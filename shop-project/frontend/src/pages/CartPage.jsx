import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const formatCurrency = (amount) =>
  Number(amount || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });

const CartPage = () => {
  const { cart, cartTotal, cartCount, loadingCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const FREE_SHIPPING_THRESHOLD = 500000;
  const shippingFee = cartTotal >= FREE_SHIPPING_THRESHOLD || cartCount === 0 ? 0 : 30000;
  const grandTotal = cartTotal + shippingFee;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);

  if (loadingCart) {
    return (
      <div className="cart-page-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: '#64748b' }}>Đang tải thông tin giỏ hàng...</p>
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="cart-empty-page" style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#64748b' }}>
          <ShoppingBag size={40} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Giỏ hàng của bạn đang trống</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Hãy khám phá các mẫu trang phục mới nhất và thêm vào giỏ hàng nhé!</p>
        <Link to="/products" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
          <span>Khám Phá Sản Phẩm Ngay</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Giỏ Hàng <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b' }}>({cartCount} món)</span>
        </h1>
        <button
          onClick={clearCart}
          className="btn-text-danger"
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Trash2 size={16} />
          Xóa toàn bộ
        </button>
      </div>

      {/* Free Shipping Notice */}
      <div style={{ background: remainingForFreeShipping === 0 ? '#ecfdf5' : '#f8fafc', border: `1px solid ${remainingForFreeShipping === 0 ? '#a7f3d0' : '#e2e8f0'}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Truck size={20} color={remainingForFreeShipping === 0 ? '#059669' : '#0284c7'} />
        <div style={{ fontSize: '14px', color: '#334155' }}>
          {remainingForFreeShipping === 0 ? (
            <span style={{ fontWeight: 600, color: '#059669' }}>Chúc mừng! Đơn hàng của bạn đã đủ điều kiện Miễn phí vận chuyển toàn quốc.</span>
          ) : (
            <span>Mua thêm <strong style={{ color: '#0284c7' }}>{formatCurrency(remainingForFreeShipping)}</strong> để được <strong>Miễn phí vận chuyển</strong></span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
        {/* Cart Items List */}
        <div className="cart-items-wrapper" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'grid', gridTemplateColumns: '3fr 1.5fr 1.5fr 40px', fontWeight: 600, fontSize: '13px', color: '#64748b', textTransform: 'uppercase' }}>
            <span>Sản phẩm</span>
            <span style={{ textAlign: 'center' }}>Số lượng</span>
            <span style={{ textAlign: 'right' }}>Thành tiền</span>
            <span></span>
          </div>

          <div className="cart-items-list" style={{ divideY: '1px solid #f1f5f9' }}>
            {cart.items.map((item) => {
              const product = item.product || {};
              const itemTotal = (item.price || product.price || 0) * item.quantity;
              const variant = item.variant && product.variants
                ? product.variants.find((v) => v._id?.toString() === item.variant?.toString())
                : null;
              const maxStock = variant ? variant.stock : (product.stock || 99);
              const variantId = item.variant?._id || item.variant || null;
              const rowKey = `${product._id || item._id}-${variantId || 'base'}`;

              return (
                <div
                  key={rowKey}
                  className="cart-item-row"
                  style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 1.5fr 40px', padding: '20px', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}
                >
                  {/* Product info */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '72px', height: '84px', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                      <img
                        src={product.images && product.images[0] ? product.images[0] : 'https://placehold.co/100x120?text=No+Image'}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>
                        {product.name || 'Sản phẩm'}
                      </h3>
                      {item.variantLabel && (
                        <p style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, margin: '0 0 4px' }}>
                          Phân loại: {item.variantLabel}
                        </p>
                      )}
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 6px' }}>{product.category || 'Thời trang'}</p>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                        {formatCurrency(item.price || product.price)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product._id, item.quantity - 1, variantId)}
                        style={{ padding: '6px 10px', background: '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        aria-label="Giảm số lượng"
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ minWidth: '36px', textAlign: 'center', fontWeight: 600, fontSize: '14px' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= maxStock}
                        onClick={() => updateQuantity(product._id, item.quantity + 1, variantId)}
                        style={{ padding: '6px 10px', background: '#f8fafc', border: 'none', cursor: item.quantity >= maxStock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: item.quantity >= maxStock ? 0.4 : 1 }}
                        aria-label="Tăng số lượng"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Item total */}
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                    {formatCurrency(itemTotal)}
                  </div>

                  {/* Delete button */}
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product._id, variantId)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
                      title="Xóa khỏi giỏ hàng"
                      aria-label="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '16px 20px', background: '#f8fafc' }}>
            <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              <ArrowLeft size={16} />
              Tiếp tục mua hàng
            </Link>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="cart-summary-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px', color: '#0f172a' }}>Tóm Tắt Đơn Hàng</h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#64748b' }}>
            <span>Tạm tính ({cartCount} món)</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(cartTotal)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
            <span>Phí vận chuyển</span>
            <span style={{ fontWeight: 600, color: shippingFee === 0 ? '#10b981' : '#0f172a' }}>
              {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
            </span>
          </div>

          <div style={{ height: '1px', background: '#e2e8f0', margin: '16px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Tổng thanh toán</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#7c3aed' }}>{formatCurrency(grandTotal)}</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '10px' }}
          >
            <span>Tiến Hành Đặt Hàng</span>
            <ArrowRight size={18} />
          </button>

          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Thanh toán an toàn &amp; Bảo mật tuyệt đối</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

