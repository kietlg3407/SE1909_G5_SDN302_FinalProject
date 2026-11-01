import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const formatCurrency = (amount) =>
  Number(amount || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });

const WishlistPage = () => {
  const { wishlist, wishlistCount, loadingWishlist, removeFromWishlist, moveToCart } = useCart();

  if (loadingWishlist) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: '#64748b' }}>Đang tải danh sách yêu thích...</p>
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="wishlist-empty-page" style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#ef4444' }}>
          <Heart size={40} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Danh sách yêu thích trống</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Bạn chưa lưu sản phẩm nào vào danh sách yêu thích. Hãy bấm vào biểu tượng trái tim khi xem sản phẩm để lưu lại nhé!</p>
        <Link to="/products" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
          <span>Khám Phá Bộ Sưu Tập</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="wishlist-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
          Sản Phẩm Yêu Thích <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b' }}>({wishlistCount})</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Những sản phẩm bạn đã lưu lại để tham khảo hoặc mua sau.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
        {wishlist.map((product) => {
          const isOutOfStock = product.stock <= 0;
          return (
            <div
              key={product._id}
              className="wishlist-card"
              style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}
            >
              <button
                type="button"
                onClick={() => removeFromWishlist(product._id)}
                style={{ position: 'absolute', top: '12px', right: '12px', background: '#ffffffcc', backdropFilter: 'blur(4px)', border: '1px solid #e2e8f0', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer', zIndex: 2 }}
                title="Xóa khỏi yêu thích"
                aria-label="Xóa"
              >
                <Trash2 size={16} />
              </button>

              <div style={{ height: '240px', background: '#f8fafc', overflow: 'hidden' }}>
                <img
                  src={product.images && product.images[0] ? product.images[0] : 'https://placehold.co/300x350?text=No+Image'}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {product.category || 'Thời trang'}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', flex: 1 }}>
                  {product.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => moveToCart(product._id, 1)}
                    className="btn-primary"
                    style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: isOutOfStock ? 0.5 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                  >
                    <ShoppingBag size={16} />
                    <span>{isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WishlistPage;

