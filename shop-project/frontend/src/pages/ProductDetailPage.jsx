import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Heart,
  Package,
  ArrowLeft,
  CheckCircle,
  MessageSquare,
  MessageCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  Send,
  AlertCircle,
  Edit3,
  ShieldAlert,
  CornerDownRight,
  Trash2,
  Reply,
  HelpCircle,
  X,
  ShoppingCart,
  Minus,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const [product, setProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  // Active tab: 'reviews' or 'comments'
  const [activeTab, setActiveTab] = useState('reviews');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, average: 5, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('all');

  const filteredReviews = useMemo(() => {
    if (selectedRatingFilter === 'all') return reviews;
    return reviews.filter((r) => Number(r.rating) === Number(selectedRatingFilter));
  }, [reviews, selectedRatingFilter]);

  // Review form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState({ checked: false, canReview: false, reason: '' });

  // Comments state (Hỏi đáp & Thảo luận)
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Inline Reply state
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Inline Edit Comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [submittingEditComment, setSubmittingEditComment] = useState(false);

  // Đánh giá đã tồn tại của người dùng hiện tại
  const myExistingReview = reviews.find(
    (r) =>
      user &&
      ((r.user?._id && String(r.user._id) === String(user._id)) ||
        (r.user && String(r.user) === String(user._id)) ||
        (r.user?.email && r.user.email === user.email))
  );

  // Check if current user is eligible to review (must have purchased & order Delivered)
  useEffect(() => {
    let isMounted = true;
    if (!user || user.role !== 'customer' || !id) {
      setReviewEligibility({ checked: true, canReview: false, reason: '' });
      return;
    }

    const checkEligibility = async () => {
      try {
        const res = await api.get(`/api/reviews/product/${id}/eligibility`);
        if (isMounted && res.data?.success) {
          setReviewEligibility({
            checked: true,
            canReview: !!res.data.canReview,
            reason: res.data.reason || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setReviewEligibility({ checked: true, canReview: false, reason: '' });
        }
      }
    };

    checkEligibility();
    return () => {
      isMounted = false;
    };
  }, [id, user]);

  // Fetch product detail
  useEffect(() => {
    let isMounted = true;
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/api/products/${id}`);
        if (isMounted && res.data?.product) {
          setProduct(res.data.product);
          setSelectedVariantId(res.data.product.variants?.find((variant) => variant.isActive !== false)?._id || '');
          const imgs = res.data.product.images;
          if (Array.isArray(imgs) && imgs.length > 0) {
            setActiveImage(imgs[0]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Không thể tải thông tin sản phẩm');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Fetch reviews for this product
  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const res = await api.get(`/api/reviews/product/${id}`);
      if (res.data?.success) {
        setReviews(res.data.reviews || []);
        if (res.data.stats) {
          setReviewStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Lỗi tải đánh giá:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, [id]);

  // Fetch comments for this product
  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/api/comments/product/${id}`);
      if (res.data?.success) {
        setComments(res.data.comments || []);
        setTotalComments(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error('Lỗi tải bình luận:', err);
    } finally {
      setLoadingComments(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchReviews();
      fetchComments();
      if (user) {
        api.get('/api/favorites/ids')
          .then((res) => {
            if (res.data?.success && Array.isArray(res.data.favoriteIds)) {
              setIsFavorite(res.data.favoriteIds.includes(id));
            }
          })
          .catch(() => {});
      } else {
        setIsFavorite(false);
      }
    }
  }, [id, user, fetchReviews, fetchComments]);

  const inWishlist = isInWishlist(product?._id || id);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    setAddingToCart(true);
    const variantId = hasVariants ? selectedVariant?._id || null : null;
    const ok = await addToCart(product._id, quantity, variantId);
    if (ok) setQuantity(1);
    setAddingToCart(false);
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu sản phẩm yêu thích');
      navigate('/login');
      return;
    }
    if (inWishlist) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product._id);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích');
      navigate('/login');
      return;
    }
    setTogglingFavorite(true);
    try {
      const res = await api.post('/api/favorites/toggle', { productId: id });
      if (res.data?.success) {
        setIsFavorite(res.data.isFavorite);
        toast.success(res.data.message || (res.data.isFavorite ? 'Đã thêm vào yêu thích' : 'Đã bỏ yêu thích'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thao tác yêu thích');
    } finally {
      setTogglingFavorite(false);
    }
  };

  // Submit new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập bằng tài khoản Khách hàng để đánh giá');
      navigate('/login');
      return;
    }

    if (user.role !== 'customer') {
      toast.error('Chỉ tài khoản khách hàng mới có thể đánh giá sản phẩm');
      return;
    }

    if (!comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.post('/api/reviews', {
        productId: id,
        rating,
        comment: comment.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Đánh giá của bạn đã được đăng thành công!');
        setComment('');
        fetchReviews();
        try {
          const prodRes = await api.get(`/api/products/${id}`);
          if (prodRes.data?.product) setProduct(prodRes.data.product);
        } catch (_) {}
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Start edit review
  const handleStartEditReview = () => {
    if (myExistingReview) {
      setRating(myExistingReview.rating || 5);
      setComment(myExistingReview.comment || '');
      setIsEditingReview(true);
    }
  };

  // Update existing review
  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!myExistingReview) return;
    if (!comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.put(`/api/reviews/${myExistingReview._id}`, {
        rating,
        comment: comment.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Cập nhật đánh giá thành công!');
        setIsEditingReview(false);
        fetchReviews();
        try {
          const prodRes = await api.get(`/api/products/${id}`);
          if (prodRes.data?.product) setProduct(prodRes.data.product);
        } catch (_) {}
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Submit top-level comment / question
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để gửi bình luận hoặc câu hỏi');
      navigate('/login');
      return;
    }

    if (!newCommentContent.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi hoặc bình luận');
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await api.post('/api/comments', {
        productId: id,
        content: newCommentContent.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Đã đăng bình luận thành công!');
        setNewCommentContent('');
        fetchComments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Submit reply to a comment (chỉ dành cho Staff/Admin)
  const handleSubmitReply = async (parentCommentId) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để trả lời bình luận');
      navigate('/login');
      return;
    }

    if (user.role === 'customer') {
      toast.error('Chỉ nhân viên CSKH hoặc Quản trị viên mới có quyền trả lời giải đáp thắc mắc');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await api.post('/api/comments', {
        productId: id,
        content: replyContent.trim(),
        parentComment: parentCommentId,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Đã gửi câu trả lời thành công!');
        setReplyingCommentId(null);
        setReplyContent('');
        fetchComments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi câu trả lời');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Update existing comment
  const handleSaveEditComment = async (commentId) => {
    if (!editingContent.trim()) {
      toast.error('Nội dung bình luận không được để trống');
      return;
    }

    setSubmittingEditComment(true);
    try {
      const res = await api.put(`/api/comments/${commentId}`, {
        content: editingContent.trim(),
      });

      if (res.data?.success) {
        toast.success('Đã cập nhật bình luận!');
        setEditingCommentId(null);
        setEditingContent('');
        fetchComments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật bình luận');
    } finally {
      setSubmittingEditComment(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

    try {
      const res = await api.delete(`/api/comments/${commentId}`);
      if (res.data?.success) {
        toast.success('Đã xóa bình luận');
        fetchComments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa bình luận');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: '#64748b', fontSize: '15px' }}>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          {error || 'Sản phẩm không tồn tại'}
        </h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>
          Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã ngừng kinh doanh.
        </p>
        <Link to="/products" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  const hasVariants = (product.variants || []).length > 0;
  const activeVariants = (product.variants || []).filter((variant) => variant.isActive !== false);
  const selectedVariant = activeVariants.find((variant) => variant._id === selectedVariantId) || activeVariants[0];
  const displayPrice = selectedVariant?.price ?? product.price;
  const displayStock = hasVariants ? (selectedVariant?.stock ?? 0) : product.stock;
  const isOutOfStock = displayStock <= 0;
  const hasDiscount = product.originalPrice && product.originalPrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - displayPrice) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="container" style={{ padding: '24px 20px 60px' }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Trang chủ</Link>
        <span>/</span>
        <Link to="/products" style={{ color: '#64748b', textDecoration: 'none' }}>Sản phẩm</Link>
        <span>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', marginBottom: '48px' }}>
        {/* Images Column */}
        <div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Package size={64} color="#94a3b8" />
            )}

            {hasDiscount && (
              <span
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '6px',
                }}
              >
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {Array.isArray(product.images) && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: activeImage === img ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {product.brand || 'CLOSET'} • {product.category}
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, margin: 0 }}>
            {product.name}
          </h1>

          {/* Rating Summary Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  fill={s <= Math.round(product.rating || 5) ? '#f59e0b' : 'none'}
                  color={s <= Math.round(product.rating || 5) ? '#f59e0b' : '#cbd5e1'}
                />
              ))}
            </div>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{product.rating || 5}.0</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              {product.numReviews || 0} Đánh giá
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              {totalComments} Hỏi đáp
            </button>
          </div>

          {/* Price & Favorite Box */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>
                {formatCurrency(displayPrice)}
              </span>
              {hasDiscount && (
                <span style={{ fontSize: '18px', color: '#94a3b8', textDecoration: 'line-through' }}>
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={togglingFavorite}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: isFavorite ? '1px solid #fecaca' : '1px solid #cbd5e1',
                background: isFavorite ? '#fef2f2' : '#ffffff',
                color: isFavorite ? '#ef4444' : '#334155',
                fontWeight: 700,
                fontSize: '14px',
                cursor: togglingFavorite ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : '#64748b'} />
              <span>{isFavorite ? 'Đã Yêu Thích' : 'Thêm Vào Yêu Thích'}</span>
            </button>
          </div>

          {/* Purchase Actions: quantity + add to cart + wishlist */}
          {!isOutOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{ padding: '10px 12px', background: '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  aria-label="Giảm số lượng"
                >
                  <Minus size={15} />
                </button>
                <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 700, fontSize: '15px' }}>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(displayStock || 99, q + 1))}
                  style={{ padding: '10px 12px', background: '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  aria-label="Tăng số lượng"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addingToCart}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '12px 28px', borderRadius: '10px', border: 'none',
                  background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: '15px',
                  cursor: addingToCart ? 'not-allowed' : 'pointer',
                  opacity: addingToCart ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                }}
              >
                <ShoppingCart size={18} />
                <span>{addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '12px 20px', borderRadius: '10px',
                  border: inWishlist ? '1px solid #fecaca' : '1px solid #cbd5e1',
                  background: inWishlist ? '#fef2f2' : '#fff',
                  color: inWishlist ? '#ef4444' : '#334155',
                  fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                }}
              >
                <Heart size={17} fill={inWishlist ? '#ef4444' : 'none'} color={inWishlist ? '#ef4444' : '#64748b'} />
                <span>{inWishlist ? 'Đã lưu Wishlist' : 'Wishlist'}</span>
              </button>
            </div>
          )}

          {activeVariants.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              <label htmlFor="product-variant" style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>Tùy chọn sản phẩm</label>
              <select
                id="product-variant"
                value={selectedVariant?._id || ''}
                onChange={(event) => setSelectedVariantId(event.target.value)}
                style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff' }}
              >
                {activeVariants.map((variant) => (
                  <option key={variant._id} value={variant._id}>
                    {[variant.size, variant.color].filter(Boolean).join(' / ')}
                    {variant.sku ? ` • ${variant.sku}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stock Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            {isOutOfStock ? (
              <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} />
                Tạm thời hết hàng
              </span>
            ) : (
              <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} color="#16a34a" />
                Còn hàng ({displayStock} sản phẩm sẵn có)
              </span>
            )}
          </div>

          {/* Description */}
          <div style={{ marginTop: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Mô Tả Sản Phẩm
            </h3>
            <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TABS: REVIEWS & RATINGS vs. COMMENTS & Q&A */}
      {/* ======================================================== */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
        {/* Tab Headers */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '2px solid #e2e8f0', marginBottom: '32px', overflowX: 'auto' }}>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            style={{
              padding: '12px 20px',
              fontSize: '16px',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'reviews' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'reviews' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '-2px',
              transition: 'all 0.2s ease',
            }}
          >
            <Star size={18} /> Đánh Giá & Nhận Xét ({reviewStats.total})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            style={{
              padding: '12px 20px',
              fontSize: '16px',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'comments' ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === 'comments' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '-2px',
              transition: 'all 0.2s ease',
            }}
          >
            <MessageSquare size={18} /> Hỏi Đáp & Thảo Luận ({totalComments})
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: REVIEW & RATING CONTENT */}
        {/* ======================================================== */}
        {activeTab === 'reviews' && (
          <section id="reviews-section">
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Đánh Giá & Nhận Xét Từ Khách Hàng
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', margin: 0 }}>
                Đánh giá trực tiếp từ những khách hàng đã mua và trải nghiệm sản phẩm
              </p>
            </div>

            {/* Rating Breakdown Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '28px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '32px',
                alignItems: 'center',
                marginBottom: '36px',
              }}
            >
              {/* Average Score */}
              <div style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '54px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {(reviewStats?.average ?? 5).toFixed(1)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', margin: '12px 0 6px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={20}
                      fill={s <= Math.round(reviewStats.average) ? '#f59e0b' : 'none'}
                      color={s <= Math.round(reviewStats.average) ? '#f59e0b' : '#cbd5e1'}
                    />
                  ))}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Dựa trên {reviewStats.total} lượt đánh giá
                </div>
              </div>

              {/* Star Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[5, 4, 3, 2, 1].map((num) => {
                  const count = reviewStats?.breakdown?.[num] || 0;
                  const percent = reviewStats.total > 0 ? Math.round((count / reviewStats.total) * 100) : 0;
                  const isSelected = selectedRatingFilter === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedRatingFilter((prev) => (prev === num ? 'all' : num))}
                      title={`Lọc xem các đánh giá ${num} sao`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        background: isSelected ? '#fef3c7' : 'transparent',
                        border: isSelected ? '1px solid #f59e0b' : '1px solid transparent',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        width: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '50px' }}>
                        <span style={{ fontWeight: 600 }}>{num}</span>
                        <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      </div>
                      <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: '#f59e0b',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                      <span style={{ width: '40px', textAlign: 'right', color: isSelected ? '#b45309' : '#64748b', fontSize: '12px', fontWeight: isSelected ? 700 : 400 }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit / Edit Review Section */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '40px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#2563eb" />
                {isEditingReview ? 'Chỉnh Sửa Đánh Giá Của Bạn' : myExistingReview ? 'Đánh Giá Của Bạn' : 'Viết Đánh Giá Của Bạn'}
              </h3>

              {!user ? (
                <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '12px' }}>
                  <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px' }}>
                    Vui lòng đăng nhập bằng tài khoản <strong>Khách hàng</strong> để có thể gửi đánh giá cho sản phẩm này.
                  </p>
                  <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', padding: '8px 20px', fontSize: '14px' }}>
                    Đăng Nhập Ngay
                  </Link>
                </div>
              ) : user.role !== 'customer' ? (
                <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <ShieldAlert size={36} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                    Tài khoản {user.role === 'admin' ? 'Quản Trị Viên (Admin)' : 'Nhân Viên (Staff)'}
                  </h4>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                    Chỉ tài khoản <strong>Khách hàng</strong> mới có thể gửi hoặc chỉnh sửa đánh giá. Bạn có thể sử dụng phân hệ CSKH để phản hồi khách hàng.
                  </p>
                </div>
              ) : myExistingReview && !isEditingReview ? (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} color="#16a34a" />
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                        Bạn đã gửi đánh giá cho sản phẩm này:
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          fill={s <= myExistingReview.rating ? '#f59e0b' : 'none'}
                          color={s <= myExistingReview.rating ? '#f59e0b' : '#cbd5e1'}
                        />
                      ))}
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginLeft: '4px' }}>
                        {myExistingReview.rating}.0
                      </span>
                    </div>
                  </div>

                  <p style={{ color: '#334155', fontSize: '14px', lineHeight: 1.5, margin: '0 0 16px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {myExistingReview.comment}
                  </p>

                  {myExistingReview.response && (
                    <div style={{ background: '#eff6ff', borderLeft: '3px solid #2563eb', padding: '10px 14px', borderRadius: '0 6px 6px 0', fontSize: '13px', marginBottom: '16px' }}>
                      <strong style={{ color: '#1e40af' }}>Phản hồi từ CSKH: </strong>
                      <span style={{ color: '#1e293b' }}>{myExistingReview.response}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleStartEditReview}
                      className="btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '13px' }}
                    >
                      <Edit3 size={14} /> Chỉnh Sửa Đánh Giá
                    </button>
                  </div>
                </div>
              ) : !myExistingReview && !isEditingReview && reviewEligibility.checked && !reviewEligibility.canReview ? (
                <div style={{ textAlign: 'center', padding: '28px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Package size={40} color="#64748b" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                    Chưa Đủ Điều Kiện Đánh Giá
                  </h4>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0, maxWidth: '480px', marginInline: 'auto', lineHeight: 1.5 }}>
                    {reviewEligibility.reason || 'Bạn chỉ có thể đánh giá sau khi đã mua sản phẩm và đơn hàng được giao thành công (Đã giao hàng).'}
                  </p>
                </div>
              ) : (
                <form onSubmit={isEditingReview ? handleUpdateReview : handleSubmitReview}>
                  {/* Star Rating Picker */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      {isEditingReview ? 'Cập nhật số sao đánh giá:' : 'Bạn đánh giá sản phẩm mấy sao?'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            transition: 'transform 0.15s ease',
                          }}
                          title={`${star} sao`}
                        >
                          <Star
                            size={28}
                            fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'}
                            color={(hoverRating || rating) >= star ? '#f59e0b' : '#cbd5e1'}
                          />
                        </button>
                      ))}
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginLeft: '8px' }}>
                        {rating === 5 ? 'Tuyệt vời (5/5)' : rating === 4 ? 'Hài lòng (4/5)' : rating === 3 ? 'Bình thường (3/5)' : rating === 2 ? 'Không hài lòng (2/5)' : 'Rất tệ (1/5)'}
                      </span>
                    </div>
                  </div>

                  {/* Comment text area */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      {isEditingReview ? 'Cập nhật nhận xét:' : 'Nhận xét chi tiết:'}
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Chia sẻ cảm nhận của bạn về chất liệu, form dáng, độ bền sản phẩm..."
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

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {isEditingReview && (
                      <button
                        type="button"
                        onClick={() => setIsEditingReview(false)}
                        className="btn-secondary"
                        style={{ padding: '10px 20px', fontSize: '14px' }}
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '14px' }}
                    >
                      <Send size={15} />
                      {submittingReview
                        ? 'Đang lưu...'
                        : isEditingReview
                        ? 'Lưu Cập Nhật'
                        : 'Gửi Đánh Giá'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Reviews List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Nhận Xét Từ Khách Hàng ({filteredReviews.length})
                </h3>
                {selectedRatingFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedRatingFilter('all')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Xóa lọc (Xem tất cả)
                  </button>
                )}
              </div>

              {/* Star Filter Buttons (Shopee/Tiki Style) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginRight: '4px' }}>Lọc xem:</span>
                <button
                  type="button"
                  onClick={() => setSelectedRatingFilter('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: selectedRatingFilter === 'all' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                    background: selectedRatingFilter === 'all' ? '#eff6ff' : '#ffffff',
                    color: selectedRatingFilter === 'all' ? '#1d4ed8' : '#475569',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Tất cả ({reviewStats.total})
                </button>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewStats?.breakdown?.[star] || 0;
                  const isSelected = selectedRatingFilter === star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRatingFilter(isSelected ? 'all' : star)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        border: isSelected ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                        background: isSelected ? '#fffbeb' : '#ffffff',
                        color: isSelected ? '#b45309' : '#475569',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{star}</span>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <span>({count})</span>
                    </button>
                  );
                })}
              </div>

              {loadingReviews ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  Đang tải nhận xét...
                </div>
              ) : filteredReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <MessageSquare size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 10px' }}>
                    {reviews.length === 0
                      ? 'Chưa có nhận xét nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!'
                      : `Không có nhận xét nào ${selectedRatingFilter} sao.`}
                  </p>
                  {selectedRatingFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedRatingFilter('all')}
                      className="btn-secondary"
                      style={{ padding: '6px 16px', fontSize: '13px' }}
                    >
                      Xem tất cả đánh giá
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredReviews.map((rev) => (
                    <div
                      key={rev._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '20px',
                      }}
                    >
                      {/* User info & rating */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#e0e7ff',
                              color: '#3730a3',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              fontSize: '15px',
                            }}
                          >
                            {rev.user?.avatar ? (
                              <img src={rev.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              (rev.user?.name || 'K').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                              {rev.user?.name || 'Khách hàng'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} />
                              {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={15}
                              fill={s <= rev.rating ? '#f59e0b' : 'none'}
                              color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: '0 0 12px' }}>
                        {rev.comment}
                      </p>

                      {/* Staff Response */}
                      {rev.response && (
                        <div
                          style={{
                            background: '#f1f5f9',
                            borderLeft: '4px solid #2563eb',
                            borderRadius: '0 8px 8px 0',
                            padding: '12px 16px',
                            marginTop: '12px',
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <ShieldCheck size={14} />
                            Phản hồi từ Ban Quản Trị / CSKH:
                          </div>
                          <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: 1.5 }}>
                            {rev.response}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 2: COMMENTS & Q&A DISCUSSION CONTENT */}
        {/* ======================================================== */}
        {activeTab === 'comments' && (
          <section id="comments-section">
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={22} color="#2563eb" /> Hỏi Đáp & Thảo Luận Về Sản Phẩm
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', margin: 0 }}>
                Bạn có thắc mắc về size số, chất liệu hay cách phối đồ? Hãy để lại câu hỏi để Shop tư vấn nhé!
              </p>
            </div>

            {/* Post Question Form */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '36px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {!user ? (
                <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                  <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px' }}>
                    Vui lòng đăng nhập để tham gia đặt câu hỏi hoặc trao đổi cùng cộng đồng.
                  </p>
                  <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', padding: '8px 20px', fontSize: '14px' }}>
                    Đăng Nhập Ngay
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmitComment}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                    Đặt câu hỏi hoặc chia sẻ ý kiến của bạn:
                  </label>
                  <textarea
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                    placeholder="Ví dụ: Áo này có co giãn không ạ? 1m7 60kg mặc size nào vừa vặn nhất shop?..."
                    rows={3}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {newCommentContent.length}/1000 ký tự
                    </span>
                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 22px', fontSize: '14px' }}
                    >
                      <Send size={14} /> {submittingComment ? 'Đang gửi...' : 'Gửi Câu Hỏi'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Comments Thread List */}
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                Các Câu Hỏi & Thảo Luận ({comments.length})
              </h3>

              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  Đang tải bình luận...
                </div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <MessageCircle size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                    Chưa có câu hỏi nào cho sản phẩm này. Hãy đặt câu hỏi đầu tiên!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {comments.map((cmt) => {
                    const isOwner = user && String(user._id) === String(cmt.user?._id || cmt.user);
                    const canDelete = isOwner || (user && ['admin', 'staff'].includes(user.role));
                    const canReply = user && ['admin', 'staff'].includes(user.role);

                    return (
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
                        }}
                      >
                        {/* Parent Comment Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: cmt.isStaffReply ? '#dbeafe' : '#f1f5f9',
                                color: cmt.isStaffReply ? '#1d4ed8' : '#334155',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                fontSize: '14px',
                              }}
                            >
                              {cmt.user?.avatar ? (
                                <img src={cmt.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                (cmt.user?.name || 'K').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                  {cmt.user?.name || 'Khách hàng'}
                                </span>
                                {cmt.isStaffReply && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                    <ShieldCheck size={12} /> CSKH
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={11} />
                                {new Date(cmt.createdAt).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>

                          {/* Action icons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(cmt._id);
                                  setEditingContent(cmt.content);
                                }}
                                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                                title="Chỉnh sửa câu hỏi"
                              >
                                <Edit3 size={15} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(cmt._id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                title="Xóa câu hỏi này"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Parent Comment Content / Edit Form */}
                        {editingCommentId === cmt._id ? (
                          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={2}
                              required
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setEditingCommentId(null)}
                                className="btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                disabled={submittingEditComment}
                                onClick={() => handleSaveEditComment(cmt._id)}
                                className="btn-primary"
                                style={{ padding: '4px 12px', fontSize: '12px' }}
                              >
                                Lưu
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                            {cmt.content}
                          </p>
                        )}

                        {/* Reply Button: Chỉ hiển thị cho Staff / Admin phản hồi CSKH */}
                        {canReply && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingCommentId(replyingCommentId === cmt._id ? null : cmt._id);
                                setReplyContent('');
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2563eb',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: 0,
                              }}
                            >
                              <Reply size={14} />
                              {replyingCommentId === cmt._id ? 'Đóng câu trả lời' : 'Trả lời CSKH'}
                            </button>
                          </div>
                        )}

                        {/* Nested Replies List */}
                        {cmt.replies && cmt.replies.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', paddingLeft: '16px', borderLeft: '2px solid #e2e8f0' }}>
                            {cmt.replies.map((reply) => {
                              const isReplyOwner = user && String(user._id) === String(reply.user?._id || reply.user);
                              const canDeleteReply = isReplyOwner || (user && ['admin', 'staff'].includes(user.role));

                              return (
                                <div
                                  key={reply._id}
                                  style={{
                                    background: reply.isStaffReply ? '#eff6ff' : '#f8fafc',
                                    border: reply.isStaffReply ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '12px 14px',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: reply.isStaffReply ? '#1d4ed8' : '#0f172a' }}>
                                        {reply.user?.name || 'Thành viên'}
                                      </span>
                                      {reply.isStaffReply && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                          <ShieldCheck size={12} /> CSKH Phản Hồi
                                        </span>
                                      )}
                                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>
                                        {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
                                      </span>
                                    </div>

                                    {canDeleteReply && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(reply._id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                        title="Xóa phản hồi"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                                    {reply.content}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Inline Reply Input (Chỉ dành cho Staff/Admin) */}
                        {canReply && replyingCommentId === cmt._id && (
                          <div style={{ marginTop: '8px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#2563eb', marginBottom: '6px' }}>
                              <CornerDownRight size={14} />
                              Trả lời câu hỏi của {cmt.user?.name || 'Khách hàng'}:
                            </div>
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Nhập câu trả lời của bạn..."
                              rows={2}
                              required
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setReplyingCommentId(null)}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                disabled={submittingReply}
                                onClick={() => handleSubmitReply(cmt._id)}
                                className="btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 14px', fontSize: '12px' }}
                              >
                                <Send size={12} />
                                {submittingReply ? 'Đang gửi...' : 'Gửi Trả Lời'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
