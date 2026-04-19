// add-to-cart.js – Xử lý nút "Thêm vào giỏ hàng" trên toàn site
(function () {
  const CART_API = "./backend/api/cart/index.php";
  const VARIANTS_API = "./backend/api/products/product-variants.php";

  // Cập nhật badge số lượng giỏ hàng
  function refreshBadge() {
    const token = localStorage.getItem("kx_auth_token");
    if (!token) return;
    fetch(CART_API, { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const n = d.data && d.data.items ? d.data.items.length : 0;
        document.querySelectorAll("[data-cart-count]").forEach((el) => {
          el.textContent = n || "0";
          el.style.display = n > 0 ? "flex" : "none";
        });
      })
      .catch(() => {});
  }

  //Gọi API POST /cart
  async function doAddToCart(variantId, qty, btn) {
    const token = localStorage.getItem("kx_auth_token");
    if (!token) {
      if (window.showToast)
        window.showToast("Vui lòng đăng nhập để thêm vào giỏ hàng.", "warning");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
      return;
    }

    const origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML =
      '<span class="material-symbols-outlined text-[18px]">hourglass_top</span>';

    try {
      const res = await fetch(CART_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ variant_id: variantId, quantity: qty }),
      });
      const data = await res.json();

      if (data.success) {
        btn.innerHTML =
          '<span class="material-symbols-outlined text-[18px]">check_circle</span> Đã thêm';
        btn.style.cssText = "background:#4caf50;color:white;";
        if (window.showToast)
          window.showToast("Đã thêm vào giỏ hàng!", "success");
        refreshBadge();
        setTimeout(() => {
          btn.innerHTML = origHTML;
          btn.style.cssText = "";
          btn.disabled = false;
        }, 1800);
      } else {
        if (window.showToast)
          window.showToast(
            data.message || "Không thể thêm vào giỏ hàng.",
            "error",
          );
        btn.innerHTML = origHTML;
        btn.disabled = false;
      }
    } catch (err) {
      console.error("addToCart error:", err);
      if (window.showToast) window.showToast("Lỗi kết nối máy chủ.", "error");
      btn.innerHTML = origHTML;
      btn.disabled = false;
    }
  }

  // ── Lấy variant ID đầu tiên theo slug ─────────────────────
  async function fetchVariantId(slug) {
    try {
      const res = await fetch(
        VARIANTS_API + "?slug=" + encodeURIComponent(slug),
      );
      const data = await res.json();
      if (data.success && data.first_id) return data.first_id;
      console.warn(
        "[add-to-cart] Không tìm thấy variant, slug =",
        slug,
        "| response:",
        data,
      );
    } catch (e) {
      console.error("[add-to-cart] fetchVariantId error:", e);
    }
    return null;
  }

  // ── Xử lý click nút ───────────────────────────────────────
  async function handleClick(e) {
    const btn = e.currentTarget;
    e.preventDefault();
    e.stopPropagation();

    // 1. Có sẵn variant-id trên nút (từ product-api.js render)
    const variantId = btn.dataset.variantId;
    if (variantId) {
      await doAddToCart(variantId, 1, btn);
      return;
    }

    // 2. Lấy slug: từ data-product-slug trên nút, hoặc data-slug trên thẻ cha
    const slug =
      btn.dataset.productSlug || btn.closest("[data-slug]")?.dataset.slug || "";

    if (!slug) {
      if (window.showToast)
        window.showToast(
          "Vui lòng xem chi tiết sản phẩm để thêm vào giỏ hàng.",
          "info",
        );
      return;
    }

    // Hiện loading trong khi lấy variant
    const origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML =
      '<span class="material-symbols-outlined text-[18px]">hourglass_top</span>';

    const vid = await fetchVariantId(slug);

    if (vid) {
      btn.innerHTML = origHTML;
      btn.disabled = false;
      await doAddToCart(vid, 1, btn);
    } else {
      if (window.showToast)
        window.showToast("Sản phẩm chưa có trong kho dữ liệu.", "warning");
      btn.innerHTML = origHTML;
      btn.disabled = false;
    }
  }

  // Bind tất cả nút chưa được bind
  function bindButtons() {
    document
      .querySelectorAll('[data-cart-action="add-to-cart"]')
      .forEach((btn) => {
        if (btn.dataset.atcBound) return;
        btn.dataset.atcBound = "1";
        btn.addEventListener("click", handleClick);
      });
  }

  // Khởi động
  document.addEventListener("DOMContentLoaded", () => {
    bindButtons();
    refreshBadge();

    // Theo dõi DOM mới (product-api.js render sau)
    const grid = document.querySelector("[data-product-grid]");
    if (grid) {
      new MutationObserver(bindButtons).observe(grid, {
        childList: true,
        subtree: true,
      });
    }
  });

  // Export global
  window.bindAddToCartButtons = bindButtons;
  window.addToCartAPI = doAddToCart;
  window.refreshCartBadge = refreshBadge;
})();

// Mua ngay
document.addEventListener("DOMContentLoaded", () => {
  const buyNowBtn = document.getElementById("buy-now-btn");
  if (!buyNowBtn) return;

  buyNowBtn.addEventListener("click", async () => {
    console.log("BUY NOW clicked");
    console.log("variantId:", buyNowBtn.dataset.variantId);
    const token = localStorage.getItem("kx_auth_token");
    if (!token) {
      if (window.showToast) window.showToast("Vui lòng đăng nhập", "warning");
      setTimeout(() => (window.location.href = "login.html"), 1000);
      return;
    }

    // Lấy variant đang chọn
    const variantId =
      buyNowBtn.dataset.variantId ||
      document.querySelector("[data-cart-action='add-to-cart']")?.dataset
        .variantId;

    if (!variantId) {
      if (window.showToast)
        window.showToast("Vui lòng chọn sản phẩm", "warning");
      return;
    }

    buyNowBtn.disabled = true;
    buyNowBtn.innerText = "Đang xử lý...";

    try {
      const token = localStorage.getItem("kx_auth_token");
      const res = await fetch("/backend/api/cart/index.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ variant_id: variantId, quantity: 1 }),
      });
      const data = await res.json();

      if (data.success) {
        window.location.href = "checkout.html";
      } else {
        if (window.showToast)
          window.showToast(data.message || "Lỗi thêm vào giỏ", "error");
        buyNowBtn.disabled = false;
        buyNowBtn.innerText = "Mua ngay";
      }
    } catch (e) {
      if (window.showToast) window.showToast("Lỗi kết nối", "error");
      buyNowBtn.disabled = false;
      buyNowBtn.innerText = "Mua ngay";
    }
  });
});
