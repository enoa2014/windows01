/**
 * ===================== 增强搜索和筛选系统 v2.0 =====================
 * 基于UI优化工作流程 - 阶段1：增强搜索和筛选功能
 */

class EnhancedSearch {
  constructor() {
    this.searchHistory = this.loadSearchHistory();
    this.activeFilters = {};
    this.searchSuggestions = [];
    this.debounceTimer = null;
    this.currentQuery = '';
    this.sortField = 'name';
    this.sortDirection = 'asc';
    
    this.initializeElements();
    this.bindEvents();
    this.loadSuggestions();
  }

  initializeElements() {
    this.searchBox = document.getElementById('searchInput');
    this.searchIcon = document.querySelector('.search-icon');
    this.suggestionsContainer = document.createElement('div');
    this.suggestionsContainer.className = 'search-suggestions';
    
    if (this.searchBox) {
      this.searchBox.parentNode.appendChild(this.suggestionsContainer);
    }

    // 年龄组筛选按钮
    this.ageButtons = {
      '0-3': document.getElementById('age-0-3-btn'),
      '4-12': document.getElementById('age-4-12-btn'),
      '13-18': document.getElementById('age-13-18-btn'),
      'all': document.getElementById('age-all-btn')
    };

    // 其他筛选器
    this.filters = {
      diagnosis: document.getElementById('diagnosis-filter'),
      hospital: document.getElementById('hospital-filter'),
      dateFrom: document.getElementById('date-from'),
      dateTo: document.getElementById('date-to')
    };

    // 排序控件
    this.sortSelect = document.getElementById('sort-select');
    this.sortDirectionBtn = document.getElementById('sort-direction');

    // 结果显示
    this.resultsCount = document.getElementById('resultCount');
    this.activeFiltersContainer = document.getElementById('active-filters');
  }

