// Tích hợp API Giỏ hàng Kính Xanh
const API_CART_BASE = './backend/api';

document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-items-container');
    const btnCheckout = document.getElementById('cart-checkout-btn');

    const currency = (value) => Number(value || 0).toLocaleString('vi-VN') + '₫';

    // Render function
    const renderCartItem = (item) => `
        <div class="flex flex-col md:flex-row items-center gap-6 bg-surface-container-low p-6 rounded-2xl relative" data-aos="fade-up">
            <button onclick="removeCartItem('${item.id}')" class="absolute top-4 right-4 text-outline hover:text-error transition-colors">
                <span class="material-symbols-outlined">delete</span>
            </button>
            <div class="w-full md:w-32 h-32 bg-surface-container-lowest rounded-xl flex items-center justify-center p-2 overflow-hidden">
                <div class="text-4xl">👓</div>
            </div>
            <div class="flex-grow space-y-2 text-center md:text-left">
                <h3 class="font-headline font-bold text-xl text-primary">${item.product_name || 'Sản phẩm'}</h3>
                <p class="text-sm font-medium uppercase tracking-widest text-on-surface-variant">Phân loại: ${item.color || 'Mặc định'}</p>
                <div class="font-headline font-extrabold text-2xl text-primary">${currency(item.price)}</div>
            </div>
            <div class="flex items-center gap-4 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/30">
                <button onclick="updateCartQty('${item.id}', ${(item.quantity||1) - 1})" class="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-variant rounded-lg transition-colors" ${(item.quantity||1) <= 1 ? 'disabled' : ''}>
                    <span class="material-symbols-outlined">remove</span>
                </button>
                <span class="font-bold text-lg w-8 text-center">${item.quantity || 1}</span>
                <button onclick="updateCartQty('${item.id}', ${(item.quantity||1) + 1})" class="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-variant rounded-lg transition-colors">
                    <span class="material-symbols-outlined">add</span>
                </button>
            </div>
        </div>
    `;

    const loadCart = async () => {
        if (!cartContainer) return;
        
        cartContainer.innerHTML = '<p class="text-center">Đang tải giỏ hàng...</p>';
        try {
            let token = localStorage.getItem('kx_auth_token');
            if(!token) {
                cartContainer.innerHTML = '<p class="text-center text-error">Vui lòng <a href="login.html" class="underline font-bold text-primary">đăng nhập</a> để xem giỏ hàng.</p>';
                return;
            }

            const response = await fetch(`${API_CART_BASE}/cart/index.php`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Kiểm tra response có phải JSON không
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Cart API trả về không phải JSON:', text);
                cartContainer.innerHTML = '<p class="text-center text-error">Lỗi server. Xem console để biết chi tiết.</p>';
                return;
            }

            const result = await response.json();
            console.log('Cart API response:', result);

            if(result.success && result.data && result.data.items && result.data.items.length > 0) {
                const items = result.data.items;
                cartContainer.innerHTML = items.map(renderCartItem).join('');

                const tmpTotal = result.data.total_price || 0;
                const vat = tmpTotal * 0.08;
                const grandTotal = tmpTotal + vat;

                document.getElementById('cart-tam-tinh').innerText = currency(tmpTotal);
                document.getElementById('cart-vat').innerText = currency(vat);
                document.getElementById('cart-thanh-tien').innerText = currency(grandTotal);

                // Cập nhật header đếm sản phẩm
                const countEl = document.querySelector('header p, main header p');
                if (countEl) countEl.textContent = `Bạn có ${items.length} sản phẩm trong giỏ hàng`;
            } else {
                cartContainer.innerHTML = '<p class="text-center text-on-surface-variant">Giỏ hàng của bạn đang trống.</p>';
                document.getElementById('cart-tam-tinh').innerText = '0₫';
                document.getElementById('cart-vat').innerText = '0₫';
                document.getElementById('cart-thanh-tien').innerText = '0₫';

                const countEl = document.querySelector('main header p');
                if (countEl) countEl.textContent = 'Giỏ hàng trống';

                if (!result.success) {
                    console.warn('Cart API lỗi:', result.message);
                }
            }
        } catch (e) {
            console.error('loadCart exception:', e);
            cartContainer.innerHTML = '<p class="text-center text-error">Lỗi kết nối máy chủ.</p>';
        }
    };

    window.removeCartItem = async (itemId) => {
        if(!confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;
        
        let token = localStorage.getItem('kx_auth_token');
        try {
            await fetch(`${API_CART_BASE}/cart/index.php`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cart_item_id: itemId })
            });
            loadCart();
        } catch (e) {
            window.showToast('Lỗi khi xóa sản phẩm', 'error');
        }
    };

    window.updateCartQty = async (itemId, newQty) => {
        if (newQty < 1) { window.removeCartItem(itemId); return; }
        let token = localStorage.getItem('kx_auth_token');
        try {
            await fetch(`${API_CART_BASE}/cart/index.php`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cart_item_id: itemId, quantity: newQty })
            });
            loadCart();
        } catch (e) {
            window.showToast('Lỗi cập nhật số lượng', 'error');
        }
    };

    if (btnCheckout) {
        btnCheckout.addEventListener('click', async () => {
            let token = localStorage.getItem('kx_auth_token');
            if(!token) {
                alert('Vui lòng đăng nhập!'); window.location.href='login.html'; return;
            }

            btnCheckout.innerText = 'Đang xử lý...';
            try {
                const res = await fetch(`${API_CART_BASE}/orders/index.php`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if(result.success) {
                    window.location.href = 'order-success.html'; // Chuyển sang trang báo thành công
                } else {
                    alert(result.message || 'Lỗi tạo đơn hàng');
                }
            } catch(e) {
                alert('Có lỗi xảy ra.');
            } finally {
                btnCheckout.innerText = 'Tiến hành thanh toán';
            }
        });
    }

    loadCart();
});
