class CareServiceStatistics {
    constructor() {
        this.currentPeriod = 'all';
        this.charts = {};
        this.statisticsData = null;
        
        this.elements = {
            // Loading and states
            loadingState: document.getElementById('loadingState'),
            statisticsContent: document.getElementById('statisticsContent'),
            errorState: document.getElementById('errorState'),
            retryBtn: document.getElementById('retryBtn'),
            
            // Period controls
            periodButtons: document.querySelectorAll('.period-btn'),
            currentPeriod: document.getElementById('currentPeriod'),
            lastUpdate: document.getElementById('lastUpdate'),
            
            // Overview stats
            totalActivities: document.getElementById('totalActivities'),
            totalBeneficiaries: document.getElementById('totalBeneficiaries'),
            totalVolunteers: document.getElementById('totalVolunteers'),
            totalHours: document.getElementById('totalHours'),
            
            // Category stats - 主题关怀活动
            themeActivities: document.getElementById('themeActivities'),
            themeBeneficiaries: document.getElementById('themeBeneficiaries'),
            themeVolunteers: document.getElementById('themeVolunteers'),
            themeActivitiesList: document.getElementById('themeActivitiesList'),
            
            // Category stats - 日常关怀陪伴
            dailyCareActivities: document.getElementById('dailyCareActivities'),
            dailyCareBeneficiaries: document.getElementById('dailyCareBeneficiaries'),
            dailyCareHours: document.getElementById('dailyCareHours'),
            dailyCareList: document.getElementById('dailyCareList'),
            
            // Category stats - 协助就医
            medicalAssistActivities: document.getElementById('medicalAssistActivities'),
            medicalAssistBeneficiaries: document.getElementById('medicalAssistBeneficiaries'),
            medicalAssistVolunteers: document.getElementById('medicalAssistVolunteers'),
            medicalAssistList: document.getElementById('medicalAssistList'),
            
            // Category stats - 个案关怀
            individualCareActivities: document.getElementById('individualCareActivities'),
            individualCareBeneficiaries: document.getElementById('individualCareBeneficiaries'),
            individualCareHours: document.getElementById('individualCareHours'),
            individualCareList: document.getElementById('individualCareList'),
            
            // Actions
            exportBtn: document.getElementById('exportBtn'),
            refreshBtn: document.getElementById('refreshBtn')
        };
        
        this.init();
    }

    async init() {
        this.initEventListeners();
        this.initCharts();
        await this.loadStatistics();
    }

