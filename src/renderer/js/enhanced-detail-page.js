/**
 * Enhanced Patient Detail Page - Interactive Components
 * 患者详情页面增强交互组件
 */

class EnhancedDetailPage {
    constructor() {
        this.activeTab = 'basic-info';
        this.timelineData = [];
        this.patientData = null;
        this.sortOrder = 'desc';
        this.iconLib = new IconLibrary();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPatientData();
        this.initializeTimeline();
        this.setupKeyboardShortcuts();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.detail-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(tab.dataset.tab);
            });
        });

        // Timeline sorting
        const sortButton = document.querySelector('.timeline-sort');
        if (sortButton) {
            sortButton.addEventListener('change', (e) => {
                this.sortOrder = e.target.value;
                this.renderTimeline();
            });
        }

        // Action buttons
        document.querySelectorAll('.detail-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleAction(e.target.dataset.action);
            });
        });

        // Print functionality
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                this.printPatientDetails();
            }
        });
    }

    switchTab(tabName) {
        // Update active tab
        this.activeTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.detail-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.detail-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });
        
        // Load tab-specific content if needed
        this.loadTabContent(tabName);
        
        // Update URL hash for deep linking
        window.location.hash = `tab=${tabName}`;
        
        // Announce to screen readers
        this.announceTabChange(tabName);
    }

    loadTabContent(tabName) {
        const content = document.querySelector(`[data-tab="${tabName}"]`);
        if (!content) return;

        switch (tabName) {
            case 'basic-info':
                this.renderBasicInfo(content);
                break;
            case 'medical-info':
                this.renderMedicalInfo(content);
                break;
            case 'admission-history':
                this.renderAdmissionHistory(content);
                break;
            case 'family-info':
                this.renderFamilyInfo(content);
                break;
            case 'treatment-records':
                this.renderTreatmentRecords(content);
                break;
        }
    }

    renderBasicInfo(container) {
        if (!this.patientData) return;
        
        const { basic } = this.patientData;
        container.innerHTML = `
            <div class="info-grid">
                <div class="info-field">
                    <div class="info-field-label">姓名</div>
                    <div class="info-field-value">${basic.name || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">性别</div>
                    <div class="info-field-value">${basic.gender || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">年龄</div>
                    <div class="info-field-value">${basic.age || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">出生日期</div>
                    <div class="info-field-value">${basic.birthDate || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">身份证号</div>
                    <div class="info-field-value id-number">${basic.idNumber || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">联系电话</div>
                    <div class="info-field-value">${basic.phone || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">家庭住址</div>
                    <div class="info-field-value">${basic.address || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">入住状态</div>
                    <div class="info-field-value status ${basic.status === '在住' ? 'active' : 'discharged'}">
                        ${this.iconLib.getIcon(basic.status === '在住' ? 'user-check' : 'user-x', 'sm')}
                        ${basic.status || '未知'}
                    </div>
                </div>
            </div>
        `;
    }

    renderMedicalInfo(container) {
        if (!this.patientData) return;
        
        const { medical } = this.patientData;
        container.innerHTML = `
            <div class="info-grid">
                <div class="info-field">
                    <div class="info-field-label">主要诊断</div>
                    <div class="info-field-value diagnosis">${medical.primaryDiagnosis || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">入住医院</div>
                    <div class="info-field-value">${medical.hospital || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">入住科室</div>
                    <div class="info-field-value">${medical.department || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">主治医生</div>
                    <div class="info-field-value">${medical.doctor || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">入住日期</div>
                    <div class="info-field-value">${medical.admissionDate || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">预计出院日期</div>
                    <div class="info-field-value">${medical.expectedDischarge || '未填写'}</div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">病情等级</div>
                    <div class="info-field-value status ${this.getSeverityClass(medical.severity)}">
                        ${this.iconLib.getIcon(this.getSeverityIcon(medical.severity), 'sm')}
                        ${medical.severity || '未评估'}
                    </div>
                </div>
                <div class="info-field">
                    <div class="info-field-label">过敏史</div>
                    <div class="info-field-value">${medical.allergies || '无过敏史'}</div>
                </div>
            </div>
        `;
    }

    renderTimeline() {
        const timelineContainer = document.querySelector('.timeline');
        if (!timelineContainer || !this.timelineData.length) return;

        const sortedData = [...this.timelineData].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        timelineContainer.innerHTML = sortedData.map(item => `
            <div class="timeline-item" data-date="${item.date}">
                <div class="timeline-item-header">
                    <div class="timeline-date">${this.formatDate(item.date)}</div>
                    <div class="timeline-attendees">
                        ${this.iconLib.getIcon('user-circle', 'sm')}
                        ${item.attendees || '医护团队'}
                    </div>
                </div>
                <div class="timeline-item-body">
                    <div class="timeline-content">
                        ${item.content.map(field => `
                            <div class="timeline-field">
                                <div class="timeline-field-label">${field.label}</div>
                                <div class="timeline-field-value ${field.highlight ? 'highlight' : ''}">
                                    ${field.value}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        // Add scroll animation
        this.animateTimelineItems();
    }

    animateTimelineItems() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = '0s';
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.timeline-item').forEach(item => {
            observer.observe(item);
        });
    }

    loadPatientData() {
        // Get patient ID from URL or passed parameter
        const urlParams = new URLSearchParams(window.location.search);
        const patientId = urlParams.get('id');
        
        if (!patientId) {
            console.error('No patient ID provided');
            return;
        }

        // Load patient data (this would typically be an API call)
        if (window.electronAPI && window.electronAPI.getPatientDetails) {
            window.electronAPI.getPatientDetails(patientId)
                .then(data => {
                    this.patientData = this.processPatientData(data);
                    this.updatePageContent();
                    this.loadTimelineData(patientId);
                })
                .catch(err => {
                    console.error('Failed to load patient data:', err);
                    this.showError('加载患者信息失败');
                });
        } else {
            // Fallback for development/testing
            this.loadMockData(patientId);
        }
    }

    processPatientData(rawData) {
        return {
            basic: {
                name: rawData.姓名,
                gender: rawData.性别,
                age: rawData.年龄,
                birthDate: rawData.出生日期,
                idNumber: rawData.身份证号,
                phone: rawData.联系电话,
                address: rawData.家庭住址,
                status: rawData.入住状态
            },
            medical: {
                primaryDiagnosis: rawData.主要诊断,
                hospital: rawData.入住医院,
                department: rawData.入住科室,
                doctor: rawData.主治医生,
                admissionDate: rawData.入住日期,
                expectedDischarge: rawData.预计出院日期,
                severity: rawData.病情等级,
                allergies: rawData.过敏史
            },
            family: {
                guardian: rawData.监护人,
                relationship: rawData.监护关系,
                guardianPhone: rawData.监护人电话,
                emergencyContact: rawData.紧急联系人,
                familyHistory: rawData.家族病史
            }
        };
    }

    updatePageContent() {
        if (!this.patientData) return;

        // Update header information
        const titleElement = document.querySelector('.patient-title');
        const subtitleElement = document.querySelector('.patient-subtitle');
        
        if (titleElement) {
            titleElement.textContent = this.patientData.basic.name;
        }
        
        if (subtitleElement) {
            subtitleElement.textContent = `${this.patientData.basic.age}岁 · ${this.patientData.basic.gender} · ${this.patientData.medical.hospital}`;
        }

        // Update quick stats
        this.updateQuickStats();
        
        // Load current tab content
        this.loadTabContent(this.activeTab);
    }

    updateQuickStats() {
        const stats = this.calculateQuickStats();
        
        document.querySelectorAll('.stat-item').forEach((item, index) => {
            const valueElement = item.querySelector('.stat-value');
            const labelElement = item.querySelector('.stat-label');
            
            if (valueElement && labelElement && stats[index]) {
                valueElement.textContent = stats[index].value;
                labelElement.textContent = stats[index].label;
                valueElement.className = `stat-value ${stats[index].color}`;
            }
        });
    }

    calculateQuickStats() {
        if (!this.patientData) return [];
        
        const admissionDays = this.calculateAdmissionDays();
        const totalRecords = this.timelineData.length;
        const criticalEvents = this.timelineData.filter(item => 
            item.content.some(field => field.highlight)
        ).length;
        
        return [
            { value: admissionDays, label: '住院天数', color: 'teal' },
            { value: totalRecords, label: '医疗记录', color: 'blue' },
            { value: criticalEvents, label: '重要事件', color: 'purple' },
            { value: this.patientData.medical.severity || '-', label: '病情等级', color: 'green' }
        ];
    }

    calculateAdmissionDays() {
        if (!this.patientData?.medical?.admissionDate) return 0;
        
        const admission = new Date(this.patientData.medical.admissionDate);
        const today = new Date();
        const diffTime = Math.abs(today - admission);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    loadTimelineData(patientId) {
        if (window.electronAPI && window.electronAPI.getPatientTimeline) {
            window.electronAPI.getPatientTimeline(patientId)
                .then(data => {
                    this.timelineData = this.processTimelineData(data);
                    this.renderTimeline();
                })
                .catch(err => {
                    console.error('Failed to load timeline data:', err);
                });
        } else {
            this.loadMockTimelineData();
        }
    }

    processTimelineData(rawData) {
        return rawData.map(record => ({
            date: record.日期,
            attendees: record.参与人员,
            content: [
                { label: '治疗措施', value: record.治疗措施, highlight: record.重要 },
                { label: '病情变化', value: record.病情变化 },
                { label: '用药记录', value: record.用药记录 },
                { label: '检查结果', value: record.检查结果, highlight: record.异常 },
                { label: '医生备注', value: record.医生备注 }
            ].filter(field => field.value)
        }));
    }

    initializeTimeline() {
        // Initialize timeline visualization
        this.setupTimelineScroll();
        this.setupTimelineSearch();
    }

    setupTimelineScroll() {
        const timelineBody = document.querySelector('.timeline-body');
        if (!timelineBody) return;

        // Smooth scrolling behavior
        timelineBody.addEventListener('scroll', this.throttle(() => {
            this.updateScrollIndicator();
        }, 100));

        // Keyboard navigation
        timelineBody.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateTimeline(e.key === 'ArrowDown');
            }
        });
    }

    setupTimelineSearch() {
        const searchInput = document.querySelector('.timeline-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', this.debounce((e) => {
            this.filterTimeline(e.target.value);
        }, 300));
    }

    filterTimeline(query) {
        const items = document.querySelectorAll('.timeline-item');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const content = item.textContent.toLowerCase();
            const matches = content.includes(lowerQuery);
            item.style.display = matches ? 'block' : 'none';
        });

        // Update timeline line visibility
        this.updateTimelineConnectors();
    }

    updateTimelineConnectors() {
        // Adjust timeline connector line based on visible items
        const visibleItems = document.querySelectorAll('.timeline-item:not([style*="display: none"])');
        const timeline = document.querySelector('.timeline');
        
        if (timeline && visibleItems.length > 0) {
            const firstItem = visibleItems[0];
            const lastItem = visibleItems[visibleItems.length - 1];
            
            // Adjust timeline height dynamically
            timeline.style.setProperty('--timeline-height', 
                `${lastItem.offsetTop + lastItem.offsetHeight - firstItem.offsetTop}px`);
        }
    }

    handleAction(action) {
        switch (action) {
            case 'edit':
                this.editPatient();
                break;
            case 'export':
                this.exportPatientData();
                break;
            case 'print':
                this.printPatientDetails();
                break;
            case 'share':
                this.sharePatientInfo();
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }

    exportPatientData() {
        if (!this.patientData) return;

        const exportData = {
            ...this.patientData,
            timeline: this.timelineData,
            exportDate: new Date().toISOString(),
            exportedBy: '系统管理员'
        };

        // Create and download JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `患者详情_${this.patientData.basic.name}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showToast('导出成功', 'success');
    }

    printPatientDetails() {
        // Optimize page for printing
        document.body.classList.add('printing');
        
        // Hide interactive elements
        document.querySelectorAll('.detail-actions, .timeline-controls').forEach(el => {
            el.style.display = 'none';
        });
        
        // Print
        window.print();
        
        // Restore UI
        setTimeout(() => {
            document.body.classList.remove('printing');
            document.querySelectorAll('.detail-actions, .timeline-controls').forEach(el => {
                el.style.display = '';
            });
        }, 1000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Tab navigation (Ctrl + 1-5)
            if (e.ctrlKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
                e.preventDefault();
                const tabs = ['basic-info', 'medical-info', 'admission-history', 'family-info', 'treatment-records'];
                this.switchTab(tabs[parseInt(e.key) - 1]);
            }
            
            // Export (Ctrl + E)
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.exportPatientData();
            }
            
            // Timeline sorting (Alt + S)
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                const sortSelect = document.querySelector('.timeline-sort');
                if (sortSelect) {
                    sortSelect.value = sortSelect.value === 'desc' ? 'asc' : 'desc';
                    sortSelect.dispatchEvent(new Event('change'));
                }
            }
        });
    }

    // Utility functions
    formatDate(dateStr) {
        if (!dateStr) return '未知日期';
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });
    }

    getSeverityClass(severity) {
        const severityMap = {
            '轻度': 'mild',
            '中度': 'moderate', 
            '重度': 'severe',
            '危重': 'critical'
        };
        return severityMap[severity] || 'unknown';
    }

    getSeverityIcon(severity) {
        const iconMap = {
            '轻度': 'trending-up',
            '中度': 'alert-circle',
            '重度': 'alert-triangle',
            '危重': 'alert-octagon'
        };
        return iconMap[severity] || 'help-circle';
    }

    announceTabChange(tabName) {
        const tabNames = {
            'basic-info': '基本信息',
            'medical-info': '医疗信息',
            'admission-history': '入住历史',
            'family-info': '家庭信息',
            'treatment-records': '治疗记录'
        };
        
        // Create announcement for screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = `已切换到${tabNames[tabName]}标签页`;
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            ${this.iconLib.getIcon(type === 'success' ? 'check-circle' : 'info', 'sm')}
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    // Utility helpers
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

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Mock data for development
    loadMockData(patientId) {
        this.patientData = {
            basic: {
                name: '张小明',
                gender: '男',
                age: '8',
                birthDate: '2015-06-15',
                idNumber: '110101201506150001',
                phone: '13800138000',
                address: '北京市朝阳区某某街道123号',
                status: '在住'
            },
            medical: {
                primaryDiagnosis: '急性支气管炎',
                hospital: '北京儿童医院',
                department: '呼吸内科',
                doctor: '李医生',
                admissionDate: '2024-01-15',
                expectedDischarge: '2024-01-25',
                severity: '中度',
                allergies: '青霉素过敏'
            },
            family: {
                guardian: '张父',
                relationship: '父亲',
                guardianPhone: '13800138001',
                emergencyContact: '张母 13800138002',
                familyHistory: '无重大疾病史'
            }
        };
        
        this.updatePageContent();
        this.loadMockTimelineData();
    }

    loadMockTimelineData() {
        this.timelineData = [
            {
                date: '2024-01-15',
                attendees: '李医生, 护士长',
                content: [
                    { label: '入院检查', value: '体温38.5°C，咳嗽有痰', highlight: true },
                    { label: '初步诊断', value: '急性支气管炎' },
                    { label: '治疗方案', value: '抗感染治疗，雾化吸入' },
                    { label: '医生备注', value: '病情稳定，需观察' }
                ]
            },
            {
                date: '2024-01-16',
                attendees: '李医生',
                content: [
                    { label: '复查结果', value: '体温37.2°C，咳嗽减轻' },
                    { label: '用药调整', value: '继续原治疗方案' },
                    { label: '医生备注', value: '病情好转' }
                ]
            },
            {
                date: '2024-01-17',
                attendees: '李医生, 呼吸科专家',
                content: [
                    { label: '专家会诊', value: '确认诊断，治疗方案合理', highlight: true },
                    { label: '检查结果', value: '胸片显示炎症减轻' },
                    { label: '治疗建议', value: '继续治疗3-5天' }
                ]
            }
        ];
        
        this.renderTimeline();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a patient detail page
    if (document.querySelector('.patient-detail-container')) {
        window.enhancedDetailPage = new EnhancedDetailPage();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedDetailPage;
}