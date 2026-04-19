// admin-api.js – Kết nối API cho trang quản trị
const ADMIN_API = "./backend/api";

const fmt = (v) => Number(v || 0).toLocaleString("vi-VN") + "₫";

async function adminFetch(url, options = {}) {
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

// Load thống kê tổng quan
async function loadAdminStats() {
  const token = localStorage.getItem("kx_auth_token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await adminFetch(`${ADMIN_API}/admin/index.php`);
    const data = await res.json();

    if (!data.success) {
      if (res.status === 403) {
        window.showToast(
          "Bạn không có quyền truy cập trang quản trị.",
          "error",
        );
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000);
      }
      return;
    }

    const d = data.data;

    // Cập nhật các card thống kê
    const revenueEl = document.getElementById("stat-revenue");
    const ordersEl = document.getElementById("stat-orders");
    const usersEl = document.getElementById("stat-users");
    const productsEl = document.getElementById("stat-products");

    if (revenueEl) revenueEl.textContent = fmt(d.total_revenue);
    if (ordersEl)
      ordersEl.textContent = d.total_orders?.toLocaleString("vi-VN") || "0";
    if (usersEl)
      usersEl.textContent = d.total_users?.toLocaleString("vi-VN") || "0";
    if (productsEl)
      productsEl.textContent = d.total_products?.toLocaleString("vi-VN") || "0";
  } catch (e) {
    console.error("loadAdminStats error:", e);
    window.showToast("Lỗi tải dữ liệu thống kê.", "error");
  }
}

// Load đơn hàng gần đây
async function loadRecentOrders() {
  const tbody = document.getElementById("recent-orders-tbody");
  if (!tbody) return;

  const statusLabel = {
    pending: { text: "Chờ xác nhận", cls: "bg-yellow-100 text-yellow-800" },
    confirmed: { text: "Đã xác nhận", cls: "bg-blue-100 text-blue-800" },
    shipping: { text: "Đang giao", cls: "bg-indigo-100 text-indigo-800" },
    completed: { text: "Hoàn thành", cls: "bg-green-100 text-green-800" },
    cancelled: { text: "Đã hủy", cls: "bg-red-100 text-red-800" },
  };

  tbody.innerHTML =
    '<tr><td colspan="5" class="px-8 py-5 text-center text-on-surface-variant text-sm">Đang tải...</td></tr>';

  try {
    // Dùng orders API – lấy tất cả (admin có thể xem tất cả nếu mở rộng sau)
    // Hiện tại API orders chỉ trả đơn của user đang đăng nhập (admin)
    const res = await adminFetch(`${ADMIN_API}/orders/index.php`);
    const data = await res.json();

    if (!data.success || !data.data.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="px-8 py-5 text-center text-on-surface-variant text-sm">Chưa có đơn hàng nào.</td></tr>';
      return;
    }

    tbody.innerHTML = data.data
      .slice(0, 10)
      .map((order) => {
        const s = statusLabel[order.status] || {
          text: order.status,
          cls: "bg-gray-100 text-gray-700",
        };
        const date = order.created_at
          ? new Date(order.created_at).toLocaleDateString("vi-VN")
          : "";
        const id = "#KX-" + order.id.slice(-6).toUpperCase();
        return `
            <tr class="hover:bg-surface-container-low/50 transition-colors">
                <td class="px-8 py-5 font-mono text-sm text-primary">${id}</td>
                <td class="px-8 py-5 text-sm text-on-surface">${date}</td>
                <td class="px-8 py-5 text-sm">${order.items?.length || 0} sản phẩm</td>
                <td class="px-8 py-5">
                    <span class="px-3 py-1 text-xs font-bold rounded-full ${s.cls}">${s.text}</span>
                </td>
                <td class="px-8 py-5 text-right font-bold text-primary">${fmt(order.total_price)}</td>
            </tr>`;
      })
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="px-8 py-5 text-center text-error text-sm">Lỗi tải dữ liệu.</td></tr>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAdminStats();
  loadRecentOrders();
});