    initEventListeners() {
        // Period selection
        this.elements.periodButtons.forEach(btn => {
            btn.addEventListener('click', () => this.changePeriod(btn.dataset.period));
        });
        
        // Actions
        this.elements.exportBtn?.addEventListener('click', () => this.exportReport());
        this.elements.refreshBtn?.addEventListener('click', () => this.loadStatistics());
        this.elements.retryBtn?.addEventListener('click', () => this.loadStatistics());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case 'r':
                    case 'R':
                        e.preventDefault();
                        this.loadStatistics();
                        break;
                    case 'e':
                    case 'E':
                        e.preventDefault();
                        this.exportReport();
                        break;
                }
            }
        });
    }

    initCharts() {
        // 初始化空图表，等待数据加载后填充
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        };

        // 活动类型分布 - 饼图
        const activityTypeChart = document.getElementById('activityTypeChart');
        if (activityTypeChart) {
            this.charts.activityType = new Chart(activityTypeChart, {
                type: 'doughnut',
                data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
                options: {
                    ...chartOptions,
                    plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const percentage = ((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // 月度趋势 - 线图
        const monthlyTrendChart = document.getElementById('monthlyTrendChart');
        if (monthlyTrendChart) {
            this.charts.monthlyTrend = new Chart(monthlyTrendChart, {
                type: 'line',
                data: { labels: [], datasets: [] },
                options: {
                    ...chartOptions,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // 受益人群分布 - 柱状图
        const beneficiaryChart = document.getElementById('beneficiaryChart');
        if (beneficiaryChart) {
            this.charts.beneficiary = new Chart(beneficiaryChart, {
                type: 'bar',
                data: { labels: [], datasets: [] },
                options: {
                    ...chartOptions,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // 志愿者服务分布 - 极坐标图
        const volunteerChart = document.getElementById('volunteerChart');
        if (volunteerChart) {
            this.charts.volunteer = new Chart(volunteerChart, {
                type: 'polarArea',
                data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
                options: {
                    ...chartOptions,
                    plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const count = context.parsed || 0;
                                    return `${label}: ${count} 人次`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    async loadStatistics() {
        try {
            this.showLoading();
            
            const data = await window.electronAPI.careService.getCategorizedStatistics(this.currentPeriod);
            this.statisticsData = data;
            
            this.updateOverviewStats(data.overall);
            this.updateCategoryStats(data);
            this.updateCharts(data);
            this.updateLastUpdate(data.lastUpdate);
            
            this.showContent();
            
        } catch (error) {
            console.error('加载统计数据失败:', error);
            this.showError();
        }
    }

    changePeriod(period) {
        this.currentPeriod = period;
        
        // 更新按钮状态
        this.elements.periodButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });
        
        // 更新期间显示
        const periodNames = {
            'all': '全部数据',
            'year': '本年度',
            'quarter': '本季度',
            'month': '本月'
        };
        
        if (this.elements.currentPeriod) {
            this.elements.currentPeriod.textContent = periodNames[period] || period;
        }
        
        this.loadStatistics();
    }

    updateOverviewStats(overall) {
        if (this.elements.totalActivities) {
            this.elements.totalActivities.textContent = (overall.totalActivities || 0).toLocaleString();
        }
        if (this.elements.totalBeneficiaries) {
            this.elements.totalBeneficiaries.textContent = (overall.totalBeneficiaries || 0).toLocaleString();
        }
        if (this.elements.totalVolunteers) {
            this.elements.totalVolunteers.textContent = (overall.totalVolunteers || 0).toLocaleString();
        }
        if (this.elements.totalHours) {
            this.elements.totalHours.textContent = (overall.totalHours || 0).toLocaleString();
        }
    }

    updateCategoryStats(data) {
        // 1. 主题关怀活动
        if (data.themeActivities) {
            const theme = data.themeActivities.total;
            if (this.elements.themeActivities) this.elements.themeActivities.textContent = theme.activities.toLocaleString();
            if (this.elements.themeBeneficiaries) this.elements.themeBeneficiaries.textContent = theme.beneficiaries.toLocaleString();
            if (this.elements.themeVolunteers) this.elements.themeVolunteers.textContent = theme.volunteers.toLocaleString();
            
            this.updateActivityList(this.elements.themeActivitiesList, data.themeActivities.activities, 'theme');
        }

        // 2. 日常关怀陪伴
        if (data.dailyCare) {
            const daily = data.dailyCare.total;
            if (this.elements.dailyCareActivities) this.elements.dailyCareActivities.textContent = daily.activities.toLocaleString();
            if (this.elements.dailyCareBeneficiaries) this.elements.dailyCareBeneficiaries.textContent = daily.beneficiaries.toLocaleString();
            if (this.elements.dailyCareHours) this.elements.dailyCareHours.textContent = daily.hours.toLocaleString();
            
            this.updateActivityList(this.elements.dailyCareList, data.dailyCare.activities, 'daily');
        }

        // 3. 协助就医
        if (data.medicalAssist) {
            const medical = data.medicalAssist.total;
            if (this.elements.medicalAssistActivities) this.elements.medicalAssistActivities.textContent = medical.activities.toLocaleString();
            if (this.elements.medicalAssistBeneficiaries) this.elements.medicalAssistBeneficiaries.textContent = medical.beneficiaries.toLocaleString();
            if (this.elements.medicalAssistVolunteers) this.elements.medicalAssistVolunteers.textContent = medical.volunteers.toLocaleString();
            
            this.updateActivityList(this.elements.medicalAssistList, data.medicalAssist.activities, 'medical');
        }

        // 4. 个案关怀
        if (data.individualCare) {
            const individual = data.individualCare.total;
            if (this.elements.individualCareActivities) this.elements.individualCareActivities.textContent = individual.activities.toLocaleString();
            if (this.elements.individualCareBeneficiaries) this.elements.individualCareBeneficiaries.textContent = individual.beneficiaries.toLocaleString();
            if (this.elements.individualCareHours) this.elements.individualCareHours.textContent = individual.hours.toLocaleString();
            
            this.updateActivityList(this.elements.individualCareList, data.individualCare.activities, 'individual');
        }
    }

    updateActivityList(container, activities, type) {
        if (!container) return;
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-gray-500">暂无数据</div>';
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="sub-category">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="font-medium text-slate-900">${activity.activity_name || '未命名活动'}</div>
                        ${activity.service_center ? `<div class="text-sm text-slate-600">${activity.service_center}</div>` : ''}
                        ${activity.beneficiary_group ? `<div class="text-sm text-slate-600">${activity.beneficiary_group}</div>` : ''}
                    </div>
                    <div class="text-right ml-4">
                        <div class="font-bold text-medical-primary">${(activity.beneficiaries || 0).toLocaleString()}</div>
                        <div class="text-xs text-slate-500">
                            ${type === 'theme' || type === 'medical' ? `${(activity.volunteers || 0)} 志愿者` :
                              type === 'daily' || type === 'individual' ? `${(activity.hours || 0)} 小时` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateCharts(data) {
        // 1. 活动类型分布图
        if (this.charts.activityType && data.activityTypeDistribution) {
            const typeData = data.activityTypeDistribution;
            const colors = this.generateColors(typeData.length);
            
            this.charts.activityType.data = {
                labels: typeData.map(item => item.activity_type || '未分类'),
                datasets: [{
                    data: typeData.map(item => item.count || 0),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            };
            this.charts.activityType.update();
        }

        // 2. 月度趋势图
        if (this.charts.monthlyTrend && data.monthlyTrend) {
            const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                              '7月', '8月', '9月', '10月', '11月', '12月'];
            
            this.charts.monthlyTrend.data = {
                labels: monthNames,
                datasets: [
                    {
                        label: '活动数',
                        data: data.monthlyTrend.map(item => item.activities || 0),
                        borderColor: 'rgb(30, 136, 229)',
                        backgroundColor: 'rgba(30, 136, 229, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: '受益人次',
                        data: data.monthlyTrend.map(item => item.beneficiaries || 0),
                        borderColor: 'rgb(76, 175, 80)',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4
                    }
                ]
            };
            this.charts.monthlyTrend.update();
        }

        // 3. 受益人群分布
        if (this.charts.beneficiary && data.beneficiaryDistribution) {
            const dist = data.beneficiaryDistribution;
            
            this.charts.beneficiary.data = {
                labels: ['成年男性', '成年女性', '儿童男性', '儿童女性'],
                datasets: [{
                    label: '受益人次',
                    data: [dist.adultMale, dist.adultFemale, dist.childMale, dist.childFemale],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 205, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 2
                }]
            };
            this.charts.beneficiary.update();
        }

        // 4. 志愿者服务分布
        if (this.charts.volunteer && data.volunteerDistribution) {
            const volunteer = data.volunteerDistribution.counts;
            
            this.charts.volunteer.data = {
                labels: ['儿童', '家长', '大学生', '老师', '社会人士'],
                datasets: [{
                    data: [volunteer.child, volunteer.parent, volunteer.student, volunteer.teacher, volunteer.social],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 205, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            };
            this.charts.volunteer.update();
        }
    }

    generateColors(count) {
        const colors = [
            'rgba(30, 136, 229, 0.8)',  // 主蓝色
            'rgba(38, 166, 154, 0.8)',  // 青绿色
            'rgba(76, 175, 80, 0.8)',   // 绿色
            'rgba(255, 152, 0, 0.8)',   // 橙色
            'rgba(244, 67, 54, 0.8)',   // 红色
            'rgba(156, 39, 176, 0.8)',  // 紫色
            'rgba(96, 125, 139, 0.8)',  // 蓝灰色
            'rgba(233, 30, 99, 0.8)',   // 粉红色
            'rgba(121, 85, 72, 0.8)',   // 棕色
            'rgba(255, 235, 59, 0.8)'   // 黄色
        ];
        
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }

    updateLastUpdate(lastUpdate) {
        if (this.elements.lastUpdate && lastUpdate) {
            const date = new Date(lastUpdate);
            this.elements.lastUpdate.textContent = date.toLocaleString('zh-CN');
        }
    }

    async exportReport() {
        try {
            if (!this.statisticsData) {
                this.showToast('暂无数据可导出', 'warning');
                return;
            }
            
            // 这里可以实现导出功能，比如生成PDF或Excel报告
            this.showToast('导出功能开发中...', 'info');
            
        } catch (error) {
            console.error('导出报告失败:', error);
            this.showToast('导出失败，请重试', 'error');
        }
    }

    showLoading() {
        this.elements.loadingState?.classList.remove('hidden');
        this.elements.statisticsContent?.classList.add('hidden');
        this.elements.errorState?.classList.add('hidden');
    }

    showContent() {
        this.elements.loadingState?.classList.add('hidden');
        this.elements.statisticsContent?.classList.remove('hidden');
        this.elements.errorState?.classList.add('hidden');
    }

    showError() {
        this.elements.loadingState?.classList.add('hidden');
        this.elements.statisticsContent?.classList.add('hidden');
        this.elements.errorState?.classList.remove('hidden');
    }

    showToast(message, type = 'info') {
        // 创建Toast通知
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
        
        switch (type) {
            case 'success':
                toast.classList.add('bg-green-500', 'text-white');
                break;
            case 'error':
                toast.classList.add('bg-red-500', 'text-white');
                break;
            case 'warning':
                toast.classList.add('bg-yellow-500', 'text-white');
                break;
            default:
                toast.classList.add('bg-blue-500', 'text-white');
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => toast.classList.remove('translate-x-full'), 100);
        
        // 自动隐藏
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new CareServiceStatistics();
});