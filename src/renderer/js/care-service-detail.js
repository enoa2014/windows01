/**
 * 关怀服务详情页面管理类
 * 基于家庭服务详情页面设计风格重新实现
 */
class CareServiceDetail {
  constructor() {
    this.recordId = null;
    this.record = null;
    this.currentTab = 'basic';
    
    // DOM 元素引用
    this.elements = {
      // 页面状态
      loadingState: document.getElementById('loadingState'),
      errorState: document.getElementById('errorState'),
      retryBtn: document.getElementById('retryBtn'),
      
      // 页面标题和面包屑
      pageTitle: document.getElementById('pageTitle'),
      breadcrumbCurrent: document.getElementById('breadcrumbCurrent'),
      
      // 快速统计
      totalBeneficiaries: document.getElementById('totalBeneficiaries'),
      totalVolunteers: document.getElementById('totalVolunteers'),
      totalHours: document.getElementById('totalHours'),
      benefitTimes: document.getElementById('benefitTimes'),
      
      // 基本信息字段
      activityName: document.getElementById('activityName'),
      serviceCenter: document.getElementById('serviceCenter'),
      projectDomain: document.getElementById('projectDomain'),
      activityType: document.getElementById('activityType'),
      activityDate: document.getElementById('activityDate'),
      reportDate: document.getElementById('reportDate'),
      beneficiaryGroup: document.getElementById('beneficiaryGroup'),
      reporter: document.getElementById('reporter'),
      
      // 志愿者信息字段
      volunteerChildCount: document.getElementById('volunteerChildCount'),
      volunteerChildHours: document.getElementById('volunteerChildHours'),
      volunteerParentCount: document.getElementById('volunteerParentCount'),
      volunteerParentHours: document.getElementById('volunteerParentHours'),
      volunteerStudentCount: document.getElementById('volunteerStudentCount'),
      volunteerStudentHours: document.getElementById('volunteerStudentHours'),
      volunteerTeacherCount: document.getElementById('volunteerTeacherCount'),
      volunteerTeacherHours: document.getElementById('volunteerTeacherHours'),
      volunteerSocialCount: document.getElementById('volunteerSocialCount'),
      volunteerSocialHours: document.getElementById('volunteerSocialHours'),
      volunteerTotalCount: document.getElementById('volunteerTotalCount'),
      volunteerTotalHours: document.getElementById('volunteerTotalHours'),
      
      // 受益人信息字段
      adultMale: document.getElementById('adultMale'),
      adultFemale: document.getElementById('adultFemale'),
      childMale: document.getElementById('childMale'),
      childFemale: document.getElementById('childFemale'),
      adultTotal: document.getElementById('adultTotal'),
      childTotal: document.getElementById('childTotal'),
      benefitAdultTimes: document.getElementById('benefitAdultTimes'),
      benefitChildTimes: document.getElementById('benefitChildTimes'),
      
      // 备注信息
      activityNotes: document.getElementById('activityNotes'),
      
      // 标签页
      tabs: document.querySelectorAll('.tab-button'),
      tabContents: document.querySelectorAll('.tab-content')
    };
    
    this.init();
  }

  /**
   * 初始化
   */
  init() {
    this.parseUrlParams();
    this.initEventListeners();
    this.initTabs();
    this.loadData();
  }

  /**
   * 解析URL参数获取记录ID
   */
  parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    this.recordId = urlParams.get('id');
    
