// 患儿入住信息管理系统 - 前端应用
class PatientApp {
    constructor() {
        this.patients = [];
        this.filteredPatients = [];
        this.currentView = 'list';
        
        // DOM元素引用
        this.elements = {
            // 视图切换
            listView: document.getElementById('listView'),
            detailView: document.getElementById('detailView'),
            backBtn: document.getElementById('backBtn'),
            
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
        this.elements.backBtn.addEventListener('click', () => this.setPage('list'));
        
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
    }

    createPatientCard(patient, searchTerm = '') {
        const age = this.calculateAge(patient.birth_date);
        const genderColor = patient.gender === '男' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700';
        const initials = patient.name ? patient.name.charAt(0) : '?';
        
        // 高亮搜索关键词
        const highlightedName = this.highlightText(patient.name || '', searchTerm);
        const highlightedDiagnosis = this.highlightText(patient.diagnosis || '', searchTerm);
        const highlightedHometown = this.highlightText(patient.hometown || '', searchTerm);

        return `
        <article class="group rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-sm hover:shadow-md hover:border-[var(--brand-primary)]/50 overflow-hidden focus-within:ring-2 focus-within:ring-[var(--ring-color)] transition cursor-pointer" 
                 role="button" tabindex="0" aria-label="查看 ${patient.name} 的详情" data-id="${patient.person_id}">
          <div class="card-header-bg p-5 text-[var(--brand-text)]">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-full bg-white/20 grid place-items-center font-semibold">${initials}</div>
              <div class="min-w-0 flex-1">
                <h3 class="text-xl font-bold truncate">${highlightedName}</h3>
                <p class="opacity-90 text-sm truncate">${highlightedDiagnosis}</p>
              </div>
              <span class="text-xs px-2 py-1 rounded-full bg-white/20" aria-label="入住次数">${patient.check_in_count || 0} 次</span>
            </div>
          </div>
          <div class="p-5 grid gap-2 text-[var(--text-secondary)]">
            <div class="flex items-center gap-2">
              <svg class="size-5 text-[var(--brand-primary)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-7 9a7 7 0 0 1 14 0Z"/></svg>
              <span class="text-sm">年龄 <strong>${this.displayAge(patient.birth_date)}</strong> 岁</span>
              <span class="ml-auto text-xs ${genderColor} px-2 py-0.5 rounded-full font-medium">${patient.gender || ''}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="size-5 text-[var(--brand-primary)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a9 9 0 0 0-9 9c0 7 9 11 9 11s9-4 9-11a9 9 0 0 0-9-9Zm0 12a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z"/></svg>
              <span class="text-sm truncate">${highlightedHometown}</span>
            </div>
            ${patient.latest_check_in ? `<div class="pt-2 mt-1 border-t border-[var(--border-secondary)] text-xs text-[var(--text-muted)]">最近入住：${patient.latest_check_in}</div>` : ''}
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

    // 工具函数
    setPage(pageName) {
        const pages = ['list', 'detail'];
        pages.forEach(page => {
            const element = this.elements[`${page}View`];
            if (element) {
                element.classList.toggle('active', page === pageName);
            }
        });
        
        this.elements.backBtn.hidden = (pageName === 'list');
        this.currentView = pageName;
        
        if (pageName === 'list') {
            document.title = '患儿入住信息管理系统';
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    calculateAge(birthDate) {
        if (!birthDate) return -1;
        
        try {
            const birth = new Date(birthDate.replace(/\./g, '-'));
            if (isNaN(birth)) return -1;
            
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            return age;
        } catch {
            return -1;
        }
    }
    
    displayAge(birthDate) {
        const age = this.calculateAge(birthDate);
        return age === -1 ? '?' : age;
    }

    maskIdCard(idCard) {
        if (!idCard) return '—';
        return idCard.replace(/(\w{4})\w+(\w{3})/, '$1***********$2');
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
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.patientApp = new PatientApp();
});