/**
 * 筛选配置中心
 * 定义不同资源的筛选选项和规则
 */

const filtersSchemas = {
  checkins: {
    dateRange: { field: 'checkin_date', preset: 'last90d' },
    room_no: { type: 'select', options: ['101', '102', '103'] }
  },
  familyServices: {
    dateRange: { 
      field: 'year_month', 
      preset: 'last12m',
      type: 'monthRange',
      label: '年月范围'
    },
    year: { 
      type: 'select', 
      field: 'year_month',
      label: '年份',
      remote: 'family-service:get-filter-options',
      transform: 'years'
    },
    familyCountRange: {
      type: 'numberRange',
      field: 'family_count',
      label: '家庭数范围',
      min: 0,
      max: 100
    },
    totalServiceRange: {
      type: 'numberRange', 
      field: 'total_service_count',
      label: '总服务人次范围',
      min: 0,
      max: 1000
    }
  }
};

// 预设筛选选项
const filterPresets = {
  last12m: () => {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // 本月最后一天
    const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1); // 12个月前第一天
    return { startDate, endDate };
  },
  
  last90d: () => {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 90);
    return { startDate, endDate };
  },
  
  currentYear: () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    const endDate = new Date(now.getFullYear(), 11, 31);
    return { startDate, endDate };
  },
  
  lastYear: () => {
    const now = new Date();
    const year = now.getFullYear() - 1;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    return { startDate, endDate };
  }
};

// 筛选工具函数
const filterUtils = {
  /**
   * 应用筛选条件到数据
   */
  applyFilters(data, filters, schema) {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        
        const fieldSchema = schema[key];
        if (!fieldSchema) return true;
        
        const field = fieldSchema.field || key;
        const itemValue = item[field];
        
        switch (fieldSchema.type) {
          case 'monthRange':
            return this.isInMonthRange(itemValue, value);
          case 'numberRange':
            return this.isInNumberRange(itemValue, value);
          case 'select':
            return Array.isArray(value) ? value.includes(itemValue) : itemValue === value;
          default:
            return this.isTextMatch(itemValue, value);
        }
      });
    });
  },
  
  /**
   * 检查是否在月份范围内
   */
  isInMonthRange(itemValue, range) {
    if (!range.start || !range.end) return true;
    const itemDate = new Date(itemValue);
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    return itemDate >= startDate && itemDate <= endDate;
  },
  
  /**
   * 检查是否在数值范围内
   */
  isInNumberRange(itemValue, range) {
    const num = Number(itemValue);
    if (isNaN(num)) return false;
    
    if (range.min !== undefined && num < range.min) return false;
    if (range.max !== undefined && num > range.max) return false;
    return true;
  },
  
  /**
   * 检查文本匹配
   */
  isTextMatch(itemValue, searchValue) {
    if (!searchValue) return true;
    const itemStr = String(itemValue || '').toLowerCase();
    const searchStr = String(searchValue).toLowerCase();
    return itemStr.includes(searchStr);
  }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { filtersSchemas, filterPresets, filterUtils };
} else {
  window.FiltersConfig = { filtersSchemas, filterPresets, filterUtils };
}