    if (!this.recordId) {
      console.error('缺少记录ID参数');
      this.showError('缺少记录ID参数');
      return;
    }
  }

  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // 重试按钮
    this.elements.retryBtn?.addEventListener('click', () => this.loadData());
    
    // 快捷键支持
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  /**
   * 初始化标签页
   */
  initTabs() {
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });
  }

  /**
   * 切换标签页
   */
  switchTab(tabName) {
    if (this.currentTab === tabName) return;
    
    this.currentTab = tabName;
    
    // 更新标签按钮状态
    this.elements.tabs.forEach(tab => {
      const isActive = tab.getAttribute('data-tab') === tabName;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
    
    // 更新标签内容显示
    this.elements.tabContents.forEach(content => {
      const isActive = content.id === `${tabName}Tab`;
      content.classList.toggle('active', isActive);
    });
  }

  /**
   * 键盘快捷键处理
   */
  handleKeydown(e) {
    // Ctrl + 1-3 切换标签页
    if (e.ctrlKey && e.key >= '1' && e.key <= '3') {
      e.preventDefault();
      const tabNames = ['basic', 'volunteer', 'beneficiary'];
      const tabIndex = parseInt(e.key) - 1;
      if (tabNames[tabIndex]) {
        this.switchTab(tabNames[tabIndex]);
      }
    }
    
    // Ctrl + P 打印
    if (e.ctrlKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      this.handlePrint();
    }
    
    // Ctrl + E 导出
    if (e.ctrlKey && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      this.handleExport();
    }
    
    // Esc 关闭模态框
    if (e.key === 'Escape') {
      // 如果有模态框，关闭它们
      this.closeModals();
    }
  }

  /**
   * 加载数据
   */
  async loadData() {
    try {
      this.showLoading();
      
      // 获取关怀服务记录数据
      const records = await window.electronAPI.careService.getRecords({}, { limit: 1000 });
      this.record = records.find(r => r.id == this.recordId);
      
      if (!this.record) {
        throw new Error('未找到指定的关怀服务记录');
      }
      
      this.renderRecord();
      this.hideLoading();
      
      // 添加淡入动画
      document.body.classList.add('fade-in');
      
    } catch (error) {
      console.error('加载关怀服务详情失败:', error);
      this.showError(`加载失败: ${error.message}`);
    }
  }

  /**
   * 渲染记录数据
   */
  renderRecord() {
    const record = this.record;
    
    // 更新页面标题和面包屑
    const activityName = record.activity_name || '未命名活动';
    this.elements.pageTitle.textContent = activityName;
    this.elements.breadcrumbCurrent.textContent = activityName;
    
    // 更新页面标题
    document.title = `${activityName} - 关怀服务详情 · 患儿入住信息管理系统`;
    
    // 计算统计数据
    const totalBeneficiaries = (record.adult_male || 0) + (record.adult_female || 0) + 
                             (record.child_male || 0) + (record.child_female || 0);
    const totalVolunteers = record.volunteer_total_count || 0;
    const totalHours = record.volunteer_total_hours || 0;
    const benefitTimes = (record.benefit_adult_times || 0) + (record.benefit_child_times || 0);
    
    // 更新快速统计
    this.elements.totalBeneficiaries.textContent = totalBeneficiaries;
    this.elements.totalVolunteers.textContent = totalVolunteers;
    this.elements.totalHours.textContent = totalHours;
    this.elements.benefitTimes.textContent = benefitTimes;
    
    // 更新基本信息
    this.updateElement(this.elements.activityName, record.activity_name);
    this.updateElement(this.elements.serviceCenter, record.service_center);
    this.updateElement(this.elements.projectDomain, record.project_domain);
    this.updateElement(this.elements.activityType, record.activity_type);
    this.updateElement(this.elements.activityDate, this.formatDate(record.activity_date));
    this.updateElement(this.elements.reportDate, this.formatDate(record.report_date));
    this.updateElement(this.elements.beneficiaryGroup, record.beneficiary_group);
    this.updateElement(this.elements.reporter, record.reporter);
    
    // 更新志愿者信息
    this.updateElement(this.elements.volunteerChildCount, record.volunteer_child_count || 0);
    this.updateElement(this.elements.volunteerChildHours, record.volunteer_child_hours || 0);
    this.updateElement(this.elements.volunteerParentCount, record.volunteer_parent_count || 0);
    this.updateElement(this.elements.volunteerParentHours, record.volunteer_parent_hours || 0);
    this.updateElement(this.elements.volunteerStudentCount, record.volunteer_student_count || 0);
    this.updateElement(this.elements.volunteerStudentHours, record.volunteer_student_hours || 0);
    this.updateElement(this.elements.volunteerTeacherCount, record.volunteer_teacher_count || 0);
    this.updateElement(this.elements.volunteerTeacherHours, record.volunteer_teacher_hours || 0);
    this.updateElement(this.elements.volunteerSocialCount, record.volunteer_social_count || 0);
    this.updateElement(this.elements.volunteerSocialHours, record.volunteer_social_hours || 0);
    this.updateElement(this.elements.volunteerTotalCount, totalVolunteers);
    this.updateElement(this.elements.volunteerTotalHours, totalHours);
    
    // 更新受益人信息
    const adultMale = record.adult_male || 0;
    const adultFemale = record.adult_female || 0;
    const childMale = record.child_male || 0;
    const childFemale = record.child_female || 0;
    
    this.updateElement(this.elements.adultMale, adultMale);
    this.updateElement(this.elements.adultFemale, adultFemale);
    this.updateElement(this.elements.childMale, childMale);
    this.updateElement(this.elements.childFemale, childFemale);
    this.updateElement(this.elements.adultTotal, adultMale + adultFemale);
    this.updateElement(this.elements.childTotal, childMale + childFemale);
    this.updateElement(this.elements.benefitAdultTimes, record.benefit_adult_times || 0);
    this.updateElement(this.elements.benefitChildTimes, record.benefit_child_times || 0);
    
    // 更新备注信息
    const notes = record.notes || record.remarks || record.activity_notes || '暂无备注信息';
    this.updateElement(this.elements.activityNotes, notes);
  }

  /**
   * 更新DOM元素内容
   */
  updateElement(element, value) {
    if (element) {
      element.textContent = value || '-';
    }
  }

  /**
   * 格式化日期
   */
  formatDate(dateString) {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // 如果无法解析，返回原始字符串
      
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * 显示加载状态
   */
  showLoading() {
    this.elements.loadingState?.classList.remove('hidden');
    this.elements.loadingState?.style.setProperty('display', 'flex');
    this.elements.errorState?.style.setProperty('display', 'none');
  }

  /**
   * 隐藏加载状态
   */
  hideLoading() {
    this.elements.loadingState?.style.setProperty('display', 'none');
  }

  /**
   * 显示错误状态
   */
  showError(message = '加载失败') {
    this.elements.loadingState?.style.setProperty('display', 'none');
    this.elements.errorState?.style.setProperty('display', 'flex');
    
    const errorMessage = this.elements.errorState?.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
  }

  /**
   * 关闭模态框
   */
  closeModals() {
    // 如果以后添加模态框，在这里处理关闭逻辑
  }

  /**
   * 显示成功提示
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * 显示错误提示
   */
  showErrorToast(message) {
    this.showToast(message, 'error');
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = 'info') {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
    
    // 根据类型设置样式
    switch (type) {
      case 'success':
        toast.className += ' bg-green-100 border border-green-400 text-green-700';
        break;
      case 'error':
        toast.className += ' bg-red-100 border border-red-400 text-red-700';
        break;
      default:
        toast.className += ' bg-blue-100 border border-blue-400 text-blue-700';
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // 3秒后自动隐藏
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

/**
 * 全局操作函数
 */

// 切换标签页
window.switchTab = function(tabName) {
  if (window.careServiceDetail) {
    window.careServiceDetail.switchTab(tabName);
  }
};

// 编辑操作
window.handleEdit = function() {
  if (window.careServiceDetail && window.careServiceDetail.record) {
    window.careServiceDetail.showToast('编辑功能开发中', 'info');
  }
};

// 导出操作
window.handleExport = async function() {
  if (!window.careServiceDetail || !window.careServiceDetail.record) {
    return;
  }
  
  try {
    const result = await window.electronAPI.careService.exportExcel({
      id: window.careServiceDetail.recordId
    });
    
    if (result.success) {
      window.careServiceDetail.showSuccess('导出成功');
    } else {
      window.careServiceDetail.showErrorToast(`导出失败: ${result.message}`);
    }
  } catch (error) {
    console.error('导出失败:', error);
    window.careServiceDetail.showErrorToast('导出失败，请稍后重试');
  }
};

// 打印操作
window.handlePrint = function() {
  if (window.careServiceDetail && window.careServiceDetail.record) {
    // 隐藏不需要打印的元素
    const noPrintElements = document.querySelectorAll('.no-print, .loading-overlay, .error-overlay');
    noPrintElements.forEach(el => el.style.display = 'none');
    
    // 执行打印
    window.print();
    
    // 恢复隐藏的元素
    noPrintElements.forEach(el => el.style.display = '');
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.careServiceDetail = new CareServiceDetail();
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  // 清理可能的定时器或事件监听器
  if (window.careServiceDetail) {
    // 如果有需要清理的资源，在这里处理
  }
});