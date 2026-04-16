// profile-api.js – Kết nối API cho trang hồ sơ cá nhân
const API_BASE = './backend/api';

const currency = (v) => Number(v || 0).toLocaleString('vi-VN') + '₫';

const statusLabel = {
    pending:   { text: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-800' },
    confirmed: { text: 'Đã xác nhận',  cls: 'bg-blue-100 text-blue-800' },
    shipping:  { text: 'Đang giao',    cls: 'bg-indigo-100 text-indigo-800' },
    completed: { text: 'Hoàn thành',   cls: 'bg-green-100 text-green-800' },
    cancelled: { text: 'Đã hủy',       cls: 'bg-red-100 text-red-800' },
};

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('kx_auth_token');
    return fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options.headers || {}) }
    });
}

// ── Load thông tin user ──────────────────────────────────────
async function loadProfile() {
    const token = localStorage.getItem('kx_auth_token');
    if (!token) { window.location.href = 'login.html'; return; }

    try {
        const res  = await authFetch(`${API_BASE}/auth/me.php`);
        const data = await res.json();
        if (!data.success) { window.location.href = 'login.html'; return; }

        const u = data.data;
        // Avatar chữ cái đầu
        document.querySelectorAll('[data-user-avatar]').forEach(el => el.textContent = (u.name || 'U')[0].toUpperCase());
        document.querySelectorAll('[data-user-name]').forEach(el  => el.textContent = u.name  || '');
        document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = u.email || '');

        // Điền vào form
        const nameInput  = document.getElementById('profile-name');
        const phoneInput = document.getElementById('profile-phone');
        const emailInput = document.getElementById('profile-email');
        if (nameInput)  nameInput.value  = u.name  || '';
        if (phoneInput) phoneInput.value = u.phone || '';
        if (emailInput) emailInput.value = u.email || '';
    } catch (e) {
        console.error('loadProfile error:', e);
    }
}

// ── Lưu thông tin user ──────────────────────────────────────
async function saveProfile(e) {
    e.preventDefault();
    const btn = document.getElementById('profile-save-btn');
    const name  = document.getElementById('profile-name')?.value.trim();
    const phone = document.getElementById('profile-phone')?.value.trim();
    const currentPw = document.getElementById('profile-current-password')?.value;
    const newPw     = document.getElementById('profile-new-password')?.value;

    if (!name) { window.showToast('Họ tên không được để trống.', 'warning'); return; }

    const body = { name, phone };
    if (newPw) { body.current_password = currentPw; body.new_password = newPw; }

    btn.disabled = true; btn.textContent = 'Đang lưu...';
    try {
        const res  = await authFetch(`${API_BASE}/auth/me.php`, { method: 'PUT', body: JSON.stringify(body) });
        const data = await res.json();
        if (data.success) {
            // Cập nhật localStorage
            const stored = JSON.parse(localStorage.getItem('kx_user') || '{}');
            stored.name = name;
            localStorage.setItem('kx_user', JSON.stringify(stored));
            document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = name);
            document.querySelectorAll('[data-user-avatar]').forEach(el => el.textContent = name[0].toUpperCase());
            window.showToast('Cập nhật thông tin thành công!', 'success');
            // Xóa trường mật khẩu
            if (document.getElementById('profile-current-password')) document.getElementById('profile-current-password').value = '';
            if (document.getElementById('profile-new-password'))     document.getElementById('profile-new-password').value = '';
        } else {
            window.showToast(data.message || 'Cập nhật thất bại.', 'error');
        }
    } catch (err) {
        window.showToast('Lỗi kết nối máy chủ.', 'error');
    } finally {
        btn.disabled = false; btn.textContent = 'Lưu Thay Đổi';
    }
}

// ── Load đơn hàng ────────────────────────────────────────────
async function loadOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;

    container.innerHTML = '<p class="text-sm text-on-surface-variant">Đang tải đơn hàng...</p>';
    try {
        const res  = await authFetch(`${API_BASE}/orders/index.php`);
        const data = await res.json();
        if (!data.success || !data.data.length) {
            container.innerHTML = '<p class="text-sm text-on-surface-variant">Bạn chưa có đơn hàng nào.</p>';
            return;
        }
        container.innerHTML = data.data.map(order => {
            const s = statusLabel[order.status] || { text: order.status, cls: 'bg-gray-100 text-gray-700' };
            const date = order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : '';
            return `
            <div class="flex items-center justify-between p-4 bg-surface-container-low rounded-xl mb-3">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                        <span class="material-symbols-outlined">local_shipping</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-primary">#${order.id.slice(-8).toUpperCase()}</h4>
                        <p class="text-sm text-on-surface-variant">${order.items?.length || 0} sản phẩm • ${date}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="inline-block px-2 py-1 rounded-full text-xs font-bold ${s.cls} mb-1">${s.text}</span>
                    <p class="font-bold text-primary">${currency(order.total_price)}</p>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        container.innerHTML = '<p class="text-sm text-error">Lỗi tải đơn hàng.</p>';
    }
}

// ── Đăng xuất ────────────────────────────────────────────────
function logout() {
    localStorage.removeItem('kx_auth_token');
    localStorage.removeItem('kx_user');
    window.location.href = 'login.html';
}

// ── Khởi động ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadOrders();

    const form = document.getElementById('profile-form');
    if (form) form.addEventListener('submit', saveProfile);

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
});
