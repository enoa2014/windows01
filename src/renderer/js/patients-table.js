(function () {
  function $(id) { return document.getElementById(id); }

  // 简单的患者卡片渲染
  function renderPatientCard(row) {
    const card = document.createElement('article');
    card.className = 'card p-4 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400';
    if (row.person_id != null) card.dataset.personId = row.person_id;
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
    // 点击/键盘进入详情
    const openDetail = () => {
      const id = Number(card.dataset.personId);
      if (!Number.isFinite(id)) return;
      if (window.app && typeof window.app.showPatientDetail === 'function') {
        window.app.showPatientDetail(id);
      } else {
        // 兜底：延迟等待 app 初始化
        setTimeout(() => window.app?.showPatientDetail?.(id), 0);
      }
    };
    card.addEventListener('click', openDetail);
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

    const table = new window.ResourceTable('patients', {
      dom: {
        container: $('patientGrid'),
        resultCountEl: $('resultCount'),
        pagination: {
          section: null, // 该页暂不展示分页控件
          pageSize: 12
        },
        filters: {
          searchInput: $('searchInput')
        },
        clientFilter: (row, filters) => {
          const kw = (filters.search || '').trim().toLowerCase();
          if (!kw) return true;
          const inStr = (v) => (v == null ? '' : String(v)).toLowerCase();
          return inStr(row.name).includes(kw)
            || inStr(row.hometown).includes(kw)
            || inStr(row.diagnosis).includes(kw);
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
  });
})();
