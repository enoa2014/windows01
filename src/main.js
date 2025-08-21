const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const DatabaseManager = require('./database/DatabaseManager');
const ExcelImporter = require('./services/ExcelImporter');
const FamilyServiceManager = require('./services/FamilyServiceManager');

class App {
    constructor() {
        this.mainWindow = null;
        this.dbManager = new DatabaseManager();
        this.excelImporter = new ExcelImporter(this.dbManager);
        this.familyServiceManager = new FamilyServiceManager(this.dbManager);
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

        // 获取扩展统计信息
        ipcMain.handle('get-extended-statistics', async () => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                return await this.dbManager.getExtendedStatistics();
            } catch (error) {
                console.error('获取扩展统计信息失败:', error);
                throw error;
            }
        });

        // 获取年龄段患者列表
        ipcMain.handle('get-age-group-patients', async (event, ageRange) => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                return await this.dbManager.getAgeGroupPatients(ageRange);
            } catch (error) {
                console.error('获取年龄段患者列表失败:', error);
                throw error;
            }
        });

        // ==================== 家庭服务管理 IPC 处理器 ====================

        // 获取家庭服务记录列表
        ipcMain.handle('family-service:get-records', async (event, filters, pagination) => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                
                return await this.familyServiceManager.getRecords(filters, pagination);
            } catch (error) {
                console.error('获取家庭服务记录失败:', error);
                throw error;
            }
        });

        // 获取家庭服务统计概览
        ipcMain.handle('family-service:get-overview-stats', async () => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                return await this.familyServiceManager.getOverviewStats();
            } catch (error) {
                console.error('获取家庭服务统计概览失败:', error);
                throw error;
            }
        });

        // 获取单条家庭服务记录详情
        ipcMain.handle('family-service:get-record-by-id', async (event, id) => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                return await this.familyServiceManager.getRecordById(id);
            } catch (error) {
                console.error('获取家庭服务记录详情失败:', error);
                throw error;
            }
        });

        // 创建家庭服务记录
        ipcMain.handle('family-service:create-record', async (event, recordData) => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                return await this.familyServiceManager.createRecord(recordData);
            } catch (error) {
                console.error('创建家庭服务记录失败:', error);
                throw error;
            }
        });

        // 更新家庭服务记录
        ipcMain.handle('family-service:update-record', async (event, id, updateData) => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                return await this.familyServiceManager.updateRecord(id, updateData);
            } catch (error) {
                console.error('更新家庭服务记录失败:', error);
                throw error;
            }
        });

        // 删除家庭服务记录
        ipcMain.handle('family-service:delete-record', async (event, id) => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                return await this.familyServiceManager.deleteRecord(id);
            } catch (error) {
                console.error('删除家庭服务记录失败:', error);
                throw error;
            }
        });

        // 批量删除家庭服务记录
        ipcMain.handle('family-service:batch-delete-records', async (event, ids) => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                return await this.familyServiceManager.batchDeleteRecords(ids);
            } catch (error) {
                console.error('批量删除家庭服务记录失败:', error);
                throw error;
            }
        });

        // 导入家庭服务Excel数据
        ipcMain.handle('family-service:import-excel', async () => {
            try {
                const result = await dialog.showOpenDialog(this.mainWindow, {
                    properties: ['openFile'],
                    filters: [
                        { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
                    ],
                    title: '选择家庭服务数据Excel文件'
                });

                if (result.canceled || result.filePaths.length === 0) {
                    return { success: false, message: '用户取消操作' };
                }

                const filePath = result.filePaths[0];
                const importResult = await this.familyServiceManager.importFromExcel(filePath);
                
                return {
                    success: importResult.success,
                    message: importResult.success ? 
                        `成功导入 ${importResult.successCount} 条记录，跳过 ${importResult.duplicateCount} 条重复记录` :
                        `导入失败: ${importResult.errors.join('; ')}`,
                    data: importResult
                };
            } catch (error) {
                console.error('导入家庭服务Excel失败:', error);
                return {
                    success: false,
                    message: `导入失败: ${error.message}`
                };
            }
        });

        // 导出家庭服务数据到Excel
        ipcMain.handle('family-service:export-excel', async (event, filters) => {
            try {
                const result = await dialog.showSaveDialog(this.mainWindow, {
                    filters: [
                        { name: 'Excel Files', extensions: ['xlsx'] }
                    ],
                    defaultPath: `家庭服务统计_${new Date().toISOString().split('T')[0]}.xlsx`,
                    title: '导出家庭服务数据'
                });

                if (result.canceled || !result.filePath) {
                    return { success: false, message: '用户取消操作' };
                }

                const exportResult = await this.familyServiceManager.exportToExcel(result.filePath, filters);
                
                return {
                    success: exportResult.success,
                    message: exportResult.success ? 
                        `成功导出 ${exportResult.recordCount} 条记录到 ${result.filePath}` :
                        `导出失败: ${exportResult.error}`,
                    data: exportResult
                };
            } catch (error) {
                console.error('导出家庭服务数据失败:', error);
                return {
                    success: false,
                    message: `导出失败: ${error.message}`
                };
            }
        });

        // 获取家庭服务筛选选项
        ipcMain.handle('family-service:get-filter-options', async () => {
            try {
                if (!this.isInitialized) {
                    throw new Error('应用未完全初始化');
                }
                return await this.familyServiceManager.getFilterOptions();
            } catch (error) {
                console.error('获取家庭服务筛选选项失败:', error);
                throw error;
            }
        });
    }
}

// 修复Electron缓存权限问题 - 更彻底的解决方案
app.commandLine.appendSwitch('--disable-http-cache');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-dev-shm-usage');
app.commandLine.appendSwitch('--no-sandbox');

// 设置自定义缓存路径
try {
    const userDataPath = app.getPath('userData');
    const cachePath = path.join(userDataPath, 'app-cache');
    app.setPath('userCache', cachePath);
} catch (error) {
    console.warn('设置缓存路径失败，继续使用默认设置:', error.message);
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