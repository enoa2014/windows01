// 患儿入住信息管理系统 - 前端应用
class PatientApp {
    constructor() {
        this.patients = [];
        this.filteredPatients = [];
        this.currentView = 'home';
        this.currentViewMode = 'list'; // 默认为列表视图
        
        // Chart.js 实例存储，防止内存泄漏
        this.charts = {
            genderChart: null,
            locationChart: null,
            diseaseChart: null,
            doctorChart: null,
            trendChart: null
        };
        
        // 页面状态标志，防止重复加载
        this.pageStates = {
            statisticsLoading: false,
            statisticsLoaded: false
        };
        
        // DOM元素引用
        this.elements = {
            // 视图切换
            homeView: document.getElementById('homeView'),
            listView: document.getElementById('listView'),
            detailView: document.getElementById('detailView'),
            statisticsView: document.getElementById('statisticsView'),
            homeBtn: document.getElementById('homeBtn'),
            backBtn: document.getElementById('backBtn'),
            
            // 导航相关
            pageTitle: document.getElementById('pageTitle'),
            breadcrumbHome: document.getElementById('breadcrumbHome'),
            breadcrumbSeparator: document.getElementById('breadcrumbSeparator'),
            breadcrumbCurrent: document.getElementById('breadcrumbCurrent'),
            
            // 主页统计
            homePatientCount: document.getElementById('homePatientCount'),
            homeRecordCount: document.getElementById('homeRecordCount'),
            homeFamilyCount: document.getElementById('homeFamilyCount'),
            homeServiceCount: document.getElementById('homeServiceCount'),
            
            // 详情页排序
            timelineSortSelect: null, // 动态创建
            
            // 数据显示
            totalPatients: document.getElementById('totalPatients'),
            totalRecords: document.getElementById('totalRecords'),
            resultCount: document.getElementById('resultCount'),
            patientGrid: document.getElementById('patientGrid'),
            emptyState: document.getElementById('emptyState'),
            
            // 控制元素
            searchInput: document.getElementById('searchInput'),
            sortSelect: document.getElementById('sortSelect'),
            resetBtn: document.getElementById('resetBtn'),
            importBtn: document.getElementById('importBtn'),
            
            // 主题控制
            themeToggleBtn: document.getElementById('themeToggleBtn'),
            themeMenu: document.getElementById('themeMenu'),
            
            // 视图切换控制
            gridViewBtn: document.getElementById('gridViewBtn'),
            listViewBtn: document.getElementById('listViewBtn'),
            
            // 加载指示器
            loadingIndicator: document.getElementById('loadingIndicator'),
            loadingText: document.getElementById('loadingText'),
            
            // 页脚
            year: document.getElementById('year'),
            appVersion: document.getElementById('appVersion'),
            printTime: document.getElementById('printTime')
        };

        this.init();
    }

