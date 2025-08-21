/**
 * 家庭服务列表页主应用程序
 * 负责页面的所有交互功能和数据管理
 */

// 应用程序状态管理
class FamilyServiceApp {
    constructor() {
        this.state = {
            records: [],
            filteredRecords: [],
            overviewStats: null,
            filters: {
                search: '',
                year: '',
                month: '',
                sort: 'date-desc'
            },
            pagination: {
                currentPage: 1,
                pageSize: 12,
                totalPages: 0
            },
            loading: false,
            error: null
        };

        this.cache = new Map();
        this.debounceTimeout = null;
        this.initialized = false;

        // DOM 元素引用
        this.elements = {
            // 概览卡片
            totalRecords: document.getElementById('totalRecords'),
            totalFamilies: document.getElementById('totalFamilies'),
            totalServices: document.getElementById('totalServices'),
            avgDays: document.getElementById('avgDays'),

            // 筛选控件
            searchInput: document.getElementById('searchInput'),
            yearFilter: document.getElementById('yearFilter'),
            monthFilter: document.getElementById('monthFilter'),
            sortSelect: document.getElementById('sortSelect'),
            resetBtn: document.getElementById('resetBtn'),
            exportBtn: document.getElementById('exportBtn'),
            resultCount: document.getElementById('resultCount'),

            // 记录列表
            serviceRecordGrid: document.getElementById('serviceRecordGrid'),
            loadingState: document.getElementById('loadingState'),
            emptyState: document.getElementById('emptyState'),
            errorState: document.getElementById('errorState'),
            retryBtn: document.getElementById('retryBtn'),

            // 分页
            paginationSection: document.getElementById('paginationSection'),
            prevPageBtn: document.getElementById('prevPageBtn'),
            nextPageBtn: document.getElementById('nextPageBtn'),
            pageInfo: document.getElementById('pageInfo'),

            // 主题相关
            themeToggleBtn: document.getElementById('themeToggleBtn'),
            themeMenu: document.getElementById('themeMenu'),
            backBtn: document.getElementById('backBtn'),

            // 通知
            toastContainer: document.getElementById('toastContainer'),

            // 页脚
            year: document.getElementById('year'),
            printTime: document.getElementById('printTime')
        };

        this.init();
    }

    async init() {
        try {
            console.log('🚀 初始化家庭服务列表应用');
            
            // 设置基础UI
            this.setupBasicUI();
            
            // 绑定事件监听器
            this.bindEventListeners();
            
            // 初始化主题系统
            this.initThemeSystem();
            
            // 加载初始数据
            await this.loadInitialData();
            
            this.initialized = true;
            console.log('✅ 家庭服务列表应用初始化完成');
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            this.showError('应用初始化失败：' + error.message);
        }
    }

    setupBasicUI() {
        // 设置年份和打印时间
        const currentYear = new Date().getFullYear();
        if (this.elements.year) {
            this.elements.year.textContent = currentYear;
        }
        
        if (this.elements.printTime) {
            this.elements.printTime.textContent = `打印时间：${new Date().toLocaleString()}`;
        }

        // 初始化页面状态
        this.showLoading(true);
    }

