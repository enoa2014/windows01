/**
 * Keyboard Shortcuts System
 * 快捷键系统 - 全局键盘导航支持
 */

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.isEnabled = true;
        this.helpVisible = false;
        this.currentContext = 'global';
        this.modifierKeys = {
            ctrl: false,
            alt: false,
            shift: false,
            meta: false
        };
        
        this.init();
    }

    init() {
        this.registerGlobalShortcuts();
        this.registerContextualShortcuts();
        this.setupEventListeners();
        this.createHelpOverlay();
    }

    setupEventListeners() {
        // Track modifier key states
        document.addEventListener('keydown', (e) => {
            this.updateModifierKeys(e);
            
            if (!this.isEnabled) return;
            
            const shortcutKey = this.generateShortcutKey(e);
            const shortcut = this.shortcuts.get(shortcutKey);
            
            if (shortcut) {
                // Check if shortcut is available in current context
                if (this.isShortcutAvailable(shortcut, this.currentContext)) {
                    e.preventDefault();
                    this.executeShortcut(shortcut, e);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.updateModifierKeys(e);
        });

        // Context detection
        document.addEventListener('focusin', (e) => {
            this.updateContext(e.target);
        });

        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.resetModifierKeys();
            }
        });
    }

    updateModifierKeys(e) {
        this.modifierKeys.ctrl = e.ctrlKey;
        this.modifierKeys.alt = e.altKey;
        this.modifierKeys.shift = e.shiftKey;
        this.modifierKeys.meta = e.metaKey;
    }

    resetModifierKeys() {
        Object.keys(this.modifierKeys).forEach(key => {
            this.modifierKeys[key] = false;
        });
    }

    generateShortcutKey(e) {
        const parts = [];
        
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.metaKey) parts.push('meta');
        
        parts.push(e.key.toLowerCase());
        
        return parts.join('+');
    }

    updateContext(element) {
        // Determine current context based on focused element
        if (element.closest('.patient-detail-container')) {
            this.currentContext = 'detail';
        } else if (element.closest('.dashboard-container')) {
            this.currentContext = 'dashboard';
        } else if (element.closest('.upload-container')) {
            this.currentContext = 'upload';
        } else if (element.closest('.search-container')) {
            this.currentContext = 'search';
        } else {
            this.currentContext = 'global';
        }
    }

    registerGlobalShortcuts() {
        // Navigation shortcuts
        this.addShortcut('ctrl+h', {
            name: '返回首页',
            description: '快速返回主页面',
            contexts: ['global', 'detail', 'dashboard'],
            action: () => this.navigateToHome()
        });

        this.addShortcut('ctrl+i', {
            name: '数据导入',
            description: '打开数据导入页面',
            contexts: ['global'],
            action: () => this.openDataImport()
        });

        this.addShortcut('ctrl+e', {
            name: '导出数据',
            description: '导出当前页面数据',
            contexts: ['global', 'detail', 'dashboard'],
            action: () => this.exportCurrentData()
        });

        this.addShortcut('ctrl+n', {
            name: '新建记录',
            description: '创建新的患儿记录',
            contexts: ['global'],
            action: () => this.createNewRecord()
        });

        this.addShortcut('f5', {
            name: '刷新数据',
            description: '刷新当前页面数据',
            contexts: ['global', 'detail', 'dashboard'],
            action: () => this.refreshCurrentPage()
        });

        this.addShortcut('f1', {
            name: '显示帮助',
            description: '显示快捷键帮助',
            contexts: ['global'],
            action: () => this.toggleHelp()
        });

        this.addShortcut('escape', {
            name: '取消/关闭',
            description: '关闭弹窗或取消当前操作',
            contexts: ['global'],
            action: () => this.handleEscape()
        });

        // Search shortcuts
        this.addShortcut('ctrl+f', {
            name: '搜索',
            description: '快速搜索患儿信息',
            contexts: ['global'],
            action: () => this.focusSearch()
        });

        this.addShortcut('ctrl+shift+f', {
            name: '高级搜索',
            description: '打开高级搜索面板',
            contexts: ['global'],
            action: () => this.openAdvancedSearch()
        });
    }

    registerContextualShortcuts() {
        // Detail page shortcuts
        this.addShortcut('ctrl+1', {
            name: '基本信息',
            description: '切换到基本信息标签',
            contexts: ['detail'],
            action: () => this.switchDetailTab('basic-info')
        });

        this.addShortcut('ctrl+2', {
            name: '医疗信息',
            description: '切换到医疗信息标签',
            contexts: ['detail'],
            action: () => this.switchDetailTab('medical-info')
        });

        this.addShortcut('ctrl+3', {
            name: '入住历史',
            description: '切换到入住历史标签',
            contexts: ['detail'],
            action: () => this.switchDetailTab('admission-history')
        });

        this.addShortcut('ctrl+4', {
            name: '家庭信息',
            description: '切换到家庭信息标签',
            contexts: ['detail'],
            action: () => this.switchDetailTab('family-info')
        });

        this.addShortcut('ctrl+5', {
            name: '治疗记录',
            description: '切换到治疗记录标签',
            contexts: ['detail'],
            action: () => this.switchDetailTab('treatment-records')
        });

        this.addShortcut('alt+s', {
            name: '时间轴排序',
            description: '切换时间轴排序方式',
            contexts: ['detail'],
            action: () => this.toggleTimelineSort()
        });

        this.addShortcut('ctrl+p', {
            name: '打印',
            description: '打印当前患者详情',
            contexts: ['detail'],
            action: () => this.printPatientDetails()
        });

        // Dashboard shortcuts
        this.addShortcut('ctrl+d', {
            name: '仪表板',
            description: '打开概览仪表板',
            contexts: ['global'],
            action: () => this.openDashboard()
        });

        this.addShortcut('ctrl+r', {
            name: '刷新仪表板',
            description: '刷新仪表板数据',
            contexts: ['dashboard'],
            action: () => this.refreshDashboard()
        });

        // Upload shortcuts
        this.addShortcut('ctrl+u', {
            name: '文件上传',
            description: '打开文件上传对话框',
            contexts: ['global', 'upload'],
            action: () => this.openFileUpload()
        });

        this.addShortcut('ctrl+shift+v', {
            name: '验证文件',
            description: '验证已上传的文件格式',
            contexts: ['upload'],
            action: () => this.validateUploadedFiles()
        });
    }

    addShortcut(key, config) {
        this.shortcuts.set(key, {
            key,
            ...config,
            id: `shortcut-${this.shortcuts.size}`
        });
    }

    isShortcutAvailable(shortcut, context) {
        return shortcut.contexts.includes(context) || shortcut.contexts.includes('global');
    }

    executeShortcut(shortcut, event) {
        try {
            // Visual feedback
            this.showShortcutFeedback(shortcut.name);
            
            // Execute action
            shortcut.action(event);
            
            // Log usage for analytics
            this.logShortcutUsage(shortcut);
            
        } catch (error) {
            console.error(`Failed to execute shortcut ${shortcut.key}:`, error);
            this.showNotification(`快捷键执行失败: ${shortcut.name}`, 'error');
        }
    }

    showShortcutFeedback(shortcutName) {
        // Create temporary visual feedback
        const feedback = document.createElement('div');
        feedback.className = 'shortcut-feedback';
        feedback.textContent = shortcutName;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        document.body.appendChild(feedback);
        
        // Animate in
        requestAnimationFrame(() => {
            feedback.style.opacity = '1';
        });
        
        // Remove after delay
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    document.body.removeChild(feedback);
                }
            }, 200);
        }, 1000);
    }

    // Shortcut Actions
    navigateToHome() {
        if (window.location.pathname !== '/index.html') {
            window.location.href = 'index.html';
        }
    }

    openDataImport() {
        // Navigate to import page or trigger import dialog
        const importBtn = document.querySelector('[data-action="import"]');
        if (importBtn) {
            importBtn.click();
        } else {
            this.showNotification('数据导入功能开发中...', 'info');
        }
    }

    exportCurrentData() {
        // Export current page data
        if (this.currentContext === 'detail' && window.enhancedDetailPage) {
            window.enhancedDetailPage.exportPatientData();
        } else if (this.currentContext === 'dashboard' && window.dashboard) {
            window.dashboard.exportDashboardData();
        } else {
            this.showNotification('当前页面不支持数据导出', 'warning');
        }
    }

    createNewRecord() {
        this.showNotification('新建记录功能开发中...', 'info');
    }

    refreshCurrentPage() {
        if (this.currentContext === 'dashboard' && window.dashboard) {
            window.dashboard.refreshData();
        } else if (this.currentContext === 'detail' && window.enhancedDetailPage) {
            window.enhancedDetailPage.loadPatientData();
        } else {
            window.location.reload();
        }
    }

    toggleHelp() {
        this.helpVisible = !this.helpVisible;
        
        if (this.helpVisible) {
            this.showHelpOverlay();
        } else {
            this.hideHelpOverlay();
        }
    }

    handleEscape() {
        // Close modals, overlays, or cancel operations
        const modal = document.querySelector('.modal-overlay:not([style*="display: none"])');
        if (modal) {
            modal.style.display = 'none';
            return;
        }
        
        if (this.helpVisible) {
            this.hideHelpOverlay();
            return;
        }
        
        // Clear search if focused
        const searchInput = document.querySelector('input[type="search"]:focus');
        if (searchInput) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            return;
        }
        
        // Blur focused element
        if (document.activeElement !== document.body) {
            document.activeElement.blur();
        }
    }

    focusSearch() {
        const searchInput = document.querySelector('input[type="search"], .search-input, .timeline-search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        } else {
            this.showNotification('当前页面没有搜索功能', 'info');
        }
    }

    openAdvancedSearch() {
        const advancedSearchBtn = document.querySelector('[data-action="advanced-search"]');
        if (advancedSearchBtn) {
            advancedSearchBtn.click();
        } else {
            this.showNotification('高级搜索功能开发中...', 'info');
        }
    }

    switchDetailTab(tabName) {
        if (window.enhancedDetailPage) {
            window.enhancedDetailPage.switchTab(tabName);
        } else {
            // Fallback for direct tab switching
            const tab = document.querySelector(`[data-tab="${tabName}"]`);
            if (tab && tab.click) {
                tab.click();
            }
        }
    }

    toggleTimelineSort() {
        const sortSelect = document.querySelector('.timeline-sort');
        if (sortSelect) {
            sortSelect.value = sortSelect.value === 'desc' ? 'asc' : 'desc';
            sortSelect.dispatchEvent(new Event('change'));
        }
    }

    printPatientDetails() {
        if (window.enhancedDetailPage) {
            window.enhancedDetailPage.printPatientDetails();
        } else {
            window.print();
        }
    }

    openDashboard() {
        if (window.location.pathname !== '/dashboard.html') {
            window.location.href = 'dashboard.html';
        }
    }

    refreshDashboard() {
        if (window.dashboard) {
            window.dashboard.refreshData();
        }
    }

    openFileUpload() {
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.click();
        } else {
            this.showNotification('文件上传功能不可用', 'warning');
        }
    }

    validateUploadedFiles() {
        if (window.enhancedUpload) {
            window.enhancedUpload.validateAllFiles();
        } else {
            this.showNotification('文件验证功能开发中...', 'info');
        }
    }

    // Help Overlay System
    createHelpOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'keyboard-shortcuts-help';
        overlay.className = 'shortcuts-help-overlay';
        overlay.style.display = 'none';
        
        overlay.innerHTML = `
            <div class="shortcuts-help-content">
                <div class="shortcuts-help-header">
                    <h3>键盘快捷键</h3>
                    <button class="shortcuts-help-close" aria-label="关闭快捷键帮助">
                        <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="shortcuts-help-body">
                    <div class="shortcuts-help-section">
                        <h4>全局快捷键</h4>
                        <div class="shortcuts-list" id="global-shortcuts-list"></div>
                    </div>
                    <div class="shortcuts-help-section">
                        <h4>页面专用快捷键</h4>
                        <div class="shortcuts-list" id="contextual-shortcuts-list"></div>
                    </div>
                </div>
                <div class="shortcuts-help-footer">
                    <p>按 <kbd>F1</kbd> 显示/隐藏此帮助，按 <kbd>Esc</kbd> 关闭</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Setup close handlers
        overlay.querySelector('.shortcuts-help-close').addEventListener('click', () => {
            this.hideHelpOverlay();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideHelpOverlay();
            }
        });
        
        this.populateHelpContent();
    }

    populateHelpContent() {
        const globalList = document.getElementById('global-shortcuts-list');
        const contextualList = document.getElementById('contextual-shortcuts-list');
        
        if (!globalList || !contextualList) return;
        
        const globalShortcuts = [];
        const contextualShortcuts = [];
        
        this.shortcuts.forEach(shortcut => {
            if (shortcut.contexts.includes('global')) {
                globalShortcuts.push(shortcut);
            } else {
                contextualShortcuts.push(shortcut);
            }
        });
        
        globalList.innerHTML = globalShortcuts.map(shortcut => this.createShortcutItem(shortcut)).join('');
        contextualList.innerHTML = contextualShortcuts.map(shortcut => this.createShortcutItem(shortcut)).join('');
    }

    createShortcutItem(shortcut) {
        return `
            <div class="shortcut-item">
                <div class="shortcut-key">
                    <kbd>${this.formatShortcutDisplay(shortcut.key)}</kbd>
                </div>
                <div class="shortcut-info">
                    <div class="shortcut-name">${shortcut.name}</div>
                    <div class="shortcut-description">${shortcut.description}</div>
                    <div class="shortcut-contexts">${shortcut.contexts.join(', ')}</div>
                </div>
            </div>
        `;
    }

    formatShortcutDisplay(key) {
        return key
            .replace('ctrl+', 'Ctrl + ')
            .replace('alt+', 'Alt + ')
            .replace('shift+', 'Shift + ')
            .replace('meta+', 'Cmd + ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    showHelpOverlay() {
        const overlay = document.getElementById('keyboard-shortcuts-help');
        if (overlay) {
            overlay.style.display = 'flex';
            this.helpVisible = true;
            
            // Focus trap
            const focusableElements = overlay.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }

    hideHelpOverlay() {
        const overlay = document.getElementById('keyboard-shortcuts-help');
        if (overlay) {
            overlay.style.display = 'none';
            this.helpVisible = false;
        }
    }

    // Utility Functions
    logShortcutUsage(shortcut) {
        // Log shortcut usage for analytics
        console.log(`Shortcut used: ${shortcut.key} (${shortcut.name}) in context: ${this.currentContext}`);
        
        // Could send analytics data here
        if (window.electronAPI && window.electronAPI.logShortcutUsage) {
            window.electronAPI.logShortcutUsage({
                key: shortcut.key,
                name: shortcut.name,
                context: this.currentContext,
                timestamp: new Date().toISOString()
            });
        }
    }

    showNotification(message, type = 'info') {
        // Create notification using existing notification system
        if (window.enhancedDetailPage && window.enhancedDetailPage.showToast) {
            window.enhancedDetailPage.showToast(message, type);
        } else if (window.dashboard && window.dashboard.showNotification) {
            window.dashboard.showNotification(message, type);
        } else {
            // Fallback notification
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Public API
    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    addCustomShortcut(key, config) {
        this.addShortcut(key, config);
        this.populateHelpContent();
    }

    removeShortcut(key) {
        this.shortcuts.delete(key);
        this.populateHelpContent();
    }

    getShortcuts(context = null) {
        if (!context) {
            return Array.from(this.shortcuts.values());
        }
        
        return Array.from(this.shortcuts.values()).filter(shortcut =>
            shortcut.contexts.includes(context)
        );
    }

    getCurrentContext() {
        return this.currentContext;
    }

    // Accessibility Support
    announceShortcut(shortcut) {
        // Screen reader announcement
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.textContent = `快捷键已执行: ${shortcut.name}`;
        announcement.style.cssText = `
            position: absolute;
            left: -10000px;
            top: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            if (announcement.parentNode) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }
}

