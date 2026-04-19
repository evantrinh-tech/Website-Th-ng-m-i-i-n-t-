const API_CART_BASE = "./backend/api/cart";

document.addEventListener("DOMContentLoaded", () => {
  const cartContainer = document.getElementById("cart-items-container");
  const btnCheckout = document.getElementById("cart-checkout-btn");

  const currency = (value) => Number(value || 0).toLocaleString("vi-VN") + "₫";

  // =========================
  // RENDER ITEM
  // =========================
  const renderCartItem = (item) => `
    <div class="flex flex-col md:flex-row items-center gap-6 bg-surface-container-low p-6 rounded-2xl relative" data-aos="fade-up">

        <button onclick="removeCartItem('${item.id}')"
            class="absolute top-4 right-4 text-outline hover:text-error transition-colors">
            <span class="material-symbols-outlined">delete</span>
        </button>

        <div class="w-full md:w-32 h-32 bg-surface-container-lowest rounded-xl overflow-hidden flex-shrink-0">
            ${
              item.thumbnail_url
                ? `<img src="${item.thumbnail_url}" alt="${item.product_name || ""}" class="w-full h-full object-cover" />`
                : `<div class="w-full h-full flex items-center justify-center text-4xl">👓</div>`
            }
        </div>

        <div class="flex-grow space-y-2 text-center md:text-left">
            <h3 class="font-headline font-bold text-xl text-primary">
                ${item.product_name || "Sản phẩm"}
            </h3>
            <p class="text-sm font-medium uppercase tracking-widest text-on-surface-variant">
                Phân loại: ${item.color || "Mặc định"}
            </p>
            <div class="font-headline font-extrabold text-2xl text-primary">
                ${currency(item.price)}
            </div>
        </div>

        <div class="flex items-center gap-4 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/30">
            <button onclick="updateCartQty('${item.id}', ${(item.quantity || 1) - 1})"
                class="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-variant rounded-lg transition-colors"
                ${(item.quantity || 1) <= 1 ? "disabled" : ""}>
                <span class="material-symbols-outlined">remove</span>
            </button>
            <span class="font-bold text-lg w-8 text-center">
                ${item.quantity || 1}
            </span>
            <button onclick="updateCartQty('${item.id}', ${(item.quantity || 1) + 1})"
                class="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-variant rounded-lg transition-colors">
                <span class="material-symbols-outlined">add</span>
            </button>
        </div>

    </div>
  `;

  // =========================
  // LOAD CART
  // =========================
  const loadCart = async () => {
    if (!cartContainer) return;

    cartContainer.innerHTML = '<p class="text-center">Đang tải giỏ hàng...</p>';

    try {
      const token = localStorage.getItem("kx_auth_token");

      if (!token) {
        cartContainer.innerHTML =
          '<p class="text-center text-error">Vui lòng <a href="login.html" class="underline font-bold text-primary">đăng nhập</a> để xem giỏ hàng.</p>';
        return;
      }

      const response = await fetch(`${API_CART_BASE}/index.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      console.log("🔥 CART RESPONSE:", result);
      console.log("📦 ITEMS:", result?.data?.items);

      if (
        result.success &&
        result.data &&
        Array.isArray(result.data.items) &&
        result.data.items.length > 0
      ) {
        const items = result.data.items;

        cartContainer.innerHTML = items.map(renderCartItem).join("");

        const tmpTotal = result.data.total_price || 0;
        const vat = tmpTotal * 0.08;
        const grandTotal = tmpTotal + vat;

        document.getElementById("cart-tam-tinh").innerText = currency(tmpTotal);
        document.getElementById("cart-vat").innerText = currency(vat);
        document.getElementById("cart-thanh-tien").innerText =
          currency(grandTotal);

        const countEl = document.querySelector("main header p");
        if (countEl) {
          countEl.textContent = `Bạn có ${items.length} sản phẩm trong giỏ hàng`;
        }

        if (typeof AOS !== "undefined") AOS.refresh();

        // Enable nút checkout
        if (btnCheckout) {
          btnCheckout.disabled = false;
          btnCheckout.classList.remove("opacity-50", "cursor-not-allowed");
        }
      } else {
        cartContainer.innerHTML =
          '<p class="text-center text-on-surface-variant">Giỏ hàng của bạn đang trống.</p>';

        document.getElementById("cart-tam-tinh").innerText = "0₫";
        document.getElementById("cart-vat").innerText = "0₫";
        document.getElementById("cart-thanh-tien").innerText = "0₫";

        const countEl = document.querySelector("main header p");
        if (countEl) countEl.textContent = "Giỏ hàng trống";
        // Disable nút checkout
        if (btnCheckout) {
          btnCheckout.disabled = true;
          btnCheckout.classList.add("opacity-50", "cursor-not-allowed");
        }
      }
    } catch (err) {
      console.error("loadCart error:", err);
      cartContainer.innerHTML =
        '<p class="text-center text-error">Lỗi kết nối server.</p>';
    }
  };

  // =========================
  // DELETE ITEM
  // =========================
  window.removeCartItem = async (id) => {
    if (!confirm("Xóa sản phẩm?")) return;

    const token = localStorage.getItem("kx_auth_token");

    await fetch(`${API_CART_BASE}/index.php`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cart_item_id: id }),
    });

    loadCart();
  };

  // =========================
  // UPDATE QTY
  // =========================
  window.updateCartQty = async (id, qty) => {
    if (qty < 1) return window.removeCartItem(id);

    const token = localStorage.getItem("kx_auth_token");

    await fetch(`${API_CART_BASE}/index.php`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cart_item_id: id, quantity: qty }),
    });

    loadCart();
  };

  // =========================
  // CHECKOUT
  // =========================
  if (btnCheckout) {
    btnCheckout.addEventListener("click", () => {
      const token = localStorage.getItem("kx_auth_token");
      if (!token) {
        alert("Vui lòng đăng nhập");
        window.location.href = "login.html";
        return;
      }
      window.location.href = "checkout.html";
    });
    //   const token = localStorage.getItem("kx_auth_token");

    //   if (!token) {
    //     alert("Vui lòng đăng nhập");
    //     window.location.href = "login.html";
    //     return;
    //   }

    //   btnCheckout.innerText = "Đang xử lý...";

    //   try {
    //     const res = await fetch(`./backend/api/orders/index.php`, {
    //       method: "POST",
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({}),
    //     });

    //     const data = await res.json();

    //     if (data.success) {
    //       window.location.href = "checkout.html";
    //     } else {
    //       alert(data.message || "Lỗi thanh toán");
    //     }
    //   } catch (e) {
    //     alert("Có lỗi xảy ra.");
    //   } finally {
    //     btnCheckout.innerText = "Tiến hành thanh toán";
    //   }
    // });
  }

  loadCart();
});
