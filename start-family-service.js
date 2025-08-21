/**
 * 家庭服务页面启动脚本
 * 用于独立测试家庭服务列表页面
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const DatabaseManager = require('./src/database/DatabaseManager');
const FamilyServiceManager = require('./src/services/FamilyServiceManager');

class FamilyServiceTestApp {
    constructor() {
        this.mainWindow = null;
        this.dbManager = new DatabaseManager();
        this.familyServiceManager = new FamilyServiceManager(this.dbManager);
        this.isInitialized = false;
    }

    async createWindow() {
        // 创建测试窗口
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'src/preload.js')
            },
            titleBarStyle: 'default',
            title: '家庭服务统计 - 测试版'
        });

        // 加载家庭服务页面
        await this.mainWindow.loadFile(path.join(__dirname, 'src/renderer/family-service.html'));

        // 开发模式下打开开发者工具
        this.mainWindow.webContents.openDevTools();

        // 初始化数据库
        try {
            await this.dbManager.initialize();
            console.log('✅ 数据库初始化成功');
            
            // 创建家庭服务表（如果不存在）
            await this.createFamilyServiceTable();
            
            // 插入测试数据（如果表为空）
            await this.insertTestDataIfNeeded();
            
            this.isInitialized = true;
            
            // 注册IPC处理器
            this.registerIpcHandlers();
            
        } catch (error) {
            console.error('❌ 数据库初始化失败:', error);
        }
    }

    async createFamilyServiceTable() {
        try {
            await this.dbManager.run(`
                CREATE TABLE IF NOT EXISTS family_service_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sequence_number TEXT,
                    year_month DATE NOT NULL,
                    family_count INTEGER DEFAULT 0,
                    residents_count INTEGER DEFAULT 0,
                    residence_days INTEGER DEFAULT 0,
                    accommodation_count INTEGER DEFAULT 0,
                    care_service_count INTEGER DEFAULT 0,
                    volunteer_service_count INTEGER DEFAULT 0,
                    total_service_count INTEGER DEFAULT 0,
                    notes TEXT,
                    cumulative_residence_days INTEGER DEFAULT 0,
                    cumulative_service_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await this.dbManager.run(`
                CREATE INDEX IF NOT EXISTS idx_family_service_year_month 
                    ON family_service_records(year_month);
            `);

            console.log('✅ 家庭服务数据表创建完成');
        } catch (error) {
            console.error('❌ 创建数据表失败:', error);
        }
    }

    async insertTestDataIfNeeded() {
        try {
            const count = await this.dbManager.get('SELECT COUNT(*) as count FROM family_service_records');
            
            if (count.count === 0) {
                console.log('📝 插入测试数据...');
                
                const testData = [
                    ['1', '2024-01-01', 12, 37, 96, 118, 83, 57, 158, '2024年1月服务记录', 96, 158],
                    ['2', '2023-12-01', 15, 42, 118, 143, 96, 76, 219, '2023年12月服务记录', 214, 377],
                    ['3', '2023-11-01', 18, 38, 87, 125, 72, 65, 190, '2023年11月服务记录', 301, 567],
                    ['4', '2023-10-01', 20, 45, 125, 168, 89, 78, 257, '2023年10月服务记录', 426, 824],
                    ['5', '2023-09-01', 16, 41, 108, 149, 76, 68, 225, '2023年9月服务记录', 534, 1049],
                    ['6', '2023-08-01', 14, 35, 89, 124, 65, 58, 182, '2023年8月服务记录', 623, 1231],
                    ['7', '2023-07-01', 22, 48, 142, 190, 98, 85, 288, '2023年7月服务记录', 765, 1519],
                    ['8', '2023-06-01', 19, 44, 115, 159, 82, 71, 241, '2023年6月服务记录', 880, 1760]
                ];

                const insertSQL = `
                    INSERT INTO family_service_records (
                        sequence_number, year_month, family_count, residents_count,
                        residence_days, accommodation_count, care_service_count,
                        volunteer_service_count, total_service_count, notes,
                        cumulative_residence_days, cumulative_service_count
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                for (const data of testData) {
                    await this.dbManager.run(insertSQL, data);
                }

                console.log(`✅ 插入了 ${testData.length} 条测试记录`);
            } else {
                console.log(`ℹ️ 数据库中已存在 ${count.count} 条记录，跳过插入测试数据`);
            }
        } catch (error) {
            console.error('❌ 插入测试数据失败:', error);
        }
    }

    registerIpcHandlers() {
        const { ipcMain } = require('electron');

        // 家庭服务相关IPC处理器
        ipcMain.handle('family-service:get-records', async (event, filters, pagination) => {
            try {
                return await this.familyServiceManager.getRecords(filters, pagination);
            } catch (error) {
                console.error('获取家庭服务记录失败:', error);
                throw error;
            }
        });

        ipcMain.handle('family-service:get-overview-stats', async () => {
            try {
                return await this.familyServiceManager.getOverviewStats();
            } catch (error) {
                console.error('获取家庭服务统计失败:', error);
                throw error;
            }
        });

        ipcMain.handle('family-service:get-filter-options', async () => {
            try {
                return await this.familyServiceManager.getFilterOptions();
            } catch (error) {
                console.error('获取筛选选项失败:', error);
                throw error;
            }
        });

        ipcMain.handle('family-service:export-excel', async (event, filters) => {
            try {
                const { dialog } = require('electron');
                const result = await dialog.showSaveDialog(this.mainWindow, {
                    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
                    defaultPath: `家庭服务统计_${new Date().toISOString().split('T')[0]}.xlsx`
                });

                if (result.canceled) {
                    return { success: false, message: '用户取消操作' };
                }

                const exportResult = await this.familyServiceManager.exportToExcel(result.filePath, filters);
                return {
                    success: exportResult.success,
                    message: exportResult.success ? 
                        `成功导出 ${exportResult.recordCount} 条记录` : 
                        `导出失败: ${exportResult.error}`
                };
            } catch (error) {
                console.error('导出失败:', error);
                return { success: false, message: `导出失败: ${error.message}` };
            }
        });

        console.log('✅ IPC处理器注册完成');
    }
}

// Electron应用事件处理
app.whenReady().then(async () => {
    const testApp = new FamilyServiceTestApp();
    await testApp.createWindow();

    console.log('🚀 家庭服务测试应用启动完成');
    console.log('💡 请在浏览器开发工具中查看任何错误信息');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        const testApp = new FamilyServiceTestApp();
        await testApp.createWindow();
    }
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});