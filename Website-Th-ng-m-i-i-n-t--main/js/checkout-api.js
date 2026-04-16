// checkout-api.js – Kết nối API cho trang thanh toán
const CHECKOUT_API = './backend/api';

const fmt = (v) => Number(v || 0).toLocaleString('vi-VN') + '₫';

async function authFetchCheckout(url, options = {}) {
    const token = localStorage.getItem('kx_auth_token');
    return fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options.headers || {}) }
    });
}

// ── Load giỏ hàng vào trang checkout ────────────────────────
async function loadCheckoutCart() {
    const container = document.getElementById('checkout-items-container');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const vatEl      = document.getElementById('checkout-vat');
    const totalEl    = document.getElementById('checkout-total');
    if (!container) return;

    const token = localStorage.getItem('kx_auth_token');
    if (!token) {
        container.innerHTML = '<p class="text-sm text-error">Vui lòng <a href="login.html" class="underline font-bold">đăng nhập</a> để thanh toán.</p>';
        return;
    }

    container.innerHTML = '<p class="text-sm text-on-surface-variant">Đang tải...</p>';
    try {
        const res  = await authFetchCheckout(`${CHECKOUT_API}/cart/index.php`);
        const data = await res.json();

        if (!data.success || !data.data.items.length) {
            container.innerHTML = '<p class="text-sm text-on-surface-variant">Giỏ hàng trống. <a href="products.html" class="underline font-bold text-primary">Mua sắm ngay</a></p>';
            return;
        }

        const items = data.data.items;
        container.innerHTML = items.map(item => `
            <div class="flex items-center gap-3 py-3 border-b border-outline-variant/20 last:border-0">
                <div class="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-2xl flex-shrink-0">👓</div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm text-primary truncate">${item.product_name || 'Sản phẩm'}</p>
                    <p class="text-xs text-on-surface-variant">${item.color || ''} × ${item.quantity}</p>
                </div>
                <p class="font-bold text-sm text-primary flex-shrink-0">${fmt((item.price || 0) * (item.quantity || 1))}</p>
            </div>
        `).join('');

        const subtotal = data.data.total_price || 0;
        const vat      = subtotal * 0.08;
        const total    = subtotal + vat;

        if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
        if (vatEl)      vatEl.textContent      = fmt(vat);
        if (totalEl)    totalEl.textContent    = fmt(total);

    } catch (e) {
        container.innerHTML = '<p class="text-sm text-error">Lỗi kết nối máy chủ.</p>';
    }
}

// ── Validate form giao hàng ──────────────────────────────────
function validateShippingForm() {
    const name    = document.getElementById('shipping-name')?.value.trim();
    const phone   = document.getElementById('shipping-phone')?.value.trim();
    const address = document.getElementById('shipping-address')?.value.trim();

    if (!name)    { window.showToast('Vui lòng nhập họ tên người nhận.', 'warning'); return false; }
    if (!phone)   { window.showToast('Vui lòng nhập số điện thoại.', 'warning'); return false; }
    if (!address) { window.showToast('Vui lòng nhập địa chỉ giao hàng.', 'warning'); return false; }
    if (!/^(0|\+84)[0-9]{8,10}$/.test(phone.replace(/\s/g, ''))) {
        window.showToast('Số điện thoại không hợp lệ.', 'warning'); return false;
    }
    return true;
}

// ── Đặt hàng ────────────────────────────────────────────────
async function submitOrder() {
    const token = localStorage.getItem('kx_auth_token');
    if (!token) { window.location.href = 'login.html'; return; }

    if (!validateShippingForm()) return;

    const btn = document.getElementById('checkout-complete-btn');
    if (btn.dataset.processing === 'true') return;
    btn.dataset.processing = 'true';
    btn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Đang xử lý...';
    btn.disabled = true;

    try {
        const res  = await authFetchCheckout(`${CHECKOUT_API}/orders/index.php`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> ĐẶT HÀNG THÀNH CÔNG';
            btn.style.background = '#4caf50';
            setTimeout(() => { window.location.href = 'order-success.html'; }, 800);
        } else {
            window.showToast(data.message || 'Đặt hàng thất bại.', 'error');
            btn.dataset.processing = 'false';
            btn.disabled = false;
            btn.innerHTML = '<span>HOÀN TẤT ĐẶT HÀNG</span><span class="material-symbols-outlined">arrow_forward</span>';
        }
    } catch (e) {
        window.showToast('Lỗi kết nối máy chủ.', 'error');
        btn.dataset.processing = 'false';
        btn.disabled = false;
        btn.innerHTML = '<span>HOÀN TẤT ĐẶT HÀNG</span><span class="material-symbols-outlined">arrow_forward</span>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCheckoutCart();

    const btn = document.getElementById('checkout-complete-btn');
    if (btn) btn.addEventListener('click', submitOrder);
});
