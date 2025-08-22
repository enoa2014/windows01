/**
 * 列配置中心
 * 定义不同资源的列显示配置
 */

const columnsConfig = {
  patients: [
    { key: 'name', title: '姓名', width: 140, fixed: 'left' },
    { key: 'gender', title: '性别', width: 80, align: 'center' },
    { key: 'birth_date', title: '出生日期', width: 120 },
    { key: 'hometown', title: '籍贯', width: 140 },
    { key: 'diagnosis', title: '诊断', ellipsis: true, minWidth: 180 },
    { key: 'check_in_count', title: '入住次数', width: 100, align: 'right' },
    { key: 'latest_check_in', title: '最近入住', width: 140, formatter: 'date' }
  ],
  checkins: [
    { key: 'child_name', title: '患儿姓名', width: 180, fixed: 'left' },
    { key: 'checkin_date', title: '入住日期', sorter: true },
    { key: 'checkout_date', title: '退住日期', sorter: true },
    { key: 'room_no', title: '房间号' },
    { key: 'notes', title: '备注', ellipsis: true }
  ],
  familyServices: [
    { key: 'sequence_number', title: '序号', width: 80, align: 'center', fixed: 'left' },
    { key: 'year_month', title: '年月', width: 120, sorter: true, formatter: 'yearMonth' },
    { key: 'family_count', title: '家庭数', width: 100, align: 'right', sorter: true },
    { key: 'residents_count', title: '住院人次', width: 120, align: 'right', sorter: true },
    { key: 'residence_days', title: '住院天数', width: 120, align: 'right', sorter: true },
    { key: 'accommodation_count', title: '陪伴住宿人次', width: 140, align: 'right' },
    { key: 'care_service_count', title: '关爱服务人次', width: 140, align: 'right' },
    { key: 'volunteer_service_count', title: '志愿服务人次', width: 140, align: 'right' },
    { key: 'total_service_count', title: '总服务人次', width: 140, align: 'right', sorter: true, className: 'font-semibold text-blue-600' },
    { key: 'notes', title: '备注', ellipsis: true, minWidth: 150 }
  ]
};

// 格式化器定义
const formatters = {
  date: (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },
  yearMonth: (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月`;
  },
  
  number: (value) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value || '-';
  }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { columnsConfig, formatters };
} else {
  window.ColumnsConfig = { columnsConfig, formatters };
}
