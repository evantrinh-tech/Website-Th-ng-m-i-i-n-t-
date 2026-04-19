/**
 * Frontend integration cho module sản phẩm.
 *
 * products.html cần:
 * - <input data-search-input />
 * - <select data-sort-select>...</select>
 * - <div data-product-grid></div>
 * - <div data-pagination></div>
 * - Checkbox: data-filter="brand|gender|material|lens_type"
 *
 * product-detail.html cần:
 * - data-detail="name"             → h1 tên SP, bottom bar tên
 * - data-detail="sku"              → SKU
 * - data-detail="price"            → giá (info + bottom bar)
 * - data-detail="old_price"        → giá cũ (info + bottom bar)
 * - data-detail="discount_percent" → badge giảm giá
 * - data-detail="rating"           → điểm rating
 * - data-detail="review_count"     → nút tab đánh giá
 * - data-detail="description"      → mô tả sản phẩm
 * - data-detail="breadcrumb_name"  → breadcrumb tên SP
 * - data-detail="main_image"       → ảnh chính + thumbnail bottom bar
 * - data-detail="thumb_0|1|2"      → 3 ảnh thumbnail nhỏ
 * - id="related-products-grid"     → container sản phẩm liên quan
 * - URL: product-detail.html?slug=ten-san-pham
 */

