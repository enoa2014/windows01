(function () {
  function $(id) { return document.getElementById(id); }

  document.addEventListener('DOMContentLoaded', async () => {
    const tbody = $('careServiceTbody');
    const table = $('careServiceTable');
    const loading = $('loading');
    const emptyState = $('emptyState');

    try {
      const records = await window.electronAPI.careService.getRecords({}, { limit: 100 });
      loading.classList.add('hidden');
      if (!records || records.length === 0) {
        emptyState.classList.remove('hidden');
        return;
      }
      table.classList.remove('hidden');
      records.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="px-4 py-2">${row.sequence_number || ''}</td>
          <td class="px-4 py-2">${row.year ? `${row.year}-${String(row.month).padStart(2,'0')}` : ''}</td>
          <td class="px-4 py-2">${row.service_center || ''}</td>
          <td class="px-4 py-2">${row.activity_name || ''}</td>
          <td class="px-4 py-2 text-right">${row.total_beneficiaries ?? ''}</td>
          <td class="px-4 py-2">${row.notes || ''}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {
      console.error('加载关怀服务记录失败:', error);
      loading.textContent = '加载失败';
    }
  });
})();
