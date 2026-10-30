import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Filter,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import api from '../services/api';

const CATEGORIES = ['Tất cả', 'Áo', 'Quần', 'Váy', 'Áo khoác', 'Phụ kiện', 'Giày dép', 'Khác'];

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: '' },
  { label: 'Giá: Thấp đến Cao', value: 'price_asc' },
  { label: 'Giá: Cao đến Thấp', value: 'price_desc' },
  { label: 'Đánh giá cao nhất', value: 'rating_desc' },
  { label: 'Tên: A đến Z', value: 'name_asc' },
];

const formatCurrency = (val) =>
  Number(val || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'Tất cả';
  const urlMinPrice = searchParams.get('minPrice') || '';
  const urlMaxPrice = searchParams.get('maxPrice') || '';
  const urlInStock = searchParams.get('inStock') === 'true';
  const urlSortBy = searchParams.get('sortBy') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  // Local state for search bar & price inputs
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [localMinPrice, setLocalMinPrice] = useState(urlMinPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(urlMaxPrice);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Catalog state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sync search input if URL changes externally (e.g. back/forward)
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setLocalMinPrice(urlMinPrice);
    setLocalMaxPrice(urlMaxPrice);
  }, [urlMinPrice, urlMaxPrice]);

  // Helper to update search params while preserving existing ones
  const updateParams = React.useCallback(
    (newParams) => {
      setSearchParams((prev) => {
        const updated = new URLSearchParams(prev);
        Object.entries(newParams).forEach(([key, value]) => {
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            value === 'Tất cả' ||
            (key === 'page' && value === 1) ||
            (key === 'inStock' && value === false)
          ) {
            updated.delete(key);
          } else {
            updated.set(key, String(value));
          }
        });
        return updated;
      });
    },
    [setSearchParams]
  );

  // 300ms Debounce search input
  useEffect(() => {
    if (searchInput.trim() === urlSearch) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setIsDebouncing(false);
      updateParams({
        search: searchInput.trim() || undefined,
        page: 1,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, urlSearch, updateParams]);

  // Fetch products from backend
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const params = {
          page: urlPage,
          limit: 12,
        };

        if (urlSearch) params.search = urlSearch;
        if (urlCategory && urlCategory !== 'Tất cả') params.category = urlCategory;
        if (urlMinPrice) params.minPrice = urlMinPrice;
        if (urlMaxPrice) params.maxPrice = urlMaxPrice;
        if (urlInStock) params.inStock = 'true';
        if (urlSortBy) params.sortBy = urlSortBy;

        const res = await api.get('/api/products', { params });
        const data = res.data;

        if (data?.success) {
          setProducts(data.products || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        } else {
          setProducts(data?.products || []);
        }
      } catch {
        toast.error('Không thể tải danh sách sản phẩm');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [urlSearch, urlCategory, urlMinPrice, urlMaxPrice, urlInStock, urlSortBy, urlPage]);

  // Clear search bar
  const handleClearSearch = () => {
    setSearchInput('');
    setIsDebouncing(false);
    updateParams({ search: undefined, page: 1 });
  };

  // Apply custom price filter
  const handleApplyPrice = (e) => {
    e?.preventDefault();
    updateParams({
      minPrice: localMinPrice || undefined,
      maxPrice: localMaxPrice || undefined,
      page: 1,
    });
  };

  // Reset all filters
  const handleResetAll = () => {
    setSearchInput('');
    setIsDebouncing(false);
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="products-catalog-page" style={{ background: '#fcfcfd', minHeight: '100vh', padding: '36px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Page Banner Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', marginBottom: '8px' }}>
            <ShoppingBag size={14} /> BỘ SƯU TẬP 2026
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Bộ Sưu Tập Thời Trang
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
            Khám phá phong cách thời thượng với các thiết kế tối giản, tinh tế. (Hiển thị {total} sản phẩm)
          </p>
        </div>

        {/* 2-Column Catalog Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px', alignItems: 'start' }}>
          {/* Left Sidebar Filter Panel */}
          <aside
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              position: 'sticky',
              top: '90px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>
                <Filter size={18} /> Bộ Lọc Tìm Kiếm
              </div>
              <button
                type="button"
                onClick={handleResetAll}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#dc2626',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                }}
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw size={12} /> Đặt lại
              </button>
            </div>

            {/* Category Filter */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px' }}>
                Danh Mục
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {CATEGORIES.map((cat) => {
                  const isSelected = urlCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => updateParams({ category: cat === 'Tất cả' ? undefined : cat, page: 1 })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: isSelected ? 700 : 500,
                        background: isSelected ? '#0f172a' : 'transparent',
                        color: isSelected ? '#ffffff' : '#475569',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all .15s',
                      }}
                    >
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div style={{ marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px' }}>
                Khoảng Giá (VND)
              </h4>

              {/* Quick price presets */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setLocalMinPrice('');
                    setLocalMaxPrice('300000');
                    updateParams({ minPrice: undefined, maxPrice: 300000, page: 1 });
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: urlMaxPrice === '300000' && !urlMinPrice ? '#e2e8f0' : '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  &lt; 300.000 ₫
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocalMinPrice('300000');
                    setLocalMaxPrice('600000');
                    updateParams({ minPrice: 300000, maxPrice: 600000, page: 1 });
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: urlMinPrice === '300000' && urlMaxPrice === '600000' ? '#e2e8f0' : '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  300k - 600k ₫
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocalMinPrice('600000');
                    setLocalMaxPrice('');
                    updateParams({ minPrice: 600000, maxPrice: undefined, page: 1 });
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: urlMinPrice === '600000' && !urlMaxPrice ? '#e2e8f0' : '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  &gt; 600.000 ₫
                </button>
              </div>

              {/* Min - Max Input Form */}
              <form onSubmit={handleApplyPrice} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    aria-label="Giá tối thiểu"
                    type="number"
                    min="0"
                    placeholder="Tối thiểu"
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                    }}
                  />
                  <span style={{ color: '#94a3b8' }}>-</span>
                  <input
                    aria-label="Giá tối đa"
                    type="number"
                    min="0"
                    placeholder="Tối đa"
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px', justifyContent: 'center' }}
                >
                  Áp dụng giá
                </button>
              </form>
            </div>

            {/* In Stock Filter */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <label htmlFor="filter-in-stock" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                <input
                  id="filter-in-stock"
                  type="checkbox"
                  checked={urlInStock}
                  onChange={(e) => updateParams({ inStock: e.target.checked, page: 1 })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>Chỉ hiện sản phẩm còn hàng</span>
              </label>
            </div>
          </aside>

          {/* Right Main Catalog Area */}
          <main style={{ gridColumn: 'span 2' }}>
            {/* Top Search & Sort Bar */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              {/* 300ms Debounced Search Bar */}
              <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '480px' }}>
                {isDebouncing || (loading && Boolean(urlSearch)) ? (
                  <RefreshCw
                    size={18}
                    className="admin-users-spin"
                    style={{ position: 'absolute', top: '11px', left: '12px', color: '#64748b' }}
                  />
                ) : (
                  <Search
                    size={18}
                    style={{ position: 'absolute', top: '11px', left: '12px', color: '#94a3b8' }}
                  />
                )}
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên sản phẩm, thương hiệu..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleClearSearch();
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      setIsDebouncing(false);
                      if (searchInput.trim() !== urlSearch) {
                        updateParams({
                          search: searchInput.trim() || undefined,
                          page: 1,
                        });
                      }
                    }
                  }}
                  aria-label="Tìm kiếm sản phẩm"
                  style={{
                    width: '100%',
                    padding: '9px 36px 9px 38px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Xóa từ khóa"
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label htmlFor="catalog-sort" style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>
                  Sắp xếp:
                </label>
                <select
                  id="catalog-sort"
                  value={urlSortBy}
                  onChange={(e) => updateParams({ sortBy: e.target.value, page: 1 })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 500,
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active search hint */}
            {urlSearch && (
              <div style={{ marginBottom: '16px', fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Kết quả tìm kiếm cho: <strong style={{ color: '#0f172a' }}>&ldquo;{urlSearch}&rdquo;</strong> ({total} sản phẩm)</span>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Xóa lọc
                </button>
              </div>
            )}

            {/* Catalog Grid or Empty State */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#64748b', gap: '12px' }}>
                <RefreshCw size={28} className="admin-users-spin" />
                <span>Đang tải sản phẩm...</span>
              </div>
            ) : products.length === 0 ? (
              urlSearch ? (
                <div className="empty-state-box">
                  <Search size={48} className="empty-icon" />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '8px 0' }}>
                    Không Tìm Thấy Sản Phẩm Phù Hợp
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '460px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                    Không tìm thấy sản phẩm phù hợp với từ khóa <strong style={{ color: '#0f172a' }}>&ldquo;{urlSearch}&rdquo;</strong>. Vui lòng thử lại với từ khóa khác hoặc xóa bộ lọc tìm kiếm.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleClearSearch}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <X size={15} />
                      <span>Xóa Từ Khóa Tìm Kiếm</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleResetAll}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RotateCcw size={14} />
                      <span>Xóa Tất Cả Bộ Lọc</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state-box">
                  <Search size={48} className="empty-icon" />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '8px 0' }}>
                    Không Tìm Thấy Sản Phẩm Nào
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 20px' }}>
                    Rất tiếc, hiện tại không có sản phẩm nào phù hợp với tiêu chí tìm kiếm và bộ lọc của bạn. Vui lòng thử lại!
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleResetAll}
                  >
                    Xóa Tất Cả Bộ Lọc
                  </button>
                </div>
              )
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '24px',
                }}
              >
                {products.map((product) => {
                  const id = product._id || product.id;
                  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                  const discountPercent = hasDiscount
                    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                    : 0;
                  const isOutOfStock = product.stock <= 0;

                  const thumbnail = Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : typeof product.images === 'string' && product.images
                    ? product.images
                    : null;

                  return (
                    <article
                      key={id}
                      className="product-card"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      }}
                    >
                      {/* Image Box */}
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '1 / 1',
                          overflow: 'hidden',
                          background: '#f8fafc',
                        }}
                      >
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={product.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.35s ease',
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <Package size={44} />
                          </div>
                        )}

                        {/* Top Badges */}
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
                              padding: '3px 8px',
                              borderRadius: '6px',
                              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            -{discountPercent}%
                          </span>
                        )}

                        <span
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(255, 255, 255, 0.92)',
                            backdropFilter: 'blur(4px)',
                            color: '#0f172a',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                          }}
                        >
                          {product.category}
                        </span>

                        {/* Out of stock overlay */}
                        {isOutOfStock && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(15, 23, 42, 0.65)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '13px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Hết hàng
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {product.brand || 'CLOSET'}
                        </div>

                        <h3
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#0f172a',
                            lineHeight: 1.4,
                            height: '38px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            margin: 0,
                          }}
                          title={product.name}
                        >
                          {product.name}
                        </h3>

                        {/* Rating */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                          <Star size={13} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{product.rating || 5}.0</span>
                          <span>({product.numReviews || 0})</span>
                        </div>

                        {/* Price */}
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

                        {/* Stock indicator */}
                        <div style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isOutOfStock ? (
                            <span style={{ color: '#dc2626' }}>• Hết hàng</span>
                          ) : (
                            <span style={{ color: '#16a34a' }}>• Còn hàng ({product.stock})</span>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ width: '100%', padding: '8px', fontSize: '13px', marginTop: '6px', justifyContent: 'center' }}
                        >
                          Xem Chi Tiết
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '40px',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => updateParams({ page: Math.max(1, urlPage - 1) })}
                  disabled={urlPage <= 1}
                  style={{ padding: '8px 14px', fontSize: '13px' }}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => updateParams({ page: pNum })}
                    style={{
                      padding: '8px 14px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      border: pNum === urlPage ? '1px solid #0f172a' : '1px solid #cbd5e1',
                      background: pNum === urlPage ? '#0f172a' : '#ffffff',
                      color: pNum === urlPage ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => updateParams({ page: Math.min(totalPages, urlPage + 1) })}
                  disabled={urlPage >= totalPages}
                  style={{ padding: '8px 14px', fontSize: '13px' }}
                >
                  Sau
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