(function () {
  const API_PRODUCTS = "./backend/api/products";
  const API_REVIEWS = "./backend/api/reviews";

  const currency = (value) => Number(value || 0).toLocaleString("vi-VN") + "₫";

  const getQueryParam = (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  };

  const collectFilterValues = (name) =>
    Array.from(
      document.querySelectorAll(`[data-filter="${name}"]:checked`),
    ).map((item) => item.value);

  const buildProductsQuery = () => {
    const params = new URLSearchParams();
    const searchInput = document.querySelector("[data-search-input]");
    const sortSelect = document.querySelector("[data-sort-select]");
    const minPriceInput = document.querySelector("[data-min-price]");
    const maxPriceInput = document.querySelector("[data-max-price]");

    if (searchInput?.value.trim()) params.set("q", searchInput.value.trim());
    if (sortSelect?.value) params.set("sort", sortSelect.value);
    if (minPriceInput?.value) params.set("min_price", minPriceInput.value);
    if (maxPriceInput?.value) params.set("max_price", maxPriceInput.value);

    const filters = {
      brand: collectFilterValues("brand"),
      gender: collectFilterValues("gender"),
      material: collectFilterValues("material"),
      lens_type: collectFilterValues("lens_type"),
    };

    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) params.set(key, values.join(","));
    });

    params.set("limit", "9");
    params.set("page", getQueryParam("page") || "1");
    return params.toString();
  };

  //Card sản phẩm dùng cho products.html
  const renderProductCard = (product) => `
    <article class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-lg transition" data-slug="${product.slug || ""}">
      <a href="product-detail.html?slug=${encodeURIComponent(product.slug)}" class="block">
        <div class="aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
          <img src="${product.thumbnail_url || ""}" alt="${product.name}" class="h-full w-full object-cover" />
        </div>
        <div class="mt-4 space-y-2">
          <p class="text-sm font-semibold text-slate-500">${product.brand}</p>
          <h3 class="text-lg font-bold text-slate-900">${product.name}</h3>
          <p class="text-sm text-slate-500">${product.short_description || ""}</p>
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-primary">${currency(product.price)}</span>
            ${product.old_price ? `<span class="text-sm text-slate-400 line-through">${currency(product.old_price)}</span>` : ""}
          </div>
          <div class="text-sm text-amber-500">★ ${product.rating} (${product.review_count} đánh giá)</div>
        </div>
      </a>
      <button
        class="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-secondary-container text-on-secondary-fixed font-bold rounded-xl transition-all active:scale-95 hover:shadow-md text-sm"
        data-cart-action="add-to-cart"
        data-product-slug="${product.slug || ""}"
      >
        <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
        Thêm vào giỏ
      </button>
    </article>
  `;

  //Card sản phẩm liên quan (giữ style layout gốc)
  const renderRelatedCard = (product) => `
    <div class="group cursor-pointer">
      <a href="product-detail.html?slug=${encodeURIComponent(product.slug)}">
        <div class="aspect-[4/5] bg-surface-container rounded-2xl overflow-hidden mb-4 relative">
          <img
            alt="${product.name}"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            src="${product.thumbnail_url || ""}"
          />
          <button class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="material-symbols-outlined text-sm">favorite</span>
          </button>
        </div>
        <p class="font-bold font-headline text-primary">${product.name}</p>
        <p class="text-sm text-secondary font-bold">${currency(product.price)}</p>
      </a>
    </div>
  `;

  // Pagination
  const renderPagination = (pagination) => {
    const container = document.querySelector("[data-pagination]");
    if (!container || !pagination) return;

    if (pagination.total_pages <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = "";
    for (let page = 1; page <= pagination.total_pages; page += 1) {
      const params = new URLSearchParams(window.location.search);
      params.set("page", String(page));
      html += `
        <a href="?${params.toString()}"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full border ${
            page === pagination.page
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-300"
          }">
          ${page}
        </a>
      `;
    }

    container.innerHTML = `<div class="mt-8 flex flex-wrap items-center justify-center gap-2">${html}</div>`;
  };

  //Load danh sách sản phẩm
  const loadProducts = async () => {
    const grid = document.querySelector("[data-product-grid]");
    if (!grid) return;

    grid.innerHTML = `<p class="col-span-full text-center text-slate-500">Đang tải sản phẩm...</p>`;

    try {
      const response = await fetch(
        `${API_PRODUCTS}/products.php?${buildProductsQuery()}`,
      );
      const result = await response.json();

      if (!result.success)
        throw new Error(result.message || "Không tải được dữ liệu");

      if (!result.data.length) {
        grid.innerHTML = `<p class="col-span-full text-center text-slate-500">Không tìm thấy sản phẩm phù hợp.</p>`;
        renderPagination(result.pagination);
        return;
      }

      grid.innerHTML = result.data.map(renderProductCard).join("");
      renderPagination(result.pagination);
    } catch (error) {
      console.error(error);
      grid.innerHTML = `<p class="col-span-full text-center text-red-500">Có lỗi khi tải dữ liệu sản phẩm.</p>`;
    }
  };

  // Inject data vào layout HTML sẵn (product-detail.html
  const injectDetailData = (payload) => {
    const product = payload.product;
    const images = payload.images || [];
    const related = payload.related_products || [];

    // Helper: set textContent hoặc src tuỳ tag
    const set = (attr, value) => {
      if (value === null || value === undefined) return;
      document.querySelectorAll(`[data-detail="${attr}"]`).forEach((el) => {
        if (el.tagName === "IMG") el.src = value;
        else el.textContent = value;
      });
    };

    // Thông tin văn bản
    set("name", product.name);
    set("sku", "SKU: " + product.sku);
    set("price", currency(product.price));
    set("old_price", product.old_price ? currency(product.old_price) : "");
    set(
      "discount_percent",
      product.discount_percent ? `-${product.discount_percent}%` : "",
    );
    set("rating", product.rating);
    set("review_count", `Đánh giá (${product.review_count})`);
    set("description", product.description || "");
    set("breadcrumb_name", product.name);
    document.title = `Kính Xanh | ${product.name}`;

    // Ảnh chính + thumbnail bottom bar
    set("main_image", product.main_image || product.thumbnail_url || "");

    // Ẩn old_price & badge nếu không có
    if (!product.old_price) {
      document.querySelectorAll('[data-detail="old_price"]').forEach((el) => {
        el.style.display = "none";
      });
      document
        .querySelectorAll('[data-detail="discount_percent"]')
        .forEach((el) => {
          el.style.display = "none";
        });
    }

    // Thumbnails từ API
    images.forEach((img, index) => {
      const el = document.querySelector(`[data-detail="thumb_${index}"]`);
      if (!el) return;
      el.src = img.image_url || "";
      el.alt = img.alt_text || product.name;
    });

    // Set variant_id lên tất cả nút add-to-cart nếu có first_variant_id
    if (product.first_variant_id) {
      document
        .querySelectorAll('[data-cart-action="add-to-cart"]')
        .forEach((btn) => {
          btn.dataset.variantId = product.first_variant_id;
        });
    }

    // Click thumbnail → đổi ảnh chính
    document.querySelectorAll('[data-detail^="thumb_"]').forEach((thumb) => {
      thumb.parentElement.addEventListener("click", () => {
        document
          .querySelectorAll('[data-detail="main_image"]')
          .forEach((main) => {
            main.src = thumb.src;
          });
        document.querySelectorAll('[data-detail^="thumb_"]').forEach((t) => {
          t.parentElement.classList.remove("ring-2", "ring-primary");
          t.parentElement.classList.add("opacity-60");
        });
        thumb.parentElement.classList.add("ring-2", "ring-primary");
        thumb.parentElement.classList.remove("opacity-60");
      });
    });

    // Render sản phẩm liên quan
    const relatedGrid = document.getElementById("related-products-grid");
    if (relatedGrid && related.length > 0) {
      relatedGrid.innerHTML = related.map(renderRelatedCard).join("");
    }
    // Set variant_id cho nút Mua ngay
    if (product.first_variant_id) {
      const buyNowBtn = document.getElementById("buy-now-btn");
      if (buyNowBtn) {
        buyNowBtn.dataset.variantId = product.first_variant_id;
      }
    }

    // Load và render variants
    if (product.id) {
      fetch(
        `/backend/api/products/product-variants.php?product_id=${product.id}`,
      )
        .then((r) => r.json())
        .then((data) => {
          if (!data.success || !data.data?.length) return;

          const variants = data.data;
          const colorLabel = document.querySelector(
            '[data-detail="color-label"]',
          );
          const colorContainer = document.querySelector("[data-color-options]");

          if (!colorContainer) return;

          colorContainer.innerHTML = variants
            .map(
              (v) => `
        <button
          class="w-10 h-10 rounded-full ring-1 ring-offset-1 ring-outline-variant hover:ring-primary transition-all"
          style="background-color: ${v.color_hex || "#ccc"}"
          data-variant-id="${v.id}"
          data-color-name="${v.color || ""}"
          title="${v.color || ""}"
        ></button>
      `,
            )
            .join("");

          // Chọn variant đầu tiên mặc định
          const firstBtn = colorContainer.querySelector("button");
          if (firstBtn) selectVariant(firstBtn, variants[0]);

          // Bind click
          colorContainer.querySelectorAll("button").forEach((btn) => {
            btn.addEventListener("click", () => {
              const variant = variants.find(
                (v) => v.id === btn.dataset.variantId,
              );
              if (variant) selectVariant(btn, variant);
            });
          });

          function selectVariant(btn, variant) {
            // Reset tất cả
            colorContainer.querySelectorAll("button").forEach((b) => {
              b.classList.remove("ring-2", "ring-primary");
              b.classList.add("ring-1", "ring-outline-variant");
            });
            // Active nút được chọn
            btn.classList.add("ring-2", "ring-primary");
            btn.classList.remove("ring-1", "ring-outline-variant");

            // Cập nhật label màu
            if (colorLabel) colorLabel.textContent = variant.color || "";

            // Cập nhật variant_id cho tất cả nút add-to-cart và buy-now
            document
              .querySelectorAll('[data-cart-action="add-to-cart"]')
              .forEach((b) => {
                b.dataset.variantId = variant.id;
              });
            const buyNowBtn = document.getElementById("buy-now-btn");
            if (buyNowBtn) buyNowBtn.dataset.variantId = variant.id;

            // Cập nhật giá nếu variant có giá riêng
            if (variant.price) {
              document
                .querySelectorAll('[data-detail="price"]')
                .forEach((el) => {
                  el.textContent = currency(variant.price);
                });
            }
          }
        })
        .catch((err) => console.error("load variants error:", err));
    }
  };

  // Load chi tiết sản phẩm
  const loadProductDetail = async () => {
    if (!document.querySelector("[data-detail]")) return;

    const slug = getQueryParam("slug");
    const id = getQueryParam("id");

    if (!slug && !id) {
      console.warn("product-api: Thiếu slug hoặc id trên URL");
      return;
    }

    const query = slug
      ? `slug=${encodeURIComponent(slug)}`
      : `id=${encodeURIComponent(id)}`;

    try {
      const response = await fetch(
        `${API_PRODUCTS}/product-detail.php?${query}`,
      );
      const result = await response.json();

      if (!result.success)
        throw new Error(result.message || "Không tải được chi tiết sản phẩm");

      injectDetailData(result.data);
    } catch (error) {
      console.error("loadProductDetail error:", error);
    }
  };

  //Filter events
  const bindFilterEvents = () => {
    const listeners = [
      document.querySelector("[data-search-input]"),
      document.querySelector("[data-sort-select]"),
      document.querySelector("[data-min-price]"),
      document.querySelector("[data-max-price]"),
      ...document.querySelectorAll("[data-filter]"),
      document.querySelector("[data-filter-submit]"),
      document.querySelector("[data-filter-reset]"),
    ].filter(Boolean);

    listeners.forEach((element) => {
      const eventName =
        element.matches('input[type="checkbox"]') ||
        element.tagName === "SELECT"
          ? "change"
          : "click";

      element.addEventListener(eventName, (event) => {
        if (element.hasAttribute("data-filter-reset")) {
          document
            .querySelectorAll("[data-filter]")
            .forEach((item) => (item.checked = false));
          const searchInput = document.querySelector("[data-search-input]");
          const minPriceInput = document.querySelector("[data-min-price]");
          const maxPriceInput = document.querySelector("[data-max-price]");
          const sortSelect = document.querySelector("[data-sort-select]");
          if (searchInput) searchInput.value = "";
          if (minPriceInput) minPriceInput.value = "";
          if (maxPriceInput) maxPriceInput.value = "";
          if (sortSelect) sortSelect.value = "newest";
        }

        event.preventDefault?.();
        const url = new URL(window.location.href);
        url.search = buildProductsQuery();
        window.history.replaceState({}, "", url);
        loadProducts();
      });
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    bindFilterEvents();
    loadProducts();
    loadProductDetail();
  });
})();
