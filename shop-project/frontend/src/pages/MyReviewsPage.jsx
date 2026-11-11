import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Star,
  MessageSquare,
  PackageCheck,
  Clock,
  ArrowRight,
  ShieldCheck,
  Edit3,
  X,
  Send,
  ShoppingBag,
} from 'lucide-react';
import api from '../services/api';

const formatCurrency = (amount) =>
  Number(amount || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });

const MyReviewsPage = () => {
  const [activeTab, setActiveTab] = useState('unreviewed'); // 'unreviewed' | 'reviewed'
  const [loading, setLoading] = useState(true);
  const [unreviewed, setUnreviewed] = useState([]);
  const [reviewed, setReviewed] = useState([]);

  // Modal State for Writing or Editing Review
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [targetItem, setTargetItem] = useState(null); // unreviewed item or review object
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch reviews & unreviewed items from backend
  const fetchMyReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reviews/my-reviews');
      if (res.data?.success) {
        setUnreviewed(res.data.unreviewed || []);
        setReviewed(res.data.reviewed || []);
      }
    } catch {
      toast.error('Không thể tải danh sách đánh giá của bạn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  // Open modal to write new review
  const handleOpenCreateModal = (item) => {
    setModalMode('create');
    setTargetItem(item);
    setRating(5);
    setHoverRating(0);
    setComment('');
    setModalOpen(true);
  };

  // Open modal to edit existing review
  const handleOpenEditModal = (rev) => {
    setModalMode('edit');
    setTargetItem(rev);
    setRating(rev.rating || 5);
    setHoverRating(0);
    setComment(rev.comment || '');
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setTargetItem(null);
    setComment('');
  };

  // Submit create or edit review
  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const productId = targetItem?.product?._id || targetItem?.product;
        const res = await api.post('/api/reviews', {
          productId,
          rating,
          comment: comment.trim(),
        });
        if (res.data?.success) {
          toast.success('Cảm ơn bạn đã gửi đánh giá!');
          handleCloseModal();
          fetchMyReviews();
        }
      } else {
        const reviewId = targetItem?._id;
        const res = await api.put(`/api/reviews/${reviewId}`, {
          rating,
          comment: comment.trim(),
        });
        if (res.data?.success) {
          toast.success(res.data.message || 'Cập nhật đánh giá thành công!');
          handleCloseModal();
          fetchMyReviews();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Star size={26} color="#f59e0b" fill="#f59e0b" /> Đánh Giá Của Tôi
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Xem các sản phẩm đã mua để viết đánh giá mới hoặc quản lý nhận xét bạn đã gửi.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('unreviewed')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 700,
            color: activeTab === 'unreviewed' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'unreviewed' ? '3px solid #2563eb' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Chưa đánh giá</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              background: activeTab === 'unreviewed' ? '#eff6ff' : '#f1f5f9',
              color: activeTab === 'unreviewed' ? '#2563eb' : '#64748b',
            }}
          >
            {unreviewed.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviewed')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 700,
            color: activeTab === 'reviewed' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'reviewed' ? '3px solid #2563eb' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Đã đánh giá</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              background: activeTab === 'reviewed' ? '#eff6ff' : '#f1f5f9',
              color: activeTab === 'reviewed' ? '#2563eb' : '#64748b',
            }}
          >
            {reviewed.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px' }}>Đang tải danh sách đánh giá...</p>
        </div>
      ) : activeTab === 'unreviewed' ? (
        /* =================================================== */
        /* TAB 1: CHƯA ĐÁNH GIÁ (UNREVIEWED) */
        /* =================================================== */
        unreviewed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#64748b' }}>
              <PackageCheck size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Không có sản phẩm nào chờ đánh giá
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              Bạn đã đánh giá hết các sản phẩm đã nhận, hoặc chưa có đơn hàng nào giao thành công.
            </p>
            <Link to="/products" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}>
              <ShoppingBag size={16} /> Mua Sắm Thêm
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {unreviewed.map((item, idx) => {
              const prod = item.product || {};
              const thumbnail = item.image || prod.images?.[0] || 'https://placehold.co/100x120?text=No+Image';

              return (
                <div
                  key={prod._id || idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Product Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '280px', flex: 1 }}>
                    <Link
                      to={`/products/${prod._id}`}
                      style={{ width: '72px', height: '84px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'block' }}
                    >
                      <img src={thumbnail} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Link>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        to={`/products/${prod._id}`}
                        style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 700, fontSize: '15px', display: 'block', marginBottom: '4px' }}
                      >
                        {prod.name || 'Sản phẩm'}
                      </Link>

                      {item.variantLabel && (
                        <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, marginBottom: '4px' }}>
                          Phân loại: {item.variantLabel}
                        </div>
                      )}

                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        {formatCurrency(item.price || prod.price)}
                      </div>

                      <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        Đã giao:{' '}
                        {item.orderDate
                          ? new Date(item.orderDate).toLocaleDateString('vi-VN')
                          : 'Đã hoàn tất'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(item)}
                      className="btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 700,
                        background: '#f59e0b',
                        borderColor: '#f59e0b',
                        color: '#ffffff',
                      }}
                    >
                      <Star size={16} fill="#ffffff" color="#ffffff" />
                      <span>Đánh Giá Ngay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* =================================================== */
        /* TAB 2: ĐÃ ĐÁNH GIÁ (REVIEWED) */
        /* =================================================== */
        reviewed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#f59e0b' }}>
              <Star size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Chưa có đánh giá nào
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              Bạn chưa gửi nhận xét nào. Hãy chia sẻ cảm nhận về những sản phẩm bạn đã trải nghiệm để giúp người mua khác nhé!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviewed.map((rev) => {
              const prod = rev.product || {};
              const thumbnail = prod.images?.[0] || 'https://placehold.co/100x120?text=No+Image';

              return (
                <div
                  key={rev._id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Top Bar: Product info + Edit button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
                      <Link
                        to={`/products/${prod._id}`}
                        style={{ width: '56px', height: '64px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'block' }}
                      >
                        <img src={thumbnail} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Link>

                      <div>
                        <Link
                          to={`/products/${prod._id}`}
                          style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 700, fontSize: '15px', display: 'block', marginBottom: '3px' }}
                        >
                          {prod.name || 'Sản phẩm'}
                        </Link>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                          {formatCurrency(prod.price)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(rev)}
                        className="btn-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          color: '#2563eb',
                          borderColor: '#bfdbfe',
                          background: '#eff6ff',
                        }}
                      >
                        <Edit3 size={14} /> Sửa Đánh Giá
                      </button>

                      <Link
                        to={`/products/${prod._id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '7px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                        }}
                      >
                        <span>Xem chi tiết SP</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div>
                    {/* Stars and Date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={16}
                            fill={s <= rev.rating ? '#f59e0b' : 'none'}
                            color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                          />
                        ))}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#f59e0b' }}>
                        {rev.rating}.0
                      </span>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(rev.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: '0 0 10px', whiteSpace: 'pre-line' }}>
                      {rev.comment}
                    </p>

                    {/* Staff Response */}
                    {rev.response && (
                      <div
                        style={{
                          background: '#f8fafc',
                          borderLeft: '4px solid #2563eb',
                          borderRadius: '0 8px 8px 0',
                          padding: '12px 16px',
                          marginTop: '12px',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <ShieldCheck size={14} />
                          Phản hồi từ CSKH:
                        </div>
                        <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: 1.5 }}>
                          {rev.response}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ======================================================== */}
      {/* REVIEW MODAL (Viết mới hoặc Chỉnh sửa) */}
      {/* ======================================================== */}
      {modalOpen && targetItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={20} color="#f59e0b" fill="#f59e0b" />
                {modalMode === 'create' ? 'Đánh Giá Sản Phẩm' : 'Chỉnh Sửa Đánh Giá'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* Target Product Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
              <img
                src={
                  targetItem.image ||
                  targetItem.product?.images?.[0] ||
                  'https://placehold.co/60x70?text=SP'
                }
                alt=""
                style={{ width: '48px', height: '56px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {targetItem.product?.name || targetItem.name || 'Sản phẩm'}
                </div>
                {targetItem.variantLabel && (
                  <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>
                    Phân loại: {targetItem.variantLabel}
                  </div>
                )}
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                  {formatCurrency(targetItem.price || targetItem.product?.price)}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitModal}>
              {/* Rating picker */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Chất lượng sản phẩm:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                      title={`${s} sao`}
                    >
                      <Star
                        size={30}
                        fill={(hoverRating || rating) >= s ? '#f59e0b' : 'none'}
                        color={(hoverRating || rating) >= s ? '#f59e0b' : '#cbd5e1'}
                      />
                    </button>
                  ))}
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginLeft: '6px' }}>
                    {rating === 5
                      ? 'Tuyệt vời (5/5)'
                      : rating === 4
                      ? 'Hài lòng (4/5)'
                      : rating === 3
                      ? 'Bình thường (3/5)'
                      : rating === 2
                      ? 'Không hài lòng (2/5)'
                      : 'Rất tệ (1/5)'}
                  </span>
                </div>
              </div>

              {/* Comment text */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Nhận xét chi tiết:
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Hãy chia sẻ cảm nhận về chất liệu, form dáng, độ bền sản phẩm để giúp khách hàng khác nhé..."
                  rows={4}
                  maxLength={1000}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right', marginTop: '4px' }}>
                  {comment.length}/1000 ký tự
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    fontSize: '14px',
                    background: '#2563eb',
                    borderColor: '#2563eb',
                  }}
                >
                  <Send size={15} />
                  {submitting
                    ? 'Đang gửi...'
                    : modalMode === 'create'
                    ? 'Gửi Đánh Giá'
                    : 'Lưu Cập Nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
