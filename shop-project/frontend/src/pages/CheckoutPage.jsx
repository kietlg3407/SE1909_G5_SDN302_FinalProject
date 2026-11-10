import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, CreditCard, Tag, CheckCircle2, ArrowLeft, Truck, AlertCircle, Ticket, X } from 'lucide-react';
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
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
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
      } catch {
        // Fallback to manual entry
      }
    };
    fetchAddresses();
  }, [user]);

  // Load active coupons from database
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoadingCoupons(true);
        const res = await api.get('/api/coupons?limit=50');
        const list = res.data?.data?.coupons || res.data?.coupons || [];
        setAvailableCoupons(list);
      } catch (err) {
        console.error('Không thể tải danh sách mã giảm giá', err);
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchCoupons();
  }, []);

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

  // Apply Coupon via Backend API
  const handleApplyCoupon = async (codeOverride) => {
    const code = (typeof codeOverride === 'string' ? codeOverride : couponCode).trim().toUpperCase();
    if (!code) {
      toast.error('Vui lòng nhập hoặc chọn mã giảm giá');
      return;
    }

    try {
      setApplyingCoupon(true);
      const res = await api.post('/api/coupons/apply', {
        code,
        orderAmount: cartTotal,
      });

      if (res.data?.coupon) {
        const c = res.data.coupon;
        setAppliedCoupon({
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          discountAmount: res.data.discountAmount,
          minOrderValue: c.minOrderValue,
        });
        setCouponCode(c.code);
        toast.success(res.data.message || `Áp dụng mã ${c.code} thành công`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể áp dụng mã giảm giá';
      toast.error(msg);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Remove Applied Coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Đã gỡ mã giảm giá');
  };

  // Recalculate discount based on current cartTotal and coupon specifications
  const discountAmount = appliedCoupon
    ? (appliedCoupon.discountType === 'percentage'
        ? Math.round((cartTotal * appliedCoupon.discountValue) / 100)
        : Math.min(appliedCoupon.discountValue || appliedCoupon.discountAmount, cartTotal))
    : 0;

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
        couponCode: appliedCoupon?.code || undefined,
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
              <div key={`${item.product?._id || item._id}-${item.variant || 'base'}`} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <img
                  src={item.product?.images?.[0] || 'https://placehold.co/80x100?text=Item'}
                  alt={item.product?.name}
                  style={{ width: '48px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.product?.name}
                  </p>
                  {item.variantLabel && (
                    <p style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, margin: 0 }}>
                      Phân loại: {item.variantLabel}
                    </p>
                  )}
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

          {/* Coupon Code Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                <Ticket size={16} color="#7c3aed" /> Mã giảm giá / Khuyến mãi
              </label>
              {availableCoupons.length > 0 && (
                <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>
                  {availableCoupons.length} mã trong hệ thống
                </span>
              )}
            </div>

            {/* Input & Apply Button */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Nhập mã ưu đãi..."
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCoupon();
                  }
                }}
                disabled={applyingCoupon}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                disabled={applyingCoupon || !couponCode.trim()}
                className="btn-primary"
                style={{ padding: '9px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
              >
                {applyingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
              </button>
            </div>

            {/* Applied Coupon Info Box */}
            {appliedCoupon && (
              <div
                style={{
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#065f46',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  padding: '8px 12px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>
                    Đang dùng mã <strong>{appliedCoupon.code}</strong> (-{formatCurrency(discountAmount)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                  title="Gỡ mã này"
                >
                  <X size={14} /> Gỡ mã
                </button>
              </div>
            )}

            {/* Available Coupons list from Database */}
            {loadingCoupons ? (
              <div style={{ fontSize: '12px', color: '#64748b', padding: '8px 0' }}>Đang tải danh sách mã ưu đãi...</div>
            ) : availableCoupons.length > 0 ? (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                  Danh sách mã ưu đãi có sẵn:
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '190px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {availableCoupons.map((c) => {
                    const isApplied = appliedCoupon?.code === c.code;
                    const isExpired = c.isExpired ?? (c.expiryDate && new Date(c.expiryDate).getTime() < Date.now());
                    const isLimitReached = c.isLimitReached ?? (c.usageLimit !== null && c.usageLimit !== undefined && c.usageLimit > 0 && (c.usedCount || 0) >= c.usageLimit);
                    const isUsable = !isExpired && !isLimitReached;
                    const isEligible = isUsable && (!c.minOrderValue || cartTotal >= c.minOrderValue);

                    const discountText =
                      c.discountType === 'percentage'
                        ? `Giảm ${c.discountValue}%`
                        : `Giảm ${formatCurrency(c.discountValue)}`;
                    const minOrderText =
                      c.minOrderValue > 0
                        ? `Đơn từ ${formatCurrency(c.minOrderValue)}`
                        : 'Không giới hạn đơn tối thiểu';

                    const borderStyle = isApplied
                      ? '1.5px solid #10b981'
                      : isExpired
                      ? '1px solid #fecaca'
                      : isLimitReached
                      ? '1px solid #fde68a'
                      : isEligible
                      ? '1px dashed #7c3aed'
                      : '1px solid #e2e8f0';

                    const bgStyle = isApplied
                      ? '#f0fdf4'
                      : isExpired
                      ? '#fef2f2'
                      : isLimitReached
                      ? '#fffbeb'
                      : isEligible
                      ? '#faf5ff'
                      : '#f8fafc';

                    return (
                      <div
                        key={c._id || c.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: borderStyle,
                          background: bgStyle,
                          opacity: isUsable ? (isEligible ? 1 : 0.8) : 0.65,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '13px',
                                color: isApplied ? '#059669' : isExpired ? '#b91c1c' : isLimitReached ? '#b45309' : '#6d28d9',
                                background: isApplied ? '#dcfce7' : isExpired ? '#fee2e2' : isLimitReached ? '#fef3c7' : '#ede9fe',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                letterSpacing: '0.5px',
                              }}
                            >
                              {c.code}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                              {discountText}
                            </span>

                            {/* Status badges */}
                            {isExpired && (
                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#b91c1c', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px' }}>
                                Đã hết hạn
                              </span>
                            )}
                            {isLimitReached && (
                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                                Hết lượt dùng
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {minOrderText}
                            {c.expiryDate && (
                              <span> • HSD: {new Date(c.expiryDate).toLocaleDateString('vi-VN')}</span>
                            )}
                            {c.usageLimit && (
                              <span> • Đã dùng: {c.usedCount || 0}/{c.usageLimit}</span>
                            )}
                          </div>

                          {/* Explanatory notes */}
                          {isExpired ? (
                            <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '2px', fontWeight: 600 }}>
                              • Mã giảm giá đã hết hạn sử dụng
                            </div>
                          ) : isLimitReached ? (
                            <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontWeight: 600 }}>
                              • Mã giảm giá đã hết lượt sử dụng ({c.usedCount || 0}/{c.usageLimit} lượt)
                            </div>
                          ) : !isEligible ? (
                            <div style={{ fontSize: '11px', color: '#e11d48', marginTop: '2px' }}>
                              Cần mua thêm {formatCurrency(c.minOrderValue - cartTotal)} để áp dụng
                            </div>
                          ) : null}
                        </div>

                        <div>
                          {isApplied ? (
                            <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              style={{
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#ef4444',
                                background: '#fee2e2',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              Đang dùng
                            </button>
                          ) : isExpired ? (
                            <button
                              type="button"
                              disabled
                              style={{
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#94a3b8',
                                background: '#e2e8f0',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'not-allowed',
                              }}
                            >
                              Đã hết hạn
                            </button>
                          ) : isLimitReached ? (
                            <button
                              type="button"
                              disabled
                              style={{
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#94a3b8',
                                background: '#e2e8f0',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'not-allowed',
                              }}
                            >
                              Hết lượt
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!isEligible || applyingCoupon}
                              onClick={() => handleApplyCoupon(c.code)}
                              style={{
                                padding: '5px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: isEligible ? '#fff' : '#94a3b8',
                                background: isEligible ? '#7c3aed' : '#e2e8f0',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isEligible ? 'pointer' : 'not-allowed',
                                transition: 'background 0.2s',
                              }}
                            >
                              Áp dụng
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginTop: '6px' }}>
                Hiện không có mã giảm giá nào trong hệ thống.
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
              <span>Giảm giá khuyến mãi ({appliedCoupon?.code})</span>
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