// CSS for keyboard shortcuts help
const keyboardShortcutsCSS = `
.shortcuts-help-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
}

.shortcuts-help-content {
    background: var(--bg-secondary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-2xl);
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.shortcuts-help-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, var(--medical-primary-50), var(--medical-secondary-50));
}

.shortcuts-help-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
}

.shortcuts-help-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
}

.shortcuts-help-close:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}

.shortcuts-help-body {
    padding: 2rem;
    overflow-y: auto;
    flex: 1;
}

.shortcuts-help-section {
    margin-bottom: 2rem;
}

.shortcuts-help-section:last-child {
    margin-bottom: 0;
}

.shortcuts-help-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
}

.shortcuts-list {
    display: grid;
    gap: 0.75rem;
}

.shortcut-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    transition: background 0.2s ease;
}

.shortcut-item:hover {
    background: var(--bg-quaternary);
}

.shortcut-key kbd {
    background: var(--bg-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    font-family: ui-monospace, monospace;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid var(--border-color);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    color: var(--text-primary);
}

.shortcut-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.shortcut-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
}

.shortcut-description {
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.4;
}

.shortcut-contexts {
    font-size: 0.7rem;
    color: var(--text-tertiary);
    font-style: italic;
}

.shortcuts-help-footer {
    padding: 1rem 2rem;
    border-top: 1px solid var(--border-color);
    background: var(--bg-tertiary);
    text-align: center;
}

.shortcuts-help-footer p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.shortcuts-help-footer kbd {
    background: var(--bg-secondary);
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-sm);
    font-family: ui-monospace, monospace;
    font-size: 0.75rem;
    border: 1px solid var(--border-color);
}

.shortcut-feedback {
    animation: shortcutFeedback 1s ease-out;
}

@keyframes shortcutFeedback {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .shortcuts-help-content {
        width: 95%;
        max-height: 85vh;
    }
    
    .shortcuts-help-header {
        padding: 1rem 1.5rem;
    }
    
    .shortcuts-help-body {
        padding: 1.5rem;
    }
    
    .shortcut-item {
        grid-template-columns: 1fr;
        gap: 0.5rem;
        text-align: center;
    }
    
    .shortcut-key {
        justify-self: center;
    }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .shortcuts-help-overlay {
        background: rgba(0, 0, 0, 0.9);
    }
    
    .shortcut-item {
        border: 1px solid var(--border-color);
    }
    
    .shortcut-key kbd {
        border-width: 2px;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .shortcut-feedback {
        animation: none;
    }
    
    .shortcuts-help-overlay,
    .shortcut-item {
        transition: none;
    }
}
`;

// Inject keyboard shortcuts styles
const keyboardStyleSheet = document.createElement('style');
keyboardStyleSheet.textContent = keyboardShortcutsCSS;
document.head.appendChild(keyboardStyleSheet);

// Initialize keyboard shortcuts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.keyboardShortcuts = new KeyboardShortcuts();
    
    // Expose to global scope for debugging
    if (window.location.search.includes('debug=true')) {
        window.ks = window.keyboardShortcuts;
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.keyboardShortcuts) {
        // Cleanup if needed
        console.log('Keyboard shortcuts system cleanup');
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardShortcuts;
}