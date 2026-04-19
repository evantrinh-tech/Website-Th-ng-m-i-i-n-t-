function initCartCheckout() {
  const btn = document.getElementById("cart-checkout-btn");
  if (!btn) return;

  btn.addEventListener("click", function () {
    const totalText =
      document.getElementById("cart-thanh-tien")?.innerText || "0";
    const total = parseInt(totalText.replace(/\D/g, "")) || 0;

    if (total <= 0) {
      alert("Giỏ hàng trống hoặc chưa tính được tổng tiền");
      return;
    }

    localStorage.setItem("checkout_total", total);
    window.location.href = "checkout.html";
  });
}

document.addEventListener("DOMContentLoaded", initCartCheckout);
