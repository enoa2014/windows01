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

  // 简单的患者卡片渲染（兼容列表/网格样式）
  function renderPatientCard(row) {
    const card = document.createElement('article');
    // 使用 patient-card 基类以兼容样式切换
    card.className = 'patient-card p-4 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400';
    // 获取患者ID - 兼容两种字段名 (person_id 或 id)
    const patientId = row.person_id != null ? row.person_id : row.id;
    if (patientId != null) {
      card.dataset.personId = patientId;
      card.dataset.id = patientId; // 兼容旧逻辑
      card.setAttribute('data-person-id', String(patientId));
      card.setAttribute('data-id', String(patientId));
    }
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    const latest = row.latest_check_in ? new Date(row.latest_check_in) : null;
    const latestStr = latest && !Number.isNaN(latest.getTime())
      ? `${latest.getFullYear()}-${String(latest.getMonth()+1).padStart(2,'0')}-${String(latest.getDate()).padStart(2,'0')}`
      : '-';
    card.innerHTML = `
      <header class="flex items-center justify-between mb-2">
        <h3 class="text-base font-semibold text-gray-900">${row.name || '-'}</h3>
        <span class="text-xs text-gray-500">最近：${latestStr}</span>
      </header>
      <div class="grid grid-cols-2 gap-3 text-sm text-gray-600">
        <div><span class="text-gray-500">性别：</span>${row.gender || '-'}</div>
        <div><span class="text-gray-500">出生：</span>${row.birth_date || '-'}</div>
        <div class="col-span-2"><span class="text-gray-500">诊断：</span>${row.diagnosis || '-'}</div>
        <div><span class="text-gray-500">籍贯：</span>${row.hometown || '-'}</div>
        <div><span class="text-gray-500">入住次数：</span>${row.check_in_count ?? 0}</div>
      </div>
    `;
    // 根据当前容器模式设置列表样式
    const container = document.getElementById('patientGrid');
    const viewMode = container && container.classList.contains('patient-list-view') ? 'list' : (localStorage.getItem('patients-view-mode') || 'grid');
    if (viewMode === 'list') {
      card.classList.add('list-mode', 'w-full');
    }
    // 点击/键盘进入详情
    const openDetail = () => {
      console.log('🔍 [Patient Card] openDetail 函数被调用');
      console.log('📊 [Patient Card] 卡片数据:', {
        personId: card.dataset.personId,
        id: card.dataset.id,
        patientId: row.person_id || row.id
      });
      
      const id = Number(card.dataset.personId);
      console.log('🔢 [Patient Card] 转换后的ID:', id, '是否有限数字:', Number.isFinite(id));
      
      if (!Number.isFinite(id)) {
        console.error('❌ [Patient Card] ID无效，无法导航');
        return;
      }
      
      console.log('🌐 [Patient Card] 检查window.app对象:', {
        exists: !!window.app,
        type: typeof window.app,
        hasNavigateFunction: window.app && typeof window.app.navigateToPatientDetail === 'function'
      });
      
      if (window.app && typeof window.app.navigateToPatientDetail === 'function') {
        console.log('✅ [Patient Card] 调用navigateToPatientDetail，ID:', id);
        try {
          window.app.navigateToPatientDetail(id);
          console.log('✅ [Patient Card] navigateToPatientDetail调用成功');
        } catch (error) {
          console.error('❌ [Patient Card] navigateToPatientDetail调用失败:', error);
        }
      } else {
        console.log('⏳ [Patient Card] app对象未就绪，使用兜底机制');
        // 兜底：延迟等待 app 初始化
        setTimeout(() => {
          console.log('🔄 [Patient Card] 兜底机制：重试调用navigateToPatientDetail');
          console.log('🌐 [Patient Card] 重试时window.app状态:', {
            exists: !!window.app,
            hasFunction: window.app?.navigateToPatientDetail
          });
          try {
            window.app?.navigateToPatientDetail?.(id);
            console.log('✅ [Patient Card] 兜底调用成功');
          } catch (error) {
            console.error('❌ [Patient Card] 兜底调用失败:', error);
          }
        }, 100);
      }
    };
    // 捕获卡片内部的链接点击，避免 href="#" 导致页面滚动到顶部
    card.addEventListener('click', (e) => {
      const anchor = e.target.closest('a');
      if (anchor) {
        e.preventDefault();
        e.stopPropagation();
        openDetail();
        return;
      }
      // 普通区域点击
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
    if (!window.ResourceTable) return;

    // 标识：启用通用表格以接管患者列表
    window.USE_RESOURCE_TABLE_PATIENTS = true;

    const container = $('patientGrid');
    const gridClasses = ['grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6', 'md:gap-8'];

    function setView(mode) {
      // 直接覆盖容器类，避免残留 grid 类影响
      if (mode === 'list') {
        container.className = 'patient-list-view space-y-4';
        container.querySelectorAll('.patient-card').forEach(el => el.classList.add('list-mode', 'w-full'));
        // 按钮高亮
        $('gridViewBtn')?.classList.remove('bg-white', 'text-gray-700', 'rounded-md', 'shadow-sm');
        $('listViewBtn')?.classList.add('bg-white', 'text-gray-700', 'rounded-md', 'shadow-sm');
      } else {
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8';
        container.querySelectorAll('.patient-card').forEach(el => el.classList.remove('list-mode', 'w-full'));
        // 按钮高亮
        $('listViewBtn')?.classList.remove('bg-white', 'text-gray-700', 'rounded-md', 'shadow-sm');
        $('gridViewBtn')?.classList.add('bg-white', 'text-gray-700', 'rounded-md', 'shadow-sm');
      }
      // 记忆
      localStorage.setItem('patients-view-mode', mode);
    }

    const table = new window.ResourceTable('patients', {
      dom: {
        container,
        resultCountEl: $('resultCount'),
        pagination: {
          section: null, // 该页暂不展示分页控件
          pageSize: 12
        },
        filters: {
          searchInput: $('searchInput'),
          sortSelect: $('sortSelect'),
          genderSelect: $('genderFilter'),
          ageSelect: $('ageFilter')
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
              return ageB - ageA; // 大年龄在前
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

    // 初始化概览（使用扩展统计）
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

    // 绑定视图切换按钮（旧逻辑被跳过时）
    $('gridViewBtn')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setView('grid'); });
    $('listViewBtn')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setView('list'); });

    // 绑定重置按钮
    $('resetBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const si = $('searchInput');
      if (si) si.value = '';
      table.state.filters.search = '';
      table.state.currentPage = 1;
      table.refresh();
    });

    // 应用历史视图模式
    setView(localStorage.getItem('patients-view-mode') || 'list');

    // 兜底：容器委托点击，确保可进入详情
    container.addEventListener('click', (e) => {
      console.log('🎯 [Container Delegate] 容器点击事件被触发');
      const card = e.target.closest('article.patient-card');
      if (!card) {
        console.log('📋 [Container Delegate] 未找到患者卡片元素');
        return;
      }
      console.log('📊 [Container Delegate] 找到卡片，数据:', {
        personId: card.dataset.personId,
        id: card.dataset.id
      });
      
      const id = Number(card.dataset.personId);
      if (!Number.isFinite(id)) {
        console.error('❌ [Container Delegate] ID无效:', card.dataset.personId);
        return;
      }
      
      console.log('🔄 [Container Delegate] 尝试调用navigateToPatientDetail，ID:', id);
      try {
        if (window.app?.navigateToPatientDetail) {
          window.app.navigateToPatientDetail(id);
          console.log('✅ [Container Delegate] 调用成功');
        } else {
          console.error('❌ [Container Delegate] navigateToPatientDetail函数不存在');
        }
      } catch (err) {
        console.error('❌ [Container Delegate] 调用失败:', err);
      }
    });

    // 保持首页默认展示，不自动跳转到列表页
  });
})();
