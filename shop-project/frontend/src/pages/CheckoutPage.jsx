import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, CreditCard, Tag, CheckCircle2, ArrowLeft, Truck, AlertCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const formatCurrency = (amount) =>
  Number(amount || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });

const CheckoutPage = () => {
  const { cart, cartTotal, cartCount, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('custom');

  const [addressForm, setAddressForm] = useState({
    recipientName: user?.name || '',
    phone: '',
    street: '',
    city: 'Hà Nội',
    state: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load user saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/api/users/addresses');
        if (res.data?.success && res.data.addresses?.length > 0) {
          setSavedAddresses(res.data.addresses);
          const defaultAddr = res.data.addresses.find((a) => a.isDefault) || res.data.addresses[0];
          setSelectedAddressId(defaultAddr._id);
          setAddressForm({
            recipientName: user?.name || '',
            phone: defaultAddr.phone || '',
            street: defaultAddr.street || '',
            city: defaultAddr.city || '',
            state: defaultAddr.state || '',
          });
        }
      } catch (err) {
        // Fallback to manual entry
      }
    };
    fetchAddresses();
  }, [user]);

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setAddressForm({
      recipientName: user?.name || '',
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
    });
  };

  const FREE_SHIPPING_THRESHOLD = 500000;
  const shippingFee = cartTotal >= FREE_SHIPPING_THRESHOLD || cartCount === 0 ? 0 : 30000;

  // Apply Coupon
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const code = couponCode.trim().toUpperCase();
      // Test with coupon endpoint or calculate client side
      if (code === 'WELCOME10') {
        const discount = Math.round(cartTotal * 0.1);
        setAppliedCoupon({ code, discountAmount: discount, description: 'Giảm 10% đơn hàng' });
        toast.success('Áp dụng mã WELCOME10 thành công (-10%)');
      } else {
        // Query coupon API
        const res = await api.get(`/api/coupons`);
        const found = res.data?.coupons?.find((c) => c.code === code && c.isActive);
        if (found) {
          let discount = 0;
          if (found.discountType === 'percentage') {
            discount = Math.round((cartTotal * found.discountValue) / 100);
            if (found.maxDiscount && discount > found.maxDiscount) discount = found.maxDiscount;
          } else {
            discount = found.discountValue;
          }
          setAppliedCoupon({ code, discountAmount: discount, description: `Giảm ${formatCurrency(discount)}` });
          toast.success(`Áp dụng mã ${code} thành công`);
        } else {
          toast.error('Mã giảm giá không tồn tại hoặc đã hết hạn');
        }
      }
    } catch {
      toast.error('Lỗi khi kiểm tra mã giảm giá');
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, cartTotal + shippingFee - discountAmount);

  // Submit Order
  const handlePlaceOrder = async () => {
    if (!addressForm.recipientName || !addressForm.phone || !addressForm.street || !addressForm.city) {
      toast.error('Vui lòng điền đầy đủ tên, số điện thoại và địa chỉ giao hàng');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        shippingAddress: {
          recipientName: addressForm.recipientName,
          phone: addressForm.phone,
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state || addressForm.city,
        },
        paymentMethod,
        couponCode: appliedCoupon?.code,
        shippingPrice: shippingFee,
      };

      const res = await api.post('/api/orders', payload);
      if (res.data?.success) {
        toast.success('Đặt hàng thành công!');
        fetchCart();
        navigate(`/orders/${res.data.order._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '20px' }}>
        <h2>Không có sản phẩm để thanh toán</h2>
        <p style={{ color: '#64748b', margin: '16px 0 24px' }}>Giỏ hàng của bạn đang trống.</p>
        <Link to="/products" className="btn-primary">Quay lại mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page" style={{ maxWidth: '1140px', margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontSize: '14px', marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Quay lại giỏ hàng
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Thanh Toán Đơn Hàng</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Left Form: Address & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 1. Shipping Address */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>1. Địa Chỉ Giao Hàng</h2>
            </div>

            {savedAddresses.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Chọn từ sổ địa chỉ của bạn:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        border: selectedAddressId === addr._id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: selectedAddressId === addr._id ? '#fbf8ff' : '#fff',
                      }}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        checked={selectedAddressId === addr._id}
                        onChange={() => handleSelectSavedAddress(addr)}
                      />
                      <div style={{ fontSize: '14px', color: '#0f172a' }}>
                        <strong>{addr.phone}</strong> - {addr.street}, {addr.state}, {addr.city}
                        {addr.isDefault && <span style={{ marginLeft: '8px', fontSize: '11px', background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '4px' }}>Mặc định</span>}
                      </div>
                    </label>
                  ))}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: selectedAddressId === 'custom' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: selectedAddressId === 'custom' ? '#fbf8ff' : '#fff',
                    }}
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={selectedAddressId === 'custom'}
                      onChange={() => setSelectedAddressId('custom')}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Nhập địa chỉ nhận hàng khác</span>
                  </label>
                </div>
              </div>
            )}

            {/* Address fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Tên người nhận *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={addressForm.recipientName}
                  onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                  placeholder="Họ và tên..."
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="0912345678"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Địa chỉ số nhà, tên đường *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  placeholder="Số 123, đường Nguyễn Trãi..."
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Quận / Huyện *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  placeholder="Thanh Xuân"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Tỉnh / Thành phố *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  placeholder="Hà Nội"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />
              </div>
            </div>
          </div>

          {/* 2. Payment Method */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={18} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>2. Phương Thức Thanh Toán</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { id: 'COD', title: 'Thanh toán khi nhận hàng (COD)', desc: 'Thanh toán bằng tiền mặt khi shipper giao hàng đến nhà.' },
                { id: 'Banking', title: 'Chuyển khoản Ngân hàng', desc: 'Chuyển khoản qua mã VietQR hoặc tài khoản ngân hàng chính thức.' },
                { id: 'VNPAY', title: 'Ví điện tử VNPAY', desc: 'Thanh toán tiện lợi qua cổng VNPAY QR hoặc thẻ ATM nội địa.' },
              ].map((pm) => (
                <label
                  key={pm.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px',
                    border: paymentMethod === pm.id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: paymentMethod === pm.id ? '#fbf8ff' : '#fff',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={pm.id}
                    checked={paymentMethod === pm.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <span style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{pm.title}</span>
                    <span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>{pm.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form: Order Review & Summary */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
            Chi Tiết Đơn Hàng ({cartCount})
          </h2>

          <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
            {cart.items.map((item) => (
              <div key={item.product?._id || item._id} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <img
                  src={item.product?.images?.[0] || 'https://placehold.co/80x100?text=Item'}
                  alt={item.product?.name}
                  style={{ width: '48px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.product?.name}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    {formatCurrency(item.product?.price || item.price)} x {item.quantity}
                  </p>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {formatCurrency((item.product?.price || item.price) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Code Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Mã giảm giá / Khuyến mãi
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Nhập WELCOME10..."
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', textTransform: 'uppercase', fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="btn-primary"
                style={{ padding: '9px 16px', fontSize: '13px' }}
              >
                Áp dụng
              </button>
            </div>
            {appliedCoupon && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669', background: '#ecfdf5', padding: '6px 10px', borderRadius: '6px' }}>
                <CheckCircle2 size={14} />
                <span>Mã <strong>{appliedCoupon.code}</strong>: -{formatCurrency(appliedCoupon.discountAmount)}</span>
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: '#e2e8f0', margin: '16px 0' }}></div>

          {/* Price Breakdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>
            <span>Tạm tính</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(cartTotal)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>
            <span>Phí giao hàng</span>
            <span style={{ fontWeight: 600, color: shippingFee === 0 ? '#10b981' : '#0f172a' }}>
              {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
            </span>
          </div>

          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#059669' }}>
              <span>Giảm giá khuyến mãi</span>
              <span style={{ fontWeight: 600 }}>-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          <div style={{ height: '1px', background: '#e2e8f0', margin: '14px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Tổng thanh toán</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#7c3aed' }}>{formatCurrency(grandTotal)}</span>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handlePlaceOrder}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700, borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Đang Xử Lý Đơn Hàng...' : 'Xác Nhận Đặt Hàng'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

