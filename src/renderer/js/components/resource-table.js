// 通用资源表格/筛选/分页组件（渲染端）
// 依赖：
//  - window.ResourceConfig.resourceAdapters（来自 ../config/resources.js）
//  - window.ColumnsConfig.columnsConfig / formatters（来自 ../config/columns.js）
//  - window.FiltersConfig.filtersSchemas / filterUtils（来自 ../config/filters.js）
//  - window.electronAPI.invoke(channel, ...args)（preload 暴露）

(function () {
  function fmtYearMonth(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  class ResourceTable {
    constructor(resourceKey, options = {}) {
      this.resourceKey = resourceKey;
      this.adapters = (window.ResourceConfig || {}).resourceAdapters || {};
      this.columnsConfig = (window.ColumnsConfig || {}).columnsConfig || {};
      this.formatters = (window.ColumnsConfig || {}).formatters || {};
      this.filtersSchemas = (window.FiltersConfig || {}).filtersSchemas || {};

      this.adapter = this.adapters[resourceKey] || {};
      this.columns = this._resolveByPath(this.adapter.columns) || [];
      this.filterSchema = this._resolveByPath(this.adapter.filtersSchema) || {};

      this.dom = Object.assign({
        container: null,
        resultCountEl: null,
        pagination: {
          section: null,
          prevBtn: null,
          nextBtn: null,
          infoEl: null,
          pageSize: 12
        },
        filters: {},
        overview: {}
      }, options.dom || {});

      this.state = {
        currentPage: 1,
        pageSize: this.dom.pagination.pageSize || 12,
        hasNextPage: false,
        filters: Object.assign({ search: '', sort: (this.adapter.defaultSort && this.adapter.defaultSort[0]?.key) || 'date-desc' }, options.initialFilters || {}),
        loading: false,
        view: 'grid'
      };
    }

    _resolveByPath(pathStr) {
      // 支持 'familyServices.columns' 形式
      if (!pathStr) return null;
      const [root, key] = pathStr.split('.');
      if (root === 'familyServices') return this.columnsConfig.familyServices;
      if (root === 'checkins') return this.columnsConfig.checkins;
      return null;
    }

    async init() {
      this._bindEvents();
      await this.loadFilterOptions();
      await this.loadOverview();
      await this.refresh();
    }

    _bindEvents() {
      const f = this.dom.filters || {};
      if (f.searchInput) {
        f.searchInput.addEventListener('input', this._debounce(() => {
          this.state.currentPage = 1;
          this.state.filters.search = f.searchInput.value || '';
          this.refresh();
        }, 300));
      }
      if (f.yearSelect) {
        f.yearSelect.addEventListener('change', () => {
          this.state.currentPage = 1;
          this.state.filters.year = f.yearSelect.value || '';
          this.refresh();
        });
      }
      if (f.monthSelect) {
        f.monthSelect.addEventListener('change', () => {
          this.state.currentPage = 1;
          this.state.filters.month = f.monthSelect.value || '';
          this.refresh();
        });
      }
      if (f.sortSelect) {
        f.sortSelect.addEventListener('change', () => {
          this.state.currentPage = 1;
          this.state.filters.sort = f.sortSelect.value || 'date-desc';
          this.refresh();
        });
      }

      if (this.dom.pagination.prevBtn) {
        this.dom.pagination.prevBtn.addEventListener('click', () => {
          if (this.state.currentPage > 1) {
            this.state.currentPage -= 1;
            this.refresh();
          }
        });
      }
      if (this.dom.pagination.nextBtn) {
        this.dom.pagination.nextBtn.addEventListener('click', () => {
          if (this.state.hasNextPage) {
            this.state.currentPage += 1;
            this.refresh();
          }
        });
      }
    }

    async loadFilterOptions() {
      if (!this.adapter.filterOptionsAPI) return;
      try {
        const res = await window.electronAPI.invoke(this.adapter.filterOptionsAPI);
        const years = (res && res.years) || [];
        if (this.dom.filters.yearSelect && years.length) {
          const sel = this.dom.filters.yearSelect;
          years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y + ' 年';
            sel.appendChild(opt);
          });
        }
      } catch (e) {
        console.warn('加载筛选选项失败:', e);
      }
    }

    async loadOverview() {
      if (!this.adapter.statsAPI || !this.dom.overview) return;
      try {
        const stats = await window.electronAPI.invoke(this.adapter.statsAPI);
        const ov = this.dom.overview;
        if (ov.totalRecords && stats?.overall?.totalRecords != null) ov.totalRecords.textContent = stats.overall.totalRecords;
        if (ov.totalFamilies && stats?.overall?.totalFamilies != null) ov.totalFamilies.textContent = stats.overall.totalFamilies;
        if (ov.totalServices && stats?.overall?.totalServices != null) ov.totalServices.textContent = stats.overall.totalServices;
        if (ov.avgDays && stats?.overall?.avgDaysPerFamily != null) ov.avgDays.textContent = stats.overall.avgDaysPerFamily.toFixed ? stats.overall.avgDaysPerFamily.toFixed(1) : stats.overall.avgDaysPerFamily;
      } catch (e) {
        console.warn('加载概览失败:', e);
      }
    }

    async refresh() {
      if (!this.adapter.api) return;
      this._setLoading(true);
      try {
        const limit = this.state.pageSize;
        const offset = (this.state.currentPage - 1) * this.state.pageSize;
        const filters = Object.assign({}, this.state.filters);

        const records = await window.electronAPI.invoke(this.adapter.api, filters, { limit, offset });
        this.state.hasNextPage = Array.isArray(records) && records.length === this.state.pageSize;
        this._renderList(Array.isArray(records) ? records : []);
        this._renderPagination();
        if (this.dom.resultCountEl) {
          const pageInfo = `显示 ${records.length} 条（第 ${this.state.currentPage} 页${this.state.hasNextPage ? '' : '·末页'}）`;
          this.dom.resultCountEl.textContent = pageInfo;
        }
      } catch (e) {
        console.error('加载数据失败:', e);
        if (this.dom.resultCountEl) this.dom.resultCountEl.textContent = '加载失败';
      } finally {
        this._setLoading(false);
      }
    }

    _renderList(records) {
      if (!this.dom.container) return;
      this.dom.container.innerHTML = '';
      if (!records.length) {
        return;
      }
      const renderer = this.dom.renderItem || this._defaultRowRenderer.bind(this);
      records.forEach(r => {
        const el = renderer(r, this.columns, this.formatters);
        if (el) this.dom.container.appendChild(el);
      });
    }

    _defaultRowRenderer(row) {
      // 默认表格行（简单卡片）
      const card = document.createElement('article');
      card.className = 'service-record-card grid-mode p-4';
      const ym = fmtYearMonth(row.year_month || row.yearMonth);
      card.innerHTML = `
        <div class="card-header flex items-center gap-3">
          <div class="time-badge"><div class="text-sm font-semibold">${ym}</div></div>
          <div>
            <div class="text-sm text-gray-500">序号：${row.sequence_number ?? '-'}</div>
            <div class="text-xs text-gray-400">创建：${row.created_at ?? '-'}</div>
          </div>
        </div>
        <div class="card-content grid grid-cols-2 gap-3 mt-3">
          <div class="stat-item"><div class="stat-value">${row.family_count ?? 0}</div><div class="stat-label">家庭数</div></div>
          <div class="stat-item"><div class="stat-value">${row.residents_count ?? 0}</div><div class="stat-label">入住人次</div></div>
          <div class="stat-item"><div class="stat-value">${row.residence_days ?? 0}</div><div class="stat-label">入住天数</div></div>
          <div class="stat-item"><div class="stat-value">${row.total_service_count ?? 0}</div><div class="stat-label">总服务人次</div></div>
        </div>
      `;
      return card;
    }

    _renderPagination() {
      const p = this.dom.pagination;
      if (!p || !p.section) return;
      p.section.classList.remove('hidden');
      if (p.prevBtn) p.prevBtn.disabled = this.state.currentPage <= 1;
      if (p.nextBtn) p.nextBtn.disabled = !this.state.hasNextPage;
      if (p.infoEl) p.infoEl.textContent = `第 ${this.state.currentPage} 页${this.state.hasNextPage ? '' : ' · 末页'}`;
    }

    _setLoading(loading) {
      this.state.loading = loading;
      // 预留：可根据需要控制 loading 状态 DOM
    }

    _debounce(fn, wait) {
      let t = null;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }
  }

  window.ResourceTable = ResourceTable;
})();

