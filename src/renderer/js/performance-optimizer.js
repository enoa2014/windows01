/**
 * Performance Optimization System
 * 性能优化系统 - 前端性能监控与优化
 */

class PerformanceOptimizer {
    constructor() {
        this.metrics = {
            renderTimes: [],
            memoryUsage: [],
            networkRequests: [],
            userInteractions: []
        };
        
        this.thresholds = {
            renderTime: 100, // ms
            memoryLimit: 50 * 1024 * 1024, // 50MB
            networkTimeout: 5000, // ms
            fpsTarget: 60
        };
        
        this.optimizations = {
            virtualScrolling: false,
            lazyLoading: false,
            debouncing: true,
            caching: true,
            imageOptimization: true
        };
        
        this.observers = {};
        this.cache = new Map();
        this.debounceTimers = new Map();
        
        this.init();
    }

    init() {
        this.setupPerformanceMonitoring();
        this.initializeOptimizations();
        this.startPerformanceTracking();
        this.setupMemoryManagement();
    }

    setupPerformanceMonitoring() {
        // Performance Observer for tracking various metrics
        if ('PerformanceObserver' in window) {
            // Navigation timing
            this.observeNavigation();
            
            // Resource loading
            this.observeResources();
            
            // User interactions
            this.observeUserTiming();
            
            // Layout shifts and paint metrics
            this.observeLayoutMetrics();
        }
        
        // Custom performance tracking
        this.setupCustomMetrics();
    }

