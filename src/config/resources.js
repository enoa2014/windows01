/**
 * 资源适配器配置
 * 定义不同资源的API、排序、列配置和筛选规则
 */

const resourceAdapters = {
  patients: {
    api: 'get-patients',
    // 可选：统计概览可用扩展统计
    statsAPI: 'get-extended-statistics',
    defaultSort: [
      { key: 'latest_check_in', order: 'desc' },
      { key: 'name', order: 'asc' }
    ],
    columns: 'patients.columns',
    // 患者列表简单搜索，使用前端 clientFilter 处理（名称/籍贯/诊断）
    filtersSchema: 'patients.filters'
  },
  checkins: {
    api: '/api/checkins',
    defaultSort: [
      { key: 'checkin_date', order: 'desc' },
      { key: 'created_at', order: 'desc' }
    ],
    columns: 'checkins.columns',
    filtersSchema: 'checkins.filters'
  },
  familyServices: {
    api: 'family-service:get-records',
    defaultSort: [
      { key: 'year_month', order: 'desc' },
      { key: 'created_at', order: 'desc' }
    ],
    columns: 'familyServices.columns',
    filtersSchema: 'familyServices.filters',
    statsAPI: 'family-service:get-overview-stats',
    filterOptionsAPI: 'family-service:get-filter-options',
    exportAPI: 'family-service:export-excel'
  }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { resourceAdapters };
} else {
  window.ResourceConfig = { resourceAdapters };
}
