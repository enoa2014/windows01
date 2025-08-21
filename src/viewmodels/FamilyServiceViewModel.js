/**
 * 家庭服务视图模型
 * 统一的数据处理和状态管理
 */

class FamilyServiceViewModel {
    constructor() {
        this.resourceConfig = window.ResourceConfig?.resourceAdapters.familyServices;
        this.columnsConfig = window.ColumnsConfig?.columnsConfig.familyServices || [];
        this.filtersConfig = window.FiltersConfig?.filtersSchemas.familyServices || {};
        this.formatters = window.ColumnsConfig?.formatters || {};
        
        // 状态管理
        this.state = {
            data: [],
            filteredData: [],
            loading: false,
            error: null,
            pagination: {
                page: 1,
                pageSize: 20,
                total: 0
            },
            filters: {},
            sorting: {
                key: 'year_month',
                order: 'desc'
            },
            stats: null,
            filterOptions: null
        };
        
        // 事件监听器
        this.listeners = {};
    }
    
    /**
     * 初始化视图模型
     */
    async init() {
        try {
            this.setState({ loading: true, error: null });
            
            // 并行加载数据
            const [statsData, filterOptions] = await Promise.all([
                this.loadOverviewStats(),
                this.loadFilterOptions()
            ]);
            
            this.setState({ 
                stats: statsData,
                filterOptions: filterOptions,
                loading: false
            });
            
            // 加载记录数据
            await this.loadRecords();
            
        } catch (error) {
            console.error('FamilyServiceViewModel 初始化失败:', error);
            this.setState({ error: error.message, loading: false });
        }
    }
    
    /**
     * 加载记录数据
     */
    async loadRecords(filters = this.state.filters, pagination = this.state.pagination) {
        try {
            this.setState({ loading: true });
            
            if (!window.electronAPI?.familyService) {
                throw new Error('API 接口未就绪');
            }
            
            const records = await window.electronAPI.familyService.getRecords(filters, pagination);
            
            // 应用排序
            const sortedRecords = this.applySorting(records, this.state.sorting);
            
            this.setState({
                data: records,
                filteredData: sortedRecords,
                loading: false,
                pagination: {
                    ...pagination,
                    total: records.length
                }
            });
            
            this.emit('dataLoaded', sortedRecords);
            
        } catch (error) {
            console.error('加载记录失败:', error);
            this.setState({ error: error.message, loading: false });
        }
    }
    
    /**
     * 加载统计数据
     */
    async loadOverviewStats() {
        if (!window.electronAPI?.familyService) {
            throw new Error('API 接口未就绪');
        }
        return await window.electronAPI.familyService.getOverviewStats();
    }
    
    /**
     * 加载筛选选项
     */
    async loadFilterOptions() {
        if (!window.electronAPI?.familyService) {
            throw new Error('API 接口未就绪');
        }
        return await window.electronAPI.familyService.getFilterOptions();
    }
    
    /**
     * 应用筛选
     */
    async applyFilters(filters) {
        this.setState({ filters });
        await this.loadRecords(filters);
        this.emit('filtersChanged', filters);
    }
    
    /**
     * 应用排序
     */
    applySorting(data, sorting) {
        const { key, order } = sorting;
        
        return [...data].sort((a, b) => {
            let valueA = a[key];
            let valueB = b[key];
            
            // 处理日期值
            if (key === 'year_month') {
                valueA = new Date(valueA).getTime();
                valueB = new Date(valueB).getTime();
            }
            
            // 处理数值
            if (typeof valueA === 'string' && !isNaN(valueA)) {
                valueA = Number(valueA);
                valueB = Number(valueB);
            }
            
            if (order === 'desc') {
                return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
            } else {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            }
        });
    }
    
    /**
     * 更新排序
     */
    updateSorting(key, order) {
        const sorting = { key, order };
        this.setState({ sorting });
        
        const sortedData = this.applySorting(this.state.data, sorting);
        this.setState({ filteredData: sortedData });
        
        this.emit('sortingChanged', sorting);
    }
    
    /**
     * 更新分页
     */
    updatePagination(page, pageSize) {
        const pagination = { ...this.state.pagination, page, pageSize };
        this.setState({ pagination });
        this.emit('paginationChanged', pagination);
    }
    
    /**
     * 导出数据
     */
    async exportData(filters = this.state.filters) {
        try {
            if (!window.electronAPI?.familyService) {
                throw new Error('API 接口未就绪');
            }
            
            const result = await window.electronAPI.familyService.exportExcel(filters);
            this.emit('dataExported', result);
            return result;
            
        } catch (error) {
            console.error('导出失败:', error);
            throw error;
        }
    }
    
    /**
     * 格式化数据值
     */
    formatValue(value, formatter) {
        if (!formatter || !this.formatters[formatter]) {
            return value;
        }
        return this.formatters[formatter](value);
    }
    
    /**
     * 获取列配置
     */
    getColumns() {
        return this.columnsConfig;
    }
    
    /**
     * 获取筛选配置
     */
    getFiltersSchema() {
        return this.filtersConfig;
    }
    
    /**
     * 状态更新
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.emit('stateChanged', this.state);
    }
    
    /**
     * 事件监听
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    /**
     * 移除事件监听
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        const index = this.listeners[event].indexOf(callback);
        if (index > -1) {
            this.listeners[event].splice(index, 1);
        }
    }
    
    /**
     * 触发事件
     */
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`事件处理器错误 (${event}):`, error);
            }
        });
    }
    
    /**
     * 销毁视图模型
     */
    destroy() {
        this.listeners = {};
        this.state = null;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FamilyServiceViewModel;
} else {
    window.FamilyServiceViewModel = FamilyServiceViewModel;
}