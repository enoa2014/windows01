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
            viewMode: 'list', // 'grid' 或 'list' - 默认列表视图
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

            // 视图切换按钮
            gridViewBtn: document.getElementById('gridViewBtn'),
            listViewBtn: document.getElementById('listViewBtn'),

            // 主题相关
            themeToggleBtn: document.getElementById('themeToggleBtn'),
            themeMenu: document.getElementById('themeMenu'),
            backBtn: document.getElementById('backBtn'),

            // 详情视图
            listView: document.getElementById('listView'),
            detailView: document.getElementById('detailView'),

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
            // 设置基础UI
            this.setupBasicUI();
            
            // 绑定事件监听器
            this.bindEventListeners();
            
            // 初始化主题系统
            this.initThemeSystem();
            
            // 初始化视图模式
            this.initViewMode();
            
            // 加载初始数据
            await this.loadInitialData();
            
            this.initialized = true;
            
        } catch (error) {
            console.error('应用初始化失败:', error);
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
                window.location.href = './index.html';
            });
        }

        // 视图切换按钮
        if (this.elements.gridViewBtn) {
            this.elements.gridViewBtn.addEventListener('click', () => {
                this.setViewMode('grid');
            });
        }

        if (this.elements.listViewBtn) {
            this.elements.listViewBtn.addEventListener('click', () => {
                this.setViewMode('list');
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

            // 分别加载数据，确保即使某个失败也能继续
            let overviewStats = null;
            let filterOptions = null;

            try {
                overviewStats = await this.loadOverviewStats();
                console.log('✅ 统计数据加载成功');
            } catch (error) {
                console.error('❌ 统计数据加载失败:', error);
            }

            try {
                filterOptions = await this.loadFilterOptions();
                console.log('✅ 筛选选项加载成功');
            } catch (error) {
                console.error('❌ 筛选选项加载失败:', error);
            }

            // 更新概览卡片
            if (overviewStats) {
                this.updateOverviewCards(overviewStats);
            }

            // 更新筛选选项
            if (filterOptions) {
                this.updateFilterOptions(filterOptions);
            }

            // 加载记录列表 - 这是最重要的，确保一定会执行
            try {
                console.log('🔄 开始加载记录列表...');
                await this.loadRecords();
                console.log('✅ 记录列表加载成功');
            } catch (error) {
                console.error('❌ 记录列表加载失败:', error);
                this.showError('记录列表加载失败：' + error.message);
            }

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
            console.log('🔄 [FamilyServiceApp] loadRecords 开始执行');
            this.state.loading = true;
            this.updateResultCount('加载中...');

            const filters = { ...this.state.filters };
            const pagination = {
                limit: this.state.pagination.pageSize,
                offset: (this.state.pagination.currentPage - 1) * this.state.pagination.pageSize
            };

            console.log('📊 [FamilyServiceApp] 准备调用 electronAPI，参数:', { filters, pagination });

            // 检查 electronAPI 是否可用
            if (!window.electronAPI) {
                throw new Error('electronAPI 不可用');
            }
            if (!window.electronAPI.familyService) {
                throw new Error('familyService API 不可用');
            }
            if (!window.electronAPI.familyService.getRecords) {
                throw new Error('getRecords 方法不可用');
            }

            console.log('✅ [FamilyServiceApp] electronAPI 检查通过，开始调用 getRecords');
            const records = await window.electronAPI.familyService.getRecords(filters, pagination);
            console.log('📋 [FamilyServiceApp] getRecords 返回结果:', records);
            
            this.state.records = records;
            this.state.filteredRecords = records;
            
            // 更新总页数
            const totalRecords = records.length;
            this.state.pagination.totalPages = Math.ceil(totalRecords / this.state.pagination.pageSize);

            console.log('🎨 [FamilyServiceApp] 开始渲染记录...');
            this.renderRecords();
            this.updatePagination();
            this.updateResultCount(`显示 ${totalRecords} 条记录`);

            this.state.loading = false;
            console.log('✅ [FamilyServiceApp] loadRecords 执行完成');

        } catch (error) {
            console.error('❌ [FamilyServiceApp] 加载记录失败:', error);
            this.showError('加载记录失败：' + error.message);
            this.state.loading = false;
        }
    }

    updateOverviewCards(stats) {
        if (!stats) {
            console.warn('统计数据为空');
            return;
        }


        // 支持两种数据格式：新格式(直接)和旧格式(stats.overall)
        const data = stats.overall || stats;

        // 更新概览卡片数据
        // 总记录数：家庭服务记录总条数
        this.animateNumber(this.elements.totalRecords, data.totalRecords || 0);
        
        // 累计服务家庭：所有记录的family_count总和
        this.animateNumber(this.elements.totalFamilies, data.totalFamilies || 0);
        
        // 总服务人次：所有记录的total_service_count总和
        this.animateNumber(this.elements.totalServices, data.totalServices || 0);
        
        // 平均入住天数：使用后端计算的avgDaysPerFamily
        const avgDays = data.avgDaysPerFamily || 0;
        this.animateNumber(this.elements.avgDays, parseFloat(avgDays), 1);

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

        // 后端已经做了分页，前端直接渲染所有返回的记录
        const recordsToRender = this.state.filteredRecords;

        const cardsHTML = recordsToRender.map(record => this.createRecordCard(record)).join('');
        
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

        // 根据当前视图模式添加对应的CSS类
        const viewModeClass = this.state.viewMode === 'list' ? 'list-mode' : 'grid-mode';

        return `
            <article class="service-record-card ${viewModeClass}" data-id="${record.id}" role="button" tabindex="0" aria-label="查看 ${year}年${month}月 的服务记录详情">
                <!-- 卡片头部：日期标识 -->
                <div class="card-header-bg p-4 text-[var(--brand-text)]">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="time-badge">
                                <div class="text-lg font-bold">${year}</div>
                                <div class="text-sm opacity-90">${month}月</div>
                            </div>
                            <div>
                                <h3 class="text-xl font-semibold">${year}年${month}月</h3>
                                <p class="text-sm opacity-90">家庭服务记录</p>
                            </div>
                        </div>
                        
                        <div class="text-right">
                            <div class="text-xs opacity-75">点击查看详情</div>
                            <svg class="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <!-- 卡片内容：核心信息 -->
                <div class="p-4">
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <!-- 家庭户数 -->
                        <div class="stat-item">
                            <div class="stat-value">${formatNumber(record.family_count)}</div>
                            <div class="stat-label">户家庭</div>
                        </div>
                        
                        <!-- 入住人数 -->
                        <div class="stat-item">
                            <div class="stat-value">${formatNumber(record.residents_count)}</div>
                            <div class="stat-label">人入住</div>
                        </div>
                        
                        <!-- 住宿人次 -->
                        <div class="stat-item">
                            <div class="stat-value">${formatNumber(record.accommodation_count)}</div>
                            <div class="stat-label">住宿人次</div>
                        </div>
                    </div>
                </div>
                
                <!-- 卡片底部：记录编号 -->
                <div class="px-4 pb-4">
                    <div class="text-center">
                        <div class="text-xs text-[var(--text-muted)]">
                            记录编号: ${record.sequence_number || record.id}
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

        
        // 切换到详情视图
        this.switchToDetailView();
        
        // 渲染详情内容
        this.renderDetailView(record);
        
        // 显示成功消息
        this.showToast(`正在查看 ${record.sequence_number || recordId} 号记录详情`, 'success');
    }

    switchToDetailView() {
        // 隐藏列表视图，显示详情视图
        if (this.elements.listView) {
            this.elements.listView.classList.remove('active');
        }
        if (this.elements.detailView) {
            this.elements.detailView.classList.add('active');
        }
        
    }

    switchToListView() {
        // 隐藏详情视图，显示列表视图
        if (this.elements.detailView) {
            this.elements.detailView.classList.remove('active');
        }
        if (this.elements.listView) {
            this.elements.listView.classList.add('active');
        }
        
    }

    renderDetailView(record) {
        if (!this.elements.detailView) return;

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

        const detailHTML = `
            <!-- 详情页面头部 -->
            <div class="mb-6">
                <div class="flex items-center gap-4 mb-4">
                    <button id="backToListBtn" class="inline-flex items-center justify-center size-10 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)]" title="返回列表" aria-label="返回列表">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
                            <path fill-rule="evenodd" d="M9.53 5.47a.75.75 0 010 1.06L4.81 11.25H21a.75.75 0 010 1.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold text-[var(--brand-primary)]">${year}年${month}月 家庭服务记录</h1>
                        <p class="text-[var(--text-secondary)] mt-1">记录编号: ${record.sequence_number || record.id}</p>
                    </div>
                </div>
            </div>

            <!-- 详情内容 -->
            <div class="space-y-6">
                <!-- 主要统计信息 -->
                <div class="overview-cards">
                    <div class="overview-card">
                        <p class="stat-label">服务家庭</p>
                        <p class="stat-value">${formatNumber(record.family_count)}</p>
                        <p class="stat-trend">户</p>
                    </div>
                    
                    <div class="overview-card">
                        <p class="stat-label">入住人数</p>
                        <p class="stat-value">${formatNumber(record.residents_count)}</p>
                        <p class="stat-trend">人</p>
                    </div>
                    
                    <div class="overview-card">
                        <p class="stat-label">入住天数</p>
                        <p class="stat-value">${formatNumber(record.residence_days)}</p>
                        <p class="stat-trend">天</p>
                    </div>
                    
                    <div class="overview-card">
                        <p class="stat-label">住宿人次</p>
                        <p class="stat-value">${formatNumber(record.accommodation_count)}</p>
                        <p class="stat-trend">人次</p>
                    </div>
                </div>

                <!-- 服务详情 -->
                <div class="filter-toolbar">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">服务详情</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="text-center p-4 rounded-xl bg-[var(--bg-tertiary)]/50">
                            <div class="text-2xl font-bold text-[var(--brand-primary)]">${formatNumber(record.care_service_count)}</div>
                            <div class="text-sm text-[var(--text-muted)] mt-1">照护服务次数</div>
                        </div>
                        
                        <div class="text-center p-4 rounded-xl bg-[var(--bg-tertiary)]/50">
                            <div class="text-2xl font-bold text-[var(--brand-primary)]">${formatNumber(record.volunteer_service_count)}</div>
                            <div class="text-sm text-[var(--text-muted)] mt-1">志愿服务次数</div>
                        </div>
                        
                        <div class="text-center p-4 rounded-xl bg-[var(--bg-tertiary)]/50">
                            <div class="text-2xl font-bold text-[var(--brand-primary)]">${formatNumber(record.total_service_count)}</div>
                            <div class="text-sm text-[var(--text-muted)] mt-1">总服务次数</div>
                        </div>
                    </div>
                </div>

                <!-- 计算指标 -->
                <div class="filter-toolbar">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">计算指标</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]/30">
                            <span class="text-[var(--text-secondary)]">平均入住天数/户</span>
                            <span class="text-xl font-bold text-[var(--brand-primary)]">${avgDaysPerFamily} 天</span>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]/30">
                            <span class="text-[var(--text-secondary)]">服务效率</span>
                            <span class="text-xl font-bold text-[var(--brand-primary)]">${serviceEfficiency}</span>
                        </div>
                    </div>
                </div>

                <!-- 累计统计 -->
                ${record.cumulative_residence_days > 0 || record.cumulative_service_count > 0 ? `
                <div class="filter-toolbar">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">累计统计</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]/30">
                            <span class="text-[var(--text-secondary)]">累计入住天数</span>
                            <span class="text-xl font-bold text-[var(--brand-primary)]">${formatNumber(record.cumulative_residence_days)} 天</span>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]/30">
                            <span class="text-[var(--text-secondary)]">累计服务次数</span>
                            <span class="text-xl font-bold text-[var(--brand-primary)]">${formatNumber(record.cumulative_service_count)} 次</span>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- 备注信息 -->
                ${record.notes ? `
                <div class="filter-toolbar">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">备注信息</h3>
                    <div class="p-4 rounded-xl bg-[var(--bg-tertiary)]/30">
                        <p class="text-[var(--text-primary)]">${record.notes}</p>
                    </div>
                </div>
                ` : ''}

                <!-- 记录信息 -->
                <div class="filter-toolbar">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">记录信息</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[var(--text-secondary)]">
                        <div>
                            <span class="font-medium">创建时间：</span>
                            <span>${new Date(record.created_at).toLocaleString('zh-CN')}</span>
                        </div>
                        <div>
                            <span class="font-medium">更新时间：</span>
                            <span>${new Date(record.updated_at).toLocaleString('zh-CN')}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.elements.detailView.innerHTML = detailHTML;
        
        // 绑定返回按钮事件
        const backBtn = this.elements.detailView.querySelector('#backToListBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.switchToListView();
            });
        }
        
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

    // 初始化视图模式
    initViewMode() {
        
        // 读取保存的用户偏好，默认为列表视图
        const savedViewMode = localStorage.getItem('app-view-mode') || 'list';
        this.state.viewMode = savedViewMode;
        
        
        // 立即更新按钮状态和容器样式
        this.updateViewToggleButtons();
        this.updateViewContainerClasses();
    }

    // 视图模式切换方法
    setViewMode(mode) {
        if (this.state.viewMode === mode) {
            return;
        }
        
        this.state.viewMode = mode;
        
        // 更新按钮状态
        this.updateViewToggleButtons();
        
        // 更新容器样式
        this.updateViewContainerClasses();
        
        // 重新渲染记录以应用新的视图样式
        this.renderRecords();
        
        // 保存用户偏好
        localStorage.setItem('app-view-mode', mode);
        
    }

    updateViewToggleButtons() {
        if (!this.elements.gridViewBtn || !this.elements.listViewBtn) return;
        
        // 重置按钮样式
        this.elements.gridViewBtn.className = 'px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-all';
        this.elements.listViewBtn.className = 'px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-all';
        
        // 设置当前模式的按钮为激活状态
        if (this.state.viewMode === 'grid') {
            this.elements.gridViewBtn.className = 'px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md shadow-sm transition-all';
        } else {
            this.elements.listViewBtn.className = 'px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md shadow-sm transition-all';
        }
    }

    updateViewContainerClasses() {
        if (!this.elements.serviceRecordGrid) return;
        
        const container = this.elements.serviceRecordGrid;
        
        // 清除旧的视图模式类
        container.classList.remove('service-grid-view', 'service-list-view');
        container.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
        container.classList.remove('space-y-4');
        
        if (this.state.viewMode === 'grid') {
            // 网格视图
            container.classList.add('service-grid-view', 'grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6', 'md:gap-8');
        } else {
            // 列表视图
            container.classList.add('service-list-view', 'space-y-4');
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