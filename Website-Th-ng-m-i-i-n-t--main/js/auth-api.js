// Logic tích hợp API Đăng nhập và Đăng ký

const API_AUTH_BASE = "./backend/api/auth";

// Redirect nếu đã đăng nhập
(function checkAlreadyLoggedIn() {
  const token = localStorage.getItem("kx_auth_token");
  const path = window.location.pathname;
  if (
    token &&
    (path.includes("login.html") || path.includes("register.html"))
  ) {
    window.location.href = "index.html";
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btn = document.getElementById("login-submit-btn");
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        alert("Vui lòng nhập đầy đủ email và mật khẩu!");
        return;
      }

      const originText = btn.innerText;
      btn.innerText = "Đang xử lý...";
      btn.disabled = true;

      try {
        const response = await fetch(`${API_AUTH_BASE}/login.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (result.success) {
          // Lưu Token và Thông tin User vào LocalStorage
          localStorage.setItem("kx_auth_token", result.data.token);
          localStorage.setItem("kx_user", JSON.stringify(result.data.user));

          alert("Đăng nhập thành công!");

          const user = result.data.user;

          if (user.role_id === 1) {
            window.location.href = "admin.html"; // 👈 trang admin
          } else {
            window.location.href = "index.html"; // 👈 user thường
          }
        } else {
          alert(result.message || "Đăng nhập thất bại.");
        }
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi gọi máy chủ.");
      } finally {
        btn.innerText = originText;
        btn.disabled = false;
      }
    });
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btn = document.getElementById("register-submit-btn");
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value.trim();
      const confirm_password = document
        .getElementById("confirm_password")
        .value.trim();

      if (!name || !email || !password || !confirm_password) {
        alert("Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu!");
        return;
      }

      if (password !== confirm_password) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
      }

      const originText = btn.innerText;
      btn.innerText = "Đang xử lý...";
      btn.disabled = true;

      try {
        const response = await fetch(`${API_AUTH_BASE}/register.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password }),
        });

        const result = await response.json();

        if (result.success) {
          localStorage.setItem("kx_auth_token", result.data.token);
          localStorage.setItem("kx_user", JSON.stringify(result.data.user));

          alert("Đăng ký thành công! Chào mừng bạn đến với Kính Xanh.");
          window.location.href = "index.html";
        } else {
          alert(result.message || "Đăng ký thất bại.");
        }
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi kết nối máy chủ.");
      } finally {
        btn.innerText = originText;
        btn.disabled = false;
      }
    });
  }

  // Helper: Thêm Token vào Header cho các Request sau
  window.AuthFetcher = async (url, options = {}) => {
    const token = localStorage.getItem("kx_auth_token");
    const headers = { ...options.headers };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(url, { ...options, headers });
  };
});
// Xử lý Google OAuth callback
const params = new URLSearchParams(window.location.search);
const googleToken = params.get("google_token");
const googleName = params.get("name");

if (googleToken) {
  localStorage.setItem("kx_auth_token", googleToken);
  localStorage.setItem("kx_user", JSON.stringify({ name: googleName }));
  window.location.href = "index.html";
}
