import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  MessageCircle,
  Trash2,
  RefreshCw,
  Package,
  Clock,
  Send,
  X,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminCommentsPage = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);

  // Reply modal / form state
  const [replyingComment, setReplyingComment] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/comments/admin', {
        params: {
          filter: activeTab,
          page: currentPage,
          limit: 10,
        },
      });

      if (res.data?.success) {
        setComments(res.data.comments || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalComments(res.data.total || 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách bình luận');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle staff reply
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyingComment || !replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await api.post('/api/comments', {
        productId: replyingComment.product?._id,
        content: replyContent.trim(),
        parentComment: replyingComment._id,
      });

      if (res.data?.success) {
        toast.success('Đã gửi phản hồi CSKH thành công');
        setReplyingComment(null);
        setReplyContent('');
        fetchComments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi phản hồi');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này cùng tất cả câu trả lời?')) {
      return;
    }

    try {
      const res = await api.delete(`/api/comments/${commentId}`);
      if (res.data?.success) {
        toast.success('Đã xóa bình luận thành công');
        fetchComments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xóa bình luận');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={24} color="#2563eb" /> Quản Lý Bình Luận & Hỏi Đáp CSKH
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
            Theo dõi các thắc mắc của khách hàng về sản phẩm và gửi câu trả lời tư vấn chính thức.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchComments}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', overflowX: 'auto' }}>
        {[
          { key: 'all', label: 'Tất cả câu hỏi' },
          { key: 'unreplied', label: 'Chưa trả lời' },
          { key: 'replied', label: 'Đã trả lời CSKH' },
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
          Tổng số câu hỏi: <strong style={{ marginLeft: '4px', color: '#0f172a' }}>{totalComments}</strong>
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Đang tải danh sách bình luận...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <MessageCircle size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
            Không có bình luận nào trong danh sách.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {comments.map((cmt) => (
            <div
              key={cmt._id}
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
              {/* Product and User Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
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
                    {cmt.product?.images?.[0] ? (
                      <img src={cmt.product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Package size={22} color="#94a3b8" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {cmt.product?.name || 'Sản phẩm đã bị xóa'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Khách hỏi: <strong>{cmt.user?.name || 'Khách'}</strong> ({cmt.user?.email || 'N/A'})
                    </div>
                  </div>
                </div>

                <div>
                  {cmt.replies && cmt.replies.length > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#dcfce7', color: '#15803d' }}>
                      <CheckCircle size={12} /> Đã trả lời ({cmt.replies.length})
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
                      <Clock size={12} /> Chờ phản hồi
                    </span>
                  )}
                </div>
              </div>

              {/* Question Content */}
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>Câu hỏi:</div>
                {cmt.content}
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  Gửi lúc: {new Date(cmt.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              {/* Replies Thread */}
              {cmt.replies && cmt.replies.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '24px', borderLeft: '2px solid #e2e8f0', paddingLeft: '14px' }}>
                  {cmt.replies.map((rep) => (
                    <div
                      key={rep._id}
                      style={{
                        background: rep.isStaffReply ? '#eff6ff' : '#f8fafc',
                        border: rep.isStaffReply ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: rep.isStaffReply ? '#1d4ed8' : '#334155' }}>
                          {rep.isStaffReply && <ShieldCheck size={14} />}
                          {rep.user?.name || 'Nhân viên'} {rep.isStaffReply && '(CSKH)'}
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {new Date(rep.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div style={{ color: '#1e293b', lineHeight: 1.4 }}>{rep.content}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingComment(cmt);
                    setReplyContent('');
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
                  <Send size={13} /> Trả Lời Khách Hàng
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteComment(cmt._id)}
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
                >
                  <Trash2 size={13} /> Xóa
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

      {/* Reply Modal */}
      {replyingComment && (
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
                Trả Lời Câu Hỏi Của Khách
              </h3>
              <button
                type="button"
                onClick={() => setReplyingComment(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
              <strong>{replyingComment.user?.name}:</strong> "{replyingComment.content}"
            </div>

            <form onSubmit={handleSubmitReply}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Nội dung câu trả lời tư vấn (CSKH):
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Chào bạn, mẫu này có sẵn size L tại cửa hàng nhé ạ..."
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
                  onClick={() => setReplyingComment(null)}
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
                  {submittingReply ? 'Đang gửi...' : 'Gửi Trả Lời'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommentsPage;

