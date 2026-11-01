import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Package, Star, ArrowLeft, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/favorites');
      if (res.data?.success) {
        setFavorites(res.data.favorites || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (productId, productName) => {
    try {
      const res = await api.delete(`/api/favorites/${productId}`);
      if (res.data?.success) {
        toast.success(`Đã xóa "${productName || 'sản phẩm'}" khỏi danh sách yêu thích`);
        setFavorites((prev) => prev.filter((item) => (item.product?._id || item._id) !== productId));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  return (
    <div className="container" style={{ padding: '32px 20px 80px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Heart size={26} fill="#ef4444" color="#ef4444" /> Danh Sách Sản Phẩm Yêu Thích
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '6px 0 0' }}>
            Những sản phẩm bạn đã lưu lại để tham khảo hoặc mua sắm sau.
          </p>
        </div>

        <div style={{ fontSize: '14px', color: '#64748b' }}>
          Tổng số: <strong style={{ color: '#0f172a' }}>{favorites.length} sản phẩm</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: '15px' }}>Đang tải danh sách yêu thích...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Heart size={36} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Chưa Có Sản Phẩm Yêu Thích
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Bạn chưa lưu sản phẩm nào. Hãy khám phá bộ sưu tập thời trang của chúng tôi và bấm vào biểu tượng trái tim để lưu lại nhé!
          </p>
          <Link
            to="/products"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '14px' }}
          >
            <ShoppingBag size={16} /> Khám Phá Sản Phẩm Ngay
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px',
          }}
        >
          {favorites.map((item) => {
            const product = item.product || item;
            const productId = product._id || item._id;
            const hasDiscount = product.originalPrice && product.originalPrice > product.price;
            const isOutOfStock = product.stock <= 0;
            const thumbnail = product.images?.[0];

            return (
              <div
                key={item._id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Product Image */}
                <Link
                  to={`/products/${productId}`}
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1 / 1',
                    overflow: 'hidden',
                    background: '#f8fafc',
                    display: 'block',
                  }}
                >
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <Package size={40} />
                    </div>
                  )}

                  {hasDiscount && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 7px',
                        borderRadius: '4px',
                      }}
                    >
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </span>
                  )}
                </Link>

                {/* Quick Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveFavorite(productId, product.name)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ef4444',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                  }}
                  title="Xóa khỏi yêu thích"
                >
                  <Heart size={16} fill="#ef4444" />
                </button>

                {/* Body */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {product.brand || 'CLOSET'} • {product.category}
                  </div>

                  <Link
                    to={`/products/${productId}`}
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0f172a',
                      textDecoration: 'none',
                      lineHeight: 1.4,
                      height: '38px',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {product.name}
                  </Link>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{product.rating || 5}.0</span>
                    <span>({product.numReviews || 0})</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: 'auto', paddingTop: '6px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      {formatCurrency(product.price)}
                    </span>
                    {hasDiscount && (
                      <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 600 }}>
                    {isOutOfStock ? (
                      <span style={{ color: '#dc2626' }}>• Hết hàng</span>
                    ) : (
                      <span style={{ color: '#16a34a' }}>• Còn hàng ({product.stock})</span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginTop: '6px' }}>
                    <Link
                      to={`/products/${productId}`}
                      className="btn-secondary"
                      style={{ padding: '8px', fontSize: '13px', justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                    >
                      Xem Chi Tiết
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(productId, product.name)}
                      style={{
                        padding: '8px 10px',
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        borderRadius: '8px',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Bỏ thích"
                    >
                      <Trash2 size={15} />
                    </button>
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

export default FavoritesPage;