    async init() {
        try {
            // 初始化页面元素
            this.initPageElements();
            
            // 初始化事件监听器
            this.initEventListeners();
            
            // 初始化主题系统
            this.initThemeSystem();
            
            // 加载数据
            await this.loadData();
            
            console.log('应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showError('应用初始化失败，请重启应用');
        }
    }

    initPageElements() {
        // 设置页脚信息
        this.elements.year.textContent = new Date().getFullYear();
        this.elements.appVersion.textContent = window.electronAPI.getAppVersion();
        
        const now = new Date();
        this.elements.printTime.textContent = `打印时间：${now.toLocaleString()}`;
    }

    initEventListeners() {
        // 视图切换
        this.elements.homeBtn.addEventListener('click', () => this.navigateTo('home'));
        this.elements.backBtn.addEventListener('click', () => this.navigateTo('patientList'));
        
        // 搜索和排序
        this.elements.searchInput.addEventListener('input', this.debounce(() => this.filterAndSort(), 300));
        this.elements.sortSelect.addEventListener('change', () => this.filterAndSort());
        this.elements.resetBtn.addEventListener('click', () => this.resetFilters());
        
        // 导入功能
        this.elements.importBtn.addEventListener('click', () => this.importExcel());
        
        // 快捷键支持
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== this.elements.searchInput) {
                e.preventDefault();
                this.elements.searchInput.focus();
            }
        });

        // 视图切换按钮事件
        this.elements.gridViewBtn.addEventListener('click', () => this.setViewMode('grid'));
        this.elements.listViewBtn.addEventListener('click', () => this.setViewMode('list'));
        
        // 患者卡片点击事件（事件委托）
        this.elements.patientGrid.addEventListener('click', (e) => {
            const card = e.target.closest('article[data-id]');
            if (card) {
                const patientId = parseInt(card.dataset.id);
                this.showPatientDetail(patientId);
            }
        });

        // 支持键盘导航
        this.elements.patientGrid.addEventListener('keydown', (e) => {
            const card = e.target.closest('article[data-id]');
            if (card && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                const patientId = parseInt(card.dataset.id);
                this.showPatientDetail(patientId);
            }
        });
    }

    initThemeSystem() {
        const themes = [
            { id: 'emerald', name: '薄荷翡翠', colors: ['#0d9488', '#0f766e'] },
            { id: 'aurora', name: '星云薄暮', colors: ['#BCB6FF', '#B8E1FF'] },
            { id: 'sunrise', name: '活力阳光', colors: ['#E8AA14', '#FF5714'] },
            { id: 'berry', name: '蔷薇甜莓', colors: ['#C52184', '#334139'] },
        ];

        // 生成主题菜单
        this.elements.themeMenu.innerHTML = themes.map((theme, index) => `
            <button data-theme-id="${theme.id}" role="menuitemradio" aria-checked="false" 
                    class="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-[var(--bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)]" 
                    tabindex="${index === 0 ? 0 : -1}">
                <span class="size-4 rounded-full" style="background-image: linear-gradient(to right, ${theme.colors[0]}, ${theme.colors[1]})"></span>
                <span>${theme.name}</span>
            </button>
        `).join('');

        // 主题切换事件
        this.elements.themeToggleBtn.addEventListener('click', () => this.toggleThemeMenu());
        this.elements.themeMenu.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-theme-id]');
            if (button) {
                this.applyTheme(button.dataset.themeId);
                this.toggleThemeMenu(false);
            }
        });

        // 点击外部关闭主题菜单
        document.addEventListener('click', (e) => {
            if (!this.elements.themeToggleBtn.contains(e.target) && !this.elements.themeMenu.contains(e.target)) {
                this.toggleThemeMenu(false);
            }
        });

        // 恢复保存的主题
        const savedTheme = localStorage.getItem('app-theme') || 'emerald';
        this.applyTheme(savedTheme);
        
        // 初始化视图模式
        this.initViewMode();
        
        // 统计页面模态框事件
        this.initStatisticsEvents();
    }

    initStatisticsEvents() {
        // 年龄段模态框关闭事件
        const ageModal = document.getElementById('ageDetailModal');
        const ageModalClose = document.getElementById('closeAgeModal');
        const ageModalCloseBtn = document.getElementById('closeAgeModalBtn');
        
        if (ageModalClose) {
            ageModalClose.addEventListener('click', () => {
                ageModal.classList.add('hidden');
            });
        }
        
        if (ageModalCloseBtn) {
            ageModalCloseBtn.addEventListener('click', () => {
                ageModal.classList.add('hidden');
            });
        }
        
        // 点击模态框背景关闭
        if (ageModal) {
            ageModal.addEventListener('click', (e) => {
                if (e.target === ageModal) {
                    ageModal.classList.add('hidden');
                }
            });
        }
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !ageModal.classList.contains('hidden')) {
                ageModal.classList.add('hidden');
            }
        });
    }

    async loadData() {
        try {
            this.showLoading('加载患者数据...');
            
            // 等待一小段时间确保后端初始化完成
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 并发获取数据
            const [patients, statistics] = await Promise.all([
                window.electronAPI.getPatients(),
                window.electronAPI.getStatistics()
            ]);
            
            this.patients = patients || [];
            this.updateStatistics(statistics);
            this.filterAndSort();
            
            // 如果当前在主页，更新主页统计
            if (this.currentView === 'home') {
                this.updateHomeStatistics();
            }
            
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('数据加载失败:', error);
            this.showError('数据加载失败，请检查数据库连接');
        }
    }

    filterAndSort() {
        const searchTerm = this.elements.searchInput.value.toLowerCase().trim();
        const sortBy = this.elements.sortSelect.value;

        // 筛选（只保留搜索功能）
        this.filteredPatients = this.patients.filter(patient => {
            return !searchTerm || 
                [patient.name, patient.diagnosis, patient.hometown].some(field => 
                    field && field.toLowerCase().includes(searchTerm)
                );
        });

        // 排序
        this.filteredPatients.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name, 'zh');
                case 'age':
                    // 按年龄降序（年龄大的在前），无效日期排在最后
                    const ageA = this.calculateAge(a.birth_date);
                    const ageB = this.calculateAge(b.birth_date);
                    
                    // 处理无效年龄（-1）
                    if (ageA === -1 && ageB === -1) return 0;
                    if (ageA === -1) return 1;  // a排到后面
                    if (ageB === -1) return -1; // b排到后面
                    
                    return ageB - ageA; // 正常年龄比较
                case 'visits':
                    return (b.check_in_count || 0) - (a.check_in_count || 0); // 按入住次数降序
                case 'recent':
                default:
                    return new Date(b.latest_check_in || '1900-01-01') - new Date(a.latest_check_in || '1900-01-01');
            }
        });

        this.renderPatientList();
    }

    renderPatientList() {
        const patients = this.filteredPatients;
        
        // 更新结果计数
        this.elements.resultCount.textContent = `${patients.length} 条结果`;
        
        // 显示/隐藏空状态
        this.elements.emptyState.classList.toggle('hidden', patients.length > 0);
        
        if (patients.length === 0) {
            this.elements.patientGrid.innerHTML = '';
            return;
        }

        const searchTerm = this.elements.searchInput.value.toLowerCase().trim();
        const cards = patients.map(patient => this.createPatientCard(patient, searchTerm));
        
        this.elements.patientGrid.innerHTML = cards.join('');
        
        // 应用当前视图模式
        this.applyViewMode();
    }

    createPatientCard(patient, searchTerm = '') {
        const age = this.calculateAge(patient.birth_date);
        const initials = patient.name ? patient.name.charAt(0) : '?';
        
        // 高亮搜索关键词
        const highlightedName = this.highlightText(patient.name || '', searchTerm);
        const highlightedDiagnosis = this.highlightText(patient.diagnosis || '', searchTerm);
        const highlightedHometown = this.highlightText(patient.hometown || '', searchTerm);
        
        // 入住次数显示
        const checkInCount = patient.check_in_count || 0;
        
        // 脱敏显示身份证号
        const maskedId = this.maskIdCard(patient.id_number);

        return `
        <article class="patient-card ${this.currentViewMode === 'list' ? 'list-mode' : ''}" 
                 role="button" 
                 tabindex="0" 
                 aria-label="查看 ${patient.name} 的详情" 
                 data-id="${patient.person_id}">
          <div class="patient-card-body">
            <!-- 患者头部信息 -->
            <div class="patient-header">
              <div class="patient-info">
                <div class="patient-avatar">${initials}</div>
                <div class="patient-details">
                  <h3>${highlightedName}</h3>
                  <div class="patient-meta">
                    <span>${patient.gender || '未知性别'}</span>
                    <span class="separator">·</span>
                    <span>${this.displayAge(patient.birth_date)}岁</span>
                    <span class="separator">·</span>
                    <span class="mask-id">${maskedId}</span>
                  </div>
                </div>
              </div>
              
              <!-- 入住次数标签 -->
              <span class="patient-status status-info">${checkInCount}次入住</span>
            </div>
            
            <!-- 关键医疗信息 -->
            <div class="patient-medical-info">
              <div class="medical-field">
                <span class="medical-field-label">最近诊断</span>
                <span class="medical-field-value" title="${patient.diagnosis || '暂无诊断信息'}">${highlightedDiagnosis || '暂无诊断信息'}</span>
              </div>
              <div class="medical-field">
                <span class="medical-field-label">患者籍贯</span>
                <span class="medical-field-value" title="${patient.hometown || '未知地区'}">${highlightedHometown || '未知地区'}</span>
              </div>
            </div>
            
            <!-- 操作按钮区域 -->
            <div class="patient-footer">
              <div class="patient-stats">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <span>入住次数：${patient.check_in_count || 0}次</span>
              </div>
              
              <a href="#" class="patient-action" data-action="view-detail">
                查看详情
                <svg class="arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
            
            ${patient.latest_check_in ? `<div class="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">最近入住：${patient.latest_check_in}</div>` : ''}
          </div>
        </article>`;
    }

    async showPatientDetail(personId) {
        try {
            this.showLoading('加载患者详情...');
            
            const patientDetail = await window.electronAPI.getPatientDetail(personId);
            this.renderPatientDetail(patientDetail);
            this.setPage('detail');
            
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('加载患者详情失败:', error);
            this.showError('加载患者详情失败');
        }
    }

    renderPatientDetail(detail) {
        const { profile, family, checkIns, medicalInfo } = detail;
        
        if (!profile) {
            this.elements.detailView.innerHTML = '<p class="text-center text-[var(--text-secondary)]">患者信息不存在</p>';
            return;
        }

        const age = this.calculateAge(profile.birth_date);
        
        // 保存原始数据供排序使用
        this.currentPatientDetail = { profile, family, checkIns, medicalInfo };
        
        const timeline = this.createTimelineHTML(checkIns, 'desc', medicalInfo);
        
        this.elements.detailView.innerHTML = `
        <div class="mb-6 no-print">
          <div class="flex flex-wrap items-center gap-3">
            <div class="size-12 rounded-full bg-[var(--brand-primary)] text-[var(--brand-text)] grid place-items-center text-lg font-semibold">
              ${profile.name ? profile.name.charAt(0) : '?'}
            </div>
            <div>
              <h2 id="detailTitle" class="text-2xl md:text-3xl font-extrabold text-[var(--brand-secondary)]">${profile.name || '未知'} 的档案</h2>
              <p class="text-[var(--text-secondary)]">诊断：${medicalInfo && medicalInfo.length > 0 ? medicalInfo[0].diagnosis || '未知' : '未知'}</p>
            </div>
            <div class="ml-auto flex items-center gap-2">
              <button onclick="window.print()" class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-primary)] px-3 py-2 text-sm hover:bg-[var(--bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)]">
                打印
              </button>
              <button id="exportBtn" class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-primary)] px-3 py-2 text-sm hover:bg-[var(--bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)]">
                导出
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 md:p-7 shadow-sm print-container">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 border-b border-[var(--border-secondary)] pb-8 mb-8">
            <section>
              <h3 class="font-semibold text-lg mb-3 text-[var(--brand-secondary)]">基本信息</h3>
              <dl class="grid grid-cols-1 gap-2 text-[var(--text-primary)]">
                <div><dt class="inline text-[var(--text-secondary)]">性别：</dt><dd class="inline">${profile.gender || '未知'}</dd></div>
                <div><dt class="inline text-[var(--text-secondary)]">出生日期：</dt><dd class="inline">${profile.birth_date || '未知'}${profile.birth_date ? `（${this.displayAge(profile.birth_date)} 岁）` : ''}</dd></div>
                <div><dt class="inline text-[var(--text-secondary)]">籍贯：</dt><dd class="inline">${profile.hometown || '未知'}</dd></div>
                <div><dt class="inline text-[var(--text-secondary)]">民族：</dt><dd class="inline">${profile.ethnicity || '未知'}</dd></div>
                <div class="mask-id"><dt class="inline text-[var(--text-secondary)]">身份证号：</dt><dd class="inline">${this.maskIdCard(profile.id_card)}</dd></div>
              </dl>
            </section>
            <section>
              <h3 class="font-semibold text-lg mb-3 text-[var(--brand-secondary)]">家庭情况</h3>
              <dl class="grid grid-cols-1 gap-2 text-[var(--text-primary)]">
                <div><dt class="inline text-[var(--text-secondary)]">家庭地址：</dt><dd class="inline">${family?.home_address || '未知'}</dd></div>
                <div><dt class="inline text-[var(--text-secondary)]">父亲：</dt><dd class="inline">${this.formatParentInfo(family?.father_name, family?.father_phone)}</dd></div>
                <div><dt class="inline text-[var(--text-secondary)]">母亲：</dt><dd class="inline">${this.formatParentInfo(family?.mother_name, family?.mother_phone)}</dd></div>
                ${family?.other_guardian ? `<div><dt class="inline text-[var(--text-secondary)]">其他监护人：</dt><dd class="inline">${family.other_guardian}</dd></div>` : ''}
                ${family?.economic_status ? `<div><dt class="inline text-[var(--text-secondary)]">家庭经济：</dt><dd class="inline">${family.economic_status}</dd></div>` : ''}
              </dl>
            </section>
          </div>

          <section>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-lg text-[var(--brand-secondary)]">入住历史</h3>
                <span class="text-xs rounded-full bg-[var(--brand-tag-bg)] text-[var(--brand-tag-text)] px-2 py-0.5">${checkIns?.length || 0} 条</span>
              </div>
              <div class="flex items-center gap-2">
                <label for="timelineSortSelect" class="text-sm text-[var(--text-secondary)]">排序:</label>
                <select id="timelineSortSelect" class="text-sm border border-[var(--border-primary)] rounded-lg px-2 py-1 bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)]">
                  <option value="desc">时间降序 (最新在前)</option>
                  <option value="asc">时间升序 (最早在前)</option>
                </select>
              </div>
            </div>
            <div id="timelineContainer">
              ${timeline}
            </div>
          </section>
        </div>`;

        // 绑定导出按钮事件
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportPatientData(detail));
        }
        
        // 绑定排序选择器事件
        this.elements.timelineSortSelect = document.getElementById('timelineSortSelect');
        if (this.elements.timelineSortSelect) {
            this.elements.timelineSortSelect.addEventListener('change', (e) => {
                this.sortTimeline(e.target.value);
            });
        }

        // 更新页面标题
        document.title = `${profile.name} · 患儿详情`;
    }

    createTimelineHTML(checkIns, sortOrder = 'desc', medicalInfo = []) {
        if (!checkIns || checkIns.length === 0) {
            return '<p class="text-[var(--text-secondary)]">暂无入住记录</p>';
        }

        // 对入住记录进行排序
        const sortedCheckIns = this.sortCheckInsByDate(checkIns, sortOrder);

        const timelineItems = sortedCheckIns.map(record => {
            // 查找对应日期的医疗信息
            const relatedMedical = medicalInfo.find(info => info.record_date === record.check_in_date);
            
            // 构建医疗信息显示内容
            let medicalContent = '';
            if (relatedMedical) {
                // 处理字段映射问题：当前数据库中hospital字段实际存储的是诊断信息
                // 分析显示diagnosis字段完全为空，hospital字段包含"急淋"、"急性淋巴细胞白血病"等诊断信息
                // 因此将hospital字段内容显示为"医院诊断"
                const isHospitalActuallyDiagnosis = relatedMedical.hospital && 
                    (!relatedMedical.diagnosis || relatedMedical.diagnosis.trim() === '');
                
                const medicalFields = [
                    // 如果hospital实际是诊断信息，则不显示就诊医院标签
                    ...(isHospitalActuallyDiagnosis ? [] : [{ label: '就诊医院', value: relatedMedical.hospital }]),
                    { label: '医生姓名', value: relatedMedical.doctor_name },
                    // 显示正确的诊断信息
                    { label: '医院诊断', value: isHospitalActuallyDiagnosis ? relatedMedical.hospital : relatedMedical.diagnosis },
                    { label: '症状详情', value: relatedMedical.symptoms },
                    { label: '医治过程', value: relatedMedical.treatment_process },
                    { label: '后续治疗安排', value: relatedMedical.follow_up_plan },
                    { label: '记录日期', value: relatedMedical.record_date }
                ];
                
                const validFields = medicalFields.filter(field => field.value && field.value.trim());
                if (validFields.length > 0) {
                    medicalContent = validFields.map(field => 
                        `<p><span class="font-medium text-[var(--text-primary)]">${field.label}：</span>${field.value}</p>`
                    ).join('');
                }
            }
            
            return `
            <li class="relative pl-8">
              <span class="absolute left-0 top-2 size-3 rounded-full bg-[var(--brand-primary)] ring-4 ring-[var(--brand-tag-bg)]" aria-hidden="true"></span>
              <h4 class="font-semibold text-[var(--brand-secondary)]">${record.check_in_date || '未知日期'}</h4>
              <div class="mt-2 rounded-xl bg-[var(--bg-tertiary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
                ${record.attendees ? `<p><span class="font-medium text-[var(--text-primary)]">入住人：</span>${record.attendees}</p>` : ''}
                ${record.details ? `<p><span class="font-medium text-[var(--text-primary)]">症状详情：</span>${record.details}</p>` : ''}
                ${record.treatment_plan ? `<p><span class="font-medium text-[var(--text-primary)]">后续安排：</span>${record.treatment_plan}</p>` : ''}
                ${medicalContent}
              </div>
            </li>`;
        }).join('');

        return `<ol class="relative border-l-2 border-[var(--brand-primary)]/20 pl-6 space-y-6">${timelineItems}</ol>`;
    }
    
    sortCheckInsByDate(checkIns, sortOrder = 'desc') {
        return [...checkIns].sort((a, b) => {
            const dateA = new Date(a.check_in_date || '1900-01-01');
            const dateB = new Date(b.check_in_date || '1900-01-01');
            
            if (sortOrder === 'asc') {
                return dateA - dateB; // 升序：早→晚
            } else {
                return dateB - dateA; // 降序：晚→早
            }
        });
    }
    
    sortTimeline(sortOrder) {
        if (!this.currentPatientDetail || !this.currentPatientDetail.checkIns) {
            return;
        }
        
        // 重新生成时间线HTML
        const timeline = this.createTimelineHTML(this.currentPatientDetail.checkIns, sortOrder, this.currentPatientDetail.medicalInfo);
        
        // 更新时间线容器
        const timelineContainer = document.getElementById('timelineContainer');
        if (timelineContainer) {
            timelineContainer.innerHTML = timeline;
        }
    }

    async importExcel() {
        try {
            this.showLoading('导入Excel文件...');
            
            const result = await window.electronAPI.importExcel();
            
            this.hideLoading();
            
            if (result.success) {
                this.showSuccess(result.message);
                await this.loadData(); // 重新加载数据
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.hideLoading();
            console.error('导入Excel失败:', error);
            this.showError('导入Excel失败，请检查文件格式');
        }
    }

    exportPatientData(data) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.profile?.name || 'patient'}-档案.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // 视图模式管理
    initViewMode() {
        // 恢复保存的视图模式，默认为列表视图
        const savedViewMode = localStorage.getItem('app-view-mode') || 'list';
        this.setViewMode(savedViewMode);
    }

    setViewMode(mode) {
        if (mode !== 'grid' && mode !== 'list') {
            console.warn(`无效的视图模式: ${mode}`);
            return;
        }

        this.currentViewMode = mode;
        
        // 保存视图模式
        localStorage.setItem('app-view-mode', mode);
        
        // 更新按钮状态
        this.updateViewButtons();
        
        // 应用视图模式
        this.applyViewMode();
    }

    updateViewButtons() {
        // 重置按钮样式
        this.elements.gridViewBtn.className = 'px-3 py-1.5 text-sm font-medium transition-all';
        this.elements.listViewBtn.className = 'px-3 py-1.5 text-sm font-medium transition-all';
        
        if (this.currentViewMode === 'grid') {
            this.elements.gridViewBtn.className += ' text-gray-700 bg-white rounded-md shadow-sm';
            this.elements.listViewBtn.className += ' text-gray-500 hover:text-gray-700';
        } else {
            this.elements.listViewBtn.className += ' text-gray-700 bg-white rounded-md shadow-sm';
            this.elements.gridViewBtn.className += ' text-gray-500 hover:text-gray-700';
        }
    }

    applyViewMode() {
        const patientGrid = this.elements.patientGrid;
        const cards = patientGrid.querySelectorAll('.patient-card');
        
        if (this.currentViewMode === 'list') {
            // 应用列表视图样式
            patientGrid.className = 'patient-list-view space-y-4';
            cards.forEach(card => {
                card.classList.add('list-mode');
                card.classList.remove('grid-mode');
            });
        } else {
            // 应用网格视图样式
            patientGrid.className = 'patient-grid-view grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8';
            cards.forEach(card => {
                card.classList.add('grid-mode');
                card.classList.remove('list-mode');
            });
        }
    }

    // 导航管理
    navigateTo(page) {
        switch (page) {
            case 'home':
                this.setPage('home');
                break;
            case 'patientList':
                this.setPage('list');
                break;
            case 'statistics':
                this.setPage('statistics');
                // 重置统计页面状态，允许重新加载（但仍然防止连续调用）
                if (!this.pageStates.statisticsLoading) {
                    this.pageStates.statisticsLoaded = false;
                }
                this.loadStatisticsPage();
                break;
            default:
                console.warn(`未知页面: ${page}`);
        }
    }

    setPage(pageName) {
        const pages = ['home', 'list', 'detail', 'statistics'];
        pages.forEach(page => {
            const element = this.elements[`${page}View`];
            if (element) {
                element.classList.toggle('active', page === pageName);
            }
        });
        
        // 更新导航按钮状态
        this.elements.homeBtn.style.display = (pageName === 'home') ? 'none' : 'flex';
        this.elements.backBtn.hidden = (pageName === 'home' || pageName === 'list');
        
        // 更新面包屑导航
        this.updateBreadcrumb(pageName);
        
        // 更新页面标题
        this.updatePageTitle(pageName);
        
        this.currentView = pageName;
        
        // 如果是主页，更新统计数据
        if (pageName === 'home') {
            this.updateHomeStatistics();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateBreadcrumb(pageName) {
        const separator = this.elements.breadcrumbSeparator;
        const current = this.elements.breadcrumbCurrent;
        
        if (pageName === 'home') {
            separator.classList.add('hidden');
            current.classList.add('hidden');
        } else {
            separator.classList.remove('hidden');
            current.classList.remove('hidden');
            
            switch (pageName) {
                case 'list':
                    current.textContent = '患儿列表';
                    break;
                case 'detail':
                    current.textContent = '患儿详情';
                    break;
                case 'statistics':
                    current.textContent = '数据统计分析';
                    break;
                default:
                    current.textContent = pageName;
            }
        }
    }

    updatePageTitle(pageName) {
        const titles = {
            home: '患儿入住信息管理系统',
            list: '患儿列表 - 患儿入住信息管理系统',
            detail: '患儿详情 - 患儿入住信息管理系统',
            statistics: '数据统计分析 - 患儿入住信息管理系统'
        };
        
        const title = titles[pageName] || titles.home;
        document.title = title;
        
        // 更新页面标题显示
        if (pageName === 'home') {
            this.elements.pageTitle.textContent = '患儿入住信息管理系统';
        } else {
            this.elements.pageTitle.textContent = titles[pageName] || pageName;
        }
    }

    updateHomeStatistics() {
        // 更新主页统计数据
        const patientCount = this.patients.length;
        const recordCount = this.patients.reduce((sum, patient) => 
            sum + (patient.check_in_count || 0), 0);
        
        this.elements.homePatientCount.textContent = patientCount;
        this.elements.homeRecordCount.textContent = recordCount;
    }

    // 主页功能方法
    showStatistics(type) {
        const messages = {
            patients: `当前共有 ${this.patients.length} 名患儿档案`,
            records: `总计 ${this.patients.reduce((sum, p) => sum + (p.check_in_count || 0), 0)} 条入住记录`,
            families: '家庭月度信息功能开发中，敬请期待',
            services: '关怀服务功能开发中，敬请期待'
        };
        
        this.showNotification(messages[type] || '统计信息获取失败');
    }

    showComingSoon(feature) {
        this.showNotification(`${feature}功能正在开发中，敬请期待！`);
    }

    importData() {
        // 调用现有的导入功能
        this.importExcel();
    }

    showSystemInfo() {
        const info = `
            系统版本: ${window.electronAPI?.getAppVersion() || '未知'}
            患儿数量: ${this.patients.length}
            入住记录: ${this.patients.reduce((sum, p) => sum + (p.check_in_count || 0), 0)}
            最后更新: ${new Date().toLocaleString()}
        `;
        this.showNotification(info.trim());
    }

    calculateAge(birthDate) {
        if (!birthDate) return -1;
        
        try {
            // 处理点号分隔的日期格式 (2014.3.27)
            let dateString = birthDate;
            if (birthDate.includes('.')) {
                dateString = birthDate.replace(/\./g, '-');
            }
            
            const birth = new Date(dateString);
            if (isNaN(birth)) return -1;
            
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            return age >= 0 ? age : -1;
        } catch {
            return -1;
        }
    }
    
    displayAge(birthDate) {
        const age = this.calculateAge(birthDate);
        return age === -1 ? '未知' : age;
    }

    maskIdCard(idCard) {
        if (!idCard) return '—';
        return idCard.replace(/(\w{4})\w+(\w{3})/, '$1***********$2');
    }

    // 判断是否为最近入住
    isRecentAdmission(latestCheckIn) {
        if (!latestCheckIn) return false;
        
        try {
            const checkInDate = new Date(latestCheckIn);
            const today = new Date();
            const daysDiff = Math.floor((today - checkInDate) / (1000 * 60 * 60 * 24));
            
            // 30天内的入住记录被认为是最近入住
            return daysDiff <= 30;
        } catch {
            return false;
        }
    }

    // 脱敏身份证号的通用方法
    maskIdNumber(idNumber) {
        if (!idNumber) return '未提供';
        
        // 适应不同长度的身份证号
        if (idNumber.length === 18) {
            return `${idNumber.substring(0, 3)}***********${idNumber.substring(15)}`;
        } else if (idNumber.length === 15) {
            return `${idNumber.substring(0, 3)}*********${idNumber.substring(12)}`;
        } else {
            return `${idNumber.substring(0, 2)}***${idNumber.substring(idNumber.length - 2)}`;
        }
    }

    formatParentInfo(name, phone) {
        if (!name && !phone) return '未知';
        if (!name) return phone;
        if (!phone) return name;
        return `${name} ${phone}`;
    }

    highlightText(text, searchTerm) {
        if (!searchTerm || !text) return text;
        
        try {
            const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedTerm, 'gi');
            return text.replace(regex, (match) => `<mark>${match}</mark>`);
        } catch {
            return text;
        }
    }

    resetFilters() {
        this.elements.searchInput.value = '';
        this.elements.sortSelect.value = 'recent';
        this.filterAndSort();
    }

    updateStatistics(stats) {
        if (stats) {
            this.elements.totalPatients.textContent = stats.totalPatients || 0;
            this.elements.totalRecords.textContent = stats.totalRecords || 0;
        }
    }

    // 主题相关函数
    toggleThemeMenu(show) {
        const isOpen = show ?? this.elements.themeMenu.classList.contains('opacity-0');
        this.elements.themeMenu.classList.toggle('opacity-0', !isOpen);
        this.elements.themeMenu.classList.toggle('scale-95', !isOpen);
        this.elements.themeMenu.classList.toggle('pointer-events-none', !isOpen);
        this.elements.themeToggleBtn.setAttribute('aria-expanded', String(isOpen));
        
        if (isOpen) {
            this.elements.themeMenu.focus();
        }
    }

    applyTheme(themeId) {
        document.documentElement.setAttribute('data-theme', themeId);
        localStorage.setItem('app-theme', themeId);
        
        // 更新选中状态
        this.elements.themeMenu.querySelectorAll('[role="menuitemradio"]').forEach(btn => {
            btn.setAttribute('aria-checked', String(btn.dataset.themeId === themeId));
        });
    }

    // UI反馈函数
    showLoading(message = '加载中...') {
        this.elements.loadingText.textContent = message;
        this.elements.loadingIndicator.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loadingIndicator.classList.add('hidden');
    }

    showError(message) {
        alert(`错误：${message}`); // 可以替换为更美观的通知组件
    }

    showSuccess(message) {
        alert(`成功：${message}`); // 可以替换为更美观的通知组件
    }

    showNotification(message) {
        alert(message); // 可以替换为更美观的通知组件
    }

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 统计页面功能
    async loadStatisticsPage() {
        try {
            console.log('🔍 [DEBUG] 开始加载统计页面...');
            
            // 防止重复加载 - 关键修复！
            if (this.pageStates.statisticsLoading) {
                console.log('🔍 [DEBUG] 统计页面正在加载中，跳过重复调用');
                return;
            }
            
            // 如果已经加载过且没有错误，也跳过
            if (this.pageStates.statisticsLoaded) {
                console.log('🔍 [DEBUG] 统计页面已加载，跳过重复调用');
                return;
            }
            
            // 设置加载状态
            this.pageStates.statisticsLoading = true;
            console.log('🔍 [DEBUG] 设置加载状态为true');
            
            // 清理现有的Chart实例，防止重复创建导致的问题
            this.destroyAllCharts();
            
            this.showLoading('加载统计数据...');
            
            // 隐藏错误状态，显示加载状态
            const errorEl = document.getElementById('statisticsError');
            const loadingEl = document.getElementById('statisticsLoading');
            
            console.log('🔍 [DEBUG] DOM 元素检查:', {
                errorEl: !!errorEl,
                loadingEl: !!loadingEl
            });
            
            if (errorEl) errorEl.classList.add('hidden');
            if (loadingEl) loadingEl.classList.remove('hidden');
            
            // 获取扩展统计数据
            console.log('🔍 [DEBUG] 开始获取统计数据...');
            const stats = await window.electronAPI.getExtendedStatistics();
            
            console.log('🔍 [DEBUG] 收到统计数据:', stats);
            
            // 验证数据完整性
            if (!stats || typeof stats !== 'object') {
                throw new Error('统计数据格式无效');
            }
            
            // 分步骤加载，提供更好的用户体验
            console.log('🔍 [DEBUG] 开始更新统计卡片...');
            this.showLoading('更新统计卡片...');
            this.updateStatCards(stats);
            
            console.log('🔍 [DEBUG] 开始生成图表...');
            this.showLoading('生成图表...');
            await new Promise(resolve => setTimeout(resolve, 100)); // 允许UI更新
            this.createCharts(stats);
            
            console.log('🔍 [DEBUG] 开始加载分布数据...');
            this.showLoading('加载分布数据...');
            await new Promise(resolve => setTimeout(resolve, 100));
            this.updateDistributionLists(stats);
            
            // 隐藏加载状态
            console.log('🔍 [DEBUG] 完成加载，隐藏加载状态...');
            if (loadingEl) loadingEl.classList.add('hidden');
            this.hideLoading();
            
            // 标记加载完成
            this.pageStates.statisticsLoading = false;
            this.pageStates.statisticsLoaded = true;
            console.log('🔍 [DEBUG] 统计页面加载完成');
            
        } catch (error) {
            this.hideLoading();
            console.error('加载统计数据失败:', error);
            
            // 重置加载状态，允许重试
            this.pageStates.statisticsLoading = false;
            this.pageStates.statisticsLoaded = false;
            
            // 显示错误状态
            const errorEl = document.getElementById('statisticsError');
            const loadingEl = document.getElementById('statisticsLoading');
            if (loadingEl) loadingEl.classList.add('hidden');
            if (errorEl) errorEl.classList.remove('hidden');
            
            // 更详细的错误信息
            const errorMsg = error.message || '未知错误';
            this.showError(`加载统计数据失败: ${errorMsg}`);
            
            // 降级显示：至少显示基本信息
            this.showBasicStatistics();
        }
    }

    updateStatCards(stats) {
        // 基础统计卡片，增加数据验证
        const statTotalPatients = document.getElementById('statTotalPatients');
        const statTotalRecords = document.getElementById('statTotalRecords');
        const statAverageAge = document.getElementById('statAverageAge');
        const statMultipleAdmissions = document.getElementById('statMultipleAdmissions');
        
        if (statTotalPatients) {
            statTotalPatients.textContent = stats.totalPatients || 0;
        }
        if (statTotalRecords) {
            statTotalRecords.textContent = stats.totalRecords || 0;
        }
        if (statAverageAge) {
            const avgAge = stats.averageAge;
            if (avgAge && avgAge > 0) {
                statAverageAge.textContent = `${avgAge}岁`;
            } else {
                statAverageAge.textContent = '暂无数据';
            }
        }
        if (statMultipleAdmissions) {
            statMultipleAdmissions.textContent = stats.multipleAdmissions || 0;
        }
        
        // 更新年龄分析概览
        this.updateAgeAnalysisOverview(stats.ageSummary);
        
        // 更新年龄分布横向图表
        this.updateAgeDistribution(stats.ageDistribution);
        
        console.log('统计卡片更新完成:', {
            patients: stats.totalPatients,
            records: stats.totalRecords,
            averageAge: stats.averageAge,
            multiple: stats.multipleAdmissions,
            ageSummary: stats.ageSummary
        });
    }

    createCharts(stats) {
        // 创建性别分布图表
        this.createGenderChart(stats.genderStats);
        
        // 年龄分布已经在updateStatCards中处理，这里不再创建传统图表
    }

    // 更新年龄分析概览
    updateAgeAnalysisOverview(ageSummary) {
        if (!ageSummary) return;
        
        const validAgeCount = document.getElementById('validAgeCount');
        const validAgePercentage = document.getElementById('validAgePercentage');
        const detailedAvgAge = document.getElementById('detailedAvgAge');
        const minAge = document.getElementById('minAge');
        const maxAge = document.getElementById('maxAge');
        
        if (validAgeCount) {
            validAgeCount.textContent = ageSummary.validCount || 0;
        }
        if (validAgePercentage) {
            validAgePercentage.textContent = ageSummary.validPercentage || 0;
        }
        if (detailedAvgAge) {
            detailedAvgAge.textContent = ageSummary.averageAge ? `${ageSummary.averageAge}岁` : '-';
        }
        if (minAge) {
            minAge.textContent = ageSummary.minAge ? `${ageSummary.minAge}岁` : '-';
        }
        if (maxAge) {
            maxAge.textContent = ageSummary.maxAge ? `${ageSummary.maxAge}岁` : '-';
        }
    }

    // 更新年龄分布横向图表
    updateAgeDistribution(ageDistribution) {
        console.log('🔍 [DEBUG] updateAgeDistribution 被调用:', {
            ageDistribution: ageDistribution,
            length: ageDistribution ? ageDistribution.length : 0
        });
        
        const container = document.getElementById('ageDistributionContainer');
        console.log('🔍 [DEBUG] ageDistributionContainer 元素:', !!container);
        
        if (!container || !ageDistribution || ageDistribution.length === 0) {
            console.log('🔍 [DEBUG] 无数据或无容器，显示占位符');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8 text-[var(--text-secondary)]">
                        <svg class="mx-auto w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        <p>暂无年龄分布数据</p>
                    </div>
                `;
            }
            return;
        }
        
        // 生成年龄段分布HTML
        console.log('🔍 [DEBUG] 开始生成HTML，年龄分布数据:', ageDistribution);
        
        const maxCount = Math.max(...ageDistribution.map(item => item.count));
        console.log('🔍 [DEBUG] 最大计数:', maxCount);
        
        const distributionHTML = ageDistribution.map((item, index) => {
            const percentage = item.percentage || 0;
            const widthPercentage = Math.max((item.count / maxCount) * 100, 5); // 最小宽度5%
            
            // 截取患者示例，最多显示4个名字
            console.log('🔍 [DEBUG] 处理患者示例:', {
                ageRange: item.age_range,
                patientExamples: item.patient_examples,
                count: item.count,
                percentage: item.percentage
            });
            
            const examples = item.patient_examples ? 
                item.patient_examples.split(', ').slice(0, 4).join(', ') : '';
            const exampleCount = item.patient_examples ? 
                item.patient_examples.split(', ').length : 0;
            const moreCount = Math.max(0, exampleCount - 4);
            
            // 不同年龄段使用不同颜色
            const colors = [
                'from-blue-400 to-blue-500',    // 0-2岁
                'from-green-400 to-green-500',   // 3-5岁  
                'from-purple-400 to-purple-500', // 6-10岁
                'from-orange-400 to-orange-500', // 11-15岁
                'from-red-400 to-red-500',      // 16-18岁
                'from-gray-400 to-gray-500'     // 18岁以上
            ];
            const colorClass = colors[index] || colors[colors.length - 1];
            
            return `
                <div class="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer age-group-card" 
                     onclick="app.showAgeGroupModal('${item.age_range}')" 
                     data-age-range="${item.age_range}">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <h4 class="text-lg font-semibold text-[var(--text-primary)]">${item.age_range}</h4>
                            <span class="text-2xl font-bold text-[var(--brand-primary)]">${item.count}人</span>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-[var(--brand-secondary)]">${percentage}%</div>
                            <div class="text-xs text-[var(--text-muted)]">
                                (有效年龄中${percentage}%)
                            </div>
                        </div>
                    </div>
                    
                    <!-- 横向进度条 -->
                    <div class="mb-3">
                        <div class="w-full bg-gray-200 rounded-full h-3">
                            <div class="bg-gradient-to-r ${colorClass} h-3 rounded-full transition-all duration-500" 
                                 style="width: ${widthPercentage}%"></div>
                        </div>
                    </div>
                    
                    <!-- 患者示例 -->
                    ${examples ? `
                        <div class="border-t border-gray-100 pt-3">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-sm text-[var(--text-secondary)]">患者示例：</span>
                                <span class="text-xs text-blue-600 font-medium">点击查看全部</span>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${examples.split(', ').map(name => 
                                    `<span class="px-2 py-1 bg-[var(--brand-tag-bg)] text-[var(--brand-tag-text)] text-sm rounded-full">${name}</span>`
                                ).join('')}
                                ${moreCount > 0 ? `<span class="text-sm text-[var(--text-muted)]">等${exampleCount}人</span>` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="text-sm text-[var(--text-muted)] italic">暂无患者示例</div>
                    `}
                    
                    <!-- 点击提示 -->
                    <div class="mt-3 pt-3 border-t border-gray-100">
                        <div class="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            <span>点击查看详细列表</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('🔍 [DEBUG] HTML生成完成，长度:', distributionHTML.length);
        console.log('🔍 [DEBUG] 设置容器HTML...');
        
        try {
            container.innerHTML = distributionHTML;
            console.log('🔍 [DEBUG] 年龄分布更新完成');
        } catch (error) {
            console.error('🔍 [DEBUG] 设置HTML时出错:', error);
        }
    }

    createGenderChart(genderStats) {
        console.log('🔍 [DEBUG] createGenderChart 被调用:', genderStats);
        
        const ctx = document.getElementById('genderChart');
        if (!ctx) {
            console.warn('🔍 [DEBUG] genderChart Canvas元素不存在');
            return;
        }
        
        // 销毁现有的Chart实例，防止重复创建导致的问题
        if (this.charts.genderChart) {
            console.log('🔍 [DEBUG] 销毁现有的性别图表实例');
            this.charts.genderChart.destroy();
            this.charts.genderChart = null;
        }
        
        // 确保有性别数据
        if (!genderStats || Object.keys(genderStats).length === 0) {
            console.warn('🔍 [DEBUG] 无性别统计数据');
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }
        
        // 按性别排序，确保颜色对应正确：男性蓝色，女性粉色
        const genderOrder = ['男', '女'];
        const labels = [];
        const data = [];
        const colors = [];
        
        // 按指定顺序处理性别数据
        genderOrder.forEach(gender => {
            if (genderStats[gender]) {
                labels.push(gender);
                data.push(genderStats[gender]);
                colors.push(gender === '男' ? '#3b82f6' : '#ec4899'); // 男性蓝色，女性粉色
            }
        });
        
        // 处理其他性别（如果有）
        Object.keys(genderStats).forEach(gender => {
            if (!genderOrder.includes(gender)) {
                labels.push(gender);
                data.push(genderStats[gender]);
                colors.push('#8b5cf6'); // 其他性别紫色
            }
        });
        
        console.log('🔍 [DEBUG] 图表数据:', { labels, data, colors });
        
        try {
            this.charts.genderChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed}人 (${percentage}%)`;
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1000 // 限制动画时长，防止过长的渲染
                    }
                }
            });
            
            console.log('🔍 [DEBUG] 性别图表创建成功');
        } catch (error) {
            console.error('🔍 [DEBUG] 创建性别图表时出错:', error);
        }
    }

    // 清理所有Chart实例，防止内存泄漏
    destroyAllCharts() {
        console.log('🔍 [DEBUG] 清理所有Chart实例');
        Object.keys(this.charts).forEach(chartKey => {
            if (this.charts[chartKey]) {
                console.log('🔍 [DEBUG] 销毁图表:', chartKey);
                this.charts[chartKey].destroy();
                this.charts[chartKey] = null;
            }
        });
    }

    createAgeChart(ageDistribution) {
        const ctx = document.getElementById('ageChart');
        if (ctx) {
            const labels = ageDistribution.map(item => item.age_range);
            const data = ageDistribution.map(item => item.count);

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '患者数量',
                        data: data,
                        backgroundColor: '#0d9488',
                        borderColor: '#0f766e',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const ageRange = labels[index];
                            this.showAgeGroupModal(ageRange);
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                afterLabel: function() {
                                    return '点击查看详细信息';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    }

    async showAgeGroupModal(ageRange) {
        try {
            this.showLoading('加载患者详情...');
            
            // 获取年龄段患者列表
            const patients = await window.electronAPI.getAgeGroupPatients(ageRange);
            
            // 更新模态框内容
            const modalTitle = document.getElementById('ageModalTitle');
            const modalSubtitle = document.getElementById('ageModalSubtitle');
            const modalPatients = document.getElementById('ageModalPatients');
            
            if (modalTitle) {
                modalTitle.textContent = `${ageRange} 患者列表`;
            }
            if (modalSubtitle) {
                modalSubtitle.textContent = `共 ${patients.length} 位患者`;
            }
            
            // 生成患者列表HTML
            if (patients.length === 0) {
                modalPatients.innerHTML = `
                    <div class="text-center py-8 text-[var(--text-secondary)]">
                        <svg class="mx-auto w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
                        </svg>
                        <p>该年龄段暂无患者</p>
                    </div>
                `;
            } else {
                const patientListHTML = patients.map(patient => `
                    <div class="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer patient-card-modal"
                         onclick="app.navigateToPatientDetail(${patient.id})" 
                         data-patient-id="${patient.id}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    ${patient.name ? patient.name.charAt(0) : '?'}
                                </div>
                                <div>
                                    <h4 class="font-semibold text-[var(--text-primary)] hover:text-blue-600 transition-colors">
                                        ${patient.name}
                                    </h4>
                                    <div class="text-sm text-[var(--text-secondary)]">
                                        ${patient.age}岁 · ${patient.gender || '未知'}
                                    </div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-sm font-medium text-[var(--text-primary)]">
                                    ${patient.check_in_count}次入住
                                </div>
                                <div class="text-xs text-[var(--text-muted)]">
                                    ${patient.latest_check_in ? new Date(patient.latest_check_in).toLocaleDateString('zh-CN') : '无记录'}
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 pt-3 border-t border-gray-100">
                            <div class="text-sm text-[var(--text-secondary)]">
                                <span class="font-medium">诊断：</span>${patient.main_diagnosis}
                            </div>
                        </div>
                        <div class="mt-2 flex items-center justify-end">
                            <span class="text-xs text-blue-600 font-medium flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                                查看详情
                            </span>
                        </div>
                    </div>
                `).join('');
                modalPatients.innerHTML = patientListHTML;
            }
            
            // 显示模态框
            const modal = document.getElementById('ageDetailModal');
            if (modal) {
                modal.classList.remove('hidden');
            }
            
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('加载年龄段患者失败:', error);
            this.showError('加载患者详情失败，请重试');
        }
    }

    // 从模态框导航到患者详情页面
    async navigateToPatientDetail(personId) {
        try {
            // 关闭年龄段模态框
            const modal = document.getElementById('ageDetailModal');
            if (modal) {
                modal.classList.add('hidden');
            }
            
            // 导航到患者详情页面
            await this.showPatientDetail(personId);
        } catch (error) {
            console.error('导航到患者详情失败:', error);
            this.showError('无法打开患者详情页面');
        }
    }

    updateDistributionLists(stats) {
        console.log('🔍 [DEBUG] updateDistributionLists 被调用:', stats);
        
        // 更新籍贯分布
        this.updateDistributionList('locationList', stats.locationStats, '籍贯');
        
        // 更新疾病分布
        this.updateDistributionList('diseaseList', stats.diseaseStats, '诊断');
        
        // 更新医生分布
        this.updateDistributionList('doctorList', stats.doctorStats, '医生', 'patient_count');
        
        console.log('🔍 [DEBUG] updateDistributionLists 完成');
    }

    updateDistributionList(listId, data, label, countField = 'count') {
        console.log('🔍 [DEBUG] updateDistributionList 被调用:', {
            listId,
            hasData: !!data,
            dataLength: data ? data.length : 0,
            label,
            countField
        });
        
        const listElement = document.getElementById(listId);
        console.log('🔍 [DEBUG] DOM元素检查:', {
            listId,
            elementExists: !!listElement
        });
        
        if (!listElement) {
            console.warn('🔍 [DEBUG] DOM元素不存在:', listId);
            return; // 如果元素不存在，直接返回，不要抛出错误
        }
        
        if (data && data.length > 0) {
            const itemsHTML = data.map(item => `
                <li class="distribution-item">
                    <span class="distribution-label">${item[Object.keys(item)[0]]}</span>
                    <span class="distribution-count">${item[countField]}</span>
                </li>
            `).join('');
            
            listElement.innerHTML = itemsHTML;
            console.log('🔍 [DEBUG] 成功更新分布列表:', listId);
        } else {
            listElement.innerHTML = `<li class="distribution-item"><span class="distribution-label">暂无数据</span></li>`;
            console.log('🔍 [DEBUG] 设置为无数据状态:', listId);
        }
    }

    // 患者详情显示（用于从统计页面跳转）
    async showPatientDetail(personId) {
        try {
            this.showLoading('加载患者详情...');
            
            const detail = await window.electronAPI.getPatientDetail(personId);
            this.currentPatientDetail = detail;
            
            // 导航到详情页面
            this.setPage('detail');
            this.renderPatientDetail();
            
            // 关闭模态框（如果打开）
            const ageModal = document.getElementById('ageDetailModal');
            if (ageModal) {
                ageModal.classList.add('hidden');
            }
            
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('加载患者详情失败:', error);
            this.showError('加载患者详情失败，请重试');
        }
    }

    // 降级显示基本统计信息
    showBasicStatistics() {
        try {
            console.log('显示降级统计信息');
            
            // 显示基本患者数量
            const basicStats = {
                totalPatients: this.patients?.length || 0,
                totalRecords: this.patients?.reduce((sum, p) => sum + (p.check_in_count || 0), 0) || 0,
                averageAge: 0,
                multipleAdmissions: 0
            };
            
            this.updateStatCards(basicStats);
            
            // 隐藏图表区域，显示提示信息
            const chartContainers = document.querySelectorAll('.chart-container');
            chartContainers.forEach(container => {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <svg class="mx-auto w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        <p class="text-gray-500">图表数据加载失败</p>
                        <p class="text-sm text-gray-400 mt-1">请重试或联系管理员</p>
                    </div>
                `;
            });
            
        } catch (error) {
            console.error('显示降级统计信息失败:', error);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PatientApp();
    window.patientApp = window.app; // 保持向后兼容
});