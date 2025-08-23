(function () {
  class Breadcrumb {
    constructor(container, items = []) {
      this.container = container;
      this.items = items;
      this.render();
    }

    setItems(items = []) {
      this.items = items;
      this.render();
    }

    setCurrent(text) {
      if (!this.items.length) return;
      this.items[this.items.length - 1].text = text;
      this.render();
    }

    render() {
      if (!this.container) return;
      this.container.innerHTML = '';
      const ol = document.createElement('ol');
      ol.className = 'flex items-center space-x-2 text-sm';
      this.items.forEach((item, index) => {
        if (index > 0) {
          const sep = document.createElement('li');
          sep.className = 'text-gray-400';
          sep.setAttribute('aria-hidden', 'true');
          sep.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>';
          ol.appendChild(sep);
        }
        const li = document.createElement('li');
        if (item.href || item.onClick) {
          const el = document.createElement(item.href ? 'a' : 'button');
          el.className = 'text-teal-600 hover:text-teal-700 font-medium transition-colors';
          if (item.href) el.href = item.href;
          if (item.onClick) el.addEventListener('click', item.onClick);
          el.textContent = item.text;
          li.appendChild(el);
        } else {
          li.className = 'text-gray-600 font-medium';
          li.textContent = item.text;
        }
        ol.appendChild(li);
      });
      this.container.appendChild(ol);
    }
  }
  window.Breadcrumb = Breadcrumb;
})();
