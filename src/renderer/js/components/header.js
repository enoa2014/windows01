(function() {
  const load = el => {
    const custom = Array.from(el.children);
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'components/header.html', false);
    xhr.send(null);
    if (xhr.status !== 200) return;
    el.innerHTML = xhr.responseText;

    const title = el.dataset.title;
    const titleEl = el.querySelector('[data-header-title]');
    if (title && titleEl) titleEl.textContent = title;

    const backBtn = el.querySelector('[data-back-btn]');
    if (backBtn) {
      if (el.dataset.back === 'true') {
        backBtn.removeAttribute('hidden');
      } else {
        backBtn.setAttribute('hidden', '');
      }
    }

    const breadcrumb = el.dataset.breadcrumb;
    if (breadcrumb) {
      const sep = el.querySelector('#breadcrumbSeparator');
      const cur = el.querySelector('#breadcrumbCurrent');
      if (sep && cur) {
        sep.classList.remove('hidden');
        cur.textContent = breadcrumb;
        cur.classList.remove('hidden');
      }
    }

    const actions = el.querySelector('[data-header-actions]');
    custom.forEach(node => actions.appendChild(node));
  };

  document.querySelectorAll('[data-component="header"]').forEach(load);
})();
