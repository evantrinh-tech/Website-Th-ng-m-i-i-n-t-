// ============================================
// GLOBAL TOAST SYSTEM
// ============================================
const toastStyle = document.createElement('style');
toastStyle.innerHTML = `
    .sys-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        color: #00113a;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,23,102,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 100000;
        transform: translateX(120%) translateY(-10px) scale(0.95);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        font-family: 'Manrope', sans-serif;
        font-weight: 700;
        font-size: 14px;
        border-left: 4px solid #4caf50;
    }
    .sys-toast.show {
        transform: translateX(0) translateY(0) scale(1);
        opacity: 1;
    }
`;
document.head.appendChild(toastStyle);

window.showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = 'sys-toast';

    let color = '#4caf50';
    let icon = 'check_circle';

    if (message.toLowerCase().includes('vui lòng') || message.toLowerCase().includes('lỗi')) type = 'warning';

    if (type === 'error') { color = '#e53935'; icon = 'error'; }
    if (type === 'info') { color = '#0288d1'; icon = 'info'; }
    if (type === 'warning') { color = '#fb8c00'; icon = 'warning'; }

    toast.style.borderLeftColor = color;
    toast.innerHTML = `<span class="material-symbols-outlined" style="color: ${color}; font-variation-settings: 'FILL' 1;">${icon}</span> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

window.alert = window.showToast;

function animateAddToCartButton(button) {
    if (!button) return;

    const originalHTML = button.dataset.originalHtml || button.innerHTML;
    button.dataset.originalHtml = originalHTML;

    const iconText = button.querySelector('.material-symbols-outlined')?.innerText?.trim() || '';
    const isIconOnly = iconText === 'add_shopping_cart' && !(button.innerText || '').includes('Thêm vào giỏ');

    if (isIconOnly) {
        button.innerHTML = '<span class="material-symbols-outlined">check</span>';
    } else {
        button.innerHTML = '<span class="material-symbols-outlined text-[20px]">check_circle</span> Đã thêm';
        button.style.backgroundColor = '#4caf50';
        button.style.color = 'white';
    }

    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.style.backgroundColor = '';
        button.style.color = '';
    }, 1500);
}

function ensureCartBadges() {
    document.querySelectorAll('header, nav').forEach(root => {
        const cartTargets = Array.from(root.querySelectorAll('a, button')).filter(el => {
            const icon = el.querySelector('.material-symbols-outlined') || (el.classList.contains('material-symbols-outlined') ? el : null);
            return icon && (icon.innerText || '').trim() === 'shopping_cart';
        });

        cartTargets.forEach(target => {
            const wrapper = target.parentElement;
            if (!wrapper) return;
            if (wrapper.querySelector('[data-cart-count]')) return;
            wrapper.classList.add('relative');
            const badge = document.createElement('span');
            badge.setAttribute('data-cart-count', 'true');
            badge.className = 'absolute -top-2 -right-2 bg-secondary text-on-secondary text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center pointer-events-none';
            badge.innerText = '0';
            wrapper.appendChild(badge);
        });
    });
}

// Cart badge sync – handled by add-to-cart.js (window.refreshCartBadge)

document.addEventListener('DOMContentLoaded', () => {
    ensureCartBadges();

    // 2. Tính năng Yêu thích sản phẩm (Đổi màu tim)
    const icons = document.querySelectorAll('span.material-symbols-outlined');
    icons.forEach(icon => {
        if (icon.innerText.trim() === 'favorite') {
            const btn = icon.parentElement;
            if (btn.tagName === 'BUTTON') {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Tránh bị click trùng vào thẻ cha

                    // Bật/tắt trạng thái trái tim (chuyển đỏ và lấp đầy)
                    if (icon.style.fontVariationSettings.includes('"FILL" 1')) {
                        icon.style.fontVariationSettings = '"FILL" 0';
                        icon.style.color = '';
                    } else {
                        icon.style.fontVariationSettings = '"FILL" 1';
                        icon.style.color = '#e91e63'; // Màu hồng đỏ
                    }
                });
            }
        }
    });

    // Lấy tên file hiện tại từ URL
    const urlPath = window.location.pathname;

    // 3. Tính năng cho trang Giỏ Hàng (Cart)
    if (urlPath.includes('cart.html')) {
        const updatePrice = (qty) => {
            const unitPrice = 3200000; // Giá cứng của kính Milan 01
            const taxRate = 0.08;

            // Update giá dòng item
            const lineTotalPrices = document.querySelectorAll('.text-xl.font-extrabold.text-primary');
            if (lineTotalPrices.length > 0) {
                lineTotalPrices[0].innerText = (unitPrice * qty).toLocaleString('vi-VN') + '₫';
            }

            // Update bảng tổng kết
            const summaryValues = document.querySelectorAll('.space-y-4 .font-bold');
            if (summaryValues.length >= 2) {
                const subTotal = unitPrice * qty;
                const taxTotal = subTotal * taxRate;
                summaryValues[0].innerText = subTotal.toLocaleString('vi-VN') + '₫'; // Tạm tính
                summaryValues[1].innerText = taxTotal.toLocaleString('vi-VN') + '₫'; // Thuế

                const finalTotal = document.querySelector('.font-headline.font-extrabold.text-3xl');
                if (finalTotal) {
                    finalTotal.innerText = (subTotal + taxTotal).toLocaleString('vi-VN') + '₫';
                }
            }
        };

        const quantitySpan = document.querySelector('.w-10.text-center.font-bold');
        const quantityContainer = quantitySpan ? quantitySpan.parentElement : null;

        if (quantityContainer) {
            const minusBtn = quantityContainer.querySelectorAll('button')[0];
            const plusBtn = quantityContainer.querySelectorAll('button')[1];

            let qty = parseInt(quantitySpan.innerText) || 1;

            if (minusBtn) {
                minusBtn.addEventListener('click', () => {
                    if (qty > 1) {
                        qty--;
                        quantitySpan.innerText = qty;
                        updatePrice(qty);
                    }
                });
            }
            if (plusBtn) {
                plusBtn.addEventListener('click', () => {
                    qty++;
                    quantitySpan.innerText = qty;
                    updatePrice(qty);
                });
            }
        }

        // Xóa sản phẩm
        const deleteBtn = document.querySelector('button.text-error');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                const itemRow = e.target.closest('.bg-surface-container-lowest');
                if (itemRow) {
                    itemRow.style.transition = 'opacity 0.3s ease';
                    itemRow.style.opacity = '0';
                    setTimeout(() => {
                        itemRow.style.display = 'none';
                        updatePrice(0);
                        const headerMsg = document.querySelector('header p');
                        if (headerMsg) headerMsg.innerText = "Bạn chưa có sản phẩm nào trong giỏ hàng";
                    }, 300);
                }
            });
        }

        // Mã giảm giá
        const applyPromoBtn = document.querySelector('button.bg-primary.text-on-primary.px-4.py-3');
        if (applyPromoBtn) {
            applyPromoBtn.addEventListener('click', () => {
                const input = applyPromoBtn.previousElementSibling;
                if (input && input.value.trim() !== '') {
                    applyPromoBtn.innerText = 'ĐÃ ÁP DỤNG';
                    applyPromoBtn.style.backgroundColor = '#4caf50';
                    setTimeout(() => alert('Đã áp dụng mã giảm giá: ' + input.value), 100);
                } else {
                    alert('Vui lòng nhập mã giảm giá!');
                    if (input) input.focus();
                }
            });
        }
    }

    // 4. Tính năng trang Thanh Toán (Checkout)
    if (urlPath.includes('checkout.html')) {
        const submitOrderBtn = document.getElementById('checkout-complete-btn') || Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.includes('HOÀN TẤT ĐẶT HÀNG'));

        if (submitOrderBtn) {
            submitOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const checkoutItems = getCheckoutItems();
                if (checkoutItems.length === 0) {
                    showToast('Không có sản phẩm nào để thanh toán.', 'warning');
                    return;
                }
                if (submitOrderBtn.dataset.processing === 'true') return;
                submitOrderBtn.dataset.processing = 'true';
                submitOrderBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> ĐẶT HÀNG THÀNH CÔNG';
                submitOrderBtn.style.background = '#4caf50';

                const paidNames = new Set(checkoutItems.map(item => item.name));
                globalCart = globalCart.filter(item => !(item.selected !== false && paidNames.has(item.name)));
                localStorage.setItem('kx_cart', JSON.stringify(globalCart));
                buffCartCount();

                setTimeout(() => {
                    alert('Đặt hàng thành công! Cảm ơn bạn đã tin tưởng Kính Xanh.');
                    window.location.href = 'order-success.html';
                }, 500);
            });
        }
    }

    // 5. Tính năng trang Đăng nhập (Login) - Xử lý bởi auth-api.js
    // (Đã xóa fake login, auth-api.js đảm nhiệm toàn bộ)

    // 6. Tính năng trang Chi tiết sản phẩm (Product Detail)
    if (urlPath.includes('product-detail.html')) {
        // Thumbnail gallery (Click thumbnail để đổi hình chính)
        const thumbnailsContainer = document.querySelectorAll('.col-span-2 .aspect-square');
        const mainImage = document.querySelector('.col-span-10 .aspect-\\[4\\/5\\] img');
        if (thumbnailsContainer.length > 0 && mainImage) {
            thumbnailsContainer.forEach(thumbContainer => {
                const img = thumbContainer.querySelector('img');
                thumbContainer.addEventListener('click', () => {
                    // Update main image src
                    mainImage.src = img.src;

                    // Update opacity / ring state
                    thumbnailsContainer.forEach(tc => {
                        tc.classList.remove('ring-2', 'ring-primary', 'opacity-100');
                        tc.classList.add('opacity-60');
                    });
                    thumbContainer.classList.add('ring-2', 'ring-primary', 'opacity-100');
                    thumbContainer.classList.remove('opacity-60');
                });
            });
        }

        // Color selection (Chọn màu)
        const colorBtns = document.querySelectorAll('.space-x-4 button.rounded-full');
        if (colorBtns.length > 0) {
            let colorLabelElement = null;
            document.querySelectorAll('label').forEach(lbl => {
                if (lbl.innerText.includes('Màu sắc gọng:')) colorLabelElement = lbl;
            });

            const colorNames = ['Black', 'Gold', 'Silver'];

            colorBtns.forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    // Reset all
                    colorBtns.forEach(b => {
                        b.classList.remove('ring-2', 'ring-primary');
                        b.classList.add('ring-1', 'ring-outline-variant');
                        b.classList.remove('ring-offset-2');
                    });
                    // Set active
                    btn.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                    btn.classList.remove('ring-1', 'ring-outline-variant');

                    if (colorLabelElement) {
                        colorLabelElement.innerHTML = `Màu sắc gọng: <span class="text-secondary">${colorNames[index] || 'Custom'}</span>`;
                    }

                    // sticky purchase bar sub text
                    const stickyLabel = document.querySelector('.fixed.bottom-0 p.text-xs.text-outline');
                    if (stickyLabel) {
                        const currentLens = stickyLabel.innerText.split('/')[1]?.trim() || 'Tròng mẫu';
                        stickyLabel.innerText = `Đã chọn: ${colorNames[index] || 'Custom'} / ${currentLens}`;
                    }
                });
            });
        }

        // Lens selection (Chọn tròng kính)
        const lensBtns = document.querySelectorAll('.grid.grid-cols-2.gap-3 button');
        if (lensBtns.length > 0) {
            lensBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    lensBtns.forEach(b => {
                        b.classList.remove('border-primary', 'bg-surface-container-lowest');
                        b.classList.add('border-transparent', 'bg-surface-container');
                    });
                    btn.classList.add('border-primary', 'bg-surface-container-lowest');
                    btn.classList.remove('border-transparent', 'bg-surface-container');

                    // sticky purchase bar sub text
                    const stickyLabel = document.querySelector('.fixed.bottom-0 p.text-xs.text-outline');
                    if (stickyLabel) {
                        const currentColor = stickyLabel.innerText.split('/')[0]?.replace('Đã chọn:', '').trim() || 'Black';
                        const lensName = btn.querySelector('.font-bold').innerText;
                        stickyLabel.innerText = `Đã chọn: ${currentColor} / ${lensName}`;
                    }
                });
            });
        }

        // Detail Tabs switching (Chuyển tab Mô tả, Thông số,...)
        const tabs = document.querySelectorAll('.flex.border-b.border-surface-container-highest button');
        if (tabs.length > 0) {
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => {
                        t.classList.remove('border-b-2', 'border-primary', 'text-primary');
                        t.classList.add('text-outline');
                    });
                    tab.classList.add('border-b-2', 'border-primary', 'text-primary');
                    tab.classList.remove('text-outline');
                });
            });
        }

        // Upload prescription file fake (Mô phỏng nút Tải lên đơn thuốc)
        const uploadBtn = document.querySelector('.p-6.bg-surface-container-low button');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                let fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*,.pdf';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);

                fileInput.addEventListener('change', () => {
                    if (fileInput.files.length > 0) {
                        uploadBtn.innerText = fileInput.files[0].name;
                        alert('Tải lên thành công: ' + fileInput.files[0].name);
                    }
                    document.body.removeChild(fileInput);
                });

                fileInput.click();
            });
        }
    }

    // 7. Tính năng trang Danh sách sản phẩm (Products list) - Phân trang, Bộ lọc
    if (urlPath.includes('products.html') || urlPath.includes('index.html')) {
        // Phân trang
        const pageBtns = document.querySelectorAll('.mt-20.flex.justify-center.items-center button');
        pageBtns.forEach(btn => {
            if (!btn.querySelector('.material-symbols-outlined') && btn.innerText !== '...') {
                btn.addEventListener('click', () => {
                    pageBtns.forEach(b => {
                        if (!b.querySelector('.material-symbols-outlined')) {
                            b.classList.remove('bg-primary', 'text-white', 'font-bold');
                            b.classList.add('bg-white', 'text-slate-600', 'font-semibold');
                        }
                    });
                    btn.classList.add('bg-primary', 'text-white', 'font-bold');
                    btn.classList.remove('bg-white', 'text-slate-600', 'font-semibold');
                });
            }
        });

        // Xóa tất cả bộ lọc (Clear All)
        const clearAllBtn = document.querySelector('button.text-xs.font-semibold.text-primary.underline');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const checkboxes = document.querySelectorAll('aside input[type="checkbox"]');
                checkboxes.forEach(cb => cb.checked = false);
                alert("Đã xóa mọi tuỳ chọn bộ lọc!");
            });
        }

        // 7.1. Chức năng Lọc theo Thương hiệu, Loại tròng (Checkbox)
        const filterCheckboxes = document.querySelectorAll('aside input[type="checkbox"], #mobile-filter-drawer input[type="checkbox"]');
        filterCheckboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                const label = e.target.closest('label');
                if (label) {
                    const filterName = label.innerText.trim();
                    if (e.target.checked) {
                        showToast(`Đã thêm bộ lọc: ${filterName}`, 'info');
                    } else {
                        // showToast(`Đã bỏ lọc: ${filterName}`, 'info'); 
                    }
                }
            });
        });

        // 7.2. Chức năng Khoảng giá (Range Slider)
        const priceSliders = document.querySelectorAll('input[type="range"]');
        priceSliders.forEach(slider => {
            // Hiển thị giá trị real-time khi kéo
            const container = slider.closest('.space-y-3');
            let valueDisplay = null;
            if (container) {
                // Thay đổi text của span nằm bên phải
                valueDisplay = container.querySelectorAll('.flex.justify-between.text-\\[11px\\] span')[1];
            }

            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value).toLocaleString('vi-VN');
                if (valueDisplay) {
                    valueDisplay.innerText = val + 'đ';
                    valueDisplay.style.color = '#002366';
                    valueDisplay.style.fontWeight = 'bold';
                }
            });

            // Khi buông chuột, hiển thị thông báo lọc
            slider.addEventListener('change', (e) => {
                const val = parseInt(e.target.value).toLocaleString('vi-VN');
                showToast(`Đang lọc sản phẩm có giá dưới ${val}đ`, 'success');
            });
        });

        // 7.3. Chức năng lọc theo Giới tính (Nút bấm)
        const genderContainers = document.querySelectorAll('.space-y-3 .flex.flex-wrap.gap-2');
        genderContainers.forEach(container => {
            const btns = container.querySelectorAll('button');
            btns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Reset all
                    btns.forEach(b => {
                        b.className = 'px-3 py-1.5 rounded-lg text-xs text-slate-500 bg-surface-container-low hover:bg-surface-container transition-colors';
                    });
                    // Set active
                    btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#002366] ring-1 ring-outline-variant shadow-sm transition-colors';

                    showToast(`Đã chọn giới tính: ${btn.innerText}`, 'info');
                });
            });
        });
    }

    // ============================================
    // 8. TÍNH NĂNG BỔ SUNG NÂNG CAO (Advanced Features)
    // ============================================

    // 8.1. Đã chuyển Toast ra global
    // 8.2. Countdown Timer (Trang chủ Flash Sale)
    if (urlPath.includes('index.html') || urlPath === '/' || urlPath === '' || urlPath.endsWith('\\')) {
        const timerBlocks = document.querySelectorAll('.bg-secondary.text-on-secondary.px-3.py-2.rounded-lg.font-bold');
        if (timerBlocks.length === 3) {
            let h = parseInt(timerBlocks[0].innerText) || 2;
            let m = parseInt(timerBlocks[1].innerText) || 14;
            let s = parseInt(timerBlocks[2].innerText) || 55;

            setInterval(() => {
                if (s > 0) {
                    s--;
                } else {
                    s = 59;
                    if (m > 0) {
                        m--;
                    } else {
                        m = 59;
                        if (h > 0) h--;
                    }
                }
                timerBlocks[0].innerText = h.toString().padStart(2, '0');
                timerBlocks[1].innerText = m.toString().padStart(2, '0');
                timerBlocks[2].innerText = s.toString().padStart(2, '0');
            }, 1000);
        }

        // Tương tác nút Thử AR / Virtual Try-On
        document.querySelectorAll('button').forEach(btn => {
            if (btn.innerText.includes('Thử ngay miễn phí') || btn.innerText.includes('Virtual Try-On') || btn.innerText.includes('Xem Bộ Sưu Tập')) {
                btn.addEventListener('click', (e) => {
                    // Nếu là href thực thì để nó chuyển trang, còn nút giả thì popup
                    if (!btn.getAttribute('onclick')) {
                        e.preventDefault();
                        showToast('Đang kết nối khối Camera để quét AR khuôn mặt...', 'info');
                    }
                });
            }
        });

        // 8.5. Leaderboard Modal (Bảng xếp hạng)
        const rankingBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.includes('Xem bảng xếp hạng'));

        if (rankingBtn) {
            rankingBtn.addEventListener('click', (e) => {
                e.preventDefault();

                // Tránh tạo nhiều modal
                if (document.getElementById('ranking-modal')) return;

                const modal = document.createElement('div');
                modal.id = 'ranking-modal';
                modal.className = 'fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-md opacity-0 transition-opacity duration-300 pointer-events-none p-4';

                const modalContent = `
                    <div class="bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] scale-95 transition-transform duration-300" id="ranking-content">
                        <!-- Header -->
                        <div class="p-6 border-b border-surface-container-highest flex justify-between items-center bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-t-3xl">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">trophy</span>
                                <h2 class="font-headline text-2xl font-bold">Bảng Xếp Hạng Top 5</h2>
                            </div>
                            <button id="close-ranking" class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <!-- Body -->
                        <div class="p-6 overflow-y-auto custom-scrollbar space-y-4">
                            <!-- Top 1 -->
                            <div class="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border-2 border-[#D4AF37] relative group">
                                <div class="absolute -top-3 -left-3 w-8 h-8 bg-[#D4AF37] text-white font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">1</div>
                                <img class="w-16 h-16 rounded-xl object-cover bg-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsnfUDyXlMBBeMpMqD62SaRqFgnTbozxZDI3F2GLjk2ay2p0KAOfxWBBVxU9oHpWx88lLPuoy48Slj5-N-R09ddLJTzBvMOytblb1S6bNUO4Cy3ibeCiXpuHP6Ta1ag0hjH-qFSCNRQNJtOWcG-xBjv1YbHWJvJQ6O6XJXccwo01vm-bSVR6aU0EIxGk8INEq2S7cSqCJvLiDMdIpkOuhXu0D2RGDwsQaesSMu4D1Au8cqdB1KFhgj3GPyHmtIyK6q4hPbGvD3NyA" />
                                <div class="flex-1">
                                    <h4 class="font-bold text-primary font-headline">Vintage Tortoise Shell</h4>
                                    <p class="text-xs text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[14px] text-secondary">star</span> 5.0 (2,104 đánh giá)</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold text-primary">3.200.000₫</p>
                                </div>
                            </div>

                            <!-- Top 2 -->
                            <div class="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-[#C0C0C0] relative">
                                <div class="absolute -top-3 -left-3 w-8 h-8 bg-[#C0C0C0] text-white font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">2</div>
                                <img class="w-16 h-16 rounded-xl object-cover bg-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLDX8IdC85umguyH5kkOR610wkiqAQgo93ZVw_AqUnKj_z9RoG67dXB6MO8RwbetMES_qNXX_NeRaU8pO7h7MipnXC_TFy5trqpMtea9ZAFeJH94W3UMItjc_o3DACHcOMI8Ub3K2GYLX0XY7_HP9EIUajCPL89mNfW0lS36DK5ckLyj8aSIOu7Ggw5fMv0cj13OriHRYEMdh94AUzrR9V0zPjwcRPkNRgMwOBmkL-jCAU3OlNyu93H9V3uTu5NIJgfbxZ6LDTe7E" />
                                <div class="flex-1">
                                    <h4 class="font-bold text-primary font-headline">Milan 01 Titanium</h4>
                                    <p class="text-xs text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[14px] text-secondary">star</span> 4.9 (1,842 đánh giá)</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold text-primary">4.500.000₫</p>
                                </div>
                            </div>

                            <!-- Top 3 -->
                            <div class="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-[#CD7F32] relative">
                                <div class="absolute -top-3 -left-3 w-8 h-8 bg-[#CD7F32] text-white font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">3</div>
                                <img class="w-16 h-16 rounded-xl object-cover bg-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf0uEL7L__JJldKtDekCWl-zBYNFb1KurkO_5TsyOeeUspestc8H_ZOgWIYMJ6zUtI58dPEbVb8J0K3QWmXwXRjRE-j6cGG8umvEIrb4-x2r8gw0kFtNeG3Zx3LoXCLSdUXAU7PdBttxqUz5ToNU1ulrglhjjuuUc_MCGLL78d0qoFkd2psiXblENhl_qtMThlQltCMWX_d0d_hdb9yntsyuzbahLq7E8dN-Oi7aLUVgopK5imsWydOkqcA2d-wwZJhKyOojAN6zA" />
                                <div class="flex-1">
                                    <h4 class="font-bold text-primary font-headline">Aviator Optics Gold</h4>
                                    <p class="text-xs text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[14px] text-secondary">star</span> 4.8 (1,530 đánh giá)</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold text-primary">4.850.000₫</p>
                                </div>
                            </div>

                            <!-- Top 4 -->
                            <div class="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl relative">
                                <div class="absolute -top-2 -left-2 w-6 h-6 bg-surface-variant text-on-surface-variant font-bold rounded-full flex items-center justify-center text-xs z-10">4</div>
                                <img class="w-14 h-14 rounded-xl object-cover bg-surface-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5X28W2YOv2Fi8SGLevsHvqDm5PHNRP3B7d651U8Kl3cSAChuOCIYvp9_QKS3HRep2YNOdzPpxtX0yYPFgE3xk3SHMOg1KyI0XPtGi7wNIWtXK5aWqOJrEfCldMKW2_QS2IgEmd-oNxjxMmEOiybaSskOwlr9FseVC56cumBYI-3PHljeZ_PYwiasr5wzjUNdDMonRyRFtPee42Bqeaa-mA-XTLxiUUgdp1YVB6GYfdE0DUzm9vvGbo6i1fy9KxP6CHJlR4I0XMBA" />
                                <div class="flex-1">
                                    <h4 class="font-bold text-primary font-headline text-sm">Round Classic Tortoise</h4>
                                    <p class="text-xs text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[12px] text-secondary">star</span> 4.7 (950 đánh giá)</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold text-primary text-sm">1.950.000₫</p>
                                </div>
                            </div>

                            <!-- Top 5 -->
                            <div class="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl relative">
                                <div class="absolute -top-2 -left-2 w-6 h-6 bg-surface-variant text-on-surface-variant font-bold rounded-full flex items-center justify-center text-xs z-10">5</div>
                                <img class="w-14 h-14 rounded-xl object-cover bg-surface-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_V3Xiu1TbquWhmxXfz3azP0M0E66qHnPcXeQtUQWlqCHtJKzauLrP2Lil9XToLuyn3R_EAYDPrzKQhTOAysTkBhE3yY7efJq4BKg0sIEmz_enTUGVGC4YUJR0VRJ41Dr2auSbigdqLHncVaYmkKw-qwx7NJDrhUfOJmIpdx4Olq9o0gUntQ1DoGej5dEEEthxbw6EoqgpemRclTkWUIGpss8BuNNu1gqQI0U-tjCNMyLJS7QKmbS22j6xB0asuDUVwTc_Czf_Yzs" />
                                <div class="flex-1">
                                    <h4 class="font-bold text-primary font-headline text-sm">Ray-Ban Classic Wayfarer</h4>
                                    <p class="text-xs text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[12px] text-secondary">star</span> 4.6 (820 đánh giá)</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold text-primary text-sm">2.230.000₫</p>
                                </div>
                            </div>

                        </div>
                        
                        <!-- Footer -->
                        <div class="p-4 border-t border-surface-container-highest bg-surface-container-lowest rounded-b-3xl text-center">
                            <button class="text-secondary font-bold hover:underline" onclick="window.location.href='products.html'">Khám phá toàn bộ bộ sưu tập</button>
                        </div>
                    </div>
                `;

                modal.innerHTML = modalContent;
                document.body.appendChild(modal);

                // Animation popup mở ra
                setTimeout(() => {
                    modal.classList.remove('opacity-0', 'pointer-events-none');
                    document.getElementById('ranking-content').classList.remove('scale-95');
                }, 10);

                // Close button event
                modal.querySelector('#close-ranking').addEventListener('click', () => {
                    modal.classList.add('opacity-0', 'pointer-events-none');
                    document.getElementById('ranking-content').classList.add('scale-95');
                    setTimeout(() => modal.remove(), 300);
                });

                // Click background outside to close
                modal.addEventListener('click', (ev) => {
                    if (ev.target === modal) {
                        modal.classList.add('opacity-0', 'pointer-events-none');
                        document.getElementById('ranking-content').classList.add('scale-95');
                        setTimeout(() => modal.remove(), 300);
                    }
                });
            });
        }
    }

    // 8.6. Ray-Ban Explorer Modal
    const raybanBtn = document.getElementById('explore-rayban');
    if (raybanBtn) {
        raybanBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (document.getElementById('rayban-modal')) return;

            const modal = document.createElement('div');
            modal.id = 'rayban-modal';
            modal.className = 'fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-md opacity-0 transition-opacity duration-300 pointer-events-none p-4';

            const modalContent = `
                <div class="bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] scale-95 transition-transform duration-300" id="rayban-content">
                    <!-- Header -->
                    <div class="p-6 border-b border-surface-container-highest flex justify-between items-center bg-[#fdc003] text-[#00113a] rounded-t-3xl">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">explore</span>
                            <h2 class="font-headline text-2xl font-bold">Bộ sưu tập Ray-Ban</h2>
                        </div>
                        <button id="close-rayban" class="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <!-- Body -->
                    <div class="p-6 overflow-y-auto custom-scrollbar space-y-4">
                        <!-- Item 1 -->
                        <div class="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant hover:border-primary transition-colors cursor-pointer group">
                            <img class="w-20 h-16 rounded-xl object-cover bg-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBX82LkXzN4Pn04ZsmzXTqwASP3YCwFPGukZjdECTvDdN7ykJT6JcWnfNeb0ORC4-qh2qoMO-HVru3YhKQLsV1JFmvF1rE8ogpHYYRwsiTn8WRjiveQwgO_YOxEAhiVn3yKPqT47Yh_dWisnW68XhHx8s0gvK5Hgafk-a1eiPuyycuJehdeTcBxd0gKd5Lgdfz4cDlhcObP2KGUwW_oHdT_uc_vnakY763t3CNAQw-EeRMNRYK5bEKbesIk1Q0-F9JS59AGCSU_fY" />
                            <div class="flex-1">
                                <h4 class="font-bold text-primary font-headline">Ray-Ban Aviator Classic</h4>
                                <p class="text-xs text-on-surface-variant line-clamp-1">Kính phi công huyền thoại với gọng vàng và tròng xanh G-15.</p>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-primary">4.250.000₫</p>
                                <button class="text-xs bg-primary text-white px-3 py-1.5 rounded-lg mt-2 font-bold" data-action="add-to-cart">Thêm vào giỏ</button>
                            </div>
                        </div>

                        <!-- Item 2 -->
                        <div class="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant hover:border-primary transition-colors cursor-pointer group">
                            <img class="w-20 h-16 rounded-xl object-cover bg-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_V3Xiu1TbquWhmxXfz3azP0M0E66qHnPcXeQtUQWlqCHtJKzauLrP2Lil9XToLuyn3R_EAYDPrzKQhTOAysTkBhE3yY7efJq4BKg0sIEmz_enTUGVGC4YUJR0VRJ41Dr2auSbigdqLHncVaYmkKw-qwx7NJDrhUfOJmIpdx4Olq9o0gUntQ1DoGej5dEEEthxbw6EoqgpemRclTkWUIGpss8BuNNu1gqQI0U-tjCNMyLJS7QKmbS22j6xB0asuDUVwTc_Czf_Yzs" />
                            <div class="flex-1">
                                <h4 class="font-bold text-primary font-headline">Ray-Ban Wayfarer Ease</h4>
                                <p class="text-xs text-on-surface-variant line-clamp-1">Phong cách rock-and-roll cổ điển, phù hợp mọi khuôn mặt.</p>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-primary">3.850.000₫</p>
                                <button class="text-xs bg-primary text-white px-3 py-1.5 rounded-lg mt-2 font-bold" data-action="add-to-cart">Thêm vào giỏ</button>
                            </div>
                        </div>

                        <!-- Item 3 -->
                        <div class="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant hover:border-primary transition-colors cursor-pointer group">
                            <img class="w-20 h-16 rounded-xl object-cover bg-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuADIZl6BGMy5DdsXak_XA0rcOxwIsYHt9dv7TvpgXDxIbLTIT_h-4jkkj2aN2q8mIYj2vpV7t9isFzQI7utEgBjbjM2YPNlF5JvpaWxIZTXtmjLYAEHIkNG99mn_lAuGkq1s3_JxyelTLJ2rpLQD1aWKKJcETIv2Dp9dVGP_rGVF3PPk3YZStXMFv8Qaj4MstQ0oDQqBf_NP6FHhjYXE_RrISqjmTWDqNUYMkpu5yTa17ZSh0cHo7prLh41QFAL16bTu3gTXZ7iKqI" />
                            <div class="flex-1">
                                <h4 class="font-bold text-primary font-headline">Ray-Ban Clubmaster</h4>
                                <p class="text-xs text-on-surface-variant line-clamp-1">Thiết kế vintage thập niên 50 cho vẻ ngoài trí thức.</p>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-primary">4.100.000₫</p>
                                <button class="text-xs bg-primary text-white px-3 py-1.5 rounded-lg mt-2 font-bold" data-action="add-to-cart">Thêm vào giỏ</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="p-4 border-t border-surface-container-highest bg-surface-container-lowest rounded-b-3xl text-center">
                        <button class="text-primary font-bold hover:underline" onclick="window.location.href='products.html?brand=rayban'">Xem tất cả kính Ray-Ban</button>
                    </div>
                </div>
            `;

            modal.innerHTML = modalContent;
            document.body.appendChild(modal);

            setTimeout(() => {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                document.getElementById('rayban-content').classList.remove('scale-95');
            }, 10);

            modal.querySelector('#close-rayban').addEventListener('click', () => {
                modal.classList.add('opacity-0', 'pointer-events-none');
                document.getElementById('rayban-content').classList.add('scale-95');
                setTimeout(() => modal.remove(), 300);
            });

            modal.addEventListener('click', (ev) => {
                if (ev.target === modal) {
                    modal.classList.add('opacity-0', 'pointer-events-none');
                    document.getElementById('rayban-content').classList.add('scale-95');
                    setTimeout(() => modal.remove(), 300);
                }
            });
        });
    }

    // Tương tác nút thử kính (Virtual Try-on) ở trang Sản phẩm
    let virtualTryBtn = null;
    document.querySelectorAll('button, a').forEach(el => {
        const label = (el.innerText || '').trim();
        if (label.includes('Virtual Try-On')) {
            virtualTryBtn = el;
        }
    });

    if (virtualTryBtn) {
        virtualTryBtn.addEventListener('click', () => {
            showToast('Đang bật AI Camera quét tỉ lệ khuôn mặt...', 'info');
        });
    }

    // 8.3. Global Search (Thanh Tìm kiếm mọi trang)
    const searchInputs = document.querySelectorAll('input[placeholder*="Tìm kiếm"]');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (input.value.trim() !== '') {
                    showToast(`Tìm kiếm: "${input.value}"`, 'info');
                    setTimeout(() => {
                        window.location.href = 'products.html'; // Chuyển sang danh sách sp
                    }, 1500);
                } else {
                    showToast('Vui lòng nhập từ khoá tìm kiếm!', 'warning');
                }
            }
        });
    });

    // 8.4. Global Newsletter Subscription (Đăng ký nhận tin)
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        const container = input.parentElement;
        if (container) {
            const btn = container.querySelector('button');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (input.value.includes('@') && input.value.includes('.')) {
                        showToast('Đăng ký nhận tin ưu đãi thành công!', 'success');
                        input.value = ''; // Reset input
                    } else {
                        showToast('Vui lòng nhập định dạng email hợp lệ!', 'error');
                        input.focus();
                    }
                });
            }
        }
    });


    // ============================================
    // 9. BUFF: MƯỢT CHUYỂN TRANG & LƯU GIỎ HÀNG
    // ============================================

    setTimeout(() => document.body.classList.add('page-fade-in'), 50);

    const links = document.querySelectorAll('a[href]:not([target="_blank"])');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetAttr = link.getAttribute('href');

            // Bỏ qua link ảo hoặc click có chứa javascript
            if (!targetAttr || targetAttr === '#' || targetAttr.startsWith('javascript:')) return;

            // Bỏ qua link bên ngoài web này
            if (targetAttr.startsWith('http')) return;

            try {
                // Chỉ xử lý chuyển màn màn hình nếu bấm các URL hệ thống nội bộ
                const targetUrl = new URL(link.href);
                const currentUrl = new URL(window.location.href);

                // Nếu đang bấm vào trang hiện tại (Trùng khít file)
                if (targetUrl.pathname === currentUrl.pathname) {
                    if (targetUrl.hash) {
                        return; // Cho phép cuộn trang tới thẻ ID
                    } else {
                        e.preventDefault(); // Trùng tuyệt đối thì đừng tải lại
                        if (window.showToast) window.showToast('Bạn đang xem bảng này rồi! 👇', 'info');
                        return;
                    }
                }
            } catch (e) { }

            // Còn lại thì Fade-out rồi Navigate
            e.preventDefault();
            document.body.classList.add('page-fade-out');
            setTimeout(() => {
                window.location.href = link.href;
            }, 600);
        });
    });
});

let globalCart = JSON.parse(localStorage.getItem('kx_cart')) || [];

ensureCartBadges();

function buffCartCount() {
    const totalItems = globalCart.reduce((sum, item) => sum + item.qty, 0);
    const badges = document.querySelectorAll('[data-cart-count]');
    badges.forEach(b => {
        b.innerText = totalItems;
    });
}

buffCartCount();

document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action=\"add-to-cart\"]');
    if (!btn) return;

    const text = (btn.innerText || '').replace(/\s+/g, ' ').toLowerCase();

    if (true) {
        const productBlock = btn.closest('.group') || btn.closest('.relative') || btn.closest('.bg-surface-container-low') || btn.closest('div[class*="rounded"]');
        let productName = 'Cặp Kính Kính Xanh';
        let productImg = 'https://lh3.googleusercontent.com/aida-public/AB6AXuADIZl6BGMy5DdsXak_XA0rcOxwIsYHt9dv7TvpgXDxIbLTIT_h-4jkkj2aN2q8mIYj2vpV7t9isFzQI7utEgBjbjM2YPNlF5JvpaWxIZTXtmjLYAEHIkNG99mn_lAuGkq1s3_JxyelTLJ2rpLQD1aWKKJcETIv2Dp9dVGP_rGVF3PPk3YZStXMFv8Qaj4MstQ0oDQqBf_NP6FHhjYXE_RrISqjmTWDqNUYMkpu5yTa17ZSh0cHo7prLh41QFAL16bTu3gTXZ7iKqI';
        let productPrice = 1200000;

        if (productBlock && productBlock.tagName !== 'BODY') {
            const titleEl = productBlock.querySelector('h3') || productBlock.querySelector('h4');
            if (titleEl) productName = titleEl.innerText;

            const imgEl = productBlock.querySelector('img');
            if (imgEl) productImg = imgEl.src;

            const priceEls = Array.from(productBlock.querySelectorAll('span, p, div')).filter(el => (el.innerText || '').includes('đ') || (el.innerText || '').includes('₫'));
            if (priceEls.length > 0) {
                const priceText = priceEls[0].innerText.split('đ')[0].split('₫')[0].replace(/[^0-9]/g, '');
                if (priceText) productPrice = parseInt(priceText) || productPrice;
            }
        }

        const existing = globalCart.find(i => i.name === productName);
        if (existing) {
            existing.qty += 1;
        } else {
            globalCart.push({ name: productName, qty: 1, img: productImg, price: productPrice });
        }

        localStorage.setItem('kx_cart', JSON.stringify(globalCart));
        buffCartCount();
        animateAddToCartButton(btn);
        const badges = document.querySelectorAll('[data-cart-count]');
        badges.forEach(badge => {
            badge.style.transform = 'scale(1.25)';
            setTimeout(() => { badge.style.transform = 'scale(1)'; }, 180);
        });
        if (window.showToast) {
            window.showToast(`Đã thêm "${productName}" vào giỏ hàng`, 'success');
        }
    }
});

function formatCurrency(num) {
    return new Intl.NumberFormat('vi-VN').format(num) + '₫';
}


function getCheckoutItems() {
    const selectedItems = globalCart.filter(item => item.selected !== false);
    return selectedItems;
}

function renderCheckout() {
    if (!window.location.pathname.includes('checkout.html')) return;

    const items = getCheckoutItems();
    const itemsContainer = document.getElementById('checkout-items-container');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const vatEl = document.getElementById('checkout-vat');
    const totalEl = document.getElementById('checkout-total');
    const completeBtn = document.getElementById('checkout-complete-btn');

    if (!itemsContainer || !subtotalEl || !vatEl || !totalEl) return;

    if (items.length === 0) {
        itemsContainer.innerHTML = `
            <div class="text-center py-10 bg-surface-container-low rounded-2xl border-dashed border-2 border-outline-variant/50">
                <span class="material-symbols-outlined block text-5xl mb-3 text-slate-300">shopping_basket</span>
                <p class="font-bold text-primary">Không có sản phẩm nào để thanh toán</p>
                <a href="products.html" class="inline-block mt-3 text-secondary font-bold hover:underline">Tiếp tục mua sắm</a>
            </div>`;
        subtotalEl.innerText = formatCurrency(0);
        vatEl.innerText = formatCurrency(0);
        totalEl.innerText = formatCurrency(0);
        if (completeBtn) completeBtn.classList.add('opacity-50', 'pointer-events-none');
        return;
    }

    let subtotal = 0;
    itemsContainer.innerHTML = items.map(item => {
        const lineTotal = item.price * item.qty;
        subtotal += lineTotal;
        return `
            <div class="flex gap-4">
                <div class="w-20 h-20 bg-surface-container-highest rounded-lg overflow-hidden flex-shrink-0">
                    <img class="w-full h-full object-cover" src="${item.img}" alt="${item.name}">
                </div>
                <div class="flex-1">
                    <p class="font-bold text-sm text-primary">${item.name}</p>
                    <p class="text-xs text-on-surface-variant">Số lượng: ${item.qty}</p>
                    <p class="font-bold mt-1">${formatCurrency(lineTotal)}</p>
                </div>
            </div>`;
    }).join('');

    const vat = subtotal * 0.08;
    const total = subtotal + vat;
    subtotalEl.innerText = formatCurrency(subtotal);
    vatEl.innerText = formatCurrency(vat);
    totalEl.innerText = formatCurrency(total);
    if (completeBtn) completeBtn.classList.remove('opacity-50', 'pointer-events-none');
}

function renderCart() {
    if (!window.location.pathname.includes('cart.html')) return;

    const container = document.getElementById('cart-items-container');
    const headerPar = document.querySelector('header p');
    const tamTinhEl = document.getElementById('cart-tam-tinh');
    const vatEl = document.getElementById('cart-vat');
    const thanhTienEl = document.getElementById('cart-thanh-tien');

    if (!container) return;

    let totalQty = 0;
    let totalPrice = 0;
    let html = '';

    let allSelected = globalCart.length > 0 && globalCart.every(i => i.selected !== false);

    if (globalCart.length > 0) {
        html += `
            <div class="flex items-center gap-3 mb-4 px-2">
                <input type="checkbox" id="cart-select-all" class="w-5 h-5 text-primary rounded border-outline-variant focus:ring-primary cursor-pointer" ${allSelected ? 'checked' : ''} onchange="toggleSelectAllCart()">
                <label for="cart-select-all" class="font-bold text-on-surface cursor-pointer select-none">Chọn tất cả sản phẩm</label>
            </div>`;
    }

    globalCart.forEach((item, index) => {
        const itemTotal = item.qty * item.price;
        const isSelected = item.selected !== false;

        if (isSelected) {
            totalQty += item.qty;
            totalPrice += itemTotal;
        }

        html += `
            <div class="bg-surface-container-lowest p-5 rounded-xl flex flex-col md:flex-row items-center gap-4 group transition-all duration-300 border border-outline-variant/30 ${isSelected ? 'border-primary/50' : 'opacity-70'}">
                <input type="checkbox" class="w-5 h-5 text-primary rounded border-outline-variant focus:ring-primary cursor-pointer hidden md:block" ${isSelected ? 'checked' : ''} onchange="toggleCartSelect(${index})">
                <div class="w-full md:w-32 h-28 bg-white rounded-lg overflow-hidden flex items-center justify-center p-2 border border-outline-variant/20 relative">
                    <input type="checkbox" class="absolute top-2 left-2 w-5 h-5 text-primary rounded border-outline-variant focus:ring-primary cursor-pointer block md:hidden" ${isSelected ? 'checked' : ''} onchange="toggleCartSelect(${index})">
                    <img class="w-full h-full object-contain" src="${item.img}" alt="Product">
                </div>
                <div class="flex-grow space-y-1 text-center md:text-left">
                    <h3 class="font-headline text-lg font-bold text-primary">${item.name}</h3>
                    <p class="text-xs text-on-surface-variant flex items-center justify-center md:justify-start gap-1">
                        <span class="material-symbols-outlined text-[14px]">check_circle</span> Hàng chính hãng
                    </p>
                    <p class="text-md font-bold text-primary mt-2 flex md:hidden justify-center">${formatCurrency(item.price)}</p>
                </div>
                
                <div class="flex items-center bg-surface-container rounded-full p-1 h-10 w-[110px] justify-between">
                    <button onclick="updateCartItem(${index}, -1)" class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-colors text-primary font-bold">-</button>
                    <span class="w-6 text-center font-bold text-primary text-sm">${item.qty}</span>
                    <button onclick="updateCartItem(${index}, 1)" class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-colors text-primary font-bold">+</button>
                </div>
                
                <div class="text-center md:text-right min-w-[120px]">
                    <p class="text-lg font-extrabold text-primary hidden md:block">${formatCurrency(itemTotal)}</p>
                    <button onclick="removeCartItem(${index})" class="text-error mt-2 hover:underline text-sm font-medium flex items-center justify-center md:justify-end gap-1 w-full md:w-auto">
                        <span class="material-symbols-outlined text-sm">delete</span> Xóa
                    </button>
                </div>
            </div>`;
    });

    if (globalCart.length === 0) {
        html = '<div class="text-center py-16 bg-surface-container-low rounded-2xl border-dashed border-2 border-outline-variant/50"><span class="material-symbols-outlined block text-6xl mb-4 text-slate-300">shopping_basket</span><p class="font-bold text-lg text-primary">Giỏ hàng rỗng!</p><a href="products.html" class="inline-block mt-4 text-secondary font-bold hover:underline">Khám phá sản phẩm</a></div>';
    }

    container.innerHTML = html;

    if (headerPar) headerPar.innerText = `Bạn có ${totalQty} sản phẩm trong giỏ hàng`;
    if (tamTinhEl) tamTinhEl.innerText = formatCurrency(totalPrice);
    if (vatEl) vatEl.innerText = formatCurrency(totalPrice * 0.08);
    if (thanhTienEl) thanhTienEl.innerText = formatCurrency(totalPrice + (totalPrice * 0.08));

    const checkoutBtn = document.querySelector('a[href="checkout.html"], button[data-checkout-btn]');
    if (checkoutBtn) {
        const hasSelectedItems = globalCart.some(item => item.selected !== false);
        if (!hasSelectedItems) {
            checkoutBtn.classList.add('opacity-50', 'pointer-events-none');
        } else {
            checkoutBtn.classList.remove('opacity-50', 'pointer-events-none');
        }
    }
}

window.updateCartItem = function (index, delta) {
    if (globalCart[index]) {
        globalCart[index].qty += delta;
        if (globalCart[index].qty <= 0) globalCart.splice(index, 1);
        localStorage.setItem('kx_cart', JSON.stringify(globalCart));
        buffCartCount();
        renderCart();
        renderCheckout();
    }
};

window.removeCartItem = function (index) {
    globalCart.splice(index, 1);
    localStorage.setItem('kx_cart', JSON.stringify(globalCart));
    buffCartCount();
    renderCart();
};

window.toggleCartSelect = function (index) {
    if (globalCart[index]) {
        if (globalCart[index].selected === undefined) {
            globalCart[index].selected = false;
        } else {
            globalCart[index].selected = !globalCart[index].selected;
        }
        localStorage.setItem('kx_cart', JSON.stringify(globalCart));
        renderCart();
    }
};

window.toggleSelectAllCart = function () {
    const allSelected = globalCart.length > 0 && globalCart.every(i => i.selected !== false);
    globalCart.forEach(item => item.selected = !allSelected);
    localStorage.setItem('kx_cart', JSON.stringify(globalCart));
    renderCart();
};

renderCart();

// ============================================
// 10. TỰ ĐỘNG ĐỔI MÀU MENU DÀNH CHO TRANG HIỆN TẠI (Auto Active Link)
// ============================================
const headerLinks = document.querySelectorAll('header nav a');
const urlPath = window.location.pathname;
let foundActive = false;

const activeClasses = ['text-[#002366]', 'dark:text-blue-300', 'font-bold', 'border-b-2', 'border-[#fdc003]', 'pb-1', "font-['Manrope']", 'tracking-tight'];
const inactiveClasses = ['text-slate-600', 'dark:text-slate-400', 'hover:text-[#00113a]', 'dark:hover:text-blue-100', 'transition-colors', "font-['Manrope']", 'tracking-tight', 'cursor-pointer'];

headerLinks.forEach(link => {
    activeClasses.forEach(cls => link.classList.remove(cls));
    inactiveClasses.forEach(cls => link.classList.add(cls));
});

headerLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const normalizedHref = href.replace('#flash-sale', '');
    const isCurrentPage = normalizedHref && urlPath.includes(normalizedHref) && href !== 'index.html#flash-sale';

    if (isCurrentPage && !foundActive) {
        inactiveClasses.forEach(cls => link.classList.remove(cls));
        activeClasses.forEach(cls => link.classList.add(cls));
        foundActive = true;
    }
});

if ((urlPath.endsWith('/') || urlPath.includes('index.html')) && !foundActive) {
    if (headerLinks.length > 0) {
        inactiveClasses.forEach(cls => headerLinks[0].classList.remove(cls));
        activeClasses.forEach(cls => headerLinks[0].classList.add(cls));
    }
}

// ============================================
// 11. TÌM KIẾM CỤC BỘ (Local Real-time Search)
// ============================================
const searchInputs = document.querySelectorAll('input[data-product-search="true"]');
searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (window.location.pathname.includes('products.html')) {
            // Selector này trỏ thẳng tới các khối chứa sản phẩm bên trang products.html
            const productCards = document.querySelectorAll('.grid.grid-cols-2.md\\:grid-cols-3 > div, .grid.grid-cols-1.md\\:grid-cols-3 > div');
            productCards.forEach(card => {
                const titleEl = card.querySelector('h3');
                if (titleEl) {
                    const title = titleEl.innerText.toLowerCase();
                    if (title.includes(query)) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value;
            if (!window.location.pathname.includes('products.html') && query.trim() !== '') {
                window.location.href = 'products.html?search=' + encodeURIComponent(query);
            }
        }
    });
});

// Nếu vào trang products.html có query trên url, tự động lấy và lọc
if (window.location.pathname.includes('products.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        searchInputs.forEach(input => {
            input.value = searchQuery;
            // Kích hoạt sự kiện input giả để lọc ngay
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }
}

// ============================================
// 12. HỆ THỐNG LỌC VÀ SẮP XẾP SẢN PHẨM CHUYÊN NGHIỆP (ACADEMIC STANDARD)
// ============================================
if (window.location.pathname.includes('products.html')) {
    const productGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3');
    if (productGrid) {
        const sidebar = document.querySelector('aside');
        const priceSlider = document.querySelector('aside input[type="range"]');
        const priceLabel = sidebar?.querySelector('.flex.justify-between')?.children[1];
        const sortSelect = document.querySelector('select');

        // Lưu trữ danh sách gốc để sắp xếp và lọc nhanh
        const originalProducts = Array.from(productGrid.children);

        /**
         * Lấy giá trị số từ thuộc tính data hoặc nội dung hiển thị
         */
        const getProductPrice = (el) => {
            const dataPrice = el.getAttribute('data-price');
            if (dataPrice) return parseInt(dataPrice);
            const priceText = el.querySelector('.text-lg.font-bold.text-primary')?.innerText || '0';
            return parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
        };

        const updateResultCount = () => {
            const visibleCount = Array.from(productGrid.children).filter(p => p.style.display !== 'none' && !p.classList.contains('animate-pulse')).length;
            const countContainer = document.getElementById('filter-result-count');
            if (countContainer) {
                countContainer.innerHTML = `<span class="material-symbols-outlined text-sm">visibility</span> Hiển thị ${visibleCount} sản phẩm`;
            }

            // Ẩn badge "Đang tải" khi đã có kết quả
            const loadingBadge = productGrid.querySelector('.animate-pulse');
            if (loadingBadge) loadingBadge.style.display = 'none';
        };

        const performFiltering = () => {
            const maxPriceValue = priceSlider ? parseInt(priceSlider.value) : Infinity;

            // Thu thập giá trị từ TẤT CẢ các bên (Mobile + Desktop)
            const selectedBrands = Array.from(document.querySelectorAll('input[data-brand]:checked'))
                .map(cb => cb.getAttribute('data-brand'));

            const selectedLens = Array.from(document.querySelectorAll('input[data-lens]:checked'))
                .map(cb => cb.getAttribute('data-lens'));

            const activeGenderBtn = document.querySelector('button[data-gender].active-filter');
            const activeGender = activeGenderBtn ? activeGenderBtn.getAttribute('data-gender') : null;

            const activeMatItem = document.querySelector('[data-material].active-filter');
            const activeMaterial = activeMatItem ? activeMatItem.getAttribute('data-material') : null;

            originalProducts.forEach(product => {
                const price = getProductPrice(product);
                const brand = product.getAttribute('data-brand');
                const gender = product.getAttribute('data-gender');
                const lensTags = (product.getAttribute('data-lens') || "").split(',');
                const material = product.getAttribute('data-material');

                let isVisible = true;

                if (price > maxPriceValue) isVisible = false;

                if (isVisible && selectedBrands.length > 0) {
                    if (!selectedBrands.includes(brand)) isVisible = false;
                }

                if (isVisible && selectedLens.length > 0) {
                    const hasMatch = selectedLens.some(l => lensTags.includes(l));
                    if (!hasMatch) isVisible = false;
                }

                if (isVisible && activeGender && activeGender !== 'unisex') {
                    if (gender !== activeGender && gender !== 'unisex') isVisible = false;
                }

                if (isVisible && activeMaterial) {
                    if (material !== activeMaterial) isVisible = false;
                }

                product.style.display = isVisible ? 'block' : 'none';
                if (isVisible && typeof AOS !== 'undefined') {
                    product.classList.add('aos-animate');
                }
            });

            updateResultCount();
        };

        // Gán sự kiện cho TẤT CẢ các điều khiển lọc (trong cả 2 aside)
        document.querySelectorAll('input[type="checkbox"][data-brand], input[type="checkbox"][data-lens], input[type="range"]').forEach(el => {
            el.addEventListener('change', performFiltering);
        });

        // Đồng bộ thanh trượt giá
        if (priceSlider) {
            const allPriceSliders = document.querySelectorAll('input[type="range"]');
            allPriceSliders.forEach(slider => {
                slider.addEventListener('input', (e) => {
                    const val = e.target.value;
                    allPriceSliders.forEach(s => s.value = val);
                    if (priceLabel) priceLabel.innerText = new Intl.NumberFormat('vi-VN').format(val) + 'đ';
                    performFiltering();
                });
            });
        }

        // Nút Giới tính
        document.querySelectorAll('button[data-gender]').forEach(btn => {
            btn.addEventListener('click', () => {
                const gender = btn.getAttribute('data-gender');
                const isAlreadyActive = btn.classList.contains('active-filter');

                // Reset tất cả các nút giới tính (cả mobile và desktop)
                document.querySelectorAll(`button[data-gender]`).forEach(b => {
                    b.classList.remove('active-filter', 'bg-white', 'text-[#002366]', 'font-semibold');
                    b.classList.add('bg-surface-container-low', 'text-slate-500');
                });

                if (!isAlreadyActive) {
                    // Kích hoạt tất cả nút cùng loại (ví dụ: cả 2 nút "Nam")
                    document.querySelectorAll(`button[data-gender="${gender}"]`).forEach(target => {
                        target.classList.add('active-filter', 'bg-white', 'text-[#002366]', 'font-semibold');
                        target.classList.remove('bg-surface-container-low', 'text-slate-500');
                    });
                }

                performFiltering();
            });
        });

        // Chất liệu
        document.querySelectorAll('[data-material]').forEach(item => {
            item.addEventListener('click', () => {
                const material = item.getAttribute('data-material');
                const isAlreadyActive = item.classList.contains('active-filter');

                document.querySelectorAll('[data-material]').forEach(i => {
                    i.classList.remove('active-filter', 'font-bold', 'text-[#002366]');
                    i.classList.add('text-slate-600');
                });

                if (!isAlreadyActive) {
                    document.querySelectorAll(`[data-material="${material}"]`).forEach(target => {
                        target.classList.add('active-filter', 'font-bold', 'text-[#002366]');
                        target.classList.remove('text-slate-600');
                    });
                }

                performFiltering();
            });
        });
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const sortType = e.target.value;
                let sortedList = [...originalProducts];
                if (sortType.includes('thấp đến cao')) sortedList.sort((a, b) => getProductPrice(a) - getProductPrice(b));
                else if (sortType.includes('cao đến thấp')) sortedList.sort((a, b) => getProductPrice(b) - getProductPrice(a));
                sortedList.forEach(p => productGrid.appendChild(p));
                if (window.showToast) window.showToast(`Đã sắp xếp: ${sortType}`, 'success');
            });
        }
        performFiltering();
    }
}
// ============================================
// 13. FINAL STABILIZATION PATCH (SYNC CART/CHECKOUT/PRODUCTS)
// ============================================
(function () {
    const CART_KEY = 'kx_cart';

    const pagePath = window.location.pathname || '';
    const isProductsPage = pagePath.includes('products.html');
    const isCartPage = pagePath.includes('cart.html');
    const isCheckoutPage = pagePath.includes('checkout.html');
    const isProductDetailPage = pagePath.includes('product-detail.html');
    const isLoginPage = pagePath.includes('login.html');
    const isSupportPage = pagePath.includes('support.html');
    const isProfilePage = pagePath.includes('profile.html');

    function loadCartState() {
        try {
            const raw = JSON.parse(localStorage.getItem(CART_KEY)) || [];
            return raw.map(item => ({
                name: item.name || 'Sản phẩm Kính Xanh',
                img: item.img || '',
                price: Number(item.price) || 0,
                qty: Math.max(1, Number(item.qty) || 1),
                selected: item.selected !== false
            }));
        } catch (e) {
            return [];
        }
    }

    function saveCartState(cart) {
        globalCart = cart;
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        syncCartBadgeFinal();
    }

    function syncCartBadgeFinal() {
        ensureCartBadges();
        const cart = loadCartState();
        const totalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
        document.querySelectorAll('[data-cart-count]').forEach(badge => {
            badge.textContent = String(totalQty);
            badge.style.display = totalQty > 0 ? 'flex' : 'none';
        });
    }

    function parsePriceText(text) {
        if (!text) return 0;
        // Split by currency symbols first to avoid string concatenation of multiple prices
        const parts = String(text).split(/[₫đ]/);
        for (const part of parts) {
            const cleaned = part.replace(/[^0-9]/g, '');
            if (cleaned.length >= 4) { // Heuristic: prices are typically >= 1000₫
                return parseInt(cleaned, 10);
            }
        }
        // Fallback for small amounts or unusual formatting
        const absoluteClean = String(text).replace(/[^0-9]/g, '');
        return absoluteClean ? parseInt(absoluteClean, 10) : 0;
    }

    function firstPriceInBlock(block) {
        if (!block) return 0;

        // 1. Prioritize visible UI text (the most honest price source)
        const candidates = Array.from(block.querySelectorAll('span, p, div, b, strong, font'));
        for (const node of candidates) {
            const style = window.getComputedStyle(node);

            // Strictly skip nodes explicitly marked as line-through (original price)
            if (style.textDecorationLine && style.textDecorationLine.includes('line-through')) continue;

            // Skip nodes that contain other candidate nodes to avoid textContent concatenation
            const hasChildrenCandidates = Array.from(node.querySelectorAll('span, p, b, strong, font')).length > 0;
            if (hasChildrenCandidates) continue;

            const text = (node.textContent || '').trim();
            if (/\d/.test(text) && (text.includes('₫') || text.includes('đ'))) {
                const value = parsePriceText(text);
                if (value > 999) return value; // Filter out small indices or codes
            }
        }

        // 2. Fallback to data-price attribute if text parsing fails
        const dp = block.getAttribute('data-price');
        if (dp) return parsePriceText(dp);

        return 0;
    }

    function extractProductData(trigger, overrides = {}) {
        const block = trigger?.closest('[data-price], .group, .bg-surface-container-lowest, .bg-surface-container-low, .rounded-xl, .rounded-2xl, .rounded-3xl') || document.body;
        const titleEl = block.querySelector('h1, h2, h3, h4, .font-headline.font-bold, .font-headline.font-extrabold');
        const imageEl = block.querySelector('img');
        let name = overrides.name || (titleEl ? titleEl.textContent.trim() : 'Sản phẩm Kính Xanh');
        let img = overrides.img || (imageEl ? imageEl.getAttribute('src') || '' : '');
        let price = Number(overrides.price) || Number(block.getAttribute('data-price')) || firstPriceInBlock(block) || 0;

        if (isProductDetailPage) {
            const title = document.querySelector('h1');
            const mainImage = document.querySelector('.col-span-10 img, .aspect-\[4\/5\] img');
            if (title) name = title.textContent.trim();
            if (mainImage) img = mainImage.getAttribute('src') || img;
            const pagePriceEl = Array.from(document.querySelectorAll('span')).find(el => /₫|đ/.test(el.textContent || '') && !(window.getComputedStyle(el).textDecorationLine || '').includes('line-through'));
            if (pagePriceEl) price = parsePriceText(pagePriceEl.textContent);
        }

        return {
            name,
            img,
            price,
            qty: 1,
            selected: true
        };
    }

    function addItemToCart(trigger, overrides = {}) {
        const cart = loadCartState();
        const product = extractProductData(trigger, overrides);
        const existing = cart.find(item => item.name === product.name && item.price === product.price);
        if (existing) {
            existing.qty += 1;
            existing.selected = true;
        } else {
            cart.push(product);
        }
        saveCartState(cart);
        return product;
    }

    function bindAddToCartButtonsFinal() {
        document.querySelectorAll('[data-action="add-to-cart"], [data-cart-action="add-to-cart"]').forEach(originalBtn => {
            const btn = originalBtn.cloneNode(true);
            btn.setAttribute('data-cart-action', 'add-to-cart');
            btn.removeAttribute('data-action');
            originalBtn.replaceWith(btn);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const product = addItemToCart(btn);
                if (typeof animateAddToCartButton === 'function') {
                    animateAddToCartButton(btn);
                }
                if (typeof showToast === 'function') {
                    showToast(`Đã thêm "${product.name}" vào giỏ hàng`, 'success');
                }
            });
        });
    }

    function bindBuyNowFinal() {
        const originalBtn = document.getElementById('buy-now-btn');
        if (!originalBtn) return;
        const btn = originalBtn.cloneNode(true);
        originalBtn.replaceWith(btn);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const product = addItemToCart(btn);
            const cart = loadCartState().map(item => ({
                ...item,
                selected: item.name === product.name && item.price === product.price
            }));
            saveCartState(cart);
            window.location.href = 'checkout.html';
        });
    }

    function renderCartFinal() {
        if (!isCartPage) return;
        const cart = loadCartState();
        const container = document.getElementById('cart-items-container');
        const headerPar = document.querySelector('header p');
        const tamTinhEl = document.getElementById('cart-tam-tinh');
        const vatEl = document.getElementById('cart-vat');
        const thanhTienEl = document.getElementById('cart-thanh-tien');
        const checkoutBtn = document.getElementById('cart-checkout-btn');
        if (!container) return;

        let totalQty = 0;
        let subtotal = 0;
        const allSelected = cart.length > 0 && cart.every(item => item.selected !== false);

        if (cart.length === 0) {
            container.innerHTML = `<div class="text-center py-16 bg-surface-container-low rounded-2xl border-dashed border-2 border-outline-variant/50"><span class="material-symbols-outlined block text-6xl mb-4 text-slate-300">shopping_basket</span><p class="font-bold text-lg text-primary">Giỏ hàng rỗng!</p><a href="products.html" class="inline-block mt-4 text-secondary font-bold hover:underline">Khám phá sản phẩm</a></div>`;
        } else {
            container.innerHTML = `
                <div class="flex items-center gap-3 mb-4 px-2">
                    <input type="checkbox" id="cart-select-all" class="w-5 h-5 text-primary rounded border-outline-variant focus:ring-primary cursor-pointer" ${allSelected ? 'checked' : ''}>
                    <label for="cart-select-all" class="font-bold text-on-surface cursor-pointer select-none">Chọn tất cả sản phẩm</label>
                </div>
                ${cart.map((item, index) => {
                const lineTotal = item.qty * item.price;
                const selected = item.selected !== false;
                if (selected) {
                    totalQty += item.qty;
                    subtotal += lineTotal;
                }
                return `
                    <div class="bg-surface-container-lowest p-5 rounded-xl flex flex-col md:flex-row items-center gap-4 group transition-all duration-300 border border-outline-variant/30 ${selected ? 'border-primary/50' : 'opacity-70'}">
                        <input type="checkbox" class="w-5 h-5 text-primary rounded border-outline-variant focus:ring-primary cursor-pointer hidden md:block" ${selected ? 'checked' : ''} data-cart-select="${index}">
                        <div class="w-full md:w-32 h-28 bg-white rounded-lg overflow-hidden flex items-center justify-center p-2 border border-outline-variant/20 relative">
                            <input type="checkbox" class="absolute top-2 left-2 w-5 h-5 text-primary rounded border-outline-variant focus:ring-primary cursor-pointer block md:hidden" ${selected ? 'checked' : ''} data-cart-select="${index}">
                            <img class="w-full h-full object-contain" src="${item.img}" alt="${item.name}">
                        </div>
                        <div class="flex-grow space-y-1 text-center md:text-left">
                            <h3 class="font-headline text-lg font-bold text-primary">${item.name}</h3>
                            <p class="text-xs text-on-surface-variant flex items-center justify-center md:justify-start gap-1"><span class="material-symbols-outlined text-[14px]">check_circle</span> Hàng chính hãng</p>
                            <p class="text-md font-bold text-primary mt-2 flex md:hidden justify-center">${formatCurrency(item.price)}</p>
                        </div>
                        <div class="flex items-center bg-surface-container rounded-full p-1 h-10 w-[110px] justify-between">
                            <button class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-colors text-primary font-bold" data-cart-qty="minus" data-index="${index}">-</button>
                            <span class="w-6 text-center font-bold text-primary text-sm">${item.qty}</span>
                            <button class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-colors text-primary font-bold" data-cart-qty="plus" data-index="${index}">+</button>
                        </div>
                        <div class="text-center md:text-right min-w-[120px]">
                            <p class="text-lg font-extrabold text-primary hidden md:block">${formatCurrency(lineTotal)}</p>
                            <button class="text-error mt-2 hover:underline text-sm font-medium flex items-center justify-center md:justify-end gap-1 w-full md:w-auto" data-cart-remove="${index}"><span class="material-symbols-outlined text-sm">delete</span> Xóa</button>
                        </div>
                    </div>`;
            }).join('')}
            `;
        }

        if (headerPar) {
            const overallQty = cart.reduce((sum, item) => sum + item.qty, 0);
            headerPar.textContent = overallQty > 0 ? `Bạn có ${overallQty} sản phẩm trong giỏ hàng` : 'Bạn chưa có sản phẩm nào trong giỏ hàng';
        }

        if (tamTinhEl) tamTinhEl.textContent = formatCurrency(subtotal);
        if (vatEl) vatEl.textContent = formatCurrency(subtotal * 0.08);
        if (thanhTienEl) thanhTienEl.textContent = formatCurrency(subtotal * 1.08);

        if (checkoutBtn) {
            const hasSelected = cart.some(item => item.selected !== false);
            checkoutBtn.disabled = !hasSelected;
            checkoutBtn.classList.toggle('opacity-50', !hasSelected);
            checkoutBtn.classList.toggle('pointer-events-none', !hasSelected);
        }

        const selectAll = document.getElementById('cart-select-all');
        if (selectAll) {
            selectAll.addEventListener('change', () => {
                const next = loadCartState().map(item => ({ ...item, selected: selectAll.checked }));
                saveCartState(next);
                renderCartFinal();
            });
        }

        container.querySelectorAll('[data-cart-select]').forEach(cb => {
            cb.addEventListener('change', () => {
                const idx = Number(cb.getAttribute('data-cart-select'));
                const next = loadCartState();
                if (next[idx]) next[idx].selected = cb.checked;
                saveCartState(next);
                renderCartFinal();
            });
        });

        container.querySelectorAll('[data-cart-qty]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-index'));
                const delta = btn.getAttribute('data-cart-qty') === 'plus' ? 1 : -1;
                const next = loadCartState();
                if (!next[idx]) return;
                next[idx].qty += delta;
                if (next[idx].qty <= 0) next.splice(idx, 1);
                saveCartState(next);
                renderCartFinal();
                renderCheckoutFinal();
            });
        });

        container.querySelectorAll('[data-cart-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-cart-remove'));
                const next = loadCartState();
                if (next[idx]) next.splice(idx, 1);
                saveCartState(next);
                renderCartFinal();
                renderCheckoutFinal();
            });
        });
    }

    function getSelectedCheckoutItemsFinal() {
        return loadCartState().filter(item => item.selected !== false);
    }

    function renderCheckoutFinal() {
        if (!isCheckoutPage) return;
        const items = getSelectedCheckoutItemsFinal();
        const itemsContainer = document.getElementById('checkout-items-container');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const vatEl = document.getElementById('checkout-vat');
        const totalEl = document.getElementById('checkout-total');
        const btn = document.getElementById('checkout-complete-btn');
        if (!itemsContainer || !subtotalEl || !vatEl || !totalEl) return;

        let subtotal = 0;
        if (items.length === 0) {
            itemsContainer.innerHTML = `<div class="text-center py-10 bg-surface-container-low rounded-2xl border-dashed border-2 border-outline-variant/50"><span class="material-symbols-outlined block text-5xl mb-3 text-slate-300">shopping_basket</span><p class="font-bold text-primary">Không có sản phẩm nào để thanh toán</p><a href="products.html" class="inline-block mt-3 text-secondary font-bold hover:underline">Tiếp tục mua sắm</a></div>`;
        } else {
            itemsContainer.innerHTML = items.map(item => {
                const lineTotal = item.price * item.qty;
                subtotal += lineTotal;
                return `<div class="flex gap-4"><div class="w-20 h-20 bg-surface-container-highest rounded-lg overflow-hidden flex-shrink-0"><img class="w-full h-full object-cover" src="${item.img}" alt="${item.name}"></div><div class="flex-1"><p class="font-bold text-sm text-primary">${item.name}</p><p class="text-xs text-on-surface-variant">Số lượng: ${item.qty}</p><p class="font-bold mt-1">${formatCurrency(lineTotal)}</p></div></div>`;
            }).join('');
        }

        const vat = subtotal * 0.08;
        const total = subtotal + vat;
        subtotalEl.textContent = formatCurrency(subtotal);
        vatEl.textContent = formatCurrency(vat);
        totalEl.textContent = formatCurrency(total);

        if (btn) {
            btn.disabled = items.length === 0;
            btn.classList.toggle('opacity-50', items.length === 0);
            btn.classList.toggle('pointer-events-none', items.length === 0);
        }
    }

    function bindCartCheckoutFinal() {
        if (!isCartPage) return;
        const originalBtn = document.getElementById('cart-checkout-btn');
        if (!originalBtn) return;
        const btn = originalBtn.cloneNode(true);
        originalBtn.replaceWith(btn);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedItems = getSelectedCheckoutItemsFinal();
            if (selectedItems.length === 0) {
                showToast('Vui lòng chọn ít nhất một sản phẩm để thanh toán.', 'warning');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }

    function bindCheckoutCompleteFinal() {
        if (!isCheckoutPage) return;
        const originalBtn = document.getElementById('checkout-complete-btn');
        if (!originalBtn) return;
        const btn = originalBtn.cloneNode(true);
        originalBtn.replaceWith(btn);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedItems = getSelectedCheckoutItemsFinal();
            if (selectedItems.length === 0) {
                showToast('Không có sản phẩm nào để thanh toán.', 'warning');
                return;
            }
            const remaining = loadCartState().filter(item => item.selected === false);
            saveCartState(remaining);
            showToast('Đặt hàng thành công!', 'success');
            setTimeout(() => {
                window.location.href = 'order-success.html';
            }, 500);
        });
    }

    function bindFormSubmissionsFinal() {
        if (isLoginPage) {
            const form = document.getElementById('login-form') || document.querySelector('form');
            if (form) {
                const clone = form.cloneNode(true);
                form.replaceWith(clone);
                clone.addEventListener('submit', (e) => {
                    e.preventDefault();
                    showToast('Đăng nhập thành công!', 'success');
                    setTimeout(() => { window.location.href = 'profile.html'; }, 500);
                });
            }
        }
        if (isSupportPage) {
            const form = document.getElementById('support-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    showToast('Gửi yêu cầu thành công! Bộ phận hỗ trợ sẽ phản hồi sớm.', 'success');
                    form.reset();
                });
            }
        }
        if (isProfilePage) {
            const form = document.getElementById('profile-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    showToast('Cập nhật hồ sơ thành công.', 'success');
                });
            }
        }
    }

    function bindProductFilteringAndSortingFinal() {
        if (!isProductsPage) return;
        const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3');
        if (!grid) return;
        const cards = Array.from(grid.children);
        cards.forEach((card, index) => {
            card.dataset.originalIndex = String(index);
            if (!card.dataset.price) {
                card.dataset.price = String(firstPriceInBlock(card));
            }
        });
        const searchInput = document.querySelector('input[data-product-search="true"]');
        const sortSelect = document.querySelector('select');
        const priceSlider = document.querySelector('aside input[type="range"]');
        const priceDisplays = Array.from(document.querySelectorAll('.flex.justify-between.text-\[11px\].text-slate-500.font-label span')).slice(-1);
        const resultCount = document.getElementById('filter-result-count');

        function getRating(card) {
            const ratingText = Array.from(card.querySelectorAll('span, p')).map(el => el.textContent.trim()).find(t => /\(\d+/.test(t));
            if (!ratingText) return 0;
            const match = ratingText.match(/^(\d+(?:[\.,]\d+)?)/);
            return match ? parseFloat(match[1].replace(',', '.')) : 0;
        }

        function applyFiltersAndSort() {
            const query = (searchInput?.value || '').trim().toLowerCase();
            const maxPrice = priceSlider ? Number(priceSlider.value) : Number.MAX_SAFE_INTEGER;
            const selectedBrands = Array.from(document.querySelectorAll('input[data-brand]:checked')).map(i => i.dataset.brand);
            const selectedLens = Array.from(document.querySelectorAll('input[data-lens]:checked')).map(i => i.dataset.lens);
            const activeGenderBtn = document.querySelector('[data-gender].active-filter');
            const activeMaterial = document.querySelector('[data-material].active-filter');
            const activeGender = activeGenderBtn?.dataset.gender || '';
            const activeMaterialValue = activeMaterial?.dataset.material || '';

            const processed = cards.map(card => {
                const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
                const brand = card.dataset.brand || '';
                const material = card.dataset.material || '';
                const gender = card.dataset.gender || '';
                const lensList = (card.dataset.lens || '').split(',').filter(Boolean);
                const price = Number(card.dataset.price || firstPriceInBlock(card));
                let visible = true;
                if (query && !title.includes(query)) visible = false;
                if (selectedBrands.length && !selectedBrands.includes(brand)) visible = false;
                if (selectedLens.length && !selectedLens.some(l => lensList.includes(l))) visible = false;
                if (activeGender && !['unisex', gender].includes(activeGender) && gender !== activeGender) visible = false;
                if (activeMaterialValue && material !== activeMaterialValue) visible = false;
                if (price > maxPrice) visible = false;
                card.style.display = visible ? 'block' : 'none';
                return card;
            }).filter(card => card.style.display !== 'none');

            const sortType = sortSelect?.value || 'Mới nhất';
            processed.sort((a, b) => {
                if (sortType.includes('Giá thấp')) return Number(a.dataset.price) - Number(b.dataset.price);
                if (sortType.includes('Giá cao')) return Number(b.dataset.price) - Number(a.dataset.price);
                if (sortType.includes('Bán chạy')) return getRating(b) - getRating(a);
                return Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
            });
            processed.forEach(card => grid.appendChild(card));
            if (resultCount) {
                resultCount.innerHTML = `<span class="material-symbols-outlined text-sm">visibility</span> HIỂN THỊ ${processed.length} SẢN PHẨM`;
            }
            if (priceDisplays.length) {
                priceDisplays[0].textContent = new Intl.NumberFormat('vi-VN').format(maxPrice) + 'đ';
            }
        }

        searchInput?.addEventListener('input', applyFiltersAndSort);
        sortSelect?.addEventListener('change', applyFiltersAndSort);
        priceSlider?.addEventListener('input', applyFiltersAndSort);
        document.querySelectorAll('input[data-brand], input[data-lens]').forEach(el => el.addEventListener('change', applyFiltersAndSort));
        document.querySelectorAll('[data-gender]').forEach(btn => btn.addEventListener('click', () => {
            const sameValue = btn.dataset.gender;
            const already = btn.classList.contains('active-filter');
            document.querySelectorAll(`[data-gender]`).forEach(item => {
                item.classList.remove('active-filter', 'bg-white', 'text-[#002366]', 'font-semibold');
                item.classList.add('bg-surface-container-low', 'text-slate-500');
            });
            if (!already) {
                document.querySelectorAll(`[data-gender="${sameValue}"]`).forEach(item => {
                    item.classList.add('active-filter', 'bg-white', 'text-[#002366]', 'font-semibold');
                    item.classList.remove('bg-surface-container-low', 'text-slate-500');
                });
            }
            applyFiltersAndSort();
        }));
        document.querySelectorAll('[data-material]').forEach(item => item.addEventListener('click', () => {
            const value = item.dataset.material;
            const already = item.classList.contains('active-filter');
            document.querySelectorAll('[data-material]').forEach(el => {
                el.classList.remove('active-filter', 'font-bold', 'text-[#002366]');
                el.classList.add('text-slate-600');
            });
            if (!already) {
                document.querySelectorAll(`[data-material="${value}"]`).forEach(el => {
                    el.classList.add('active-filter', 'font-bold', 'text-[#002366]');
                    el.classList.remove('text-slate-600');
                });
            }
            applyFiltersAndSort();
        }));

        const params = new URLSearchParams(window.location.search);
        const q = params.get('search');
        if (searchInput && q) searchInput.value = q;
        applyFiltersAndSort();
    }

    function initMobileSidebarAdvanced() {
        if (document.querySelector('.global-mobile-drawer')) return;

        const header = document.querySelector('header');
        if (!header) return;

        const drawerHTML = `
            <div class="global-mobile-drawer fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] opacity-0 pointer-events-none transition-opacity duration-300">
                <div id="mobile-drawer-content" class="absolute top-0 right-0 w-[80%] max-w-[320px] h-full bg-white text-slate-800 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col rounded-l-3xl overflow-hidden">
                    <div class="p-6 border-b border-slate-200 flex justify-between items-center bg-[#00113a] text-white">
                        <span class="text-xl font-black font-['Manrope']">Kính Xanh</span>
                        <button class="close-menu-btn p-2 rounded-full hover:bg-white/20 transition-colors flex">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                        <a href="index.html" class="block px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-[#dbe1ff] hover:text-[#00113a] transition-colors">Trang Chủ</a>
                        <a href="products.html" class="block px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-[#dbe1ff] hover:text-[#00113a] transition-colors">Bộ Sưu Tập</a>
                        <a href="products.html?sort=bestseller" class="block px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-[#dbe1ff] hover:text-[#00113a] transition-colors">Bán Chạy</a>
                        <a href="index.html#flash-sale" class="block px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-[#dbe1ff] hover:text-[#00113a] transition-colors">Khuyến Mãi</a>
                        <a href="brands.html" class="block px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-[#dbe1ff] hover:text-[#00113a] transition-colors">Thương Hiệu</a>
                        <div class="my-4 border-t border-slate-200"></div>
                        <a href="profile.html" class="block px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors">Tài Khoản Của Tôi</a>
                        <a href="support.html" class="block px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors">Hỗ Trợ</a>
                    </div>
                    <div class="p-6 border-t border-slate-200 bg-slate-50">
                        <p class="text-xs text-center text-slate-500 font-semibold">Kính Xanh Optical © 2026</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', drawerHTML);
        
        const drawerOverlay = document.querySelector('.global-mobile-drawer');
        const drawerContent = document.getElementById('mobile-drawer-content');

        const openMenu = (e) => {
            if(e) e.preventDefault();
            drawerOverlay.classList.remove('opacity-0', 'pointer-events-none');
            drawerContent.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden'; 
        };

        const closeMenu = () => {
            drawerContent.classList.add('translate-x-full');
            drawerOverlay.classList.add('opacity-0');
            setTimeout(() => {
                drawerOverlay.classList.add('pointer-events-none');
                document.body.style.overflow = '';
            }, 300);
        };

        drawerContent.querySelector('.close-menu-btn').addEventListener('click', closeMenu);
        drawerOverlay.addEventListener('click', (e) => {
            if (e.target === drawerOverlay) closeMenu();
        });

        // Bổ sung nút nếu html cũ chưa có
        let foundExisting = false;
        header.querySelectorAll('button').forEach(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon && icon.textContent.trim() === 'menu') {
                foundExisting = true;
                // Bắt sự kiện trực tiếp song song với uỷ quyền để tối đa tỉ lệ thành công
                btn.addEventListener('click', openMenu);
            }
        });

        if (!foundExisting) {
            const cartLink = header.querySelector('a[href*="cart.html"]');
            if (cartLink && cartLink.parentElement) {
                const rightControls = cartLink.parentElement.parentElement;
                if (rightControls) {
                    const hamburgerBtn = document.createElement('button');
                    hamburgerBtn.className = 'mobile-menu-btn lg:hidden xl:hidden p-2 transform scale-95 hover:bg-surface-container transition-colors flex items-center justify-center rounded-full text-primary';
                    hamburgerBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 26px;">menu</span>';
                    rightControls.appendChild(hamburgerBtn);
                    hamburgerBtn.addEventListener('click', openMenu);
                }
            }
        }
        
        // Lắng nghe sự kiện click chung trên Header để bắt dính mọi nút Menu (Event Delegation)
        header.addEventListener('click', (e) => {
            let t = e.target;
            if (t.nodeType === 3) t = t.parentNode; // fix cho text node
            const btn = t.closest('button, .mobile-menu-btn');
            if (!btn) return;
            const icon = btn.querySelector('.material-symbols-outlined') || (btn.classList.contains('material-symbols-outlined') ? btn : null);
            if (icon && icon.textContent.trim() === 'menu') {
                openMenu(e);
            }
        });
    }

    function initFinalPatch() {
        try { initMobileSidebarAdvanced(); } catch (e) { console.error(e); }

        globalCart = loadCartState();
        saveCartState(globalCart);
        syncCartBadgeFinal();
        bindAddToCartButtonsFinal();
        bindBuyNowFinal();
        bindCartCheckoutFinal();
        renderCartFinal();
        renderCheckoutFinal();
        bindCheckoutCompleteFinal();
        bindFormSubmissionsFinal();
        
        try {
            bindProductFilteringAndSortingFinal();
        } catch (e) {
            console.error(e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFinalPatch, { once: true });
    } else {
        initFinalPatch();
    }
})();