  bindEvents() {
    if (!this.searchBox) return;

    // 搜索框事件
    this.searchBox.addEventListener('input', (e) => {
      this.handleSearchInput(e.target.value);
    });

    this.searchBox.addEventListener('focus', () => {
      this.showSuggestions();
    });

    this.searchBox.addEventListener('blur', () => {
      // 延迟隐藏，允许点击建议项
      setTimeout(() => this.hideSuggestions(), 150);
    });

    this.searchBox.addEventListener('keydown', (e) => {
      this.handleKeyNavigation(e);
    });

    // 年龄组筛选事件
    Object.entries(this.ageButtons).forEach(([ageRange, button]) => {
      if (button) {
        button.addEventListener('click', () => {
          this.setAgeFilter(ageRange);
        });
      }
    });

    // 其他筛选器事件
    Object.entries(this.filters).forEach(([filterType, element]) => {
      if (element) {
        element.addEventListener('change', () => {
          this.updateFilter(filterType, element.value);
        });
      }
    });

    // 排序事件
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.setSortField(e.target.value);
      });
    }

    if (this.sortDirectionBtn) {
      this.sortDirectionBtn.addEventListener('click', () => {
        this.toggleSortDirection();
      });
    }

    // 清除筛选器按钮
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    // 全局点击事件处理建议框
    document.addEventListener('click', (e) => {
      if (!this.searchBox.parentNode.contains(e.target)) {
        this.hideSuggestions();
      }
    });
  }

  /**
   * 处理搜索输入
   */
  handleSearchInput(query) {
    this.currentQuery = query.trim();
    
    // 防抖处理
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.performSearch();
      this.updateSuggestions(query);
    }, 300);
  }

  /**
   * 执行搜索
   */
  async performSearch() {
    try {
      const searchParams = {
        query: this.currentQuery,
        filters: this.activeFilters,
        sort: {
          field: this.sortField,
          direction: this.sortDirection
        }
      };

      // 调用后端搜索API
      const results = await this.callSearchAPI(searchParams);
      
      // 更新结果显示
      this.displayResults(results);
      this.updateResultsCount(results.length);
      
      // 保存搜索历史
      if (this.currentQuery && this.currentQuery.length > 2) {
        this.addToSearchHistory(this.currentQuery);
      }

    } catch (error) {
      console.error('搜索失败:', error);
      this.showErrorMessage('搜索失败，请重试');
    }
  }

  /**
   * 调用搜索API（模拟实现）
   */
  async callSearchAPI(params) {
    // 这里应该调用实际的搜索API
    // 暂时返回模拟数据
    if (window.electronAPI && window.electronAPI.searchPatients) {
      return await window.electronAPI.searchPatients(params.query, params.filters);
    }
    
    // 降级处理 - 使用现有的搜索功能
    return [];
  }

  /**
   * 智能搜索建议
   */
  async loadSuggestions() {
    try {
      // 加载搜索建议数据
      this.searchSuggestions = [
        { text: '张', type: '姓名', category: 'name' },
        { text: '李', type: '姓名', category: 'name' },
        { text: '王', type: '姓名', category: 'name' },
        { text: '急性白血病', type: '诊断', category: 'diagnosis' },
        { text: '淋巴瘤', type: '诊断', category: 'diagnosis' },
        { text: '区人民医院', type: '医院', category: 'hospital' },
        { text: '市中心医院', type: '医院', category: 'hospital' }
      ];
    } catch (error) {
      console.error('加载搜索建议失败:', error);
    }
  }

  /**
   * 更新搜索建议
   */
  updateSuggestions(query) {
    if (!query || query.length < 1) {
      this.showSearchHistory();
      return;
    }

    const filtered = this.searchSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(query.toLowerCase())
    );

    this.displaySuggestions(filtered);
  }

  /**
   * 显示搜索建议
   */
  displaySuggestions(suggestions) {
    this.suggestionsContainer.innerHTML = '';

    if (suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = `
        <div class="suggestion-text">${this.highlightQuery(suggestion.text, this.currentQuery)}</div>
        <div class="suggestion-type">${suggestion.type}</div>
      `;
      
      item.addEventListener('click', () => {
        this.selectSuggestion(suggestion);
      });

      this.suggestionsContainer.appendChild(item);
    });

    this.showSuggestions();
  }

  /**
   * 显示搜索历史
   */
  showSearchHistory() {
    if (this.searchHistory.length === 0) {
      this.hideSuggestions();
      return;
    }

    this.suggestionsContainer.innerHTML = `
      <div class="search-history">
        <div class="search-history-title">最近搜索</div>
        <div class="search-history-list">
          ${this.searchHistory.map(item => `
            <div class="search-history-item" data-query="${item}">
              ${item}
              <span class="search-history-remove" data-query="${item}">×</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // 绑定历史项点击事件
    this.suggestionsContainer.querySelectorAll('.search-history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('search-history-remove')) {
          this.removeFromSearchHistory(e.target.dataset.query);
        } else {
          this.searchBox.value = item.dataset.query;
          this.handleSearchInput(item.dataset.query);
          this.hideSuggestions();
        }
      });
    });

    this.showSuggestions();
  }

  /**
   * 高亮查询关键词
   */
  highlightQuery(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * 选择建议项
   */
  selectSuggestion(suggestion) {
    this.searchBox.value = suggestion.text;
    this.handleSearchInput(suggestion.text);
    this.hideSuggestions();
  }

  /**
   * 显示/隐藏建议框
   */
  showSuggestions() {
    this.suggestionsContainer.classList.add('show');
  }

  hideSuggestions() {
    this.suggestionsContainer.classList.remove('show');
  }

  /**
   * 键盘导航
   */
  handleKeyNavigation(e) {
    const suggestions = this.suggestionsContainer.querySelectorAll('.suggestion-item');
    const highlighted = this.suggestionsContainer.querySelector('.suggestion-item.highlighted');
    
    let currentIndex = highlighted ? Array.from(suggestions).indexOf(highlighted) : -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, suggestions.length - 1);
        this.highlightSuggestion(suggestions, currentIndex);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        this.highlightSuggestion(suggestions, currentIndex);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (highlighted) {
          highlighted.click();
        } else {
          this.performSearch();
          this.hideSuggestions();
        }
        break;
        
      case 'Escape':
        this.hideSuggestions();
        this.searchBox.blur();
        break;
    }
  }

  /**
   * 高亮建议项
   */
  highlightSuggestion(suggestions, index) {
    suggestions.forEach(item => item.classList.remove('highlighted'));
    if (suggestions[index]) {
      suggestions[index].classList.add('highlighted');
    }
  }

  /**
   * 年龄组筛选
   */
  setAgeFilter(ageRange) {
    // 更新按钮状态
    Object.values(this.ageButtons).forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    
    if (this.ageButtons[ageRange]) {
      this.ageButtons[ageRange].classList.add('active');
    }

    // 更新筛选器
    if (ageRange === 'all') {
      delete this.activeFilters.ageRange;
    } else {
      this.activeFilters.ageRange = ageRange;
    }

    this.updateActiveFilters();
    this.performSearch();
  }

  /**
   * 更新筛选器
   */
  updateFilter(filterType, value) {
    if (value && value !== 'all') {
      this.activeFilters[filterType] = value;
    } else {
      delete this.activeFilters[filterType];
    }

    this.updateActiveFilters();
    this.performSearch();
  }

  /**
   * 更新活动筛选器显示
   */
  updateActiveFilters() {
    if (!this.activeFiltersContainer) return;

    const filterTags = Object.entries(this.activeFilters).map(([key, value]) => {
      const label = this.getFilterLabel(key, value);
      return `
        <span class="filter-tag">
          ${label}
          <span class="filter-tag-remove" data-filter="${key}">×</span>
        </span>
      `;
    }).join('');

    this.activeFiltersContainer.innerHTML = filterTags;

    // 绑定移除事件
    this.activeFiltersContainer.querySelectorAll('.filter-tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeFilter(btn.dataset.filter);
      });
    });
  }

  /**
   * 获取筛选器标签
   */
  getFilterLabel(key, value) {
    const labels = {
      ageRange: `年龄: ${value}岁`,
      diagnosis: `诊断: ${value}`,
      hospital: `医院: ${value}`,
      dateFrom: `开始日期: ${value}`,
      dateTo: `结束日期: ${value}`
    };
    return labels[key] || `${key}: ${value}`;
  }

  /**
   * 移除筛选器
   */
  removeFilter(filterKey) {
    delete this.activeFilters[filterKey];

    // 重置对应的UI控件
    if (filterKey === 'ageRange') {
      Object.values(this.ageButtons).forEach(btn => {
        if (btn) btn.classList.remove('active');
      });
      if (this.ageButtons.all) {
        this.ageButtons.all.classList.add('active');
      }
    } else if (this.filters[filterKey]) {
      this.filters[filterKey].value = '';
    }

    this.updateActiveFilters();
    this.performSearch();
  }

  /**
   * 清除所有筛选器
   */
  clearAllFilters() {
    this.activeFilters = {};
    
    // 重置UI
    Object.values(this.ageButtons).forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    if (this.ageButtons.all) {
      this.ageButtons.all.classList.add('active');
    }

    Object.values(this.filters).forEach(element => {
      if (element) element.value = '';
    });

    this.updateActiveFilters();
    this.performSearch();
  }

  /**
   * 排序设置
   */
  setSortField(field) {
    this.sortField = field;
    this.performSearch();
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    
    // 更新按钮图标
    if (this.sortDirectionBtn) {
      const icon = this.sortDirectionBtn.querySelector('.icon');
      if (icon) {
        icon.innerHTML = this.sortDirection === 'asc' ? 
          window.IconLibrary.getIcon('arrow-up', 'sm') : 
          window.IconLibrary.getIcon('arrow-down', 'sm');
      }
    }

    this.performSearch();
  }

  /**
   * 搜索历史管理
   */
  loadSearchHistory() {
    try {
      const history = localStorage.getItem('patient-search-history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('加载搜索历史失败:', error);
      return [];
    }
  }

  addToSearchHistory(query) {
    // 移除重复项
    this.searchHistory = this.searchHistory.filter(item => item !== query);
    
    // 添加到开头
    this.searchHistory.unshift(query);
    
    // 限制历史记录数量
    this.searchHistory = this.searchHistory.slice(0, 10);
    
    // 保存到本地存储
    this.saveSearchHistory();
  }

  removeFromSearchHistory(query) {
    this.searchHistory = this.searchHistory.filter(item => item !== query);
    this.saveSearchHistory();
    this.showSearchHistory();
  }

  saveSearchHistory() {
    try {
      localStorage.setItem('patient-search-history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  }

  /**
   * 结果显示
   */
  displayResults(results) {
    // 这里应该更新患儿列表显示
    if (window.app && window.app.displayPatients) {
      window.app.displayPatients(results);
    }
  }

  updateResultsCount(count) {
    if (this.resultsCount) {
      this.resultsCount.textContent = `找到 ${count} 条结果`;
    }
  }

  showErrorMessage(message) {
    // 显示错误消息
    console.error(message);
    
    // 可以添加toast通知或其他错误显示机制
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'error');
    }
  }

  /**
   * 获取当前搜索状态
   */
  getSearchState() {
    return {
      query: this.currentQuery,
      filters: { ...this.activeFilters },
      sort: {
        field: this.sortField,
        direction: this.sortDirection
      }
    };
  }

  /**
   * 恢复搜索状态
   */
  restoreSearchState(state) {
    if (state.query && this.searchBox) {
      this.searchBox.value = state.query;
      this.currentQuery = state.query;
    }

    if (state.filters) {
      this.activeFilters = { ...state.filters };
      this.updateActiveFilters();
      
      // 更新UI控件状态
      Object.entries(state.filters).forEach(([key, value]) => {
        if (key === 'ageRange') {
          this.setAgeFilter(value);
        } else if (this.filters[key]) {
          this.filters[key].value = value;
        }
      });
    }

    if (state.sort) {
      this.sortField = state.sort.field;
      this.sortDirection = state.sort.direction;
      
      if (this.sortSelect) {
        this.sortSelect.value = this.sortField;
      }
    }

    this.performSearch();
  }
}

// 创建全局增强搜索实例
window.EnhancedSearch = EnhancedSearch;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('searchInput')) {
    window.enhancedSearch = new EnhancedSearch();
  }
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedSearch;
}