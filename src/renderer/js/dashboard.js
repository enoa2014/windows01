/**
 * Dashboard Management System
 * 概览仪表板管理系统
 */

class Dashboard {
    constructor() {
        this.data = {};
        this.refreshInterval = null;
        this.chartInstances = {};
        this.iconLib = new IconLibrary();
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.startAutoRefresh();
        this.setupKeyboardShortcuts();
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        // Chart period controls
        document.querySelectorAll('.chart-control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchChartPeriod(e.target.dataset.period);
                
                // Update active state
                e.target.parentElement.querySelectorAll('.chart-control-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');
            });
        });

        // Card interactions
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', () => {
                this.handleStatCardClick(card);
            });
        });
    }

    async loadInitialData() {
        this.setLoadingState(true);
        
        try {
            // Load statistics data
            await this.loadStatistics();
            
            // Load chart data
            await this.loadChartData();
            
            // Load recent activities
            await this.loadRecentActivities();
            
            // Update system status
            this.updateSystemStatus();
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('加载仪表板数据失败');
        } finally {
            this.setLoadingState(false);
        }
    }

    async loadStatistics() {
        if (window.electronAPI && window.electronAPI.getDashboardStats) {
            const stats = await window.electronAPI.getDashboardStats();
            this.updateStatistics(stats);
        } else {
            // Mock data for development
            this.updateStatistics({
                totalPatients: 156,
                newAdmissions: 23,
                dischargedPatients: 18,
                averageStay: 7.2,
                trends: {
                    patients: { value: 8.5, direction: 'up' },
                    admissions: { value: 12.3, direction: 'up' },
                    discharges: { value: 5.1, direction: 'down' },
                    stay: { value: 0, direction: 'neutral' }
                }
            });
        }
    }

    updateStatistics(stats) {
        // Update numbers
        this.updateElement('total-patients', stats.totalPatients);
        this.updateElement('new-admissions', stats.newAdmissions);
        this.updateElement('discharged-patients', stats.dischargedPatients);
        this.updateElement('average-stay', `${stats.averageStay}天`);
        
        // Update trends
        this.updateTrend('patients-trend', stats.trends.patients);
        this.updateTrend('admissions-trend', stats.trends.admissions);
        this.updateTrend('discharge-trend', stats.trends.discharges);
        this.updateTrend('stay-trend', stats.trends.stay);
        
        // Animate numbers
        this.animateNumbers();
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateTrend(id, trend) {
        const element = document.getElementById(id);
        if (!element) return;
        
        const directionIcons = {
            up: '<polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/>',
            down: '<polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/><polyline points="17,18 23,18 23,12"/>',
            neutral: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
        };
        
        const directionText = {
            up: '增长',
            down: '下降', 
            neutral: '稳定'
        };
        
        element.className = `stat-card-trend ${trend.direction === 'up' ? 'positive' : trend.direction === 'down' ? 'negative' : 'neutral'}`;
        element.innerHTML = `
            <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                ${directionIcons[trend.direction]}
            </svg>
            ${trend.value}% ${directionText[trend.direction]}
        `;
    }

    animateNumbers() {
        document.querySelectorAll('.stat-card-number').forEach(element => {
            const finalValue = element.textContent;
            const numericValue = parseFloat(finalValue);
            
            if (isNaN(numericValue)) return;
            
            let currentValue = 0;
            const increment = numericValue / 30;
            const suffix = finalValue.replace(numericValue.toString(), '');
            
            const animate = () => {
                currentValue += increment;
                if (currentValue >= numericValue) {
                    element.textContent = finalValue;
                } else {
                    element.textContent = Math.floor(currentValue) + suffix;
                    requestAnimationFrame(animate);
                }
            };
            
            element.textContent = '0' + suffix;
            requestAnimationFrame(animate);
        });
    }

    async loadChartData() {
        // Placeholder for chart integration
        // Will be implemented with Chart.js or ECharts
        console.log('Chart data loading - Chart.js integration pending');
    }

    async loadRecentActivities() {
        if (window.electronAPI && window.electronAPI.getRecentActivities) {
            const activities = await window.electronAPI.getRecentActivities();
            this.updateRecentActivities(activities);
        } else {
            // Mock data
            this.updateRecentActivities([
                {
                    type: 'admission',
                    patient: '李小明',
                    hospital: '北京儿童医院',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    details: '呼吸内科入住'
                },
                {
                    type: 'discharge',
                    patient: '王小红',
                    hospital: '上海儿童医院',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                    details: '康复出院'
                },
                {
                    type: 'treatment',
                    patient: '张小强',
                    hospital: '广州儿童医院',
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                    details: '治疗方案调整'
                }
            ]);
        }
    }

    updateRecentActivities(activities) {
        const container = document.getElementById('recent-activities');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="activity-content">
                    <div class="activity-text">
                        ${this.formatActivityText(activity)}
                    </div>
                    <div class="activity-meta">
                        <span>${this.formatRelativeTime(activity.timestamp)}</span>
                        <span>•</span>
                        <span>${activity.hospital}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const iconMap = {
            admission: 'user-plus',
            discharge: 'user-check',
            treatment: 'activity',
            examination: 'search',
            medication: 'pill'
        };
        
        return this.iconLib.getIcon(iconMap[type] || 'file-text', 'sm');
    }

    formatActivityText(activity) {
        const actionMap = {
            admission: '新患儿入住',
            discharge: '患儿出院',
            treatment: '治疗更新',
            examination: '检查完成',
            medication: '用药调整'
        };
        
        return `${actionMap[activity.type] || '活动'}: ${activity.patient}`;
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 60) {
            return `${minutes}分钟前`;
        } else if (hours < 24) {
            return `${hours}小时前`;
        } else {
            return `${days}天前`;
        }
    }

    updateSystemStatus() {
        // Check system health
        const statusItems = [
            { label: '数据库连接', status: 'healthy', value: '正常' },
            { label: '上次数据更新', status: 'healthy', value: '刚刚' },
            { label: '系统版本', status: 'healthy', value: 'v2.0.0-beta1' }
        ];
        
        const container = document.getElementById('system-status');
        if (container) {
            container.innerHTML = statusItems.map(item => `
                <div class="status-item">
                    <div class="status-indicator status-${item.status}"></div>
                    <div class="status-content">
                        <div class="status-label">${item.label}</div>
                        <div class="status-value">${item.value}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    switchChartPeriod(period) {
        console.log(`Switching chart period to: ${period}`);
        // Chart data reload logic will be implemented with Chart.js integration
        this.showNotification(`已切换到 ${period} 视图`, 'info');
    }

    handleStatCardClick(card) {
        // Stat card click interactions
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
        
        // Add click feedback or navigation
        this.showNotification('统计卡片交互功能开发中...', 'info');
    }

    async refreshData() {
        if (this.isLoading) return;
        
        this.setLoadingState(true);
        this.showNotification('正在刷新数据...', 'info');
        
        try {
            await this.loadInitialData();
            this.showNotification('数据刷新成功', 'success');
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showError('数据刷新失败');
        }
    }

    startAutoRefresh() {
        // Auto-refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 5 * 60 * 1000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.disabled = loading;
            if (loading) {
                refreshBtn.querySelector('svg').style.animation = 'spin 1s linear infinite';
            } else {
                refreshBtn.querySelector('svg').style.animation = '';
            }
        }
        
        // Add shimmer effect to cards during loading
        document.querySelectorAll('.stat-card, .chart-card, .activity-card').forEach(card => {
            if (loading) {
                card.classList.add('loading-shimmer');
            } else {
                card.classList.remove('loading-shimmer');
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // F5 - Refresh dashboard
            if (e.key === 'F5') {
                e.preventDefault();
                this.refreshData();
            }
            
            // Ctrl + 1-4 - Focus on stat cards
            if (e.ctrlKey && ['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
                const cards = document.querySelectorAll('.stat-card');
                const cardIndex = parseInt(e.key) - 1;
                if (cards[cardIndex]) {
                    cards[cardIndex].focus();
                    cards[cardIndex].scrollIntoView({ behavior: 'smooth' });
                }
            }
            
            // Ctrl + R - Refresh (alternative)
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.refreshData();
            }
        });
    }

    showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `dashboard-notification notification-${type}`;
        toast.innerHTML = `
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                ${this.getNotificationIcon(type)}
            </svg>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    getNotificationIcon(type) {
        const icons = {
            success: '<polyline points="20,6 9,17 4,12"/>',
            error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
            warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
            info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
        };
        return icons[type] || icons.info;
    }

    // Chart Integration Preparation
    initializeCharts() {
        // This will be implemented when Chart.js is integrated
        console.log('Chart initialization - Chart.js integration pending');
        
        // Placeholder chart setup
        this.setupPlaceholderCharts();
    }

    setupPlaceholderCharts() {
        // Add interactive placeholder behavior
        document.querySelectorAll('.chart-placeholder').forEach(placeholder => {
            placeholder.addEventListener('click', () => {
                this.showNotification('图表功能开发中，即将支持 Chart.js 数据可视化', 'info');
            });
        });
    }

    switchChartPeriod(period) {
        console.log(`Chart period switched to: ${period}`);
        // This will update charts when Chart.js is integrated
        this.showNotification(`图表周期已切换到 ${period}`, 'info');
    }

    handleStatCardClick(card) {
        // Add interactive feedback
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
        
        // Future: Navigate to detailed view
        this.showNotification('统计详情功能开发中...', 'info');
    }

    // Data Export Functions
    exportDashboardData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            statistics: this.data,
            charts: {
                // Chart data will be added when Chart.js is integrated
                note: 'Chart data export will be available after Chart.js integration'
            },
            systemInfo: {
                version: 'v2.0.0-beta1',
                lastUpdate: new Date().toISOString()
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `仪表板数据_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showNotification('仪表板数据导出成功', 'success');
    }

    // Performance Monitoring
    startPerformanceMonitoring() {
        // Monitor dashboard performance
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.duration > 1000) {
                    console.warn(`Slow dashboard operation: ${entry.name} took ${entry.duration}ms`);
                }
            });
        });

        observer.observe({ entryTypes: ['measure', 'navigation'] });
    }

    // Memory Management
    cleanup() {
        this.stopAutoRefresh();
        
        // Cleanup chart instances (when Chart.js is integrated)
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        
        this.chartInstances = {};
    }

    // Development Helper Functions
    simulateDataUpdate() {
        // Simulate live data updates for development
        setTimeout(() => {
            const mockStats = {
                totalPatients: 156 + Math.floor(Math.random() * 10),
                newAdmissions: 23 + Math.floor(Math.random() * 5),
                dischargedPatients: 18 + Math.floor(Math.random() * 3),
                averageStay: (7.2 + (Math.random() - 0.5) * 2).toFixed(1),
                trends: {
                    patients: { value: (Math.random() * 15).toFixed(1), direction: Math.random() > 0.5 ? 'up' : 'down' },
                    admissions: { value: (Math.random() * 20).toFixed(1), direction: Math.random() > 0.3 ? 'up' : 'down' },
                    discharges: { value: (Math.random() * 10).toFixed(1), direction: Math.random() > 0.6 ? 'up' : 'down' },
                    stay: { value: 0, direction: 'neutral' }
                }
            };
            this.updateStatistics(mockStats);
        }, 1000);
    }
}

// CSS for notifications (add to dashboard)
const notificationCSS = `
.dashboard-notification {
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 400px;
}

.dashboard-notification.show {
    transform: translateX(0);
}

.notification-success {
    border-left: 4px solid var(--medical-success-500);
    color: var(--medical-success-500);
}

.notification-error {
    border-left: 4px solid var(--medical-error-500);
    color: var(--medical-error-500);
}

.notification-warning {
    border-left: 4px solid var(--medical-warning-500);
    color: var(--medical-warning-500);
}

.notification-info {
    border-left: 4px solid var(--medical-info-500);
    color: var(--medical-info-500);
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationCSS;
document.head.appendChild(styleSheet);

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
    
    // Add development helper
    if (window.location.search.includes('dev=true')) {
        window.dashboard.simulateDataUpdate();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.cleanup();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}