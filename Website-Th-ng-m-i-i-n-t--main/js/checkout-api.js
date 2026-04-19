// js/checkout-api.js
// Kính Xanh — Checkout + MoMo QR Payment

const CHECKOUT_API = "/backend/api";
const fmt = (v) => Number(v || 0).toLocaleString("vi-VN") + "₫";

/* ─────────────────────────────────────────
   AUTH FETCH
───────────────────────────────────────── */
async function authFetchCheckout(url, options = {}) {
  const token = localStorage.getItem("kx_auth_token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

/* ─────────────────────────────────────────
   LOAD CART ITEMS INTO CHECKOUT PAGE
───────────────────────────────────────── */
async function loadCheckoutCart() {
  const container = document.getElementById("checkout-items-container");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const vatEl = document.getElementById("checkout-vat");
  const totalEl = document.getElementById("checkout-total");

  if (!container) return;

  const token = localStorage.getItem("kx_auth_token");
  if (!token) {
    container.innerHTML = `<p class="text-sm text-on-surface-variant">Vui lòng đăng nhập</p>`;
    return;
  }

  container.innerHTML = `<p class="text-sm text-on-surface-variant animate-pulse">Đang tải...</p>`;

  try {
    const res = await authFetchCheckout(`${CHECKOUT_API}/cart/index.php`);
    console.log("URL gọi:", `${CHECKOUT_API}/cart/index.php`);
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("CHECKOUT CART API:", data);

    if (!data.success || !data.data?.items?.length) {
      container.innerHTML = `<p class="text-sm text-on-surface-variant">Giỏ hàng trống</p>`;
      return;
    }

    const items = data.data.items;

    container.innerHTML = items
      .map(
        (item) => `
        <div class="flex justify-between items-center py-2 border-b border-outline-variant/30 text-sm">
          <span class="text-on-surface font-medium">${item.product_name}</span>
          <span class="text-primary font-bold">${fmt(item.price * item.quantity)}</span>
        </div>`,
      )
      .join("");
    container.dataset.managed = "api";

    const subtotal = data.data.total_price || 0;
    const vat = subtotal * 0.08;
    const total = Math.round(subtotal + vat);

    if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
    if (vatEl) vatEl.textContent = fmt(vat);
    if (totalEl) totalEl.textContent = fmt(total);

    // Lưu để submitOrder dùng (không parse DOM)
    localStorage.setItem("checkout_total", total);
  } catch (err) {
    console.error("loadCheckoutCart:", err);
    container.innerHTML = `<p class="text-sm text-red-500">Lỗi tải giỏ hàng</p>`;
  }
  loadUserInfo();
}

// lấy thông tin tên và sdt khách hàng
async function loadUserInfo() {
  try {
    const res = await authFetchCheckout(`/backend/api/auth/me.php`);
    const data = await res.json();
    if (!data.success) return;

    const u = data.data;

    const nameInput = document.getElementById("shipping-name");
    const phoneInput = document.getElementById("shipping-phone");

    if (nameInput && !nameInput.value) nameInput.value = u.name || "";
    if (phoneInput && !phoneInput.value) phoneInput.value = u.phone || "";
  } catch (e) {
    console.error("loadUserInfo error:", e);
  }
}

/* ─────────────────────────────────────────
   VALIDATE SHIPPING FORM
───────────────────────────────────────── */
function validateShippingForm() {
  const name = document.getElementById("shipping-name")?.value.trim();
  const phone = document.getElementById("shipping-phone")?.value.trim();
  const address = document.getElementById("shipping-address")?.value.trim();

  if (!name || !phone || !address) {
    showToast("Vui lòng nhập đầy đủ thông tin giao hàng", "error");
    return false;
  }

  const phoneRegex = /^(0|\+84)[0-9]{8,10}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
    showToast("Số điện thoại không hợp lệ", "error");
    return false;
  }

  return true;
}

/* ─────────────────────────────────────────
   GET SELECTED PAYMENT METHOD
───────────────────────────────────────── */
function getSelectedPayment() {
  const checked = document.querySelector('input[name="payment"]:checked');
  return checked?.value ?? "cod";
}

/* ─────────────────────────────────────────
   CREATE ORDER IN BACKEND
───────────────────────────────────────── */
async function createOrder() {
  const res = await authFetchCheckout(`${CHECKOUT_API}/orders/index.php`, {
    method: "POST",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Tạo đơn hàng thất bại");
  return data.data.order_id;
}

/* ─────────────────────────────────────────
   TOAST NOTIFICATION
───────────────────────────────────────── */
function showToast(msg, type = "info") {
  const existing = document.getElementById("kx-toast");
  if (existing) existing.remove();

  const colors = {
    error: "bg-red-500 text-white",
    success: "bg-green-600 text-white",
    info: "bg-primary text-on-primary",
  };

  const toast = document.createElement("div");
  toast.id = "kx-toast";
  toast.className = `fixed top-6 right-6 z-[9999] px-6 py-3 rounded-xl shadow-xl font-medium text-sm ${colors[type] ?? colors.info} transition-all duration-300 opacity-0`;
  toast.textContent = msg;
  toast.style.position = "fixed";
  toast.style.top = "24px";
  toast.style.right = "24px";
  toast.style.zIndex = "9999";
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ─────────────────────────────────────────
   MOMO QR MODAL
───────────────────────────────────────── */
function showMoMoQRModal({ payUrl, qrCodeUrl, amount, orderId }) {
  // Xoá modal cũ nếu có
  document.getElementById("momo-qr-modal")?.remove();

  // QR source: dùng qrCodeUrl từ MoMo nếu có, fallback Google Chart API
  const qrSrc = qrCodeUrl
    ? qrCodeUrl
    : `https://chart.googleapis.com/chart?cht=qr&chs=280x280&chld=M|1&chl=${encodeURIComponent(payUrl)}`;

  const modal = document.createElement("div");
  modal.id = "momo-qr-modal";
  modal.innerHTML = `
    <div class="momo-modal-overlay" id="momo-overlay">
      <div class="momo-modal-card" role="dialog" aria-modal="true" aria-label="Thanh toán MoMo">

        <!-- Header -->
        <div class="momo-modal-header">
          <div class="momo-logo-wrap">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="#a50064"/>
              <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
                    font-family="Arial Black,sans-serif" font-weight="900"
                    font-size="10" fill="white">MoMo</text>
            </svg>
            <span class="momo-brand">MoMo</span>
          </div>
          <button class="momo-close-btn" id="momo-close" aria-label="Đóng">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- QR Section -->
        <div class="momo-qr-section">
          <p class="momo-instruction">Mở app MoMo → <strong>Quét mã</strong> để thanh toán</p>

          <div class="momo-qr-frame">
            <div class="momo-qr-corner tl"></div>
            <div class="momo-qr-corner tr"></div>
            <div class="momo-qr-corner bl"></div>
            <div class="momo-qr-corner br"></div>
            <img
              src="${qrSrc}"
              alt="MoMo QR Code"
              class="momo-qr-img"
              onerror="this.src='https://chart.googleapis.com/chart?cht=qr&chs=280x280&chl=${encodeURIComponent(payUrl)}'"
            />
          </div>

          <div class="momo-amount-badge">
            <span class="momo-amount-label">Số tiền</span>
            <span class="momo-amount-value">${fmt(amount)}</span>
          </div>

          <div class="momo-order-id">
            Mã đơn: <code>${orderId}</code>
          </div>
        </div>

        <!-- Timer -->
        <div class="momo-timer-wrap">
          <div class="momo-timer-bar">
            <div class="momo-timer-fill" id="momo-timer-fill"></div>
          </div>
          <p class="momo-timer-text">
            Mã QR hết hạn sau <strong id="momo-countdown">15:00</strong>
          </p>
        </div>

        <!-- Actions -->
        <div class="momo-actions">
          <a href="${payUrl}" target="_blank" rel="noopener" class="momo-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Mở app MoMo
          </a>
          <button class="momo-btn-secondary" id="momo-cancel">
            Huỷ thanh toán
          </button>
        </div>

      </div>
    </div>

    <style>
      #momo-qr-modal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        font-family: 'Manrope', 'Inter', sans-serif;
      }

      .momo-modal-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: momoFadeIn .2s ease;
      }

      @keyframes momoFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      @keyframes momoSlideUp {
        from { opacity: 0; transform: translateY(24px) scale(.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .momo-modal-card {
        background: #fff;
        border-radius: 24px;
        width: 100%;
        max-width: 380px;
        box-shadow: 0 32px 80px rgba(165, 0, 100, .2), 0 8px 24px rgba(0,0,0,.12);
        overflow: hidden;
        animation: momoSlideUp .3s cubic-bezier(.22,1,.36,1);
      }

      /* Header */
      .momo-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px 16px;
        border-bottom: 1px solid #f0e5ed;
      }

      .momo-logo-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .momo-brand {
        font-size: 18px;
        font-weight: 800;
        color: #a50064;
        letter-spacing: -.5px;
      }

      .momo-close-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: #f5f5f5;
        color: #666;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background .15s, color .15s;
      }

      .momo-close-btn:hover {
        background: #ffe5f3;
        color: #a50064;
      }

      /* QR Section */
      .momo-qr-section {
        padding: 24px 24px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .momo-instruction {
        font-size: 14px;
        color: #444;
        text-align: center;
        line-height: 1.5;
      }

      .momo-qr-frame {
        position: relative;
        padding: 12px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 2px 16px rgba(165,0,100,.1), 0 0 0 1px #f0e5ed;
      }

      /* Decorative corner brackets */
      .momo-qr-corner {
        position: absolute;
        width: 20px;
        height: 20px;
        border-color: #a50064;
        border-style: solid;
      }
      .momo-qr-corner.tl { top: 6px; left: 6px;  border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
      .momo-qr-corner.tr { top: 6px; right: 6px; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
      .momo-qr-corner.bl { bottom: 6px; left: 6px;  border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
      .momo-qr-corner.br { bottom: 6px; right: 6px; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }

      .momo-qr-img {
        display: block;
        width: 220px;
        height: 220px;
        border-radius: 8px;
      }

      /* Amount badge */
      .momo-amount-badge {
        display: flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #fce4f3, #fff0f9);
        border: 1px solid #f0bdd8;
        border-radius: 12px;
        padding: 10px 20px;
        width: 100%;
        justify-content: space-between;
      }

      .momo-amount-label {
        font-size: 13px;
        color: #888;
        font-weight: 600;
      }

      .momo-amount-value {
        font-size: 20px;
        font-weight: 800;
        color: #a50064;
        letter-spacing: -.5px;
      }

      .momo-order-id {
        font-size: 11px;
        color: #aaa;
        text-align: center;
      }

      .momo-order-id code {
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        color: #666;
      }

      /* Timer */
      .momo-timer-wrap {
        padding: 0 24px 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .momo-timer-bar {
        height: 4px;
        background: #f0e5ed;
        border-radius: 4px;
        overflow: hidden;
      }

      .momo-timer-fill {
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, #a50064, #ff6bb5);
        border-radius: 4px;
        transform-origin: left;
        transition: transform 1s linear;
      }

      .momo-timer-text {
        font-size: 12px;
        color: #aaa;
        text-align: center;
      }

      .momo-timer-text strong {
        color: #a50064;
        font-weight: 700;
      }

      /* Actions */
      .momo-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 24px 24px;
      }

      .momo-btn-primary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: linear-gradient(135deg, #a50064, #c4007a);
        color: #fff;
        text-decoration: none;
        border: none;
        border-radius: 14px;
        padding: 14px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: opacity .2s, transform .1s;
      }

      .momo-btn-primary:hover  { opacity: .9; transform: translateY(-1px); }
      .momo-btn-primary:active { transform: scale(.98); }

      .momo-btn-secondary {
        background: #f5f5f5;
        color: #666;
        border: none;
        border-radius: 14px;
        padding: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background .15s, color .15s;
      }

      .momo-btn-secondary:hover {
        background: #ffe5f3;
        color: #a50064;
      }
    </style>
  `;

  document.body.appendChild(modal);

  const DURATION = 1 * 60;
  let remaining = DURATION;
  const fill = document.getElementById("momo-timer-fill");
  const countdown = document.getElementById("momo-countdown");

  const timer = setInterval(() => {
    remaining--;
    const pct = (remaining / DURATION) * 100;

    if (fill) fill.style.transform = `scaleX(${pct / 100})`;
    if (countdown) {
      const m = String(Math.floor(remaining / 60)).padStart(2, "0");
      const s = String(remaining % 60).padStart(2, "0");
      countdown.textContent = `${m}:${s}`;
    }

    if (remaining <= 0) {
      clearInterval(timer);
      closeMoMoModal();
      showToast("Mã QR đã hết hạn. Vui lòng thử lại.", "error");
    }
  }, 1000);

  /* ── Close handlers ── */
  function closeMoMoModal() {
    clearInterval(timer);
    const card = modal.querySelector(".momo-modal-card");
    if (card) {
      card.style.animation = "none";
      card.style.transition = "transform .2s, opacity .2s";
      card.style.opacity = "0";
      card.style.transform = "translateY(16px) scale(.97)";
    }
    setTimeout(() => modal.remove(), 200);
  }

  document
    .getElementById("momo-close")
    ?.addEventListener("click", closeMoMoModal);
  document
    .getElementById("momo-cancel")
    ?.addEventListener("click", closeMoMoModal);

  // Click ngoài để đóng
  document.getElementById("momo-overlay")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeMoMoModal();
  });

  // ESC để đóng
  const escHandler = (e) => {
    if (e.key === "Escape") {
      closeMoMoModal();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
}

/* ─────────────────────────────────────────
   MAIN SUBMIT ORDER FLOW
───────────────────────────────────────── */
async function submitOrder(e) {
  if (e) e.preventDefault();

  const btn = document.getElementById("checkout-complete-btn");
  if (!btn || btn.dataset.processing === "true") return;
  if (!validateShippingForm()) return;

  const paymentMethod = getSelectedPayment();

  btn.dataset.processing = "true";
  btn.disabled = true;
  btn.innerHTML = `<span class="animate-pulse">Đang xử lý...</span>`;

  try {
    /* 1. Tạo order */
    const orderId = await createOrder();
    console.log("[KX] Order created:", orderId);

    /* 2. COD / Bank — chuyển trang thành công */
    if (paymentMethod === "cod" || paymentMethod === "bank") {
      localStorage.setItem("kx_last_order", orderId);
      window.location.href = "checkout-success.html";
      return;
    }

    /* 3. MoMo */
    if (paymentMethod === "momo") {
      let amount = parseInt(localStorage.getItem("checkout_total") || "0");

      if (!amount) {
        const totalText =
          document.getElementById("checkout-total")?.textContent || "0";
        amount = parseInt(totalText.replace(/\D/g, "")) || 0;
      }

      if (!amount) throw new Error("Không xác định được số tiền");
      const res = await fetch("/backend/api/payment/momo_create.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          amount,
          orderId,
          orderInfo: "Thanh toán Kính Xanh",
        }),
      });

      const data = await res.json();
      console.log("[KX] MoMo response:", data);

      if (!data.success || !data.payUrl) {
        throw new Error(data.message || "Không lấy được payUrl từ MoMo");
      }

      // Hiện QR modal
      showMoMoQRModal({
        payUrl: data.payUrl,
        qrCodeUrl: data.qrCodeUrl ?? null,
        amount,
        orderId,
      });

      return; // Không reset button — user đang ở trong modal
    }

    /* 4. ZaloPay — placeholder */
    if (paymentMethod === "zalopay") {
      showToast("ZaloPay đang được phát triển", "info");
    }
  } catch (err) {
    console.error("[KX] submitOrder error:", err);
    showToast("Đặt hàng thất bại: " + err.message, "error");
  } finally {
    // Chỉ reset button nếu KHÔNG phải đang ở MoMo modal hoặc redirect
    if (document.getElementById("momo-qr-modal") === null) {
      btn.dataset.processing = "false";
      btn.disabled = false;
      btn.innerHTML = `<span>HOÀN TẤT ĐẶT HÀNG</span><span class="material-symbols-outlined">arrow_forward</span>`;
    }
  }
}

/* ─────────────────────────────────────────
   PAYMENT METHOD — HIGHLIGHT SELECTED
───────────────────────────────────────── */
function initPaymentMethodHighlight() {
  const radios = document.querySelectorAll('input[name="payment"]');
  const labels = Array.from(radios).map((r) => r.closest("label"));

  radios.forEach((radio, i) => {
    radio.addEventListener("change", () => {
      labels.forEach((label, j) => {
        if (!label) return;
        if (j === i) {
          label.classList.add("border-primary", "bg-primary-fixed/10");
          label.classList.remove("border-transparent");
        } else {
          label.classList.remove("border-primary", "bg-primary-fixed/10");
          label.classList.add("border-transparent");
        }
      });
    });
  });
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  loadCheckoutCart();
  initPaymentMethodHighlight();

  const btn = document.getElementById("checkout-complete-btn");
  if (btn) btn.addEventListener("click", submitOrder);
});
