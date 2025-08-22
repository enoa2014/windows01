/**
 * ===================== 响应式布局管理 v2.0 =====================
 * 基于UI优化工作流程 - 阶段1：实施响应式布局适配
 */

class ResponsiveLayout {
  constructor() {
    this.isTouch = 'ontouchstart' in window;
    this.isMobile = window.innerWidth <= 640;
    this.isTablet = window.innerWidth > 640 && window.innerWidth <= 1024;
    this.isDesktop = window.innerWidth > 1024;
    
    this.sidebarCollapsed = this.loadSidebarState();
    this.mobileMenuOpen = false;
    
    this.breakpoints = {
      mobile: 640,
      tablet: 1024,
      desktop: 1200,
      wide: 1440
    };

    this.init();
  }

  init() {
    this.createResponsiveElements();
    this.bindEvents();
    this.setupSidebar();
    this.handleResize();
  }

  createResponsiveElements() {
    // 创建移动端头部
    if (this.isMobile && !document.querySelector('.mobile-header')) {
      const header = document.createElement('div');
      header.className = 'mobile-header';
      header.innerHTML = `
        <button class="mobile-menu-btn" id="mobileMenuBtn">
          <span data-icon="menu" data-icon-size="base"></span>
        </button>
        <h1 class="text-lg font-semibold text-[var(--text-primary)]">患儿管理系统</h1>
        <div class="mobile-actions">
          <button class="icon-button" id="mobileThemeBtn">
            <span data-icon="sun" data-icon-size="base"></span>
          </button>
        </div>
      `;
      
      document.body.insertBefore(header, document.body.firstChild);
    }

    // 创建侧边栏遮罩
    if (this.isMobile && !document.querySelector('.sidebar-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.id = 'sidebarOverlay';
      document.body.appendChild(overlay);
    }

    // 创建侧边栏切换按钮
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && !this.isMobile && !sidebar.querySelector('.sidebar-toggle')) {
      const toggle = document.createElement('button');
      toggle.className = 'sidebar-toggle';
      toggle.id = 'sidebarToggle';
      toggle.innerHTML = `<span data-icon="chevron-left" data-icon-size="sm"></span>`;
      
      const sidebarContainer = sidebar.closest('.sidebar-container') || sidebar.parentElement;
      if (sidebarContainer) {
        sidebarContainer.style.position = 'relative';
        sidebarContainer.appendChild(toggle);
      }
    }

    // 更新图标
    if (window.IconLibrary) {
      window.IconLibrary.replaceIcons();
    }
  }

  bindEvents() {
    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // 侧边栏切换按钮
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }

