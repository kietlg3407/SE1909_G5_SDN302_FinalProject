import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingBag, ChevronRight, XCircle, Clock, CheckCircle2, Truck, AlertCircle } from 'lucide-react';
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

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const url = activeTab === 'All' ? '/api/orders/my-orders' : `/api/orders/my-orders?status=${activeTab}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    try {
      setCancellingId(orderId);
      const res = await api.put(`/api/orders/${orderId}/cancel`, {
        reason: 'Khách hàng chủ động hủy đơn qua website',
      });
      if (res.data?.success) {
        toast.success('Hủy đơn hàng thành công');
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancellingId(null);
    }
  };

  const tabs = [
    { id: 'All', label: 'Tất cả' },
    { id: 'Pending', label: 'Chờ xác nhận' },
    { id: 'Confirmed', label: 'Đã xác nhận' },
    { id: 'Shipping', label: 'Đang giao hàng' },
    { id: 'Delivered', label: 'Đã giao' },
    { id: 'Cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="my-orders-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Đơn Hàng Của Tôi</h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Theo dõi tiến trình và trạng thái các đơn hàng bạn đã đặt.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: activeTab === tab.id ? '#0f172a' : '#f8fafc',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748b' }}>Đang tải danh sách đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94a3b8' }}>
            <ShoppingBag size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>Chưa có đơn hàng nào</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Bạn chưa có đơn hàng nào ở trạng thái này.</p>
          <Link to="/products" className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>Mua sắm ngay</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const canCancel = ['Pending', 'Confirmed'].includes(order.status);

            return (
              <div
                key={order._id}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {/* Header: Order ID & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      Đơn #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(order.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>

                {/* Items preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img
                        src={item.image || 'https://placehold.co/60x70?text=Item'}
                        alt={item.name}
                        style={{ width: '48px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Số lượng: {item.quantity} x {formatCurrency(item.price)}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracking info if Shipping */}
                {order.trackingNumber && (
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0369a1' }}>
                    <Truck size={16} />
                    <span>Mã vận đơn: <strong>{order.trackingNumber}</strong></span>
                    {order.shippingNotes && <span style={{ color: '#475569' }}>- {order.shippingNotes}</span>}
                  </div>
                )}

                {/* Footer: Total & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#64748b', marginRight: '8px' }}>Tổng thanh toán:</span>
                    <strong style={{ fontSize: '17px', color: '#7c3aed' }}>{formatCurrency(order.totalPrice)}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {canCancel && (
                      <button
                        type="button"
                        disabled={cancellingId === order._id}
                        onClick={() => handleCancelOrder(order._id)}
                        style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        {cancellingId === order._id ? 'Đang hủy...' : 'Hủy đơn'}
                      </button>
                    )}
                    <Link
                      to={`/orders/${order._id}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: '#0f172a', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', textDecoration: 'none' }}
                    >
                      <span>Xem chi tiết</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
