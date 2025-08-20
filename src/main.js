const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const DatabaseManager = require('./database/DatabaseManager');
const ExcelImporter = require('./services/ExcelImporter');

class App {
    constructor() {
        this.mainWindow = null;
        this.dbManager = new DatabaseManager();
        this.excelImporter = new ExcelImporter(this.dbManager);
        this.isInitialized = false;
    }

    async createWindow() {
        // 创建主窗口
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js')
            },
            titleBarStyle: 'default',
            icon: path.join(__dirname, '../assets/icon.png')
        });

        // 加载应用页面
        await this.mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

        // 开发模式下打开开发者工具
        if (process.argv.includes('--dev')) {
            this.mainWindow.webContents.openDevTools();
        }

        // 初始化数据库
        try {
            await this.dbManager.initialize();
            this.isInitialized = true;
            console.log('数据库初始化成功');
            
            // 数据库初始化完成后注册IPC处理器
            if (!this.handlersRegistered) {
                this.registerIpcHandlers();
                this.handlersRegistered = true;
            }
        } catch (error) {
            console.error('数据库初始化失败:', error);
            dialog.showErrorBox('数据库错误', '无法初始化数据库，应用可能无法正常工作');
            return;
        }
    }

    registerIpcHandlers() {
        // 获取患者列表
        ipcMain.handle('get-patients', async () => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                return await this.dbManager.getPatients();
            } catch (error) {
                console.error('获取患者列表失败:', error);
                throw error;
            }
        });

        // 获取患者详细信息
        ipcMain.handle('get-patient-detail', async (event, personId) => {
            try {
                return await this.dbManager.getPatientDetail(personId);
            } catch (error) {
                console.error('获取患者详情失败:', error);
                throw error;
            }
        });

        // 导入Excel文件
        ipcMain.handle('import-excel', async () => {
            try {
                const result = await dialog.showOpenDialog(this.mainWindow, {
                    properties: ['openFile'],
                    filters: [
                        { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
                    ]
                });

                if (result.canceled || result.filePaths.length === 0) {
                    return { success: false, message: '用户取消操作' };
                }

                const filePath = result.filePaths[0];
                const importResult = await this.excelImporter.importFile(filePath);
                
                return {
                    success: true,
                    message: `成功导入 ${importResult.imported} 条记录，跳过 ${importResult.skipped} 条重复记录`,
                    data: importResult
                };
            } catch (error) {
                console.error('导入Excel失败:', error);
                return {
                    success: false,
                    message: `导入失败: ${error.message}`
                };
            }
        });

        // 搜索患者
        ipcMain.handle('search-patients', async (event, query) => {
            try {
                return await this.dbManager.searchPatients(query);
            } catch (error) {
                console.error('搜索患者失败:', error);
                throw error;
            }
        });

        // 获取统计信息
        ipcMain.handle('get-statistics', async () => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                return await this.dbManager.getStatistics();
            } catch (error) {
                console.error('获取统计信息失败:', error);
                throw error;
            }
        });
    }
}

// 应用初始化
const appInstance = new App();

app.whenReady().then(() => {
    appInstance.createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            appInstance.createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 优雅关闭
app.on('before-quit', async () => {
    if (appInstance.dbManager) {
        await appInstance.dbManager.close();
    }
});