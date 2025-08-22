(function () {
  function $(id) { return document.getElementById(id); }

  document.addEventListener('DOMContentLoaded', async () => {
    const table = new window.ResourceTable('familyServices', {
      dom: {
        container: $('serviceRecordGrid'),
        resultCountEl: $('resultCount'),
        pagination: {
          section: $('paginationSection'),
          prevBtn: $('prevPageBtn'),
          nextBtn: $('nextPageBtn'),
          infoEl: $('pageInfo'),
          pageSize: 12
        },
        filters: {
          searchInput: $('searchInput'),
          yearSelect: $('yearFilter'),
          monthSelect: $('monthFilter'),
          sortSelect: $('sortSelect')
        },
        overview: {
          totalRecords: $('totalRecords'),
          totalFamilies: $('totalFamilies'),
          totalServices: $('totalServices'),
          avgDays: $('avgDays')
        },
        renderItem: (row) => {
          const card = document.createElement('article');
          card.className = 'service-record-card grid-mode p-4';
          const ym = new Date(row.year_month || row.yearMonth);
          const ymStr = Number.isNaN(ym.getTime()) ? (row.year_month || '-') : `${ym.getFullYear()}-${String(ym.getMonth() + 1).padStart(2,'0')}`;
          card.innerHTML = `
            <div class="card-header flex items-center gap-3">
              <div class="time-badge"><div class="text-sm font-semibold">${ymStr}</div></div>
              <div>
                <div class="text-sm text-gray-600">服务总人次：<span class="font-semibold text-[var(--brand-primary)]">${row.total_service_count ?? 0}</span></div>
                <div class="text-xs text-gray-400">创建：${row.created_at ?? '-'}</div>
              </div>
            </div>
            <div class="card-content grid grid-cols-2 gap-3 mt-3">
              <div class="stat-item"><div class="stat-value">${row.family_count ?? 0}</div><div class="stat-label">家庭数</div></div>
              <div class="stat-item"><div class="stat-value">${row.residents_count ?? 0}</div><div class="stat-label">入住人次</div></div>
              <div class="stat-item"><div class="stat-value">${row.residence_days ?? 0}</div><div class="stat-label">入住天数</div></div>
              <div class="stat-item"><div class="stat-value">${row.accommodation_count ?? 0}</div><div class="stat-label">住宿人次</div></div>
            </div>`;
          return card;
        }
      }
    });

    // 导出按钮
    const exportBtn = $('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        try {
          const filters = table.state.filters;
          const result = await window.electronAPI.familyService.exportExcel(filters);
          if (result?.success) {
            showToast('导出成功');
          } else {
            showToast(result?.error || '导出失败', true);
          }
        } catch (e) {
          showToast('导出失败', true);
        }
      });
    }

    // 重置按钮
    const resetBtn = $('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if ($('searchInput')) $('searchInput').value = '';
        if ($('yearFilter')) $('yearFilter').value = '';
        if ($('monthFilter')) $('monthFilter').value = '';
        if ($('sortSelect')) $('sortSelect').value = 'date-desc';
        table.state.filters = { search: '', sort: 'date-desc' };
        table.state.currentPage = 1;
        table.refresh();
      });
    }

    // 返回按钮（回到主页 index.html）
    const backBtn = $('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    function showToast(text, isError) {
      const c = $('toastContainer');
      if (!c) return alert(text);
      const item = document.createElement('div');
      item.className = `px-3 py-2 rounded-lg shadow text-sm ${isError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`;
      item.textContent = text;
      c.appendChild(item);
      setTimeout(() => item.remove(), 2000);
    }

    await table.init();
  });
})();

