/**
 * Frontend integration cho module sản phẩm.
 * Dùng được với HTML tĩnh nếu bổ sung các data-attribute cần thiết.
 *
 * Gợi ý gắn vào products.html:
 * - <input data-search-input />
 * - <select data-sort-select>...</select>
 * - <div data-product-grid></div>
 * - <div data-pagination></div>
 * - Checkbox: data-filter="brand|gender|material|lens_type"
 *
 * Gợi ý gắn vào product-detail.html:
 * - <section data-product-detail-root></section>
 * - URL: product-detail.html?slug=milan-01-titanium
 */

(function () {
  const API_BASE = './backend/api';

  const currency = (value) =>
    Number(value || 0).toLocaleString('vi-VN') + '₫';

  const getQueryParam = (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  };

  const collectFilterValues = (name) =>
    Array.from(document.querySelectorAll(`[data-filter="${name}"]:checked`)).map(
      (item) => item.value
    );

  const buildProductsQuery = () => {
    const params = new URLSearchParams();
    const searchInput = document.querySelector('[data-search-input]');
    const sortSelect = document.querySelector('[data-sort-select]');
    const minPriceInput = document.querySelector('[data-min-price]');
    const maxPriceInput = document.querySelector('[data-max-price]');

    if (searchInput?.value.trim()) params.set('q', searchInput.value.trim());
    if (sortSelect?.value) params.set('sort', sortSelect.value);
    if (minPriceInput?.value) params.set('min_price', minPriceInput.value);
    if (maxPriceInput?.value) params.set('max_price', maxPriceInput.value);

    const filters = {
      brand: collectFilterValues('brand'),
      gender: collectFilterValues('gender'),
      material: collectFilterValues('material'),
      lens_type: collectFilterValues('lens_type'),
    };

    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(key, values.join(','));
      }
    });

    params.set('limit', '6');
    params.set('page', getQueryParam('page') || '1');
    return params.toString();
  };

  const renderProductCard = (product) => `
    <article class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-lg transition" data-slug="${product.slug || ''}">
      <a href="product-detail.html?slug=${encodeURIComponent(product.slug)}" class="block">
        <div class="aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
          <img src="${product.thumbnail_url || ''}" alt="${product.name}" class="h-full w-full object-cover" />
        </div>
        <div class="mt-4 space-y-2">
          <p class="text-sm font-semibold text-slate-500">${product.brand}</p>
          <h3 class="text-lg font-bold text-slate-900">${product.name}</h3>
          <p class="text-sm text-slate-500">${product.short_description || ''}</p>
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-primary">${currency(product.price)}</span>
            ${product.old_price ? `<span class="text-sm text-slate-400 line-through">${currency(product.old_price)}</span>` : ''}
          </div>
          <div class="text-sm text-amber-500">★ ${product.rating} (${product.review_count} đánh giá)</div>
        </div>
      </a>
      <button
        class="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-secondary-container text-on-secondary-fixed font-bold rounded-xl transition-all active:scale-95 hover:shadow-md text-sm"
        data-cart-action="add-to-cart"
        data-product-slug="${product.slug || ''}"
      >
        <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
        Thêm vào giỏ
      </button>
    </article>
  `;

  const renderPagination = (pagination) => {
    const container = document.querySelector('[data-pagination]');
    if (!container || !pagination) return;

    if (pagination.total_pages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    for (let page = 1; page <= pagination.total_pages; page += 1) {
      const params = new URLSearchParams(window.location.search);
      params.set('page', String(page));

      html += `
        <a
          href="?${params.toString()}"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full border ${
            page === pagination.page
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-300'
          }"
        >
          ${page}
        </a>
      `;
    }

    container.innerHTML = `<div class="mt-8 flex flex-wrap items-center justify-center gap-2">${html}</div>`;
  };

  const loadProducts = async () => {
    const grid = document.querySelector('[data-product-grid]');
    if (!grid) return;

    grid.innerHTML = `<p class="col-span-full text-center text-slate-500">Đang tải sản phẩm...</p>`;

    try {
      const response = await fetch(`${API_BASE}/products.php?${buildProductsQuery()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Không tải được dữ liệu');
      }

      if (!result.data.length) {
        grid.innerHTML = `<p class="col-span-full text-center text-slate-500">Không tìm thấy sản phẩm phù hợp.</p>`;
        renderPagination(result.pagination);
        return;
      }

      grid.innerHTML = result.data.map(renderProductCard).join('');
      renderPagination(result.pagination);
    } catch (error) {
      console.error(error);
      grid.innerHTML = `<p class="col-span-full text-center text-red-500">Có lỗi khi tải dữ liệu sản phẩm.</p>`;
    }
  };

  const renderDetailPage = (payload) => {
    const detailRoot = document.querySelector('[data-product-detail-root]');
    if (!detailRoot) return;

    const product = payload.product;
    const images = payload.images || [];
    const related = payload.related_products || [];

    detailRoot.innerHTML = `
      <div class="grid gap-8 lg:grid-cols-2">
        <div>
          <div class="overflow-hidden rounded-3xl bg-slate-100">
            <img src="${product.main_image || product.thumbnail_url || ''}" alt="${product.name}" class="h-full w-full object-cover" />
          </div>
          <div class="mt-4 grid grid-cols-4 gap-3">
            ${images
              .map(
                (image) => `
                  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <img src="${image.image_url}" alt="${image.alt_text || product.name}" class="h-full w-full object-cover" />
                  </div>
                `
              )
              .join('')}
          </div>
        </div>

        <div class="space-y-4">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">${product.brand}</p>
          <h1 class="text-3xl font-black text-slate-900">${product.name}</h1>
          <p class="text-slate-600">${product.short_description || ''}</p>
          <div class="flex items-center gap-3">
            <span class="text-3xl font-black text-primary">${currency(product.price)}</span>
            ${product.old_price ? `<span class="text-lg text-slate-400 line-through">${currency(product.old_price)}</span>` : ''}
          </div>
          <div class="text-sm text-amber-500">★ ${product.rating} (${product.review_count} đánh giá)</div>

          <div class="grid gap-2 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
            <p><strong>SKU:</strong> ${product.sku}</p>
            <p><strong>Giới tính:</strong> ${product.gender}</p>
            <p><strong>Chất liệu:</strong> ${product.frame_material}</p>
            <p><strong>Loại tròng:</strong> ${product.lens_type}</p>
          </div>

          <div class="rounded-3xl border border-slate-200 p-5">
            <h2 class="text-lg font-bold text-slate-900">Mô tả sản phẩm</h2>
            <p class="mt-3 leading-7 text-slate-600">${product.description || ''}</p>
          </div>
        </div>
      </div>

      <section class="mt-12">
        <h2 class="mb-6 text-2xl font-bold text-slate-900">Sản phẩm liên quan</h2>
        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          ${related.map(renderProductCard).join('')}
        </div>
      </section>
    `;
  };

  const loadProductDetail = async () => {
    const detailRoot = document.querySelector('[data-product-detail-root]');
    if (!detailRoot) return;

    const slug = detailRoot.dataset.currentSlug || getQueryParam('slug');
    const id = getQueryParam('id');

    if (!slug && !id) {
      detailRoot.innerHTML = `<p class="text-red-500">Thiếu tham số sản phẩm.</p>`;
      return;
    }

    detailRoot.innerHTML = `<p class="text-slate-500">Đang tải chi tiết sản phẩm...</p>`;

    const query = slug ? `slug=${encodeURIComponent(slug)}` : `id=${encodeURIComponent(id)}`;

    try {
      const response = await fetch(`${API_BASE}/product-detail.php?${query}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Không tải được chi tiết sản phẩm');
      }

      renderDetailPage(result.data);
    } catch (error) {
      console.error(error);
      detailRoot.innerHTML = `<p class="text-red-500">Không thể tải chi tiết sản phẩm.</p>`;
    }
  };

  const bindFilterEvents = () => {
    const listeners = [
      document.querySelector('[data-search-input]'),
      document.querySelector('[data-sort-select]'),
      document.querySelector('[data-min-price]'),
      document.querySelector('[data-max-price]'),
      ...document.querySelectorAll('[data-filter]'),
      document.querySelector('[data-filter-submit]'),
      document.querySelector('[data-filter-reset]'),
    ].filter(Boolean);

    listeners.forEach((element) => {
      const eventName =
        element.matches('input[type="checkbox"]') || element.tagName === 'SELECT'
          ? 'change'
          : 'click';

      element.addEventListener(eventName, (event) => {
        if (element.hasAttribute('data-filter-reset')) {
          document
            .querySelectorAll('[data-filter]')
            .forEach((item) => (item.checked = false));

          const searchInput = document.querySelector('[data-search-input]');
          const minPriceInput = document.querySelector('[data-min-price]');
          const maxPriceInput = document.querySelector('[data-max-price]');
          const sortSelect = document.querySelector('[data-sort-select]');

          if (searchInput) searchInput.value = '';
          if (minPriceInput) minPriceInput.value = '';
          if (maxPriceInput) maxPriceInput.value = '';
          if (sortSelect) sortSelect.value = 'newest';
        }

        event.preventDefault?.();
        const url = new URL(window.location.href);
        url.search = buildProductsQuery();
        window.history.replaceState({}, '', url);
        loadProducts();
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    bindFilterEvents();
    loadProducts();
    loadProductDetail();
  });
})();
