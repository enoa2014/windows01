const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 患者数据相关
    getPatients: () => ipcRenderer.invoke('get-patients'),
    getPatientDetail: (personId) => ipcRenderer.invoke('get-patient-detail', personId),
    searchPatients: (query) => ipcRenderer.invoke('search-patients', query),
    getStatistics: () => ipcRenderer.invoke('get-statistics'),
    
    // 文件操作
    importExcel: () => ipcRenderer.invoke('import-excel'),
    
    // 应用信息
    getAppVersion: () => process.env.npm_package_version || '1.0.0',
    getPlatform: () => process.platform,
    
    // 事件监听器
    onUpdateProgress: (callback) => {
        ipcRenderer.on('update-progress', callback);
        return () => ipcRenderer.removeListener('update-progress', callback);
    }
});