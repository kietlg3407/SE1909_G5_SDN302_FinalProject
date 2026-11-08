import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Package, MapPin, CreditCard, Truck, XCircle, Tag, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';

const formatCurrency = (amount) =>
  Number(amount || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });

const getStatusBadge = (status) => {
  switch (status) {
    case 'Pending':
      return { label: 'Chờ xác nhận', bg: '#fef3c7', color: '#b45309' };
    case 'Confirmed':
      return { label: 'Đã xác nhận', bg: '#e0e7ff', color: '#4338ca' };
    case 'Processing':
      return { label: 'Đang xử lý / Đóng gói', bg: '#f3e8ff', color: '#7e22ce' };
    case 'Shipping':
      return { label: 'Đang giao hàng', bg: '#e0f2fe', color: '#0369a1' };
    case 'Delivered':
      return { label: 'Giao hàng thành công', bg: '#dcfce7', color: '#15803d' };
    case 'Cancelled':
      return { label: 'Đã hủy', bg: '#fee2e2', color: '#b91c1c' };
    default:
      return { label: status, bg: '#f1f5f9', color: '#475569' };
  }
};

const PAYMENT_LABELS = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  Banking: 'Chuyển khoản Ngân hàng',
  VNPAY: 'Ví điện tử VNPAY',
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/orders/${id}`);
      if (res.data?.success) {
        setOrder(res.data.order);
      }
    } catch {
      toast.error('Không thể tải thông tin đơn hàng');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    try {
      setCancelling(true);
      const res = await api.put(`/api/orders/${id}/cancel`, {
        reason: 'Khách hàng chủ động hủy đơn qua website',
      });
      if (res.data?.success) {
        toast.success('Hủy đơn hàng thành công');
        fetchOrder();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: '#64748b' }}>Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (!order) return null;

  const badge = getStatusBadge(order.status);
  const canCancel = ['Pending', 'Confirmed'].includes(order.status);
  const addr = order.shippingAddress || {};

  return (
    <div className="order-detail-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontSize: '14px', marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Quay lại đơn hàng
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              Đơn hàng #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', background: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
            {canCancel && (
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: '8px', cursor: cancelling ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <XCircle size={15} />
                {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Items + Status history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Items */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} /> Sản phẩm đã đặt
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {order.orderItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={item.image || 'https://placehold.co/60x70?text=Item'}
                    alt={item.name}
                    style={{ width: '56px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {formatCurrency(item.price)} x {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status history */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} /> Lịch sử trạng thái
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[...order.statusHistory].reverse().map((h, idx) => {
                  const hb = getStatusBadge(h.status);
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: hb.color, marginTop: '5px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{hb.label}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {new Date(h.changedAt).toLocaleString('vi-VN')}
                          {h.changedBy?.name ? ` • ${h.changedBy.name}` : ''}
                        </div>
                        {h.note && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{h.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary + Address + Payment + Tracking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Price summary */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>Tóm tắt thanh toán</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              <span>Tạm tính</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(order.itemsPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              <span>Phí vận chuyển</span>
              <span style={{ fontWeight: 600, color: order.shippingPrice === 0 ? '#10b981' : '#0f172a' }}>
                {order.shippingPrice === 0 ? 'Miễn phí' : formatCurrency(order.shippingPrice)}
              </span>
            </div>
            {order.coupon?.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#059669', marginBottom: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={13} /> Mã {order.coupon.code}
                </span>
                <span style={{ fontWeight: 600 }}>-{formatCurrency(order.coupon.discountAmount)}</span>
              </div>
            )}
            <div style={{ height: '1px', background: '#e2e8f0', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Tổng cộng</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#7c3aed' }}>{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>

          {/* Shipping address */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} /> Địa chỉ giao hàng
            </h2>
            <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.7 }}>
              <div><strong>{addr.recipientName}</strong></div>
              <div>{addr.street}, {addr.state && `${addr.state}, `}{addr.city}</div>
              <div>Điện thoại: {addr.phone}</div>
            </div>
          </div>

          {/* Payment */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} /> Thanh toán
            </h2>
            <div style={{ fontSize: '14px', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
              {order.isPaid ? (
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: '12px' }}>Đã thanh toán</span>
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '3px 10px', borderRadius: '12px' }}>Chưa thanh toán</span>
              )}
            </div>
          </div>

          {/* Tracking */}
          {order.trackingNumber && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '16px', padding: '20px 24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 8px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={17} /> Vận chuyển
              </h2>
              <div style={{ fontSize: '14px', color: '#0f172a' }}>
                Mã vận đơn: <strong>{order.trackingNumber}</strong>
              </div>
              {order.shippingNotes && (
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>{order.shippingNotes}</div>
              )}
            </div>
          )}

          {order.status === 'Cancelled' && order.cancelReason && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '20px 24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={17} /> Lý do hủy
              </h2>
              <div style={{ fontSize: '14px', color: '#7f1d1d' }}>{order.cancelReason}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