    bindEventListeners() {
        // 搜索防抖处理
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.debounceSearch(e.target.value);
            });
        }

        // 筛选器变化
        [this.elements.yearFilter, this.elements.monthFilter, this.elements.sortSelect].forEach(element => {
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });

        // 重置按钮
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.resetFilters());
        }

        // 导出按钮
        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => this.handleExport());
        }

        // 分页按钮
        if (this.elements.prevPageBtn) {
            this.elements.prevPageBtn.addEventListener('click', () => this.previousPage());
        }

        if (this.elements.nextPageBtn) {
            this.elements.nextPageBtn.addEventListener('click', () => this.nextPage());
        }

        // 重试按钮
        if (this.elements.retryBtn) {
            this.elements.retryBtn.addEventListener('click', () => this.loadInitialData());
        }

        // 返回按钮
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => {
                // 根据实际需要实现返回逻辑
                window.history.back();
            });
        }

        // 键盘快捷键
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 避免在输入框中触发快捷键
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                return;
            }

            switch (e.key) {
                case '/':
                    e.preventDefault();
                    if (this.elements.searchInput) {
                        this.elements.searchInput.focus();
                    }
                    break;
                case 'f':
                case 'F':
                    if (!e.metaKey && !e.ctrlKey) {
                        e.preventDefault();
                        if (this.elements.yearFilter) {
                            this.elements.yearFilter.focus();
                        }
                    }
                    break;
                case 'e':
                case 'E':
                    if (!e.metaKey && !e.ctrlKey) {
                        e.preventDefault();
                        this.handleExport();
                    }
                    break;
                case 'r':
                case 'R':
                    if (!e.metaKey && !e.ctrlKey) {
                        e.preventDefault();
                        this.resetFilters();
                    }
                    break;
                case 'Escape':
                    if (this.elements.searchInput) {
                        this.elements.searchInput.value = '';
                        this.elements.searchInput.blur();
                        this.debounceSearch('');
                    }
                    break;
            }
        });
    }

    async loadInitialData() {
        try {
            this.showLoading(true);
            this.clearError();

            // 并行加载数据
            const [overviewStats, filterOptions] = await Promise.all([
                this.loadOverviewStats(),
                this.loadFilterOptions()
            ]);

            // 更新概览卡片
            this.updateOverviewCards(overviewStats);

            // 更新筛选选项
            this.updateFilterOptions(filterOptions);

            // 加载记录列表
            await this.loadRecords();

            this.showLoading(false);

        } catch (error) {
            console.error('加载初始数据失败:', error);
            this.showError('加载数据失败：' + error.message);
            this.showLoading(false);
        }
    }

    async loadOverviewStats() {
        try {
            const cacheKey = 'overview-stats';
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const stats = await window.electronAPI.familyService.getOverviewStats();
            this.cache.set(cacheKey, stats);
            return stats;

        } catch (error) {
            console.error('加载概览统计失败:', error);
            throw error;
        }
    }

    async loadFilterOptions() {
        try {
            const cacheKey = 'filter-options';
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const options = await window.electronAPI.familyService.getFilterOptions();
            this.cache.set(cacheKey, options);
            return options;

        } catch (error) {
            console.error('加载筛选选项失败:', error);
            return { years: [], months: [], serviceRange: { minServices: 0, maxServices: 1000 } };
        }
    }

    async loadRecords() {
        try {
            this.state.loading = true;
            this.updateResultCount('加载中...');

            const filters = { ...this.state.filters };
            const pagination = {
                limit: this.state.pagination.pageSize,
                offset: (this.state.pagination.currentPage - 1) * this.state.pagination.pageSize
            };

            // 调试日志：记录传递给IPC的参数
            console.log('🔍 FamilyServiceApp.loadRecords 调用参数:');
            console.log('  filters:', JSON.stringify(filters));
            console.log('  pagination:', JSON.stringify(pagination));

            const records = await window.electronAPI.familyService.getRecords(filters, pagination);
            
            // 调试日志：记录返回结果
            console.log('  返回记录数:', records.length);
            if (records.length === 0) {
                console.warn('  ⚠️ 返回了0条记录！');
            }
            
            this.state.records = records;
            this.state.filteredRecords = records;
            
            // 更新总页数
            const totalRecords = records.length;
            this.state.pagination.totalPages = Math.ceil(totalRecords / this.state.pagination.pageSize);

            this.renderRecords();
            this.updatePagination();
            this.updateResultCount(`显示 ${totalRecords} 条记录`);

            this.state.loading = false;

        } catch (error) {
            console.error('加载记录失败:', error);
            this.showError('加载记录失败：' + error.message);
            this.state.loading = false;
        }
    }

    updateOverviewCards(stats) {
        if (!stats || !stats.overall) {
            console.warn('统计数据格式错误');
            return;
        }

        const overall = stats.overall;

        // 更新概览卡片数据
        this.animateNumber(this.elements.totalRecords, overall.totalRecords || 0);
        this.animateNumber(this.elements.totalFamilies, overall.totalFamilies || 0);
        this.animateNumber(this.elements.totalServices, overall.totalServices || 0);
        this.animateNumber(this.elements.avgDays, parseFloat(overall.avgDaysPerFamily || 0), 1);

        // 存储统计数据
        this.state.overviewStats = stats;
    }

    updateFilterOptions(options) {
        if (!options) return;

        // 更新年份选项
        if (options.years && this.elements.yearFilter) {
            const yearFilter = this.elements.yearFilter;
            // 保留"全部年份"选项
            yearFilter.innerHTML = '<option value="">全部年份</option>';
            
            options.years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = `${year}年`;
                yearFilter.appendChild(option);
            });
        }
    }

    renderRecords() {
        if (!this.elements.serviceRecordGrid) return;

        const container = this.elements.serviceRecordGrid;
        
        if (this.state.filteredRecords.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        // 分页处理
        const startIndex = (this.state.pagination.currentPage - 1) * this.state.pagination.pageSize;
        const endIndex = startIndex + this.state.pagination.pageSize;
        const pageRecords = this.state.filteredRecords.slice(startIndex, endIndex);

        const cardsHTML = pageRecords.map(record => this.createRecordCard(record)).join('');
        
        // 使用 requestAnimationFrame 优化性能
        requestAnimationFrame(() => {
            container.innerHTML = cardsHTML;
            this.bindCardEvents();
        });
    }

    createRecordCard(record) {
        const date = new Date(record.year_month || record.yearMonth);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const formatNumber = (num) => {
            return num ? num.toLocaleString() : '0';
        };

        const avgDaysPerFamily = record.family_count > 0 ? 
            (record.residence_days / record.family_count).toFixed(1) : '0';

        const serviceEfficiency = record.residents_count > 0 ? 
            (record.total_service_count / record.residents_count).toFixed(1) : '0';

        return `
            <article class="service-record-card" data-id="${record.id}" role="button" tabindex="0" aria-label="查看 ${year}年${month}月 的服务记录详情">
                <!-- 卡片头部 -->
                <div class="card-header-bg p-4 text-[var(--brand-text)]">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="time-badge">
                                <div class="text-lg font-bold">${year}</div>
                                <div class="text-sm opacity-90">${month}月</div>
                            </div>
                            <div>
                                <h3 class="text-xl font-semibold">${formatNumber(record.family_count)}户家庭</h3>
                                <p class="text-sm opacity-90">${formatNumber(record.residents_count)}人入住</p>
                            </div>
                        </div>
                        
                        <div class="text-right">
                            <div class="text-2xl font-bold">${formatNumber(record.total_service_count)}</div>
                            <div class="text-xs opacity-90">服务人次</div>
                        </div>
                    </div>
                </div>
                
                <!-- 卡片内容 -->
                <div class="p-4 space-y-3">
                    <!-- 核心指标 -->
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div class="stat-item">
                            <div class="stat-value">${formatNumber(record.residence_days)}</div>
                            <div class="stat-label">入住天数</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${formatNumber(record.accommodation_count)}</div>
                            <div class="stat-label">住宿人次</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${formatNumber(record.care_service_count)}</div>
                            <div class="stat-label">关怀服务</div>
                        </div>
                    </div>
                    
                    <!-- 次要指标 -->
                    <div class="grid grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
                        <div class="flex items-center gap-2">
                            <svg class="size-4 text-[var(--brand-primary)]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            <span>志愿者: ${formatNumber(record.volunteer_service_count)}人次</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <svg class="size-4 text-[var(--brand-primary)]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                            </svg>
                            <span>平均: ${avgDaysPerFamily}天/户</span>
                        </div>
                    </div>
                    
                    ${record.cumulative_residence_days || record.cumulative_service_count ? `
                    <!-- 累计统计 -->
                    <div class="border-t pt-3 mt-3 text-xs text-[var(--text-muted)]">
                        <div class="flex justify-between">
                            <span>累计入住: ${formatNumber(record.cumulative_residence_days)}天</span>
                            <span>累计服务: ${formatNumber(record.cumulative_service_count)}人次</span>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${record.notes ? `
                    <!-- 备注信息 -->
                    <div class="border-t pt-3 mt-3">
                        <p class="text-sm text-[var(--text-secondary)]">
                            <span class="font-medium">备注:</span> ${this.escapeHtml(record.notes)}
                        </p>
                    </div>
                    ` : ''}
                </div>
                
                <!-- 卡片底部 -->
                <div class="p-4 border-t bg-[var(--bg-tertiary)]/30">
                    <div class="flex items-center justify-between">
                        <div class="text-xs text-[var(--text-muted)]">
                            ID: ${record.sequence_number || record.id}
                        </div>
                        <div class="text-xs text-[var(--text-muted)]">
                            效率: ${serviceEfficiency}人次/人
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    bindCardEvents() {
        const cards = this.elements.serviceRecordGrid.querySelectorAll('.service-record-card[data-id]');
        
        cards.forEach(card => {
            // 点击事件
            card.addEventListener('click', () => {
                const recordId = parseInt(card.dataset.id);
                this.showRecordDetail(recordId);
            });

            // 键盘事件
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const recordId = parseInt(card.dataset.id);
                    this.showRecordDetail(recordId);
                }
            });
        });
    }

    showRecordDetail(recordId) {
        const record = this.state.records.find(r => r.id === recordId);
        if (!record) {
            this.showToast('记录不存在', 'error');
            return;
        }

        console.log('显示记录详情:', record);
        // TODO: 实现详情页面显示逻辑
        this.showToast(`查看记录 ${record.sequence_number || recordId} 的详情`, 'info');
    }

    debounceSearch(query) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.state.filters.search = query.trim();
            this.applyFilters();
        }, 300);
    }

    async applyFilters() {
        try {
            // 更新筛选状态
            this.state.filters.year = this.elements.yearFilter?.value || '';
            this.state.filters.month = this.elements.monthFilter?.value || '';
            this.state.filters.sort = this.elements.sortSelect?.value || 'date-desc';

            // 重置到第一页
            this.state.pagination.currentPage = 1;

            // 重新加载数据
            await this.loadRecords();

        } catch (error) {
            console.error('应用筛选失败:', error);
            this.showToast('筛选失败：' + error.message, 'error');
        }
    }

    resetFilters() {
        // 重置筛选器值
        if (this.elements.searchInput) this.elements.searchInput.value = '';
        if (this.elements.yearFilter) this.elements.yearFilter.value = '';
        if (this.elements.monthFilter) this.elements.monthFilter.value = '';
        if (this.elements.sortSelect) this.elements.sortSelect.value = 'date-desc';

        // 重置状态
        this.state.filters = {
            search: '',
            year: '',
            month: '',
            sort: 'date-desc'
        };

        this.state.pagination.currentPage = 1;

        // 重新加载数据
        this.loadRecords();
        this.showToast('筛选条件已重置', 'success');
    }

    async handleExport() {
        try {
            this.showToast('正在导出数据...', 'info');
            
            const result = await window.electronAPI.familyService.exportExcel(this.state.filters);
            
            if (result.success) {
                this.showToast(result.message, 'success');
            } else {
                this.showToast(result.message, 'error');
            }

        } catch (error) {
            console.error('导出失败:', error);
            this.showToast('导出失败：' + error.message, 'error');
        }
    }

    previousPage() {
        if (this.state.pagination.currentPage > 1) {
            this.state.pagination.currentPage--;
            this.renderRecords();
            this.updatePagination();
        }
    }

    nextPage() {
        if (this.state.pagination.currentPage < this.state.pagination.totalPages) {
            this.state.pagination.currentPage++;
            this.renderRecords();
            this.updatePagination();
        }
    }

    updatePagination() {
        const { currentPage, totalPages } = this.state.pagination;
        
        if (this.elements.prevPageBtn) {
            this.elements.prevPageBtn.disabled = currentPage <= 1;
        }
        
        if (this.elements.nextPageBtn) {
            this.elements.nextPageBtn.disabled = currentPage >= totalPages;
        }
        
        if (this.elements.pageInfo) {
            this.elements.pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
        }

        // 显示或隐藏分页控件
        if (this.elements.paginationSection) {
            this.elements.paginationSection.classList.toggle('hidden', totalPages <= 1);
        }
    }

    updateResultCount(text) {
        if (this.elements.resultCount) {
            this.elements.resultCount.textContent = text;
        }
    }

    showLoading(show = true) {
        if (this.elements.loadingState) {
            this.elements.loadingState.classList.toggle('hidden', !show);
        }
        if (this.elements.serviceRecordGrid) {
            this.elements.serviceRecordGrid.classList.toggle('hidden', show);
        }
        this.hideEmptyState();
        this.clearError();
    }

    showEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.classList.remove('hidden');
        }
        if (this.elements.serviceRecordGrid) {
            this.elements.serviceRecordGrid.classList.add('hidden');
        }
    }

    hideEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.classList.add('hidden');
        }
        if (this.elements.serviceRecordGrid) {
            this.elements.serviceRecordGrid.classList.remove('hidden');
        }
    }

    showError(message) {
        this.state.error = message;
        
        if (this.elements.errorState) {
            this.elements.errorState.classList.remove('hidden');
            const errorText = this.elements.errorState.querySelector('p');
            if (errorText) {
                errorText.textContent = message;
            }
        }
        
        this.hideEmptyState();
        this.showLoading(false);
    }

    clearError() {
        this.state.error = null;
        if (this.elements.errorState) {
            this.elements.errorState.classList.add('hidden');
        }
    }

    animateNumber(element, targetValue, decimals = 0) {
        if (!element) return;

        const startValue = 0;
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (targetValue - startValue) * easeOutCubic;
            
            element.textContent = decimals > 0 ? 
                currentValue.toFixed(decimals) : 
                Math.floor(currentValue).toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    showToast(message, type = 'info') {
        if (!this.elements.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `
            flex items-center gap-3 p-4 rounded-lg shadow-lg text-white text-sm
            transform translate-x-full opacity-0 transition-all duration-300 ease-out
            ${type === 'success' ? 'bg-[var(--success-color)]' : 
              type === 'error' ? 'bg-[var(--error-color)]' : 
              type === 'warning' ? 'bg-[var(--warning-color)]' : 
              'bg-[var(--brand-primary)]'}
        `;

        const icon = type === 'success' ? '✓' : 
                    type === 'error' ? '✗' : 
                    type === 'warning' ? '⚠' : 'ℹ';

        toast.innerHTML = `
            <span class="font-medium">${icon}</span>
            <span>${this.escapeHtml(message)}</span>
            <button class="ml-2 opacity-70 hover:opacity-100" onclick="this.parentElement.remove()">×</button>
        `;

        this.elements.toastContainer.appendChild(toast);

        // 触发进入动画
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        });

        // 自动移除
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }
        }, type === 'error' ? 5000 : 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 主题系统初始化
    initThemeSystem() {
        const themes = [
            { id: 'emerald', name: '薄荷翡翠', colors: ['#0d9488', '#0f766e'] },
            { id: 'aurora', name: '星云薄暮', colors: ['#BCB6FF', '#B8E1FF'] },
            { id: 'sunrise', name: '活力阳光', colors: ['#E8AA14', '#FF5714'] },
            { id: 'berry', name: '蔷薇甜莓', colors: ['#C52184', '#334139'] }
        ];

        if (this.elements.themeMenu) {
            this.elements.themeMenu.innerHTML = themes.map((theme, index) => `
                <button data-theme-id="${theme.id}" 
                        role="menuitemradio" 
                        aria-checked="false" 
                        class="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-[var(--bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)]" 
                        tabindex="${index === 0 ? 0 : -1}">
                    <span class="size-4 rounded-full" style="background-image: linear-gradient(to right, ${theme.colors[0]}, ${theme.colors[1]})"></span>
                    <span>${theme.name}</span>
                </button>
            `).join('');
        }

        // 恢复保存的主题
        const savedTheme = localStorage.getItem('app-theme') || 'emerald';
        this.applyTheme(savedTheme);

        // 绑定主题切换事件
        this.bindThemeEvents();
    }

    bindThemeEvents() {
        if (this.elements.themeToggleBtn) {
            this.elements.themeToggleBtn.addEventListener('click', () => {
                this.toggleThemeMenu();
            });
        }

        if (this.elements.themeMenu) {
            this.elements.themeMenu.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-theme-id]');
                if (button) {
                    const themeId = button.dataset.themeId;
                    this.applyTheme(themeId);
                    this.toggleThemeMenu(false);
                }
            });
        }

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (this.elements.themeToggleBtn && this.elements.themeMenu &&
                !this.elements.themeToggleBtn.contains(e.target) && 
                !this.elements.themeMenu.contains(e.target)) {
                this.toggleThemeMenu(false);
            }
        });

        // ESC键关闭菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.themeMenu) {
                this.toggleThemeMenu(false);
            }
        });
    }

    toggleThemeMenu(show) {
        if (!this.elements.themeMenu || !this.elements.themeToggleBtn) return;

        const shouldShow = show !== undefined ? show : 
                          this.elements.themeMenu.classList.contains('opacity-0');

        this.elements.themeMenu.classList.toggle('opacity-0', !shouldShow);
        this.elements.themeMenu.classList.toggle('scale-95', !shouldShow);
        this.elements.themeMenu.classList.toggle('pointer-events-none', !shouldShow);
        this.elements.themeToggleBtn.setAttribute('aria-expanded', String(shouldShow));

        if (shouldShow) {
            this.elements.themeMenu.focus();
        }
    }

    applyTheme(themeId) {
        document.documentElement.setAttribute('data-theme', themeId);
        localStorage.setItem('app-theme', themeId);

        // 更新选中状态
        if (this.elements.themeMenu) {
            const buttons = this.elements.themeMenu.querySelectorAll('[role="menuitemradio"]');
            buttons.forEach(button => {
                button.setAttribute('aria-checked', String(button.dataset.themeId === themeId));
            });
        }
    }
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.familyServiceApp = new FamilyServiceApp();
});

// 暴露全局方法供调试使用
window.showFamilyServiceDetail = (id) => {
    if (window.familyServiceApp) {
        window.familyServiceApp.showRecordDetail(id);
    }
};