/**
 * Timeline Visualization Component
 * 医疗记录时间轴可视化组件
 */

class TimelineVisualization {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            sortOrder: 'desc',
            showFilters: true,
            enableSearch: true,
            enableExport: true,
            maxItems: 100,
            itemHeight: 'auto',
            ...options
        };
        
        this.data = [];
        this.filteredData = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.iconLib = new IconLibrary();
        
        this.init();
    }

    init() {
        this.createTimelineStructure();
        this.setupEventListeners();
        this.setupIntersectionObserver();
    }

    createTimelineStructure() {
        this.container.innerHTML = `
            <div class="timeline-visualization">
                ${this.options.showFilters ? this.createFiltersHtml() : ''}
                <div class="timeline-wrapper">
                    <div class="timeline-controls">
                        <div class="timeline-stats">
                            <span class="timeline-count">0 条记录</span>
                            <span class="timeline-range">时间范围: -</span>
                        </div>
                        <div class="timeline-actions">
                            ${this.options.enableExport ? `
                                <button class="timeline-action-btn" data-action="export" title="导出时间轴">
                                    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7,10 12,15 17,10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                </button>
                            ` : ''}
                            <button class="timeline-action-btn" data-action="refresh" title="刷新数据">
                                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                    <path d="M21 3v5h-5"/>
                                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                    <path d="M3 21v-5h5"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="timeline-container">
                        <div class="timeline-track"></div>
                        <div class="timeline-items" id="timeline-items"></div>
                    </div>
                </div>
            </div>
        `;
    }

    createFiltersHtml() {
        return `
            <div class="timeline-filters">
                <div class="filter-group">
                    <label class="filter-label">记录类型</label>
                    <select class="filter-select" data-filter="type">
                        <option value="all">全部记录</option>
                        <option value="treatment">治疗记录</option>
                        <option value="examination">检查记录</option>
                        <option value="medication">用药记录</option>
                        <option value="consultation">会诊记录</option>
                        <option value="discharge">出院记录</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label class="filter-label">时间范围</label>
                    <select class="filter-select" data-filter="timerange">
                        <option value="all">全部时间</option>
                        <option value="recent">最近7天</option>
                        <option value="month">最近30天</option>
                        <option value="quarter">最近3个月</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label class="filter-label">重要程度</label>
                    <select class="filter-select" data-filter="importance">
                        <option value="all">全部</option>
                        <option value="critical">重要事件</option>
                        <option value="normal">常规记录</option>
                    </select>
                </div>
                
                ${this.options.enableSearch ? `
                    <div class="filter-group search-group">
                        <label class="filter-label">搜索</label>
                        <div class="search-input-wrapper">
                            <svg class="search-icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21l-4.35-4.35"/>
                            </svg>
                            <input type="search" class="timeline-search-input" placeholder="搜索治疗记录...">
                            <button class="search-clear" style="display: none;" title="清除搜索">
                                <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    setupEventListeners() {
        // Filter controls
        this.container.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.applyFilter(e.target.dataset.filter, e.target.value);
            });
        });

        // Search input
        const searchInput = this.container.querySelector('.timeline-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));

            searchInput.addEventListener('focus', () => {
                this.container.querySelector('.search-input-wrapper').classList.add('focused');
            });

            searchInput.addEventListener('blur', () => {
                this.container.querySelector('.search-input-wrapper').classList.remove('focused');
            });
        }

        // Clear search
        const clearBtn = this.container.querySelector('.search-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.handleSearch('');
                searchInput.focus();
            });
        }

        // Action buttons
        this.container.querySelectorAll('.timeline-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleAction(e.currentTarget.dataset.action);
            });
        });

        // Timeline item interactions
        this.container.addEventListener('click', (e) => {
            const timelineItem = e.target.closest('.timeline-item');
            if (timelineItem) {
                this.handleTimelineItemClick(timelineItem, e);
            }
        });

        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }

    setupIntersectionObserver() {
        // Lazy loading and animation observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const item = entry.target;
                    item.classList.add('timeline-item-visible');
                    
                    // Add staggered animation delay
                    const index = Array.from(item.parentElement.children).indexOf(item);
                    item.style.animationDelay = `${index * 0.1}s`;
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '50px'
        });
    }

    setData(timelineData) {
        this.data = this.processTimelineData(timelineData);
        this.filteredData = [...this.data];
        this.render();
        this.updateStats();
    }

    processTimelineData(rawData) {
        return rawData.map((item, index) => ({
            id: item.id || `timeline-${index}`,
            date: new Date(item.date),
            type: this.detectRecordType(item),
            importance: this.detectImportance(item),
            title: this.generateTitle(item),
            content: item.content || [],
            attendees: item.attendees || '医护团队',
            metadata: {
                originalData: item,
                searchText: this.generateSearchText(item)
            }
        }));
    }

    detectRecordType(item) {
        const content = JSON.stringify(item).toLowerCase();
        
        if (content.includes('检查') || content.includes('化验') || content.includes('影像')) {
            return 'examination';
        } else if (content.includes('用药') || content.includes('药物') || content.includes('处方')) {
            return 'medication';
        } else if (content.includes('会诊') || content.includes('专家') || content.includes('转科')) {
            return 'consultation';
        } else if (content.includes('出院') || content.includes('离院') || content.includes('转院')) {
            return 'discharge';
        } else {
            return 'treatment';
        }
    }

    detectImportance(item) {
        const content = JSON.stringify(item).toLowerCase();
        const criticalKeywords = ['紧急', '危重', '异常', '恶化', '并发症', '急诊'];
        
        return criticalKeywords.some(keyword => content.includes(keyword)) ? 'critical' : 'normal';
    }

    generateTitle(item) {
        const typeMap = {
            'treatment': '治疗记录',
            'examination': '检查记录',
            'medication': '用药记录',
            'consultation': '会诊记录',
            'discharge': '出院记录'
        };
        
        const type = this.detectRecordType(item);
        const date = new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        
        return `${date} ${typeMap[type] || '医疗记录'}`;
    }

    generateSearchText(item) {
        let searchText = '';
        searchText += item.attendees || '';
        
        if (item.content && Array.isArray(item.content)) {
            item.content.forEach(field => {
                searchText += ` ${field.label || ''} ${field.value || ''}`;
            });
        }
        
        return searchText.toLowerCase();
    }

    applyFilter(filterType, value) {
        this.currentFilter = { ...this.currentFilter, [filterType]: value };
        this.filterData();
        this.render();
        this.updateStats();
    }

    filterData() {
        this.filteredData = this.data.filter(item => {
            // Type filter
            if (this.currentFilter.type && this.currentFilter.type !== 'all') {
                if (item.type !== this.currentFilter.type) return false;
            }
            
            // Time range filter
            if (this.currentFilter.timerange && this.currentFilter.timerange !== 'all') {
                const now = new Date();
                const itemDate = item.date;
                let daysDiff = (now - itemDate) / (1000 * 60 * 60 * 24);
                
                switch (this.currentFilter.timerange) {
                    case 'recent':
                        if (daysDiff > 7) return false;
                        break;
                    case 'month':
                        if (daysDiff > 30) return false;
                        break;
                    case 'quarter':
                        if (daysDiff > 90) return false;
                        break;
                }
            }
            
            // Importance filter
            if (this.currentFilter.importance && this.currentFilter.importance !== 'all') {
                if (item.importance !== this.currentFilter.importance) return false;
            }
            
            // Search filter
            if (this.searchQuery) {
                if (!item.metadata.searchText.includes(this.searchQuery.toLowerCase())) {
                    return false;
                }
            }
            
            return true;
        });
    }

    handleSearch(query) {
        this.searchQuery = query;
        
        // Update clear button visibility
        const clearBtn = this.container.querySelector('.search-clear');
        if (clearBtn) {
            clearBtn.style.display = query ? 'flex' : 'none';
        }
        
        this.filterData();
        this.render();
        this.updateStats();
        
        // Highlight search results
        if (query) {
            this.highlightSearchResults(query);
        }
    }

    highlightSearchResults(query) {
        const items = this.container.querySelectorAll('.timeline-item');
        items.forEach(item => {
            this.removeHighlights(item);
            if (query.length >= 2) {
                this.addHighlights(item, query);
            }
        });
    }

    addHighlights(element, query) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            const regex = new RegExp(`(${query})`, 'gi');
            if (regex.test(text)) {
                const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
                const span = document.createElement('span');
                span.innerHTML = highlightedText;
                textNode.parentNode.replaceChild(span, textNode);
            }
        });
    }

    removeHighlights(element) {
        const highlights = element.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
    }

    render() {
        const timelineItems = this.container.querySelector('#timeline-items') || 
                             this.container.querySelector('.timeline-items');
        
        if (!timelineItems) return;

        // Sort data
        const sortedData = [...this.filteredData].sort((a, b) => {
            return this.options.sortOrder === 'desc' ? b.date - a.date : a.date - b.date;
        });

        // Clear existing items
        timelineItems.innerHTML = '';

        if (sortedData.length === 0) {
            timelineItems.innerHTML = this.createEmptyStateHtml();
            return;
        }

        // Render items with virtual scrolling for large datasets
        const itemsToRender = sortedData.slice(0, this.options.maxItems);
        
        itemsToRender.forEach((item, index) => {
            const itemElement = this.createTimelineItem(item, index);
            timelineItems.appendChild(itemElement);
            
            // Setup intersection observer for animations
            this.observer.observe(itemElement);
        });

        // Show load more button if needed
        if (sortedData.length > this.options.maxItems) {
            const loadMoreBtn = this.createLoadMoreButton(sortedData.length - this.options.maxItems);
            timelineItems.appendChild(loadMoreBtn);
        }
    }

    createTimelineItem(item, index) {
        const div = document.createElement('div');
        div.className = `timeline-item timeline-item-${item.type} timeline-${item.importance}`;
        div.dataset.id = item.id;
        div.dataset.date = item.date.toISOString();
        div.setAttribute('tabindex', '0');
        div.setAttribute('role', 'article');
        div.setAttribute('aria-label', `${item.title} - ${this.formatDate(item.date)}`);

        div.innerHTML = `
            <div class="timeline-item-indicator ${item.importance}">
                ${this.getTypeIcon(item.type)}
            </div>
            
            <div class="timeline-item-content">
                <div class="timeline-item-header">
                    <div class="timeline-item-meta">
                        <time class="timeline-date" datetime="${item.date.toISOString()}">
                            ${this.formatDate(item.date)}
                        </time>
                        <span class="timeline-type ${item.type}">
                            ${this.getTypeLabel(item.type)}
                        </span>
                        ${item.importance === 'critical' ? 
                            '<span class="timeline-priority critical">重要</span>' : ''
                        }
                    </div>
                    
                    <div class="timeline-attendees">
                        <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        ${item.attendees}
                    </div>
                </div>
                
                <div class="timeline-item-body">
                    <h4 class="timeline-item-title">${item.title}</h4>
                    
                    <div class="timeline-content-grid">
                        ${item.content.map(field => `
                            <div class="timeline-content-field">
                                <label class="timeline-field-label">${field.label}</label>
                                <div class="timeline-field-value ${field.highlight ? 'highlight' : ''}">
                                    ${field.value}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="timeline-item-actions">
                        <button class="timeline-item-action" data-action="expand" 
                                aria-label="展开详情" title="查看完整记录">
                            <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="15,3 21,3 21,9"/>
                                <polyline points="9,21 3,21 3,15"/>
                                <line x1="21" y1="3" x2="14" y2="10"/>
                                <line x1="3" y1="21" x2="10" y2="14"/>
                            </svg>
                        </button>
                        <button class="timeline-item-action" data-action="share" 
                                aria-label="分享记录" title="分享此记录">
                            <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="18" cy="5" r="3"/>
                                <circle cx="6" cy="12" r="3"/>
                                <circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        return div;
    }

    createEmptyStateHtml() {
        return `
            <div class="timeline-empty-state">
                <div class="empty-state-illustration">
                    <svg class="icon-2xl" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <h3 class="empty-state-title">暂无医疗记录</h3>
                <p class="empty-state-description">
                    ${this.searchQuery ? '没有找到匹配的记录，请尝试其他搜索条件' : '该患者暂无医疗时间轴记录'}
                </p>
                ${this.searchQuery ? `
                    <button class="empty-state-action" onclick="this.closest('.timeline-visualization').querySelector('.timeline-search-input').value = ''; this.closest('.timeline-visualization').querySelector('.timeline-search-input').dispatchEvent(new Event('input'));">
                        清除搜索条件
                    </button>
                ` : ''}
            </div>
        `;
    }

    createLoadMoreButton(remainingCount) {
        const button = document.createElement('button');
        button.className = 'timeline-load-more';
        button.innerHTML = `
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <polyline points="19,12 12,19 5,12"/>
            </svg>
            加载更多 (还有 ${remainingCount} 条记录)
        `;
        
        button.addEventListener('click', () => {
            this.options.maxItems += 50;
            this.render();
        });
        
        return button;
    }

    updateStats() {
        const countElement = this.container.querySelector('.timeline-count');
        const rangeElement = this.container.querySelector('.timeline-range');
        
        if (countElement) {
            countElement.textContent = `${this.filteredData.length} 条记录`;
        }
        
        if (rangeElement && this.filteredData.length > 0) {
            const dates = this.filteredData.map(item => item.date).sort((a, b) => a - b);
            const startDate = this.formatDate(dates[0], true);
            const endDate = this.formatDate(dates[dates.length - 1], true);
            rangeElement.textContent = `时间范围: ${startDate} - ${endDate}`;
        }
    }

    handleAction(action) {
        switch (action) {
            case 'export':
                this.exportTimeline();
                break;
            case 'refresh':
                this.refreshData();
                break;
            default:
                console.warn('Unknown timeline action:', action);
        }
    }

    handleTimelineItemClick(item, event) {
        const action = event.target.closest('[data-action]');
        if (action) {
            const actionType = action.dataset.action;
            const itemId = item.dataset.id;
            
            switch (actionType) {
                case 'expand':
                    this.expandTimelineItem(itemId);
                    break;
                case 'share':
                    this.shareTimelineItem(itemId);
                    break;
            }
        } else {
            // Toggle item selection
            item.classList.toggle('selected');
        }
    }

    handleKeyboardNavigation(event) {
        const focusedItem = this.container.querySelector('.timeline-item:focus');
        if (!focusedItem) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.focusNextItem(focusedItem);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.focusPreviousItem(focusedItem);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.expandTimelineItem(focusedItem.dataset.id);
                break;
        }
    }

    focusNextItem(currentItem) {
        const nextItem = currentItem.nextElementSibling;
        if (nextItem && nextItem.classList.contains('timeline-item')) {
            nextItem.focus();
            nextItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    focusPreviousItem(currentItem) {
        const prevItem = currentItem.previousElementSibling;
        if (prevItem && prevItem.classList.contains('timeline-item')) {
            prevItem.focus();
            prevItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    exportTimeline() {
        const exportData = {
            patientInfo: {
                exportDate: new Date().toISOString(),
                totalRecords: this.filteredData.length,
                filters: this.currentFilter,
                searchQuery: this.searchQuery
            },
            timeline: this.filteredData.map(item => ({
                date: item.date.toISOString(),
                type: item.type,
                importance: item.importance,
                title: item.title,
                content: item.content,
                attendees: item.attendees
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `医疗时间轴_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showNotification('时间轴数据导出成功', 'success');
    }

    refreshData() {
        this.showNotification('正在刷新数据...', 'info');
        
        // Trigger data reload if callback provided
        if (this.options.onRefresh) {
            this.options.onRefresh();
        }
    }

    // Utility functions
    getTypeIcon(type) {
        const iconMap = {
            'treatment': 'activity',
            'examination': 'search',
            'medication': 'pill',
            'consultation': 'users',
            'discharge': 'log-out'
        };
        
        return this.iconLib.getIcon(iconMap[type] || 'file-text', 'sm');
    }

    getTypeLabel(type) {
        const labelMap = {
            'treatment': '治疗',
            'examination': '检查',
            'medication': '用药',
            'consultation': '会诊',
            'discharge': '出院'
        };
        
        return labelMap[type] || '记录';
    }

    formatDate(date, short = false) {
        if (!date) return '未知日期';
        
        const options = short ? 
            { month: 'short', day: 'numeric' } : 
            { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
            
        return date.toLocaleDateString('zh-CN', options);
    }

    showNotification(message, type = 'info') {
        // Create and show notification
        const toast = document.createElement('div');
        toast.className = `timeline-notification notification-${type}`;
        toast.innerHTML = `
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                ${type === 'success' ? 
                    '<polyline points="20,6 9,17 4,12"/>' : 
                    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
                }
            </svg>
            ${message}
        `;
        
        this.container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => this.container.removeChild(toast), 300);
        }, 3000);
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

    // Public API
    updateData(newData) {
        this.setData(newData);
    }

    setSortOrder(order) {
        this.options.sortOrder = order;
        this.render();
    }

    clearFilters() {
        this.currentFilter = { type: 'all', timerange: 'all', importance: 'all' };
        this.searchQuery = '';
        
        // Reset UI
        this.container.querySelectorAll('.filter-select').forEach(select => {
            select.value = 'all';
        });
        
        const searchInput = this.container.querySelector('.timeline-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.filterData();
        this.render();
        this.updateStats();
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        this.container.innerHTML = '';
    }
}

// CSS for timeline visualization (add to enhanced-detail-page.css)
const timelineVisualizationCSS = `
.timeline-visualization {
    width: 100%;
}

.timeline-filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.filter-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.875rem;
}

.search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--text-secondary);
    z-index: 1;
}

.timeline-search-input {
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.875rem;
    width: 100%;
}

.search-input-wrapper.focused .timeline-search-input {
    border-color: var(--medical-primary-500);
    box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
}

.search-clear {
    position: absolute;
    right: 0.5rem;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
}

.timeline-item-indicator {
    position: absolute;
    left: -1.5rem;
    top: 1.5rem;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-full);
    background: var(--medical-primary-500);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    border: 3px solid var(--bg-secondary);
    box-shadow: 0 0 0 3px var(--bg-primary);
}

.timeline-item-indicator.critical {
    background: var(--medical-error-500);
    animation: pulse 2s infinite;
}

.timeline-type {
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
}

.timeline-type.treatment { background: #e0f2fe; color: #0277bd; }
.timeline-type.examination { background: #f3e5f5; color: #7b1fa2; }
.timeline-type.medication { background: #e8f5e8; color: #2e7d32; }
.timeline-type.consultation { background: #fff3e0; color: #ef6c00; }
.timeline-type.discharge { background: #f5f5f5; color: #424242; }

.timeline-priority.critical {
    background: var(--medical-error-500);
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
}

.timeline-content-grid {
    display: grid;
    gap: 1rem;
    margin: 1rem 0;
}

.timeline-content-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.timeline-item-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}

.timeline-item-action {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
}

.timeline-item-action:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}

.search-highlight {
    background: #fef08a;
    color: #854d0e;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-weight: 600;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
`;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimelineVisualization;
}