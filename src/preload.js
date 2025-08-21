const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 患者数据相关
    getPatients: () => ipcRenderer.invoke('get-patients'),
    getPatientDetail: (personId) => ipcRenderer.invoke('get-patient-detail', personId),
    searchPatients: (query) => ipcRenderer.invoke('search-patients', query),
    getStatistics: () => ipcRenderer.invoke('get-statistics'),
    getExtendedStatistics: () => ipcRenderer.invoke('get-extended-statistics'),
    getAgeGroupPatients: (ageRange) => ipcRenderer.invoke('get-age-group-patients', ageRange),
    
    // 文件操作
    importExcel: () => ipcRenderer.invoke('import-excel'),
    
    // 家庭服务数据相关
    familyService: {
        getRecords: (filters, pagination) => ipcRenderer.invoke('family-service:get-records', filters, pagination),
        getOverviewStats: () => ipcRenderer.invoke('family-service:get-overview-stats'),
        getRecordById: (id) => ipcRenderer.invoke('family-service:get-record-by-id', id),
        createRecord: (recordData) => ipcRenderer.invoke('family-service:create-record', recordData),
        updateRecord: (id, updateData) => ipcRenderer.invoke('family-service:update-record', id, updateData),
        deleteRecord: (id) => ipcRenderer.invoke('family-service:delete-record', id),
        batchDeleteRecords: (ids) => ipcRenderer.invoke('family-service:batch-delete-records', ids),
        importExcel: () => ipcRenderer.invoke('family-service:import-excel'),
        exportExcel: (filters) => ipcRenderer.invoke('family-service:export-excel', filters),
        getFilterOptions: () => ipcRenderer.invoke('family-service:get-filter-options')
    },
    
    // 通用调用方法（为了兼容性）
    invoke: (channel, ...args) => {
        // 安全的频道白名单
        const allowedChannels = [
            'get-patients', 'get-patient-detail', 'search-patients', 
            'get-statistics', 'get-extended-statistics', 'get-age-group-patients',
            'import-excel', 'family-service:get-records', 'family-service:get-overview-stats',
            'family-service:get-record-by-id', 'family-service:create-record',
            'family-service:update-record', 'family-service:delete-record',
            'family-service:batch-delete-records', 'family-service:import-excel',
            'family-service:export-excel', 'family-service:get-filter-options'
        ];
        
        if (allowedChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        } else {
            throw new Error(`不允许的IPC频道: ${channel}`);
        }
    },
    
    // 应用信息
    getAppVersion: () => process.env.npm_package_version || '1.0.0',
    getPlatform: () => process.platform,
    
    // 事件监听器
    onUpdateProgress: (callback) => {
        ipcRenderer.on('update-progress', callback);
        return () => ipcRenderer.removeListener('update-progress', callback);
    }
});