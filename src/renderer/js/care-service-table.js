class CareServiceManager {
  constructor() {
    this.records = [];
    this.filteredRecords = [];
    this.currentPage = 1;
    this.pageSize = 20;
    this.viewMode = 'list'; // 'list' or 'grid'
    this.filters = {
      search: '',
      year: '',
      projectArea: '',
      activityType: ''
    };
    
    this.elements = {
      // Loading states
      loadingState: document.getElementById('loadingState'),
      careServiceGrid: document.getElementById('careServiceGrid'),
      emptyState: document.getElementById('emptyState'),
      errorState: document.getElementById('errorState'),
      
      // Statistics
      totalRecords: document.getElementById('totalRecords'),
      totalBeneficiaries: document.getElementById('totalBeneficiaries'),
      totalVolunteers: document.getElementById('totalVolunteers'),
      totalHours: document.getElementById('totalHours'),
      
      // Views
      careServiceGrid: document.getElementById('careServiceGrid'),
      careServiceTable: document.getElementById('careServiceTable'),
      tbody: document.getElementById('careServiceTbody'),
      
      // View toggle
      gridViewBtn: document.getElementById('gridViewBtn'),
      listViewBtn: document.getElementById('listViewBtn'),
      
      // Filters
      searchInput: document.getElementById('searchInput'),
      yearFilter: document.getElementById('yearFilter'),
      projectAreaFilter: document.getElementById('projectAreaFilter'),
      activityTypeFilter: document.getElementById('activityTypeFilter'),
      resetFiltersBtn: document.getElementById('resetFiltersBtn'),
      resultCount: document.getElementById('resultCount'),
      
      // Pagination
      pageStart: document.getElementById('pageStart'),
      pageEnd: document.getElementById('pageEnd'),
      totalItems: document.getElementById('totalItems'),
      pageInfo: document.getElementById('pageInfo'),
      prevPageBtn: document.getElementById('prevPageBtn'),
      nextPageBtn: document.getElementById('nextPageBtn'),
      
      // Actions
      backBtn: document.getElementById('backBtn'),
      importBtn: document.getElementById('importBtn'),
      exportBtn: document.getElementById('exportBtn'),
      retryBtn: document.getElementById('retryBtn')
    };
    
    this.init();
  }

  async init() {
    this.initEventListeners();
    this.updateViewButtons(); // 初始化视图按钮状态
    await this.loadData();
  }

  initEventListeners() {
    // Search and filter
    this.elements.searchInput?.addEventListener('input', () => this.handleSearch());
    this.elements.yearFilter?.addEventListener('change', () => this.handleFilter());
    this.elements.projectAreaFilter?.addEventListener('change', () => this.handleFilter());
    this.elements.activityTypeFilter?.addEventListener('change', () => this.handleFilter());
    this.elements.resetFiltersBtn?.addEventListener('click', () => this.resetFilters());
    
    // Pagination
    this.elements.prevPageBtn?.addEventListener('click', () => this.previousPage());
    this.elements.nextPageBtn?.addEventListener('click', () => this.nextPage());
    
    // Actions
    this.elements.backBtn?.addEventListener('click', () => this.goBack());
    this.elements.importBtn?.addEventListener('click', () => this.importExcel());
    this.elements.exportBtn?.addEventListener('click', () => this.exportExcel());
    this.elements.retryBtn?.addEventListener('click', () => this.loadData());
    
    // View toggle
    this.elements.gridViewBtn?.addEventListener('click', () => this.switchToGrid());
    this.elements.listViewBtn?.addEventListener('click', () => this.switchToList());
  }

  async loadData() {
    try {
      this.showLoading();
      
      // Load records first, then calculate statistics
      this.records = await window.electronAPI.careService.getRecords({}, { limit: 1000 }) || [];
      this.filteredRecords = [...this.records];
      
      // Load statistics and filter options in parallel
      const [statistics] = await Promise.all([
        this.loadStatistics(),
        this.loadFilterOptions()
      ]);
      
      this.updateStatistics(statistics);
      this.renderCurrentView();
      this.showCurrentView();
      
    } catch (error) {
      console.error('加载关怀服务数据失败:', error);
      this.showError();
    }
  }

  async loadStatistics() {
    try {
      return await window.electronAPI.careService.getStatistics();
    } catch (error) {
      console.warn('统计数据加载失败:', error);
      return { totalRecords: 0, totalBeneficiaries: 0, totalVolunteers: 0, totalHours: 0 };
    }
  }

  async loadFilterOptions() {
    // Extract unique values for filters
    const years = [...new Set(this.records.map(r => r.year).filter(Boolean))].sort((a, b) => b - a);
    const projectAreas = [...new Set(this.records.map(r => r.project_domain).filter(Boolean))].sort();
    const activityTypes = [...new Set(this.records.map(r => r.activity_type).filter(Boolean))].sort();
    
    // Populate filter dropdowns
    this.populateSelect(this.elements.yearFilter, years);
    this.populateSelect(this.elements.projectAreaFilter, projectAreas);
    this.populateSelect(this.elements.activityTypeFilter, activityTypes);
  }

  populateSelect(selectElement, options) {
    if (!selectElement) return;
    
    // Keep the first option (全部...)
    const firstOption = selectElement.children[0];
    selectElement.innerHTML = '';
    selectElement.appendChild(firstOption);
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      selectElement.appendChild(optionElement);
    });
  }

  updateStatistics(stats) {
    if (this.elements.totalRecords) this.elements.totalRecords.textContent = stats.totalRecords?.toLocaleString() || '0';
    if (this.elements.totalBeneficiaries) this.elements.totalBeneficiaries.textContent = stats.totalBeneficiaries?.toLocaleString() || '0';
    if (this.elements.totalVolunteers) this.elements.totalVolunteers.textContent = stats.totalVolunteers?.toLocaleString() || '0';
    if (this.elements.totalHours) this.elements.totalHours.textContent = `${stats.totalHours?.toLocaleString() || '0'}小时`;
  }

  handleSearch() {
    this.filters.search = this.elements.searchInput?.value?.toLowerCase() || '';
    this.applyFilters();
  }

  handleFilter() {
    this.filters.year = this.elements.yearFilter?.value || '';
    this.filters.projectArea = this.elements.projectAreaFilter?.value || '';
    this.filters.activityType = this.elements.activityTypeFilter?.value || '';
    this.applyFilters();
  }

  applyFilters() {
    this.filteredRecords = this.records.filter(record => {
      // Search filter
      if (this.filters.search) {
        const searchFields = [
          record.activity_name,
          record.service_center,
          record.notes
        ].join(' ').toLowerCase();
        
        if (!searchFields.includes(this.filters.search)) {
          return false;
        }
      }
      
      // Year filter
      if (this.filters.year && record.year !== parseInt(this.filters.year)) {
        return false;
      }
      
      // Project area filter  
      if (this.filters.projectArea && record.project_domain !== this.filters.projectArea) {
        return false;
      }
      
      // Activity type filter
      if (this.filters.activityType && record.activity_type !== this.filters.activityType) {
        return false;
      }
      
      return true;
    });
    
    this.currentPage = 1;
    this.renderCurrentView();
    this.updateResultCount();
  }

  resetFilters() {
    this.filters = { search: '', year: '', projectArea: '', activityType: '' };
    if (this.elements.searchInput) this.elements.searchInput.value = '';
    if (this.elements.yearFilter) this.elements.yearFilter.value = '';
    if (this.elements.projectAreaFilter) this.elements.projectAreaFilter.value = '';
    if (this.elements.activityTypeFilter) this.elements.activityTypeFilter.value = '';
    
    this.filteredRecords = [...this.records];
    this.currentPage = 1;
    this.renderCurrentView();
    this.updateResultCount();
  }

  renderGrid() {
    if (!this.elements.careServiceGrid) return;
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const pageRecords = this.filteredRecords.slice(startIndex, endIndex);
    
    this.elements.careServiceGrid.innerHTML = '';
    
    if (pageRecords.length === 0) {
      this.elements.emptyState.classList.remove('hidden');
      return;
    }
    
    this.elements.emptyState.classList.add('hidden');
    
    pageRecords.forEach(record => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-xl shadow-sm border border-[var(--border-primary)] hover:shadow-md transition-all duration-200 cursor-pointer';
      card.onclick = () => this.showDetail(record.id);
      
      card.innerHTML = `
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-1">${record.activity_name || '未命名活动'}</h3>
              <p class="text-sm text-[var(--text-secondary)]">${record.activity_name || '-'}</p>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-[var(--brand-primary)]">${this.formatYearMonth(record.year, record.month)}</div>
            </div>
          </div>
          
          <div class="flex items-center gap-4 mb-4">
            <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">${record.project_domain || '-'}</span>
            <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">${record.activity_type || '-'}</span>
          </div>
          
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-lg font-bold text-[var(--brand-primary)]">${(record.adult_male || 0) + (record.adult_female || 0) + (record.child_male || 0) + (record.child_female || 0)}</div>
              <div class="text-xs text-[var(--text-secondary)]">受益人次</div>
            </div>
            <div>
              <div class="text-lg font-bold text-[var(--brand-secondary)]">${record.volunteer_total_count || 0}</div>
              <div class="text-xs text-[var(--text-secondary)]">志愿者人次</div>
            </div>
            <div>
              <div class="text-lg font-bold text-[var(--warning)]">${record.volunteer_total_hours || 0}h</div>
              <div class="text-xs text-[var(--text-secondary)]">服务时长</div>
            </div>
          </div>
          
          ${record.activity_date ? `<div class="mt-4 pt-4 border-t border-[var(--border-primary)]">
            <div class="text-xs text-[var(--text-secondary)]">活动日期: ${this.formatDate(record.activity_date)}</div>
          </div>` : ''}
        </div>
      `;
      
      this.elements.careServiceGrid.appendChild(card);
    });
    
    this.updatePagination();
  }

  updatePagination() {
    const totalPages = Math.ceil(this.filteredRecords.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredRecords.length);
    
    if (this.elements.pageStart) this.elements.pageStart.textContent = this.filteredRecords.length > 0 ? startIndex + 1 : 0;
    if (this.elements.pageEnd) this.elements.pageEnd.textContent = endIndex;
    if (this.elements.totalItems) this.elements.totalItems.textContent = this.filteredRecords.length;
    if (this.elements.pageInfo) this.elements.pageInfo.textContent = `第 ${this.currentPage} 页，共 ${totalPages} 页`;
    
    if (this.elements.prevPageBtn) this.elements.prevPageBtn.disabled = this.currentPage <= 1;
    if (this.elements.nextPageBtn) this.elements.nextPageBtn.disabled = this.currentPage >= totalPages;
  }

  updateResultCount() {
    if (this.elements.resultCount) {
      this.elements.resultCount.textContent = this.filteredRecords.length.toLocaleString();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderTable();
    }
  }

  nextPage() {
    const totalPages = Math.ceil(this.filteredRecords.length / this.pageSize);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.renderTable();
    }
  }

  formatYearMonth(year, month) {
    if (!year) return '-';
    if (!month) return year.toString();
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN');
    } catch (error) {
      return dateStr;
    }
  }

  async importExcel() {
    try {
      const result = await window.electronAPI.careService.importExcel();
      if (result.success) {
        alert(result.message);
        await this.loadData(); // Reload data
      } else {
        alert(`导入失败: ${result.message}`);
      }
    } catch (error) {
      console.error('导入Excel失败:', error);
      alert('导入失败，请重试');
    }
  }

  async exportExcel() {
    try {
      const result = await window.electronAPI.careService.exportExcel(this.filters);
      if (result.success) {
        alert(result.message);
      } else {
        alert(`导出失败: ${result.message}`);
      }
    } catch (error) {
      console.error('导出Excel失败:', error);
      alert('导出失败，请重试');
    }
  }

  switchToGrid() {
    this.viewMode = 'grid';
    this.updateViewButtons();
    this.renderCurrentView();
    this.showCurrentView();
  }

  switchToList() {
    this.viewMode = 'list';
    this.updateViewButtons();
    this.renderCurrentView();
    this.showCurrentView();
  }

  updateViewButtons() {
    if (this.viewMode === 'grid') {
      this.elements.gridViewBtn?.classList.add('text-gray-700', 'bg-white', 'rounded-md', 'shadow-sm');
      this.elements.gridViewBtn?.classList.remove('text-gray-500', 'hover:text-gray-700');
      this.elements.listViewBtn?.classList.add('text-gray-500', 'hover:text-gray-700');
      this.elements.listViewBtn?.classList.remove('text-gray-700', 'bg-white', 'rounded-md', 'shadow-sm');
    } else {
      this.elements.listViewBtn?.classList.add('text-gray-700', 'bg-white', 'rounded-md', 'shadow-sm');
      this.elements.listViewBtn?.classList.remove('text-gray-500', 'hover:text-gray-700');
      this.elements.gridViewBtn?.classList.add('text-gray-500', 'hover:text-gray-700');
      this.elements.gridViewBtn?.classList.remove('text-gray-700', 'bg-white', 'rounded-md', 'shadow-sm');
    }
  }

  renderCurrentView() {
    if (this.viewMode === 'grid') {
      this.renderGrid();
    } else {
      this.renderTable();
    }
  }

  showCurrentView() {
    if (this.viewMode === 'grid') {
      this.showGrid();
    } else {
      this.showTable();
    }
  }

  renderTable() {
    if (!this.elements.tbody) return;
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const pageRecords = this.filteredRecords.slice(startIndex, endIndex);
    
    this.elements.tbody.innerHTML = '';
    
    pageRecords.forEach(record => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer';
      tr.onclick = () => this.showDetail(record.id);
      
      tr.innerHTML = `
        <td class="px-6 py-4 text-sm text-[var(--text-primary)] max-w-xs">
          <div class="font-medium">${record.activity_name || '未命名活动'}</div>
          <div class="text-[var(--text-secondary)] text-xs">${record.activity_type || '-'}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">${this.formatYearMonth(record.year, record.month)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">${record.activity_name || '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
          <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">${record.project_domain || '-'}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-[var(--brand-primary)]">${(record.adult_male || 0) + (record.adult_female || 0) + (record.child_male || 0) + (record.child_female || 0)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-[var(--text-primary)]">${record.volunteer_total_count || 0}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-[var(--text-primary)]">${record.volunteer_total_hours || 0}h</td>
      `;
      
      this.elements.tbody.appendChild(tr);
    });
    
    this.updatePagination();
  }

  showTable() {
    this.elements.loadingState?.classList.add('hidden');
    this.elements.errorState?.classList.add('hidden');
    this.elements.careServiceGrid?.classList.add('hidden');
    this.elements.careServiceTable?.classList.remove('hidden');
    
    if (this.filteredRecords.length === 0) {
      this.elements.careServiceTable?.classList.add('hidden');
      this.elements.emptyState?.classList.remove('hidden');
    } else {
      this.elements.emptyState?.classList.add('hidden');
    }
  }

  showDetail(recordId) {
    // 导航到关怀服务详情页
    window.location.href = `care-service-detail.html?id=${recordId}`;
  }

  goBack() {
    window.history.back();
  }

  showLoading() {
    this.elements.loadingState?.classList.remove('hidden');
    this.elements.careServiceGrid?.classList.add('hidden');
    this.elements.careServiceTable?.classList.add('hidden');
    this.elements.emptyState?.classList.add('hidden');
    this.elements.errorState?.classList.add('hidden');
  }

  showGrid() {
    this.elements.loadingState?.classList.add('hidden');
    this.elements.errorState?.classList.add('hidden');
    this.elements.careServiceTable?.classList.add('hidden');
    this.elements.careServiceGrid?.classList.remove('hidden');
    
    if (this.filteredRecords.length === 0) {
      this.elements.careServiceGrid?.classList.add('hidden');
      this.elements.emptyState?.classList.remove('hidden');
    } else {
      this.elements.emptyState?.classList.add('hidden');
    }
  }

  showError() {
    this.elements.loadingState?.classList.add('hidden');
    this.elements.careServiceGrid?.classList.add('hidden');
    this.elements.careServiceTable?.classList.add('hidden');
    this.elements.emptyState?.classList.add('hidden');
    this.elements.errorState?.classList.remove('hidden');
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new CareServiceManager();
});
