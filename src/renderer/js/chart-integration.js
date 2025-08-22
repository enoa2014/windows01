/**
 * Chart Integration System
 * 图表集成系统 - Chart.js集成准备
 */

class ChartIntegration {
    constructor() {
        this.charts = {};
        this.chartConfigs = {};
        this.theme = 'light';
        this.colors = this.getMedicalColors();
        
        this.init();
    }

    init() {
        this.checkChartLibrary();
        this.setupChartContainers();
        this.createPlaceholderCharts();
    }

    checkChartLibrary() {
        // Check if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initializeChartJS();
        } else {
            console.warn('Chart.js not loaded - using placeholder charts');
            this.loadChartJSLibrary();
        }
    }

    loadChartJSLibrary() {
        // Dynamically load Chart.js for future integration
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
        script.onload = () => {
            console.log('Chart.js loaded successfully');
            this.initializeChartJS();
        };
        script.onerror = () => {
            console.error('Failed to load Chart.js');
        };
        // Note: Not actually loading for now - placeholder only
        console.log('Chart.js integration prepared for future implementation');
    }

    getMedicalColors() {
        return {
            primary: '#1E88E5',
            secondary: '#26A69A',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            info: '#3B82F6',
            gradient: {
                primary: ['#1E88E5', '#1976D2'],
                secondary: ['#26A69A', '#00796B'],
                success: ['#10B981', '#059669'],
                warning: ['#F59E0B', '#D97706'],
                error: ['#EF4444', '#DC2626'],
                info: ['#3B82F6', '#2563EB']
            },
            palette: [
                '#1E88E5', '#26A69A', '#10B981', '#F59E0B', 
                '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'
            ]
        };
    }

    setupChartContainers() {
        // Setup chart containers with proper structure
        this.chartConfigs = {
            admissionTrend: {
                containerId: 'admission-trend-chart',
                type: 'line',
                title: '入住趋势分析',
                description: '显示患儿入住数量的时间趋势'
            },
            diagnosisDistribution: {
                containerId: 'diagnosis-distribution-chart',
                type: 'doughnut',
                title: '诊断分布',
                description: '主要诊断类型的分布情况'
            },
            hospitalComparison: {
                containerId: 'hospital-comparison-chart',
                type: 'bar',
                title: '医院分布',
                description: '各医院患儿数量对比'
            },
            ageGroupAnalysis: {
                containerId: 'age-group-chart',
                type: 'polarArea',
                title: '年龄段分析',
                description: '不同年龄段患儿分布'
            },
            monthlyStats: {
                containerId: 'monthly-stats-chart',
                type: 'bar',
                title: '月度统计',
                description: '月度入住和出院统计'
            }
        };
    }

    createPlaceholderCharts() {
        Object.entries(this.chartConfigs).forEach(([key, config]) => {
            this.createPlaceholderChart(config);
        });
    }

    createPlaceholderChart(config) {
        const placeholder = this.createChartPlaceholder(config);
        
        // Add to existing chart containers or create new ones
        const existingContainer = document.getElementById(config.containerId);
        if (existingContainer) {
            existingContainer.innerHTML = placeholder;
        } else {
            console.log(`Chart container ${config.containerId} not found - chart ready for integration`);
        }
    }

    createChartPlaceholder(config) {
        const iconMap = {
            line: '<polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>',
            doughnut: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/>',
            bar: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
            polarArea: '<polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/>',
        };

        return `
            <div class="chart-placeholder interactive" data-chart-type="${config.type}">
                <div class="chart-placeholder-content">
                    <svg class="icon-2xl chart-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        ${iconMap[config.type] || iconMap.line}
                    </svg>
                    <h4 class="chart-placeholder-title">${config.title}</h4>
                    <p class="chart-placeholder-description">${config.description}</p>
                    <div class="chart-placeholder-tech">
                        <span class="tech-badge">Chart.js 4.4</span>
                        <span class="tech-badge">医疗专业配色</span>
                        <span class="tech-badge">响应式设计</span>
                    </div>
                </div>
                <div class="chart-placeholder-preview">
                    ${this.generateMockChartPreview(config.type)}
                </div>
            </div>
        `;
    }

    generateMockChartPreview(type) {
        switch (type) {
            case 'line':
                return this.createLinePreview();
            case 'doughnut':
                return this.createDoughnutPreview();
            case 'bar':
                return this.createBarPreview();
            case 'polarArea':
                return this.createPolarPreview();
            default:
                return '<div class="preview-generic">数据可视化预览</div>';
        }
    }

    createLinePreview() {
        return `
            <div class="line-preview">
                <svg viewBox="0 0 200 100" class="preview-chart">
                    <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:${this.colors.primary};stop-opacity:0.8"/>
                            <stop offset="100%" style="stop-color:${this.colors.secondary};stop-opacity:0.8"/>
                        </linearGradient>
                    </defs>
                    <polyline fill="none" stroke="url(#lineGradient)" stroke-width="2" 
                              points="10,70 30,50 50,60 70,30 90,40 110,20 130,35 150,25 170,45 190,30"/>
                    <circle cx="190" cy="30" r="3" fill="${this.colors.primary}"/>
                </svg>
                <div class="preview-labels">
                    <span>入住趋势</span>
                    <span class="trend-up">↗ 增长12%</span>
                </div>
            </div>
        `;
    }

    createDoughnutPreview() {
        return `
            <div class="doughnut-preview">
                <svg viewBox="0 0 100 100" class="preview-chart">
                    <circle cx="50" cy="50" r="35" fill="none" stroke="${this.colors.primary}" stroke-width="8" 
                            stroke-dasharray="65 155" stroke-dashoffset="0"/>
                    <circle cx="50" cy="50" r="35" fill="none" stroke="${this.colors.secondary}" stroke-width="8" 
                            stroke-dasharray="45 175" stroke-dashoffset="-65"/>
                    <circle cx="50" cy="50" r="35" fill="none" stroke="${this.colors.success}" stroke-width="8" 
                            stroke-dasharray="35 185" stroke-dashoffset="-110"/>
                    <circle cx="50" cy="50" r="35" fill="none" stroke="${this.colors.warning}" stroke-width="8" 
                            stroke-dasharray="75 145" stroke-dashoffset="-145"/>
                </svg>
                <div class="preview-legend">
                    <div class="legend-item">
                        <div class="legend-color" style="background: ${this.colors.primary}"></div>
                        <span>呼吸系统</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: ${this.colors.secondary}"></div>
                        <span>消化系统</span>
                    </div>
                </div>
            </div>
        `;
    }

    createBarPreview() {
        return `
            <div class="bar-preview">
                <svg viewBox="0 0 200 100" class="preview-chart">
                    <rect x="20" y="60" width="15" height="30" fill="${this.colors.primary}" rx="2"/>
                    <rect x="45" y="40" width="15" height="50" fill="${this.colors.secondary}" rx="2"/>
                    <rect x="70" y="55" width="15" height="35" fill="${this.colors.success}" rx="2"/>
                    <rect x="95" y="35" width="15" height="55" fill="${this.colors.warning}" rx="2"/>
                    <rect x="120" y="50" width="15" height="40" fill="${this.colors.info}" rx="2"/>
                    <rect x="145" y="45" width="15" height="45" fill="${this.colors.error}" rx="2"/>
                </svg>
                <div class="preview-labels">
                    <span>医院分布对比</span>
                </div>
            </div>
        `;
    }

    createPolarPreview() {
        return `
            <div class="polar-preview">
                <svg viewBox="0 0 100 100" class="preview-chart">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="1"/>
                    <circle cx="50" cy="50" r="30" fill="none" stroke="#e5e7eb" stroke-width="1"/>
                    <circle cx="50" cy="50" r="20" fill="none" stroke="#e5e7eb" stroke-width="1"/>
                    <path d="M50,50 L50,10 A40,40 0 0,1 85,50 Z" fill="${this.colors.primary}" opacity="0.7"/>
                    <path d="M50,50 L85,50 A40,40 0 0,1 50,90 Z" fill="${this.colors.secondary}" opacity="0.7"/>
                    <path d="M50,50 L50,90 A40,40 0 0,1 15,50 Z" fill="${this.colors.success}" opacity="0.7"/>
                    <path d="M50,50 L15,50 A40,40 0 0,1 50,10 Z" fill="${this.colors.warning}" opacity="0.7"/>
                </svg>
                <div class="preview-labels">
                    <span>年龄段分析</span>
                </div>
            </div>
        `;
    }

    // Chart.js Integration Methods (for future implementation)
    initializeChartJS() {
        console.log('Initializing Chart.js integration...');
        
        // Configure Chart.js defaults
        if (typeof Chart !== 'undefined') {
            Chart.defaults.font.family = 'system-ui, -apple-system, sans-serif';
            Chart.defaults.color = '#6b7280';
            Chart.defaults.borderColor = '#e5e7eb';
            Chart.defaults.backgroundColor = 'rgba(30, 136, 229, 0.1)';
            
            this.createRealCharts();
        }
    }

    createRealCharts() {
        // This will create actual Chart.js instances
        Object.entries(this.chartConfigs).forEach(([key, config]) => {
            this.createChart(key, config);
        });
    }

    createChart(chartId, config) {
        const canvas = document.getElementById(config.containerId);
        if (!canvas) return;

        const chartConfig = this.getChartConfig(config.type, config);
        
        try {
            this.charts[chartId] = new Chart(canvas, chartConfig);
        } catch (error) {
            console.error(`Failed to create chart ${chartId}:`, error);
        }
    }

    getChartConfig(type, config) {
        const baseConfig = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: this.colors.primary,
                    borderWidth: 1
                }
            }
        };

        switch (type) {
            case 'line':
                return this.getLineChartConfig(baseConfig);
            case 'doughnut':
                return this.getDoughnutChartConfig(baseConfig);
            case 'bar':
                return this.getBarChartConfig(baseConfig);
            case 'polarArea':
                return this.getPolarAreaChartConfig(baseConfig);
            default:
                return baseConfig;
        }
    }

    getLineChartConfig(baseConfig) {
        return {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [{
                    label: '入住人数',
                    data: [12, 19, 13, 25, 22, 30],
                    borderColor: this.colors.primary,
                    backgroundColor: `${this.colors.primary}20`,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...baseConfig,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f3f4f6'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        };
    }

    getDoughnutChartConfig(baseConfig) {
        return {
            type: 'doughnut',
            data: {
                labels: ['呼吸系统疾病', '消化系统疾病', '神经系统疾病', '其他'],
                datasets: [{
                    data: [35, 25, 20, 20],
                    backgroundColor: [
                        this.colors.primary,
                        this.colors.secondary,
                        this.colors.success,
                        this.colors.warning
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                ...baseConfig,
                cutout: '60%',
                plugins: {
                    ...baseConfig.plugins,
                    legend: {
                        position: 'right'
                    }
                }
            }
        };
    }

    getBarChartConfig(baseConfig) {
        return {
            type: 'bar',
            data: {
                labels: ['北京儿童医院', '上海儿童医院', '广州儿童医院', '深圳儿童医院'],
                datasets: [{
                    label: '患儿数量',
                    data: [45, 32, 28, 25],
                    backgroundColor: this.colors.gradient.primary[0],
                    borderColor: this.colors.gradient.primary[1],
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                ...baseConfig,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f3f4f6'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        };
    }

    getPolarAreaChartConfig(baseConfig) {
        return {
            type: 'polarArea',
            data: {
                labels: ['0-3岁', '4-8岁', '9-12岁', '13-18岁'],
                datasets: [{
                    data: [30, 40, 25, 15],
                    backgroundColor: [
                        `${this.colors.primary}80`,
                        `${this.colors.secondary}80`,
                        `${this.colors.success}80`,
                        `${this.colors.warning}80`
                    ],
                    borderColor: [
                        this.colors.primary,
                        this.colors.secondary,
                        this.colors.success,
                        this.colors.warning
                    ],
                    borderWidth: 2
                }]
            },
            options: baseConfig
        };
    }

    // Data Management
    updateChartData(chartId, newData) {
        if (this.charts[chartId]) {
            this.charts[chartId].data = newData;
            this.charts[chartId].update('resize');
        }
    }

    refreshAllCharts() {
        Object.keys(this.charts).forEach(chartId => {
            if (this.charts[chartId]) {
                this.charts[chartId].update('resize');
            }
        });
    }

    // Theme Management
    switchTheme(newTheme) {
        this.theme = newTheme;
        
        if (newTheme === 'dark') {
            this.colors = this.getDarkModeColors();
        } else {
            this.colors = this.getMedicalColors();
        }
        
        // Update all charts with new colors
        this.updateChartThemes();
    }

    getDarkModeColors() {
        return {
            ...this.getMedicalColors(),
            text: '#f1f5f9',
            background: '#1e293b',
            gridLines: '#334155'
        };
    }

    updateChartThemes() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                // Update chart colors based on current theme
                chart.options.plugins.legend.labels.color = this.colors.text || '#6b7280';
                chart.options.scales.x.grid.color = this.colors.gridLines || '#f3f4f6';
                chart.options.scales.y.grid.color = this.colors.gridLines || '#f3f4f6';
                chart.update('none');
            }
        });
    }

    // Export Functions
    exportChart(chartId, format = 'png') {
        const chart = this.charts[chartId];
        if (!chart) return;

        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.href = url;
        link.download = `${chartId}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportAllCharts() {
        Object.keys(this.charts).forEach(chartId => {
            this.exportChart(chartId);
        });
    }

    // Responsive Chart Management
    handleResize() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }

    // Data Processing Utilities
    processAdmissionTrendData(rawData) {
        // Process raw admission data for line chart
        return {
            labels: rawData.map(item => item.date),
            datasets: [{
                label: '入住人数',
                data: rawData.map(item => item.count),
                borderColor: this.colors.primary,
                backgroundColor: `${this.colors.primary}20`,
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        };
    }

    processDiagnosisData(rawData) {
        // Process diagnosis data for doughnut chart
        const diagnosisCount = {};
        rawData.forEach(patient => {
            const diagnosis = patient.主要诊断 || '其他';
            diagnosisCount[diagnosis] = (diagnosisCount[diagnosis] || 0) + 1;
        });

        return {
            labels: Object.keys(diagnosisCount),
            datasets: [{
                data: Object.values(diagnosisCount),
                backgroundColor: this.colors.palette.slice(0, Object.keys(diagnosisCount).length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };
    }

    processHospitalData(rawData) {
        // Process hospital data for bar chart
        const hospitalCount = {};
        rawData.forEach(patient => {
            const hospital = patient.入住医院 || '未知医院';
            hospitalCount[hospital] = (hospitalCount[hospital] || 0) + 1;
        });

        return {
            labels: Object.keys(hospitalCount),
            datasets: [{
                label: '患儿数量',
                data: Object.values(hospitalCount),
                backgroundColor: this.colors.primary,
                borderColor: this.colors.gradient.primary[1],
                borderWidth: 1,
                borderRadius: 4
            }]
        };
    }

    // Cleanup
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// CSS for chart placeholders and previews
const chartIntegrationCSS = `
.chart-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    text-align: center;
    color: var(--text-secondary);
    position: relative;
}

.chart-placeholder.interactive {
    cursor: pointer;
    transition: all 0.2s ease;
}

.chart-placeholder.interactive:hover {
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
}

.chart-placeholder-content {
    z-index: 2;
    position: relative;
}

.chart-placeholder-icon {
    margin-bottom: 1rem;
    opacity: 0.4;
    color: var(--medical-primary-500);
}

.chart-placeholder-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}

.chart-placeholder-description {
    font-size: 0.875rem;
    margin-bottom: 1rem;
    max-width: 200px;
}

.chart-placeholder-tech {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
}

.tech-badge {
    background: var(--medical-primary-100);
    color: var(--medical-primary-700);
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 500;
}

.chart-placeholder-preview {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.1;
    z-index: 1;
}

.preview-chart {
    width: 100%;
    height: 100%;
    max-width: 200px;
    max-height: 100px;
    margin: auto;
}

.line-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.preview-labels {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
}

.trend-up {
    color: var(--medical-success-500);
    font-weight: 600;
}

.doughnut-preview,
.bar-preview,
.polar-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.preview-legend {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
}

.legend-color {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: var(--radius-sm);
}

.preview-generic {
    font-size: 0.875rem;
    color: var(--text-secondary);
    padding: 2rem;
}
`;

// Inject chart integration styles
const chartStyleSheet = document.createElement('style');
chartStyleSheet.textContent = chartIntegrationCSS;
document.head.appendChild(chartStyleSheet);

// Initialize chart integration when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chartIntegration = new ChartIntegration();
});

// Handle window resize for responsive charts
window.addEventListener('resize', () => {
    if (window.chartIntegration) {
        window.chartIntegration.handleResize();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartIntegration;
}