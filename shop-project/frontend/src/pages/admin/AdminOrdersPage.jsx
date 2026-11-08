import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ClipboardList, Search, ChevronDown, ChevronUp, Truck, XCircle,
  CheckCircle2, Clock, Package, MapPin, CreditCard, User, ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '../../services/api';

const formatCurrency = (amount) =>
  Number(amount || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });

const STATUS_OPTIONS = [
  { id: 'All', label: 'Tất cả' },
  { id: 'Pending', label: 'Chờ xác nhận' },
  { id: 'Confirmed', label: 'Đã xác nhận' },
  { id: 'Processing', label: 'Đang xử lý' },
  { id: 'Shipping', label: 'Đang giao' },
  { id: 'Delivered', label: 'Đã giao' },
  { id: 'Cancelled', label: 'Đã hủy' },
];

const CANCEL_REASONS = [
  'Khách hàng yêu cầu hủy',
  'Hết hàng / không đủ tồn kho',
  'Thông tin giao hàng không hợp lệ',
  'Khách hàng không phản hồi',
  'Lý do khác',
];

const NEXT_STATUS_ACTIONS = {
  Pending: [{ status: 'Confirmed', label: 'Xác nhận đơn' }, { status: 'Cancelled', label: 'Hủy đơn', danger: true }],
  Confirmed: [{ status: 'Processing', label: 'Bắt đầu xử lý' }, { status: 'Cancelled', label: 'Hủy đơn', danger: true }],
  Processing: [{ status: 'Shipping', label: 'Bàn giao vận chuyển' }, { status: 'Cancelled', label: 'Hủy đơn', danger: true }],
  Shipping: [{ status: 'Delivered', label: 'Đã giao hàng' }],
  Delivered: [],
  Cancelled: [],
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Pending':
      return { label: 'Chờ xác nhận', bg: '#fef3c7', color: '#b45309' };
    case 'Confirmed':
      return { label: 'Đã xác nhận', bg: '#e0e7ff', color: '#4338ca' };
    case 'Processing':
      return { label: 'Đang xử lý', bg: '#f3e8ff', color: '#7e22ce' };
    case 'Shipping':
      return { label: 'Đang giao hàng', bg: '#e0f2fe', color: '#0369a1' };
    case 'Delivered':
      return { label: 'Đã giao', bg: '#dcfce7', color: '#15803d' };
    case 'Cancelled':
      return { label: 'Đã hủy', bg: '#fee2e2', color: '#b91c1c' };
    default:
      return { label: status, bg: '#f1f5f9', color: '#475569' };
  }
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [shippingForms, setShippingForms] = useState({});
  const [statusModal, setStatusModal] = useState(null); // { orderId, status, label, danger }
  const [cancelReason, setCancelReason] = useState('');

  const LIMIT = 10;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (activeStatus !== 'All') params.set('status', activeStatus);
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/api/orders?${params.toString()}`);
      if (res.data?.success) {
        setOrders(res.data.orders || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [activeStatus, search, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounce search input 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleStatusChange = (activeStatus) => {
    setActiveStatus(activeStatus);
    setPage(1);
  };

  const openStatusModal = (orderId, status, label, danger = false) => {
    setStatusModal({ orderId, status, label, danger });
    setCancelReason('');
  };

  const confirmStatusAction = async () => {
    if (!statusModal) return;
    const { orderId, status, danger } = statusModal;
    const note = danger
      ? (cancelReason || 'Nhân viên hủy đơn hàng')
      : `Nhân viên cập nhật trạng thái sang ${status}`;
    try {
      setActionLoading(`${orderId}-status`);
      const res = await api.put(`/api/orders/${orderId}/status`, { status, note });
      if (res.data?.success) {
        toast.success(res.data.message || 'Cập nhật trạng thái thành công');
        setStatusModal(null);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setActionLoading(null);
    }
  };

  const handleShippingSubmit = async (orderId) => {
    const form = shippingForms[orderId];
    if (!form || (!form.trackingNumber.trim() && !form.shippingNotes.trim())) {
      toast.error('Vui lòng nhập mã vận đơn hoặc ghi chú vận chuyển');
      return;
    }
    try {
      setActionLoading(`${orderId}-shipping`);
      const res = await api.put(`/api/orders/${orderId}/shipping`, {
        trackingNumber: form.trackingNumber,
        shippingNotes: form.shippingNotes,
      });
      if (res.data?.success) {
        toast.success('Cập nhật vận chuyển thành công');
        setShippingForms((prev) => ({ ...prev, [orderId]: { trackingNumber: '', shippingNotes: '' } }));
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật vận chuyển');
    } finally {
      setActionLoading(null);
    }
  };

  const setShippingField = (orderId, field, value) => {
    setShippingForms((prev) => ({
      ...prev,
      [orderId]: { trackingNumber: '', shippingNotes: '', ...prev[orderId], [field]: value },
    }));
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}
        >
          <ChevronLeft size={15} /> Trước
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p)}
            style={{
              minWidth: '36px', height: '36px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              border: p === page ? 'none' : '1px solid #cbd5e1',
              background: p === page ? '#0f172a' : '#fff',
              color: p === page ? '#fff' : '#334155',
            }}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}
        >
          Sau <ChevronRight size={15} />
        </button>
      </div>
    );
  };

  return (
    <div className="admin-orders-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={26} color="#7c3aed" /> Xử Lý Đơn Hàng
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Tổng cộng {total} đơn hàng — Duyệt đơn, cập nhật trạng thái và thông tin vận chuyển.
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo SĐT, người nhận, mã vận đơn, mã đơn..."
            style={{ width: '100%', padding: '10px 14px 10px 38px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px' }}
          />
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
        {STATUS_OPTIONS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleStatusChange(tab.id)}
            style={{
              padding: '9px 16px',
              border: 'none',
              background: activeStatus === tab.id ? '#7c3aed' : '#f8fafc',
              color: activeStatus === tab.id ? '#fff' : '#64748b',
              fontWeight: 600,
              fontSize: '13px',
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
          <p style={{ color: '#64748b' }}>Đang tải đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center', padding: '32px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94a3b8' }}>
            <Package size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>Không có đơn hàng</h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Không tìm thấy đơn hàng nào phù hợp bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const isExpanded = expandedId === order._id;
            const actions = NEXT_STATUS_ACTIONS[order.status] || [];
            const shippingForm = shippingForms[order._id] || { trackingNumber: '', shippingNotes: '' };

            return (
              <div
                key={order._id}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}
              >
                {/* Order summary row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : order._id)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '12px', flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(order.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={14} color="#64748b" />
                      {order.user?.name || 'Khách hàng'} ({order.user?.email || 'N/A'})
                    </div>
                    <div style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} color="#64748b" />
                      {order.shippingAddress?.recipientName}, {order.shippingAddress?.phone}
                    </div>
                    {order.trackingNumber && (
                      <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Truck size={13} /> {order.trackingNumber}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#7c3aed' }}>{formatCurrency(order.totalPrice)}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    {isExpanded ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #f1f5f9', padding: '20px', background: '#f8fafc' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px' }}>
                      {/* Left: items + address */}
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Package size={15} /> Sản phẩm ({order.orderItems?.length || 0})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          {(order.orderItems || []).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
                              <img
                                src={item.image || 'https://placehold.co/44x52?text=Item'}
                                alt={item.name}
                                style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                              />
                              <div style={{ flex: 1, minWidth: 0, fontSize: '13px' }}>
                                <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                <div style={{ color: '#64748b', fontSize: '12px' }}>{formatCurrency(item.price)} x {item.quantity}</div>
                              </div>
                              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{formatCurrency(item.price * item.quantity)}</div>
                            </div>
                          ))}
                        </div>

                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={15} /> Địa chỉ giao hàng
                        </h4>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                          <div><strong>{order.shippingAddress?.recipientName}</strong> — {order.shippingAddress?.phone}</div>
                          <div>{order.shippingAddress?.street}, {order.shippingAddress?.state}, {order.shippingAddress?.city}</div>
                        </div>

                        <div style={{ marginTop: '10px', fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CreditCard size={14} color="#64748b" />
                          {order.paymentMethod} {order.isPaid ? '• Đã thanh toán' : '• Chưa thanh toán'}
                          {order.coupon?.code && ` • Coupon: ${order.coupon.code} (-${formatCurrency(order.coupon.discountAmount)})`}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Status actions */}
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>Cập nhật trạng thái</h4>
                          {actions.length === 0 ? (
                            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                              Đơn hàng ở trạng thái cuối — không thể chuyển tiếp.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {actions.map((a) => (
                                <button
                                  key={a.status}
                                  type="button"
                                  disabled={actionLoading === `${order._id}-status`}
                                  onClick={() => openStatusModal(order._id, a.status, a.label, a.danger)}
                                  style={{
                                    padding: '9px 14px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', cursor: 'pointer',
                                    border: 'none',
                                    background: a.danger ? '#fee2e2' : '#eef2ff',
                                    color: a.danger ? '#b91c1c' : '#4338ca',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                  }}
                                >
                                  {a.danger ? <XCircle size={15} /> : a.status === 'Delivered' ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                                  {a.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Shipping update */}
                        {['Processing', 'Shipping', 'Delivered'].includes(order.status) && (
                          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Truck size={15} /> Vận chuyển
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input
                                type="text"
                                value={shippingForm.trackingNumber}
                                onChange={(e) => setShippingField(order._id, 'trackingNumber', e.target.value)}
                                placeholder="Mã vận đơn (VD: VNPOST123456)"
                                style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                              />
                              <input
                                type="text"
                                value={shippingForm.shippingNotes}
                                onChange={(e) => setShippingField(order._id, 'shippingNotes', e.target.value)}
                                placeholder="Ghi chú vận chuyển"
                                style={{ padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                              />
                              <button
                                type="button"
                                disabled={actionLoading === `${order._id}-shipping`}
                                onClick={() => handleShippingSubmit(order._id)}
                                style={{ padding: '9px 14px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', cursor: 'pointer', border: 'none', background: '#0f172a', color: '#fff' }}
                              >
                                {actionLoading === `${order._id}-shipping` ? 'Đang lưu...' : 'Lưu vận chuyển'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Status history mini */}
                        {order.statusHistory && order.statusHistory.length > 0 && (
                          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Lịch sử trạng thái</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                              {[...order.statusHistory].reverse().slice(0, 6).map((h, idx) => (
                                <div key={idx} style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{getStatusBadge(h.status).label}</span>
                                  <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(h.changedAt).toLocaleString('vi-VN')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {renderPagination()}

      {/* Status change confirmation modal */}
      {statusModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
          }}
          onClick={() => !actionLoading && setStatusModal(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: statusModal.danger ? '#fee2e2' : '#eef2ff',
                color: statusModal.danger ? '#b91c1c' : '#4338ca',
              }}>
                {statusModal.danger ? <XCircle size={22} /> : <Clock size={22} />}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {statusModal.danger ? 'Xác nhận hủy đơn' : 'Xác nhận chuyển trạng thái'}
              </h3>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px' }}>
              Đơn <strong>#{statusModal.orderId.slice(-8).toUpperCase()}</strong> sẽ chuyển sang trạng thái{' '}
              <strong>{statusModal.label}</strong>.
            </p>

            {statusModal.danger ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Lý do hủy đơn <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {CANCEL_REASONS.map((reason) => (
                    <label
                      key={reason}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                        border: cancelReason === reason ? '2px solid #dc2626' : '1px solid #e2e8f0',
                        borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#0f172a',
                        background: cancelReason === reason ? '#fef2f2' : '#fff',
                      }}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        checked={cancelReason === reason}
                        onChange={() => setCancelReason(reason)}
                      />
                      {reason}
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0' }}>
                  Tồn kho của các sản phẩm trong đơn sẽ được hoàn lại.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '20px' }}>
                {statusModal.status === 'Delivered'
                  ? 'Đơn hàng sẽ được đánh dấu là đã thanh toán sau khi giao thành công.'
                  : 'Khách hàng sẽ nhận được thông báo khi trạng thái đơn hàng được cập nhật.'}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={!!actionLoading}
                onClick={() => setStatusModal(null)}
                style={{ padding: '10px 18px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer' }}
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={!!actionLoading || (statusModal.danger && !cancelReason)}
                onClick={confirmStatusAction}
                style={{
                  padding: '10px 20px', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: statusModal.danger ? '#dc2626' : '#7c3aed',
                  color: '#fff',
                  opacity: (statusModal.danger && !cancelReason) ? 0.5 : 1,
                }}
              >
                {actionLoading ? 'Đang xử lý...' : statusModal.danger ? 'Xác nhận hủy đơn' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