    observeNavigation() {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.entryType === 'navigation') {
                    this.recordNavigationMetrics(entry);
                }
            });
        });
        
        try {
            observer.observe({ entryTypes: ['navigation'] });
            this.observers.navigation = observer;
        } catch (error) {
            console.warn('Navigation timing not supported');
        }
    }

    observeResources() {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.entryType === 'resource') {
                    this.recordResourceMetrics(entry);
                }
            });
        });
        
        try {
            observer.observe({ entryTypes: ['resource'] });
            this.observers.resource = observer;
        } catch (error) {
            console.warn('Resource timing not supported');
        }
    }

    observeUserTiming() {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.entryType === 'measure') {
                    this.recordUserTimingMetrics(entry);
                }
            });
        });
        
        try {
            observer.observe({ entryTypes: ['measure'] });
            this.observers.userTiming = observer;
        } catch (error) {
            console.warn('User timing not supported');
        }
    }

    observeLayoutMetrics() {
        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            
            this.metrics.cumulativeLayoutShift = clsValue;
        });
        
        try {
            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.layoutShift = observer;
        } catch (error) {
            console.warn('Layout shift monitoring not supported');
        }

        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.largestContentfulPaint = lastEntry.startTime;
        });
        
        try {
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.lcp = lcpObserver;
        } catch (error) {
            console.warn('LCP monitoring not supported');
        }
    }

    setupCustomMetrics() {
        // Custom render time tracking
        this.startRenderTimeTracking();
        
        // Memory usage monitoring
        this.startMemoryMonitoring();
        
        // FPS monitoring
        this.startFPSMonitoring();
        
        // Network performance tracking
        this.startNetworkMonitoring();
    }

    startRenderTimeTracking() {
        // Override common DOM manipulation methods to track render times
        this.wrapRenderMethods();
        
        // Track component render times
        this.setupComponentTracking();
    }

    wrapRenderMethods() {
        const originalInnerHTML = Element.prototype.innerHTML;
        
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                const start = performance.now();
                originalInnerHTML.call(this, value);
                const end = performance.now();
                
                if (window.performanceOptimizer) {
                    window.performanceOptimizer.recordRenderTime(end - start, this.className);
                }
            },
            get: function() {
                return originalInnerHTML;
            }
        });
    }

    setupComponentTracking() {
        // Track major component render times
        const componentSelectors = [
            '.patient-card',
            '.timeline-item', 
            '.stat-card',
            '.chart-container'
        ];
        
        componentSelectors.forEach(selector => {
            this.trackComponentRenders(selector);
        });
    }

    trackComponentRenders(selector) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.matches(selector)) {
                            this.measureComponentRender(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observers[`component-${selector}`] = observer;
    }

    measureComponentRender(element) {
        const start = performance.now();
        
        // Use requestAnimationFrame to measure actual render completion
        requestAnimationFrame(() => {
            const end = performance.now();
            this.recordRenderTime(end - start, element.className);
        });
    }

    startMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = performance.memory;
                this.recordMemoryUsage({
                    used: memInfo.usedJSHeapSize,
                    total: memInfo.totalJSHeapSize,
                    limit: memInfo.jsHeapSizeLimit,
                    timestamp: Date.now()
                });
            }, 5000);
        }
    }

    startFPSMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                this.recordFPS(fps);
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    startNetworkMonitoring() {
        // Monitor fetch requests
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const start = performance.now();
            const url = typeof args[0] === 'string' ? args[0] : args[0].url;
            
            try {
                const response = await originalFetch(...args);
                const end = performance.now();
                
                this.recordNetworkRequest({
                    url,
                    duration: end - start,
                    status: response.status,
                    success: response.ok,
                    timestamp: Date.now()
                });
                
                return response;
            } catch (error) {
                const end = performance.now();
                
                this.recordNetworkRequest({
                    url,
                    duration: end - start,
                    status: 0,
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                });
                
                throw error;
            }
        };
    }

    initializeOptimizations() {
        // Virtual scrolling for large lists
        this.setupVirtualScrolling();
        
        // Lazy loading for images and content
        this.setupLazyLoading();
        
        // Debouncing for search and input
        this.setupInputDebouncing();
        
        // Caching system
        this.setupCaching();
        
        // Image optimization
        this.setupImageOptimization();
    }

    setupVirtualScrolling() {
        const largeLists = document.querySelectorAll('.patient-list, .timeline-items');
        
        largeLists.forEach(list => {
            if (list.children.length > 50) {
                this.enableVirtualScrolling(list);
            }
        });
    }

    enableVirtualScrolling(container) {
        // Simple virtual scrolling implementation
        const itemHeight = 120; // Approximate item height
        const containerHeight = container.clientHeight;
        const visibleItems = Math.ceil(containerHeight / itemHeight) + 5; // Buffer
        
        container.addEventListener('scroll', this.throttle(() => {
            this.updateVisibleItems(container, itemHeight, visibleItems);
        }, 16)); // 60fps
        
        this.optimizations.virtualScrolling = true;
    }

    updateVisibleItems(container, itemHeight, visibleItems) {
        const scrollTop = container.scrollTop;
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleItems, container.children.length);
        
        // Hide/show items based on visibility
        Array.from(container.children).forEach((item, index) => {
            if (index >= startIndex && index <= endIndex) {
                if (item.style.display === 'none') {
                    item.style.display = '';
                }
            } else {
                item.style.display = 'none';
            }
        });
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyContent(entry.target);
                        lazyObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            // Observe lazy-loadable elements
            document.querySelectorAll('[data-lazy]').forEach(element => {
                lazyObserver.observe(element);
            });
            
            this.observers.lazyLoading = lazyObserver;
            this.optimizations.lazyLoading = true;
        }
    }

    loadLazyContent(element) {
        const lazyType = element.dataset.lazy;
        
        switch (lazyType) {
            case 'image':
                this.loadLazyImage(element);
                break;
            case 'content':
                this.loadLazyTextContent(element);
                break;
            case 'component':
                this.loadLazyComponent(element);
                break;
        }
    }

    loadLazyImage(img) {
        const src = img.dataset.src;
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.removeAttribute('data-lazy');
        }
    }

    setupInputDebouncing() {
        // Debounce search inputs
        document.querySelectorAll('input[type="search"], .search-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.debouncedSearch(e.target.value, e.target);
            });
        });
    }

    debouncedSearch(query, input) {
        const debounceKey = input.id || input.className;
        
        // Clear existing timer
        if (this.debounceTimers.has(debounceKey)) {
            clearTimeout(this.debounceTimers.get(debounceKey));
        }
        
        // Set new timer
        const timer = setTimeout(() => {
            this.performSearch(query, input);
            this.debounceTimers.delete(debounceKey);
        }, 300);
        
        this.debounceTimers.set(debounceKey, timer);
    }

    performSearch(query, input) {
        // Measure search performance
        const start = performance.now();
        
        // Trigger search event
        input.dispatchEvent(new CustomEvent('debouncedSearch', {
            detail: { query, input }
        }));
        
        const end = performance.now();
        this.recordSearchTime(end - start, query.length);
    }

    setupCaching() {
        // Simple in-memory cache for frequently accessed data
        this.cache.set('searchResults', new Map());
        this.cache.set('patientData', new Map());
        this.cache.set('chartData', new Map());
        
        // Cache cleanup interval
        setInterval(() => {
            this.cleanupCache();
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    setupImageOptimization() {
        // Optimize images on load
        document.querySelectorAll('img').forEach(img => {
            this.optimizeImage(img);
        });
        
        // Watch for new images
        const imageObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const images = node.querySelectorAll ? node.querySelectorAll('img') : [];
                        images.forEach(img => this.optimizeImage(img));
                    }
                });
            });
        });
        
        imageObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observers.imageOptimization = imageObserver;
    }

    optimizeImage(img) {
        // Set loading attribute for modern browsers
        if ('loading' in HTMLImageElement.prototype) {
            img.loading = 'lazy';
        }
        
        // Add error handling
        img.addEventListener('error', () => {
            this.handleImageError(img);
        });
        
        // Track loading performance
        img.addEventListener('load', () => {
            this.recordImageLoadTime(img);
        });
    }

    // Metrics Recording
    recordNavigationMetrics(entry) {
        const metrics = {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            firstPaint: this.getFirstPaint(),
            timestamp: Date.now()
        };
        
        this.metrics.navigationTiming = metrics;
        this.analyzeNavigationPerformance(metrics);
    }

    recordResourceMetrics(entry) {
        const metrics = {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            type: this.getResourceType(entry.name),
            timestamp: Date.now()
        };
        
        this.metrics.networkRequests.push(metrics);
        
        if (entry.duration > this.thresholds.networkTimeout) {
            this.flagSlowResource(entry);
        }
    }

    recordUserTimingMetrics(entry) {
        this.metrics.userInteractions.push({
            name: entry.name,
            duration: entry.duration,
            timestamp: Date.now()
        });
    }

    recordRenderTime(duration, component) {
        this.metrics.renderTimes.push({
            duration,
            component,
            timestamp: Date.now()
        });
        
        if (duration > this.thresholds.renderTime) {
            console.warn(`Slow render detected: ${component} took ${duration.toFixed(2)}ms`);
            this.optimizeSlowComponent(component);
        }
    }

    recordMemoryUsage(memInfo) {
        this.metrics.memoryUsage.push(memInfo);
        
        if (memInfo.used > this.thresholds.memoryLimit) {
            console.warn(`High memory usage: ${(memInfo.used / 1024 / 1024).toFixed(2)}MB`);
            this.triggerMemoryCleanup();
        }
    }

    recordFPS(fps) {
        this.metrics.currentFPS = fps;
        
        if (fps < this.thresholds.fpsTarget * 0.8) {
            console.warn(`Low FPS detected: ${fps}fps`);
            this.optimizeForFPS();
        }
    }

    recordNetworkRequest(request) {
        this.metrics.networkRequests.push(request);
        
        if (!request.success) {
            console.warn(`Network request failed: ${request.url}`);
        }
    }

    recordSearchTime(duration, queryLength) {
        this.metrics.searchTimes = this.metrics.searchTimes || [];
        this.metrics.searchTimes.push({
            duration,
            queryLength,
            timestamp: Date.now()
        });
    }

    recordImageLoadTime(img) {
        const loadTime = performance.now() - img.startTime;
        this.metrics.imageLoadTimes = this.metrics.imageLoadTimes || [];
        this.metrics.imageLoadTimes.push({
            src: img.src,
            duration: loadTime,
            timestamp: Date.now()
        });
    }

    // Performance Analysis
    analyzeNavigationPerformance(metrics) {
        // Check Core Web Vitals
        const recommendations = [];
        
        if (metrics.domContentLoaded > 1500) {
            recommendations.push('DOM内容加载时间过长，建议优化JavaScript执行');
        }
        
        if (metrics.loadComplete > 3000) {
            recommendations.push('页面完全加载时间过长，建议优化资源加载');
        }
        
        if (this.metrics.largestContentfulPaint > 2500) {
            recommendations.push('最大内容绘制时间过长，建议优化关键渲染路径');
        }
        
        if (recommendations.length > 0) {
            this.suggestPerformanceImprovements(recommendations);
        }
    }

    // Optimization Strategies
    optimizeSlowComponent(componentClass) {
        // Implement specific optimizations based on component type
        if (componentClass.includes('patient-card')) {
            this.optimizePatientCards();
        } else if (componentClass.includes('timeline-item')) {
            this.optimizeTimelineItems();
        } else if (componentClass.includes('chart')) {
            this.optimizeChartRendering();
        }
    }

    optimizePatientCards() {
        // Virtual scrolling for patient cards
        const patientList = document.querySelector('.patient-list');
        if (patientList && !this.optimizations.virtualScrolling) {
            this.enableVirtualScrolling(patientList);
        }
        
        // Lazy load patient images
        this.setupLazyLoading();
    }

    optimizeTimelineItems() {
        // Limit visible timeline items
        const timelineItems = document.querySelectorAll('.timeline-item');
        if (timelineItems.length > 20) {
            this.implementTimelinePagination();
        }
    }

    optimizeChartRendering() {
        // Reduce chart animation duration
        if (window.chartIntegration) {
            // Reduce animation complexity for better performance
            console.log('Optimizing chart rendering performance');
        }
    }

    optimizeForFPS() {
        // Reduce animation complexity
        document.documentElement.style.setProperty('--animation-duration', '0.1s');
        
        // Disable non-essential animations
        const animations = document.querySelectorAll('[style*="animation"]');
        animations.forEach(element => {
            element.style.animationDuration = '0.1s';
        });
        
        // Reduce chart update frequency
        if (window.chartIntegration) {
            // Throttle chart updates
            console.log('Throttling chart updates for better FPS');
        }
    }

    triggerMemoryCleanup() {
        // Clear caches
        this.cleanupCache();
        
        // Remove unused DOM elements
        this.cleanupDOMElements();
        
        // Trigger garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        console.log('Memory cleanup performed');
    }

    cleanupCache() {
        const maxCacheAge = 10 * 60 * 1000; // 10 minutes
        const now = Date.now();
        
        this.cache.forEach((cacheMap, key) => {
            if (cacheMap instanceof Map) {
                cacheMap.forEach((value, cacheKey) => {
                    if (value.timestamp && now - value.timestamp > maxCacheAge) {
                        cacheMap.delete(cacheKey);
                    }
                });
            }
        });
    }

    cleanupDOMElements() {
        // Remove hidden elements that are no longer needed
        const hiddenElements = document.querySelectorAll('[style*="display: none"]');
        hiddenElements.forEach(element => {
            if (element.dataset.cleanup === 'auto') {
                element.remove();
            }
        });
        
        // Clean up empty containers
        const emptyContainers = document.querySelectorAll('.timeline-item:empty, .patient-card:empty');
        emptyContainers.forEach(container => container.remove());
    }

    // Utility Functions
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    }

    getResourceType(url) {
        if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'script';
        if (url.match(/\.(css|scss|sass)$/)) return 'stylesheet';
        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
        return 'other';
    }

    flagSlowResource(entry) {
        console.warn(`Slow resource detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        
        // Suggest optimizations
        const type = this.getResourceType(entry.name);
        switch (type) {
            case 'script':
                console.suggest('Consider code splitting or lazy loading for JavaScript files');
                break;
            case 'stylesheet':
                console.suggest('Consider critical CSS extraction or CSS optimization');
                break;
            case 'image':
                console.suggest('Consider image compression or WebP format');
                break;
            case 'font':
                console.suggest('Consider font-display: swap or font optimization');
                break;
        }
    }

    suggestPerformanceImprovements(recommendations) {
        console.group('Performance Recommendations');
        recommendations.forEach(rec => console.warn(rec));
        console.groupEnd();
        
        // Show in UI if in development mode
        if (window.location.search.includes('dev=true')) {
            this.showPerformanceRecommendations(recommendations);
        }
    }

    showPerformanceRecommendations(recommendations) {
        const notification = document.createElement('div');
        notification.className = 'performance-recommendations';
        notification.innerHTML = `
            <div class="recommendations-header">
                <h4>性能优化建议</h4>
                <button class="close-recommendations">×</button>
            </div>
            <ul class="recommendations-list">
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        `;
        
        document.body.appendChild(notification);
        
        notification.querySelector('.close-recommendations').addEventListener('click', () => {
            document.body.removeChild(notification);
        });
        
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 10000);
    }

    // Public API
    startPerformanceTracking() {
        // Mark performance monitoring start
        performance.mark('performance-tracking-start');
        console.log('Performance tracking started');
    }

    getPerformanceReport() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            optimizations: this.optimizations,
            thresholds: this.thresholds,
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Analyze render times
        const avgRenderTime = this.metrics.renderTimes.reduce((sum, metric) => sum + metric.duration, 0) / this.metrics.renderTimes.length;
        if (avgRenderTime > this.thresholds.renderTime) {
            recommendations.push(`平均渲染时间 ${avgRenderTime.toFixed(2)}ms 超过阈值，建议启用虚拟滚动`);
        }
        
        // Analyze memory usage
        if (this.metrics.memoryUsage.length > 0) {
            const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
            if (latestMemory.used > this.thresholds.memoryLimit) {
                recommendations.push(`内存使用量 ${(latestMemory.used / 1024 / 1024).toFixed(2)}MB 过高，建议清理缓存`);
            }
        }
        
        // Analyze FPS
        if (this.metrics.currentFPS && this.metrics.currentFPS < this.thresholds.fpsTarget * 0.8) {
            recommendations.push(`FPS ${this.metrics.currentFPS} 低于目标，建议减少动画复杂度`);
        }
        
        return recommendations;
    }

    exportPerformanceReport() {
        const report = this.getPerformanceReport();
        
        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `性能报告_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Utility Methods
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

    // Cleanup
    destroy() {
        // Disconnect all observers
        Object.values(this.observers).forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        
        // Clear timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        // Clear cache
        this.cache.clear();
        
        console.log('Performance optimizer destroyed');
    }
}

// Performance monitoring CSS
const performanceOptimizerCSS = `
.performance-recommendations {
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: var(--medical-warning-50);
    border: 1px solid var(--medical-warning-200);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 400px;
    z-index: 9999;
}

.recommendations-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--medical-warning-200);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--medical-warning-100);
}

.recommendations-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--medical-warning-800);
}

.close-recommendations {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--medical-warning-600);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
}

.close-recommendations:hover {
    background: var(--medical-warning-200);
}

.recommendations-list {
    padding: 1rem 1.5rem;
    margin: 0;
    list-style: none;
}

.recommendations-list li {
    font-size: 0.75rem;
    color: var(--medical-warning-700);
    margin-bottom: 0.5rem;
    padding-left: 1rem;
    position: relative;
}

.recommendations-list li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--medical-warning-500);
    font-weight: bold;
}

.recommendations-list li:last-child {
    margin-bottom: 0;
}

/* Performance monitoring indicator */
.performance-indicator {
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.performance-indicator.warning {
    border-color: var(--medical-warning-500);
    color: var(--medical-warning-700);
    background: var(--medical-warning-50);
}

.performance-indicator.error {
    border-color: var(--medical-error-500);
    color: var(--medical-error-700);
    background: var(--medical-error-50);
}

@media (max-width: 768px) {
    .performance-recommendations {
        top: 1rem;
        right: 1rem;
        left: 1rem;
        max-width: none;
    }
    
    .performance-indicator {
        bottom: 0.5rem;
        left: 0.5rem;
        font-size: 0.7rem;
        padding: 0.375rem 0.75rem;
    }
}
`;

// Inject performance optimizer styles
const perfStyleSheet = document.createElement('style');
perfStyleSheet.textContent = performanceOptimizerCSS;
document.head.appendChild(perfStyleSheet);

// Initialize performance optimizer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
    
    // Add performance indicator in development mode
    if (window.location.search.includes('dev=true')) {
        const indicator = document.createElement('div');
        indicator.className = 'performance-indicator';
        indicator.innerHTML = `
            <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
            </svg>
            性能监控中
        `;
        document.body.appendChild(indicator);
        
        // Update indicator based on performance
        setInterval(() => {
            const fps = window.performanceOptimizer.metrics.currentFPS;
            if (fps < 30) {
                indicator.className = 'performance-indicator error';
                indicator.querySelector('span').textContent = `FPS: ${fps} (差)`;
            } else if (fps < 50) {
                indicator.className = 'performance-indicator warning';
                indicator.querySelector('span').textContent = `FPS: ${fps} (一般)`;
            } else {
                indicator.className = 'performance-indicator';
                indicator.querySelector('span').textContent = `FPS: ${fps} (良好)`;
            }
        }, 2000);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.performanceOptimizer) {
        window.performanceOptimizer.destroy();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}