    // 移动端菜单按钮
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    // 移动端遮罩点击
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    }

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileMenuOpen) {
        this.closeMobileMenu();
      }
      
      // Ctrl+B 切换侧边栏
      if (e.ctrlKey && e.key === 'b' && !this.isMobile) {
        e.preventDefault();
        this.toggleSidebar();
      }
    });

    // 触摸手势支持
    if (this.isTouch) {
      this.setupTouchGestures();
    }

    // 方向改变
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleOrientationChange(), 100);
    });
  }

  setupSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarContainer = document.querySelector('.sidebar-container');
    
    if (!sidebar) return;

    // 应用保存的侧边栏状态
    if (!this.isMobile && this.sidebarCollapsed) {
      sidebar.classList.add('collapsed');
    }

    // 移动端特殊处理
    if (this.isMobile && sidebarContainer) {
      sidebarContainer.classList.add('mobile-sidebar');
    }
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.toggleMobileMenu();
      return;
    }

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    this.sidebarCollapsed = !this.sidebarCollapsed;
    
    if (this.sidebarCollapsed) {
      sidebar.classList.add('collapsed');
    } else {
      sidebar.classList.remove('collapsed');
    }

    this.saveSidebarState();
    this.adjustMainContent();
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('sidebarToggle', {
      detail: { collapsed: this.sidebarCollapsed }
    }));
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    
    const sidebarContainer = document.querySelector('.sidebar-container');
    const overlay = document.querySelector('.sidebar-overlay');
    const menuBtn = document.getElementById('mobileMenuBtn');

    if (this.mobileMenuOpen) {
      if (sidebarContainer) sidebarContainer.classList.add('open');
      if (overlay) overlay.classList.add('show');
      if (menuBtn) menuBtn.classList.add('js-mobile-menu-open');
      document.body.style.overflow = 'hidden';
    } else {
      if (sidebarContainer) sidebarContainer.classList.remove('open');
      if (overlay) overlay.classList.remove('show');
      if (menuBtn) menuBtn.classList.remove('js-mobile-menu-open');
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu() {
    if (this.mobileMenuOpen) {
      this.toggleMobileMenu();
    }
  }

  adjustMainContent() {
    const mainContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');
    
    if (!mainContent || !sidebar || this.isMobile) return;

    const sidebarWidth = this.sidebarCollapsed ? 80 : (this.isTablet ? 240 : 280);
    mainContent.style.marginLeft = `${sidebarWidth}px`;
  }

  handleResize() {
    const oldIsMobile = this.isMobile;
    const oldIsTablet = this.isTablet;
    
    this.isMobile = window.innerWidth <= this.breakpoints.mobile;
    this.isTablet = window.innerWidth > this.breakpoints.mobile && 
                   window.innerWidth <= this.breakpoints.tablet;
    this.isDesktop = window.innerWidth > this.breakpoints.tablet;

    // 设备类型改变时重新初始化
    if (oldIsMobile !== this.isMobile || oldIsTablet !== this.isTablet) {
      this.handleDeviceChange();
    }

    this.updateViewport();
    this.adjustGridColumns();
    this.updateSearchLayout();
  }

  handleDeviceChange() {
    // 移动端 → 桌面端
    if (!this.isMobile && document.querySelector('.mobile-header')) {
      this.closeMobileMenu();
      this.removeMobileElements();
      this.createDesktopElements();
    }
    
    // 桌面端 → 移动端
    if (this.isMobile && !document.querySelector('.mobile-header')) {
      this.createResponsiveElements();
    }

    this.adjustMainContent();
  }

  removeMobileElements() {
    const elements = ['.mobile-header', '.sidebar-overlay'];
    elements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) element.remove();
    });
  }

  createDesktopElements() {
    // 重新创建桌面端侧边栏切换按钮
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && !sidebar.querySelector('.sidebar-toggle')) {
      const toggle = document.createElement('button');
      toggle.className = 'sidebar-toggle';
      toggle.id = 'sidebarToggle';
      toggle.innerHTML = `<span data-icon="chevron-left" data-icon-size="sm"></span>`;
      
      const sidebarContainer = sidebar.closest('.sidebar-container') || sidebar.parentElement;
      if (sidebarContainer) {
        sidebarContainer.appendChild(toggle);
        
        // 重新绑定事件
        toggle.addEventListener('click', () => {
          this.toggleSidebar();
        });
      }
    }
  }

  updateViewport() {
    // 更新视口相关的CSS变量
    document.documentElement.style.setProperty('--viewport-width', `${window.innerWidth}px`);
    document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
  }

  adjustGridColumns() {
    const patientGrid = document.querySelector('.patient-grid');
    if (!patientGrid) return;

    let columns;
    const viewportWidth = window.innerWidth;

    if (viewportWidth <= this.breakpoints.mobile) {
      columns = '1fr';
    } else if (viewportWidth <= this.breakpoints.tablet) {
      columns = 'repeat(auto-fill, minmax(300px, 1fr))';
    } else if (viewportWidth <= this.breakpoints.desktop) {
      columns = 'repeat(auto-fill, minmax(350px, 1fr))';
    } else if (viewportWidth <= this.breakpoints.wide) {
      columns = 'repeat(auto-fill, minmax(380px, 1fr))';
    } else {
      columns = 'repeat(auto-fill, minmax(420px, 1fr))';
    }

    patientGrid.style.gridTemplateColumns = columns;
  }

  updateSearchLayout() {
    const filtersContainer = document.querySelector('.filters-container');
    if (!filtersContainer) return;

    if (this.isMobile) {
      filtersContainer.style.gridTemplateColumns = '1fr';
    } else if (this.isTablet) {
      filtersContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
      filtersContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    }
  }

  handleOrientationChange() {
    // 处理设备方向改变
    this.handleResize();
    
    // 重新计算布局
    setTimeout(() => {
      this.adjustMainContent();
      this.updateViewport();
    }, 300);
  }

  setupTouchGestures() {
    let startX = 0;
    let startY = 0;
    let isSwipeGesture = false;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwipeGesture = false;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!this.isMobile || e.touches.length > 1) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      // 检测水平滑动
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
        isSwipeGesture = true;
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!this.isMobile || !isSwipeGesture) return;

      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;

      // 从左边缘向右滑动打开菜单
      if (startX < 20 && deltaX > 100 && !this.mobileMenuOpen) {
        this.toggleMobileMenu();
      }
      
      // 从右向左滑动关闭菜单
      if (deltaX < -100 && this.mobileMenuOpen) {
        this.closeMobileMenu();
      }
    }, { passive: true });
  }

  /**
   * 状态管理
   */
  saveSidebarState() {
    try {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(this.sidebarCollapsed));
    } catch (error) {
      console.warn('无法保存侧边栏状态:', error);
    }
  }

  loadSidebarState() {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.warn('无法加载侧边栏状态:', error);
      return false;
    }
  }

  /**
   * 公共方法
   */
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    
    if (width <= this.breakpoints.mobile) return 'mobile';
    if (width <= this.breakpoints.tablet) return 'tablet';
    if (width <= this.breakpoints.desktop) return 'desktop';
    if (width <= this.breakpoints.wide) return 'wide';
    return 'ultrawide';
  }

  isMobileDevice() {
    return this.isMobile;
  }

  isTabletDevice() {
    return this.isTablet;
  }

  isDesktopDevice() {
    return this.isDesktop;
  }

  isSidebarCollapsed() {
    return this.sidebarCollapsed;
  }

  isMobileMenuOpen() {
    return this.mobileMenuOpen;
  }

  /**
   * 强制重新布局
   */
  forceLayout() {
    this.handleResize();
    this.adjustMainContent();
    this.updateViewport();
  }

  /**
   * 销毁实例
   */
  destroy() {
    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    
    // 清理移动端元素
    this.removeMobileElements();
    
    // 重置状态
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }
}

// 创建全局实例
window.ResponsiveLayout = ResponsiveLayout;

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', () => {
  window.responsiveLayout = new ResponsiveLayout();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveLayout;
}