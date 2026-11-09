import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  CheckCircle,
  MessageCircle,
  Trash2,
  RefreshCw,
  Package,
  Clock,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  // Reply modal state
  const [replyingReview, setReplyingReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reviews/admin', {
        params: {
          filter: activeTab,
          page: currentPage,
          limit: 10,
        },
      });

      if (res.data?.success) {
        setReviews(res.data.reviews || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalReviews(res.data.total || 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle reply submit
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyingReview) return;

    setSubmittingReply(true);
    try {
      const res = await api.put(`/api/reviews/${replyingReview._id}/status`, {
        response: responseText,
      });

      if (res.data?.success) {
        toast.success('Đã gửi phản hồi CSKH thành công');
        setReplyingReview(null);
        setResponseText('');
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi phản hồi');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này? Điểm sao của sản phẩm sẽ được tính lại tự động.')) {
      return;
    }

    try {
      const res = await api.delete(`/api/reviews/${reviewId}`);
      if (res.data?.success) {
        toast.success('Đã xóa đánh giá thành công');
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xóa đánh giá');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={24} color="#2563eb" /> Quản Lý Đánh Giá & CSKH
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
            Đánh giá của khách hàng được hiển thị trực tiếp. Nhân viên CSKH theo dõi và gửi phản hồi chăm sóc khách hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReviews}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', overflowX: 'auto' }}>
        {[
          { key: 'all', label: 'Tất cả đánh giá' },
          { key: 'unreplied', label: 'Chưa phản hồi' },
          { key: 'replied', label: 'Đã phản hồi CSKH' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === tab.key ? '#2563eb' : '#f1f5f9',
              color: activeTab === tab.key ? '#ffffff' : '#475569',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
          Tổng số: <strong style={{ marginLeft: '4px', color: '#0f172a' }}>{totalReviews}</strong>
        </div>
      </div>

      {/* Review List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Đang tải danh sách đánh giá...
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <MessageCircle size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
            Không có đánh giá nào trong mục này.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map((rev) => (
            <div
              key={rev._id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              {/* Top row: Product info & Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {rev.product?.images?.[0] ? (
                      <img src={rev.product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Package size={24} color="#94a3b8" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {rev.product?.name || 'Sản phẩm đã bị xóa'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Khách hàng: <strong>{rev.user?.name || 'Khách'}</strong> ({rev.user?.email || 'N/A'})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        fill={s <= rev.rating ? '#f59e0b' : 'none'}
                        color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                      />
                    ))}
                    <span style={{ fontSize: '13px', fontWeight: 700, marginLeft: '4px', color: '#0f172a' }}>
                      {rev.rating}.0
                    </span>
                  </div>

                  {rev.response ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#dcfce7', color: '#15803d' }}>
                      <CheckCircle size={12} /> Đã phản hồi CSKH
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
                      <Clock size={12} /> Chờ phản hồi
                    </span>
                  )}
                </div>
              </div>

              {/* Review Content */}
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                {rev.comment}
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  Đăng lúc: {new Date(rev.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              {/* CSKH Response (if any) */}
              {rev.response && (
                <div style={{ background: '#eff6ff', borderLeft: '3px solid #2563eb', padding: '10px 14px', borderRadius: '0 6px 6px 0', fontSize: '13px' }}>
                  <strong style={{ color: '#1e40af' }}>Phản hồi của Staff / CSKH: </strong>
                  <span style={{ color: '#1e293b' }}>{rev.response}</span>
                  {rev.respondedAt && (
                    <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '8px' }}>
                      ({new Date(rev.respondedAt).toLocaleDateString('vi-VN')})
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingReview(rev);
                    setResponseText(rev.response || '');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: '#f0fdf4',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    cursor: 'pointer',
                  }}
                >
                  <MessageCircle size={14} /> {rev.response ? 'Sửa Phản Hồi' : 'Phản Hồi CSKH'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteReview(rev._id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'none',
                    color: '#dc2626',
                    border: '1px solid #fee2e2',
                    cursor: 'pointer',
                  }}
                  title="Xóa đánh giá này khỏi hệ thống"
                >
                  <Trash2 size={14} /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '13px' }}
          >
            Trang trước
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '13px' }}
          >
            Trang sau
          </button>
        </div>
      )}

      {/* Staff Reply Modal */}
      {replyingReview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Phản Hồi Đánh Giá (CSKH)
              </h3>
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
              <strong>Khách hàng ({replyingReview.user?.name}):</strong> "{replyingReview.comment}"
            </div>

            <form onSubmit={handleSubmitReply}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Nội dung phản hồi từ Shop:
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Cảm ơn bạn đã đóng góp ý kiến cho Shop..."
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px' }}
                >
                  <Send size={14} />
                  {submittingReply ? 'Đang lưu...' : 'Gửi Phản Hồi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
