(function () {
  function $(id) { return document.getElementById(id); }

  function calcAge(birth) {
    if (!birth) return -1;
    const d = new Date(birth);
    if (Number.isNaN(d.getTime())) return -1;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }

  // 获取年龄组标签和颜色
  function getAgeGroup(age) {
    if (age < 0) return { label: '未知', color: 'gray' };
    if (age <= 2) return { label: '婴幼儿', color: 'pink' };
    if (age <= 6) return { label: '学龄前', color: 'blue' };
    if (age <= 12) return { label: '儿童', color: 'green' };
    if (age <= 18) return { label: '青少年', color: 'purple' };
    return { label: '成人', color: 'indigo' };
  }

  // 获取患者状态样式
  function getPatientStatus(row) {
    if (row.emergency) return { label: '紧急', color: 'red', icon: '🚨' };
    if (row.latest_check_in && new Date() - new Date(row.latest_check_in) < 7 * 24 * 60 * 60 * 1000) {
      return { label: '新入住', color: 'blue', icon: '🆕' };
    }
    if (row.check_in_count > 10) return { label: 'VIP', color: 'purple', icon: '⭐' };
    return { label: '在院', color: 'green', icon: '🏥' };
  }

  // 现代化患者卡片渲染（基于儿童活动卡片设计）
  function renderPatientCard(row) {
    console.log('🎨 渲染患者卡片:', row.name || '未知患者');
    
    // 检查当前是否为列表模式
    const container = document.getElementById('modernPatientGrid');
    const isListMode = container && container.classList.contains('patient-list-view');
    
    console.log('🗺️ 当前模式:', isListMode ? '列表模式' : '网格模式');
    
    if (isListMode) {
      return renderPatientCardList(row);
    } else {
      return renderPatientCardGrid(row);
    }
  }
  
  // 网格模式卡片渲染
  function renderPatientCardGrid(row) {
    const card = document.createElement('article');
    const age = calcAge(row.birth_date);
    const ageGroup = getAgeGroup(age);
    const status = getPatientStatus(row);
    const patientId = row.person_id || row.id || row.personId;

    if (patientId != null && patientId !== undefined) {
      card.dataset.personId = String(patientId);
      card.dataset.id = String(patientId);
      card.setAttribute('data-person-id', String(patientId));
      card.setAttribute('data-id', String(patientId));
    }

    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${row.name || '未知患者'} - ${row.diagnosis || '无诊断信息'}`);

    const latest = row.latest_check_in ? new Date(row.latest_check_in) : null;
    const latestStr = latest && !Number.isNaN(latest.getTime())
      ? `${latest.getFullYear()}-${String(latest.getMonth()+1).padStart(2,'0')}-${String(latest.getDate()).padStart(2,'0')}`
      : '无记录';

    // 使用类似children-activity-cards的现代化样式
    card.className = `
      group relative flex h-80 w-full max-w-sm select-none flex-col justify-between rounded-3xl 
      border border-white/20 bg-white/10 backdrop-blur-xl p-6 transition-all duration-700 ease-out 
      hover:border-white/30 hover:bg-white/20 hover:shadow-2xl hover:shadow-teal-500/20 
      hover:scale-[1.02] hover:-translate-y-3 cursor-pointer patient-card-modern
      before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br 
      before:from-teal-500/20 before:via-emerald-500/10 before:to-cyan-500/20 
      before:opacity-0 before:transition-opacity before:duration-700 hover:before:opacity-100
    `;

    // 根据患者状态设置不同的渐变色
    let gradientClass = 'from-teal-500/20 via-emerald-500/10 to-cyan-500/20';
    if (status.color === 'red') gradientClass = 'from-red-500/20 via-pink-500/10 to-rose-500/20';
    else if (status.color === 'purple') gradientClass = 'from-purple-500/20 via-violet-500/10 to-indigo-500/20';
    else if (status.color === 'blue') gradientClass = 'from-blue-500/20 via-sky-500/10 to-cyan-500/20';

    card.innerHTML = `
      <!-- 动画背景粒子 -->
      <div class="absolute inset-0 overflow-hidden rounded-3xl">
        <div class="sparkle-1 absolute animate-ping opacity-60" style="left: 20%; top: 15%; animation-delay: 0s; animation-duration: 3s;">
          <div class="size-2 rounded-full bg-gradient-to-r from-teal-300 to-emerald-300"></div>
        </div>
        <div class="sparkle-2 absolute animate-ping opacity-60" style="left: 80%; top: 25%; animation-delay: 1s; animation-duration: 3s;">
          <div class="size-2 rounded-full bg-gradient-to-r from-cyan-300 to-teal-300"></div>
        </div>
        <div class="sparkle-3 absolute animate-ping opacity-60" style="left: 60%; top: 70%; animation-delay: 2s; animation-duration: 3s;">
          <div class="size-2 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300"></div>
        </div>
      </div>

      <!-- 渐变光晕效果 -->
      <div class="absolute -top-10 -right-10 size-32 rounded-full bg-gradient-to-br from-teal-400/30 to-emerald-400/30 blur-2xl transition-all duration-1000 group-hover:scale-150 group-hover:opacity-60"></div>
      
      <!-- 头部区域 -->
      <div class="relative z-20 flex items-start justify-between mb-4">
        <div class="flex items-center gap-4">
          <!-- 患者头像/图标 -->
          <div class="relative">
            <span class="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-xl text-white font-bold text-lg">
              ${(row.name || '?').charAt(0).toUpperCase()}
            </span>
            <!-- 脉冲环效果 -->
            <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 opacity-0 transition-all duration-700 group-hover:opacity-30 group-hover:scale-125 group-hover:animate-pulse"></div>
          </div>
          
          <div class="flex-1">
            <h3 class="text-xl font-bold leading-tight mb-1 transition-colors duration-300 text-gray-800 dark:text-white">
              ${row.name || '未知患者'}
            </h3>
            
            <!-- 年龄和性别信息 -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1">
                <span class="text-sm font-semibold text-gray-600 dark:text-gray-300">${age >= 0 ? age + '岁' : '年龄未知'}</span>
                ${row.gender ? `<span class="text-xs text-gray-500">·</span><span class="text-sm text-gray-600 dark:text-gray-300">${row.gender}</span>` : ''}
              </div>
              <span class="text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r shadow-sm bg-${ageGroup.color}-100 text-${ageGroup.color}-700 dark:bg-${ageGroup.color}-900 dark:text-${ageGroup.color}-300">
                ${ageGroup.label}
              </span>
            </div>
          </div>
        </div>

        <!-- 状态徽章 -->
        <div class="text-right">
          <div class="rounded-2xl bg-gradient-to-r from-${status.color === 'green' ? 'emerald' : status.color}-400 to-${status.color === 'green' ? 'teal' : status.color}-500 px-3 py-2 shadow-lg">
            <span class="text-xs font-bold text-white">${status.icon} ${status.label}</span>
          </div>
        </div>
      </div>

      <!-- 诊断信息 -->
      <div class="relative z-20 flex-1 mb-4">
        <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-200 line-clamp-2 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors duration-300">
          <span class="font-medium text-teal-600 dark:text-teal-400">诊断：</span>${row.diagnosis || '暂无诊断信息'}
        </p>
      </div>

      <!-- 标签区域 -->
      <div class="relative z-20 flex flex-wrap gap-2 mb-4">
        ${row.hometown ? `
        <span class="rounded-xl bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md dark:from-gray-800/80 dark:to-gray-700/80 dark:text-gray-200">
          📍 ${row.hometown}
        </span>
        ` : ''}
        ${row.check_in_count > 0 ? `
        <span class="rounded-xl bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md dark:from-gray-800/80 dark:to-gray-700/80 dark:text-gray-200">
          🏥 ${row.check_in_count}次入住
        </span>
        ` : ''}
        ${row.birth_date ? `
        <span class="rounded-xl bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md dark:from-gray-800/80 dark:to-gray-700/80 dark:text-gray-200">
          🎂 ${row.birth_date}
        </span>
        ` : ''}
      </div>

      <!-- 底部信息 -->
      <div class="relative z-20 flex items-center justify-between">
        <div class="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
          <div class="flex items-center gap-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg px-2 py-1 backdrop-blur-sm">
            <div class="size-3.5 flex items-center justify-center">🕒</div>
            <span class="font-medium">最近：${latestStr}</span>
          </div>
        </div>
        
        <!-- 增强的操作按钮 -->
        <button 
          class="patient-action-btn group/btn relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
          aria-label="查看 ${row.name || '患者'} 详情"
        >
          <!-- 按钮光泽效果 -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-1000 group-hover/btn:translate-x-full"></div>
          <span class="relative flex items-center gap-2">
            <div class="size-4 flex items-center justify-center">👀</div>
            查看详情
          </span>
        </button>
      </div>

      <!-- 增强的悬停光晕 -->
      <div class="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-cyan-500/10 opacity-0 transition-all duration-700 group-hover:opacity-100"></div>
      
      <!-- 边框光晕效果 -->
      <div class="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-400 via-emerald-400 to-cyan-400 opacity-0 blur-sm transition-all duration-700 group-hover:opacity-20 -z-10"></div>
    `;


    // 点击/键盘进入详情
    const openDetail = () => {
      const id = Number(card.dataset.personId);
      
      if (!Number.isFinite(id)) {
        return;
      }
      
      if (window.app && typeof window.app.navigateToPatientDetail === 'function') {
        try {
          window.app.navigateToPatientDetail(id);
        } catch (error) {
          console.error('Navigation failed:', error);
        }
      } else {
        // 兜底：延迟等待 app 初始化
        setTimeout(() => {
          try {
            window.app?.navigateToPatientDetail?.(id);
          } catch (error) {
            console.error('Fallback navigation failed:', error);
          }
        }, 100);
      }
    };

    // 事件监听
    card.addEventListener('click', (e) => {
      const button = e.target.closest('button.patient-action-btn');
      if (button) {
        e.preventDefault();
        e.stopPropagation();
        openDetail();
        return;
      }
      openDetail();
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetail();
      }
    });

    return card;
  }

  // 列表模式卡片渲染 - 完全独立的实现
  function renderPatientCardList(row) {
    console.log('🔄 生成列表模式卡片:', row.name);
    
    const card = document.createElement('div');
    const age = calcAge(row.birth_date);
    const ageGroup = getAgeGroup(age);
    const status = getPatientStatus(row);
    const patientId = row.person_id || row.id || row.personId;

    if (patientId != null && patientId !== undefined) {
      card.dataset.personId = String(patientId);
      card.dataset.id = String(patientId);
      card.setAttribute('data-person-id', String(patientId));
      card.setAttribute('data-id', String(patientId));
    }

    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${row.name || '未知患者'} - ${row.diagnosis || '无诊断信息'}`);

    const latest = row.latest_check_in ? new Date(row.latest_check_in) : null;
    const latestStr = latest && !Number.isNaN(latest.getTime())
      ? `${latest.getFullYear()}-${String(latest.getMonth()+1).padStart(2,'0')}-${String(latest.getDate()).padStart(2,'0')}`
      : '无记录';

    // 使用强制的内联样式确保列表显示
    card.style.cssText = `
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      width: 100% !important;
      height: auto !important;
      min-height: 5rem !important;
      max-height: 6rem !important;
      padding: 1rem 1.5rem !important;
      margin-bottom: 0.75rem !important;
      border-radius: 1rem !important;
      background: rgba(255, 255, 255, 0.8) !important;
      backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      gap: 1rem !important;
      position: relative !important;
      overflow: hidden !important;
    `;
    
    card.className = 'patient-card-modern patient-card-list';

    card.innerHTML = `
      <!-- 患者头像 -->
      <div style="width: 3rem; height: 3rem; border-radius: 0.75rem; background: linear-gradient(135deg, #14b8a6, #10b981); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);">
        <span style="color: white; font-weight: 700; font-size: 1rem;">${(row.name || '?').charAt(0).toUpperCase()}</span>
      </div>
      
      <!-- 患者信息 -->
      <div style="flex: 0 0 auto; width: 8rem; margin-right: 1rem;">
        <div style="font-size: 0.875rem; font-weight: 700; color: #111827; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${row.name || '未知患者'}</div>
        <div style="font-size: 0.75rem; color: #6b7280; display: flex; align-items: center; gap: 0.25rem;">
          <span style="white-space: nowrap;">${age >= 0 ? age + '岁' : '年龄未知'}</span>
          ${row.gender ? `<span>·</span><span style="white-space: nowrap;">${row.gender}</span>` : ''}
          <span style="background: ${ageGroup.color === 'pink' ? '#fef3f2' : ageGroup.color === 'blue' ? '#eff6ff' : ageGroup.color === 'green' ? '#f0fdf4' : '#faf5ff'}; color: ${ageGroup.color === 'pink' ? '#dc2626' : ageGroup.color === 'blue' ? '#2563eb' : ageGroup.color === 'green' ? '#16a34a' : '#7c3aed'}; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; white-space: nowrap;">${ageGroup.label}</span>
        </div>
      </div>
      
      <!-- 诊断信息 -->
      <div style="flex: 1; min-width: 0; margin-right: 1rem;">
        <div style="font-size: 0.75rem; color: #374151; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.25rem;">${row.diagnosis || '暂无诊断信息'}</div>
        <div style="display: flex; gap: 0.5rem;">
          ${row.hometown ? `<span style="font-size: 0.625rem; padding: 0.125rem 0.375rem; border-radius: 0.25rem; background: #f3f4f6; color: #6b7280; white-space: nowrap;">📍 ${row.hometown}</span>` : ''}
          ${row.check_in_count > 0 ? `<span style="font-size: 0.625rem; padding: 0.125rem 0.375rem; border-radius: 0.25rem; background: #f3f4f6; color: #6b7280; white-space: nowrap;">🏥 ${row.check_in_count}次</span>` : ''}
        </div>
      </div>
      
      <!-- 状态 -->
      <div style="flex: 0 0 auto; width: 2rem; height: 2rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; color: white; margin-right: 1rem; background: ${status.color === 'red' ? 'linear-gradient(135deg, #ef4444, #f87171)' : status.color === 'blue' ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : status.color === 'purple' ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)' : 'linear-gradient(135deg, #10b981, #34d399)'};">
        ${status.icon}
      </div>
      
      <!-- 时间 -->
      <div style="flex: 0 0 auto; width: 4rem; text-align: center; margin-right: 1rem;">
        <div style="font-size: 0.625rem; color: #6b7280; margin-bottom: 0.125rem;">最近</div>
        <div style="font-size: 0.75rem; font-weight: 600; color: #374151;">${latestStr.includes('-') ? latestStr.split('-')[1] + '-' + latestStr.split('-')[2] : latestStr}</div>
      </div>
      
      <!-- 操作按钮 -->
      <button class="patient-action-btn-list" style="flex: 0 0 auto; padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 700; border: none; border-radius: 0.5rem; background: linear-gradient(135deg, #14b8a6, #10b981); color: white; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(20, 184, 166, 0.2);" aria-label="查看 ${row.name || '患者'} 详情">
        👁️ 查看
      </button>
    `;

    // 点击/键盘进入详情
    const openDetail = () => {
      const id = Number(card.dataset.personId);
      
      if (!Number.isFinite(id)) {
        return;
      }
      
      if (window.app && typeof window.app.navigateToPatientDetail === 'function') {
        try {
          window.app.navigateToPatientDetail(id);
        } catch (error) {
          console.error('Navigation failed:', error);
        }
      } else {
        // 兜底：延迟等待 app 初始化
        setTimeout(() => {
          try {
            window.app?.navigateToPatientDetail?.(id);
          } catch (error) {
            console.error('Fallback navigation failed:', error);
          }
        }, 100);
      }
    };

    // 事件监听 - 适配列表模式按钮
    card.addEventListener('click', (e) => {
      const button = e.target.closest('button.patient-action-btn-list') || e.target.closest('button.patient-action-btn');
      if (button) {
        e.preventDefault();
        e.stopPropagation();
        openDetail();
        return;
      }
      openDetail();
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetail();
      }
    });

    return card;
  }


  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 现代化卡片系统初始化开始...');
    
    if (!window.ResourceTable) {
      console.error('❌ ResourceTable 不存在');
      return;
    }
    console.log('✅ ResourceTable 已加载');

    // 标识：启用现代化患者卡片
    window.USE_MODERN_PATIENT_CARDS = true;
    console.log('✅ 现代化卡片模式已启用');

    const container = $('modernPatientGrid');
    console.log('📋 容器元素:', container);
    
    // 添加背景渐变
    if (container) {
      container.style.background = `
        linear-gradient(135deg, 
          rgb(240, 253, 250) 0%, 
          rgb(254, 249, 195) 25%, 
          rgb(240, 249, 255) 50%, 
          rgb(245, 251, 255) 75%, 
          rgb(247, 254, 231) 100%
        )
      `;
      container.style.minHeight = '100vh';
      container.style.position = 'relative';
      container.style.padding = '2rem';
      
      // 添加动态背景元素
      const bgElements = document.createElement('div');
      bgElements.className = 'absolute inset-0 overflow-hidden pointer-events-none';
      bgElements.innerHTML = `
        ${Array.from({ length: 20 }, (_, i) => `
          <div class="absolute rounded-full bg-gradient-to-r from-teal-300/20 to-emerald-300/20 animate-pulse" 
               style="
                 left: ${Math.random() * 100}%; 
                 top: ${Math.random() * 100}%; 
                 width: ${Math.random() * 60 + 20}px; 
                 height: ${Math.random() * 60 + 20}px; 
                 animation-delay: ${Math.random() * 5}s; 
                 animation-duration: ${Math.random() * 3 + 2}s;
               ">
          </div>
        `).join('')}
      `;
      container.appendChild(bgElements);
    }

    function setView(mode) {
      console.log('📱 切换视图模式:', mode);
      console.log('🔍 切换前容器类名:', container.className);
      
      if (mode === 'list') {
        // 列表视图样式 - 添加专用的列表样式类
        container.className = 'patient-list-view flex flex-col gap-3 relative patient-cards-container';
        console.log('🔄 设置列表模式，新类名:', container.className);
        console.log('🔎 验证是否包含 patient-list-view:', container.classList.contains('patient-list-view'));
        
        // 按钮高亮
        $('modernGridViewBtn')?.classList.remove('bg-white', 'text-gray-700', 'rounded-md', 'shadow-sm');
        $('modernListViewBtn')?.classList.add('bg-white', 'text-gray-700', 'rounded-md', 'shadow-sm');
        
      } else {
        // 网格视图样式 - 移除列表样式类
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative patient-cards-container';
        console.log('🔄 设置网格模式，新类名:', container.className);
        
        // 按钮高亮
        $('modernListViewBtn')?.classList.remove('bg-white', 'text-gray-700', 'rounded-md', 'shadow-sm');
        $('modernGridViewBtn')?.classList.add('bg-white', 'text-gray-700', 'rounded-md', 'shadow-sm');
      }
      
      // 立即强制刷新
      setTimeout(() => {
        console.log('⏰ 延迟重新渲染开始...');
        console.log('🔍 当前容器类名:', container.className);
        console.log('🔎 是否为列表模式:', container.classList.contains('patient-list-view'));
        
        // 重新渲染所有卡片以应用新模式
        const cards = container.querySelectorAll('.patient-card-modern');
        console.log('📋 找到卡片数量:', cards.length);
        
        cards.forEach((card, index) => {
          // 获取卡片数据
          const patientId = card.dataset.personId;
          console.log(`🎯 处理卡片 ${index + 1}, ID:`, patientId);
          
          // 从应用数据源获取患者数据
          const patientData = window.app?.patients?.find(p => String(p.person_id) === patientId);
          
          if (patientData) {
            console.log(`🔄 重新渲染患者: ${patientData.name}`);
            // 根据新的视图模式重新渲染卡片
            const newCard = renderPatientCard(patientData);
            if (newCard) {
              card.replaceWith(newCard);
              console.log(`✅ 卡片 ${index + 1} 重新渲染完成`);
            } else {
              console.log(`❌ 卡片 ${index + 1} 重新渲染失败`);
            }
          } else {
            console.log(`❌ 找不到患者数据，ID: ${patientId}`);
          }
        });
      }, 10); // 很短的延迟确保DOM更新完成
      
      // 记忆视图模式
      localStorage.setItem('patients-view-mode', mode);
      console.log('✅ 视图模式切换完成:', mode);
    }

    const table = new window.ResourceTable('patients', {
      dom: {
        container,
        resultCountEl: $('modernResultCount'),
        pagination: {
          section: null,
          pageSize: 12
        },
        filters: {
          searchInput: $('modernSearchInput'),
          sortSelect: $('modernSortSelect'),
          genderSelect: $('modernGenderFilter'),
          ageSelect: $('modernAgeFilter')
        },
        clientFilter: (row, filters) => {
          const kw = (filters.search || '').trim().toLowerCase();
          const inStr = (v) => (v == null ? '' : String(v)).toLowerCase();
          // 关键词
          if (kw) {
            const matchKw = inStr(row.name).includes(kw) || inStr(row.hometown).includes(kw) || inStr(row.diagnosis).includes(kw);
            if (!matchKw) return false;
          }
          // 性别筛选
          if (filters.gender && row.gender !== filters.gender) return false;
          // 年龄段筛选
          if (filters.age) {
            const age = calcAge(row.birth_date);
            const [minStr, maxStr] = String(filters.age).split('-');
            const min = Number(minStr);
            const max = Number(maxStr);
            if (age === -1) return false;
            if (!Number.isNaN(min) && age < min) return false;
            if (!Number.isNaN(max) && age > max) return false;
          }
          return true;
        },
        clientSort: (a, b, filters) => {
          const sort = filters.sort || 'recent';
          switch (sort) {
            case 'name':
              return String(a.name || '').localeCompare(String(b.name || ''), 'zh');
            case 'age': {
              const ageA = calcAge(a.birth_date);
              const ageB = calcAge(b.birth_date);
              if (ageA === -1 && ageB === -1) return 0;
              if (ageA === -1) return 1;
              if (ageB === -1) return -1;
              return ageB - ageA;
            }
            case 'visits':
              return (b.check_in_count || 0) - (a.check_in_count || 0);
            case 'recent':
            default:
              return new Date(b.latest_check_in || '1900-01-01') - new Date(a.latest_check_in || '1900-01-01');
          }
        },
        renderItem: renderPatientCard
      }
    });

    // 初始化概览
    try {
      const stats = await window.electronAPI.getExtendedStatistics();
      if (stats) {
        const totalPatients = document.getElementById('totalPatients');
        const totalRecords = document.getElementById('totalRecords');
        if (totalPatients) totalPatients.textContent = stats.totalPatients ?? 0;
        if (totalRecords) totalRecords.textContent = stats.totalRecords ?? 0;
      }
    } catch (e) { /* 忽略概览失败 */ }

    await table.init();
    console.log('✅ ResourceTable 初始化完成');

    // 绑定视图切换按钮
    $('modernGridViewBtn')?.addEventListener('click', (e) => { 
      e.preventDefault(); 
      e.stopPropagation(); 
      setView('grid'); 
    });
    $('modernListViewBtn')?.addEventListener('click', (e) => { 
      e.preventDefault(); 
      e.stopPropagation(); 
      setView('list'); 
    });

    // 绑定重置按钮
    $('modernResetBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const si = $('modernSearchInput');
      if (si) si.value = '';
      table.state.filters.search = '';
      table.state.currentPage = 1;
      table.refresh();
    });

    // 应用历史视图模式
    setView(localStorage.getItem('patients-view-mode') || 'grid');

    // 容器委托点击
    container.addEventListener('click', (e) => {
      const card = e.target.closest('article.patient-card-modern');
      if (!card) return;
      
      const id = card.dataset.personId || card.dataset.id || 
                 card.getAttribute('data-person-id') || 
                 card.getAttribute('data-id');
                 
      if (!id || id === 'undefined' || id === 'null') return;
      
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) return;
      
      try {
        if (window.app?.navigateToPatientDetail) {
          window.app.navigateToPatientDetail(numericId);
        }
      } catch (err) {
        console.error('Container delegate navigation failed:', err);
      }
    });

    // 添加页面标题
    const pageTitle = document.querySelector('h1, .page-title');
    if (pageTitle) {
      pageTitle.innerHTML = `
        <div class="inline-flex items-center gap-3 mb-6">
          <div class="relative">
            <div class="size-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md text-white text-2xl animate-pulse">
              🏥
            </div>
            <div class="absolute inset-0 rounded-xl bg-teal-400 blur-xl opacity-30 animate-pulse"></div>
          </div>
          <h1 class="text-5xl sm:text-6xl font-black bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
            患儿入住信息管理
          </h1>
          <div class="relative">
            <div class="size-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md text-white text-2xl animate-bounce">
              ✨
            </div>
            <div class="absolute inset-0 rounded-xl bg-emerald-400 blur-xl opacity-30 animate-bounce"></div>
          </div>
        </div>
      `;
    }
  });
})();