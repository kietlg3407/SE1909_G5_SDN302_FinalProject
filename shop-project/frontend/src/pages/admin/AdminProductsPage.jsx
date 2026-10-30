import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CheckCircle2,
  Edit,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = ['Áo', 'Quần', 'Váy', 'Áo khoác', 'Phụ kiện', 'Giày dép', 'Khác'];

const INITIAL_FORM = {
  name: '',
  category: 'Áo',
  brand: 'CLOSET',
  price: '',
  originalPrice: '',
  stock: '',
  images: '',
  description: '',
  isActive: true,
};

const formatCurrency = (val) =>
  Number(val || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const getProductId = (product) => product?._id || product?.id;

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Status toggle & Delete dialog states
  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
      };

      if (query.trim()) params.search = query.trim();
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter === 'active') params.isActive = 'true';
      if (statusFilter === 'inactive') params.isActive = 'false';

      const response = await api.get('/api/products', { params });
      const data = response.data;

      if (data?.success) {
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setProducts(data?.products || []);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể tải danh sách sản phẩm';
      toast.error(msg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, query, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData(INITIAL_FORM);
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || 'Áo',
      brand: product.brand || 'CLOSET',
      price: product.price ?? '',
      originalPrice: product.originalPrice ?? '',
      stock: product.stock ?? '',
      images: Array.isArray(product.images) ? product.images.join(', ') : (product.images || ''),
      description: product.description || '',
      isActive: product.isActive !== false,
    });
    setShowModal(true);
  };

  // 1-Click Toggle Active Status
  const handleToggleStatus = async (product) => {
    const id = getProductId(product);
    if (!id || togglingId) return;

    const currentStatus = product.isActive !== false;
    const nextStatus = !currentStatus;

    try {
      setTogglingId(id);
      const response = await api.put(`/api/products/${id}`, { isActive: nextStatus });
      const updatedProduct = response.data?.product;

      setProducts((prev) =>
        prev.map((item) => (getProductId(item) === id ? (updatedProduct || { ...item, isActive: nextStatus }) : item))
      );
      toast.success(nextStatus ? 'Đã kích hoạt hiển thị sản phẩm' : 'Đã tạm ẩn sản phẩm');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái sản phẩm');
    } finally {
      setTogglingId(null);
    }
  };

  // Submit Add or Edit Product
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (formData.name.trim().length < 2) {
      toast.error('Tên sản phẩm phải có ít nhất 2 ký tự');
      return;
    }
    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
      toast.error('Giá bán phải là số hợp lệ và không âm');
      return;
    }
    if (formData.stock === '' || isNaN(formData.stock) || Number(formData.stock) < 0) {
      toast.error('Số lượng tồn kho phải là số hợp lệ và không âm');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Vui lòng nhập mô tả sản phẩm');
      return;
    }

    const imageArray = formData.images
      ? formData.images
          .split(',')
          .map((img) => img.trim())
          .filter(Boolean)
      : [];

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      brand: formData.brand.trim() || 'CLOSET',
      price: Number(formData.price),
      originalPrice: formData.originalPrice !== '' ? Number(formData.originalPrice) : null,
      stock: Number(formData.stock),
      images: imageArray,
      description: formData.description.trim(),
      isActive: Boolean(formData.isActive),
    };

    try {
      setSubmitting(true);
      if (editingProduct) {
        const id = getProductId(editingProduct);
        const res = await api.put(`/api/products/${id}`, payload);
        toast.success(res.data?.message || 'Cập nhật sản phẩm thành công');
      } else {
        const res = await api.post('/api/products', payload);
        toast.success(res.data?.message || 'Thêm sản phẩm thành công');
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product Confirmation
  const handleConfirmDelete = async () => {
    const id = getProductId(deleteTarget);
    if (!id || deleting) return;

    try {
      setDeleting(true);
      await api.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => getProductId(p) !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success('Xóa sản phẩm thành công');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa sản phẩm');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-products-page" style={{ minHeight: '100vh', padding: '32px 24px 60px', background: '#f8fafc' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Package size={16} /> Administration
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '6px 0 4px' }}>
              Quản Lý Sản Phẩm
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Quản lý thông tin, giá bán, tồn kho và trạng thái hiển thị của các sản phẩm.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenCreateModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <Plus size={18} />
            <span>Thêm Sản Phẩm Mới</span>
          </button>
        </header>

        {/* Card Container */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', padding: '18px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
              {/* Search input */}
              <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', top: '11px', left: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Tìm theo tên, thương hiệu, danh mục..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Category Filter */}
              <select
                aria-label="Lọc theo danh mục"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#ffffff',
                  color: '#334155',
                }}
              >
                <option value="all">Tất cả danh mục</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                aria-label="Lọc theo trạng thái"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#ffffff',
                  color: '#334155',
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ẩn</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                Tổng: <strong style={{ color: '#0f172a' }}>{total}</strong> sản phẩm
              </span>
              <button
                type="button"
                className="btn-secondary"
                onClick={fetchProducts}
                disabled={loading}
                style={{ padding: '8px 12px', fontSize: '13px' }}
                title="Làm mới danh sách"
              >
                <RefreshCw size={14} className={loading ? 'admin-users-spin' : ''} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* Table / Content */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#64748b', gap: '12px' }}>
              <RefreshCw size={26} className="admin-users-spin" />
              <span>Đang tải danh sách sản phẩm...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state-box" style={{ margin: '30px' }}>
              <Package size={44} className="empty-icon" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Không tìm thấy sản phẩm nào
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 auto 16px', maxWidth: '360px' }}>
                Không có sản phẩm nào khớp với điều kiện tìm kiếm hoặc cửa hàng chưa có sản phẩm.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleOpenCreateModal}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Plus size={16} />
                <span>Thêm sản phẩm đầu tiên</span>
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ảnh</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tên & Thương hiệu</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Danh mục</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Giá bán / Gốc</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Kho hàng</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const id = getProductId(product);
                    const isActive = product.isActive !== false;
                    const isToggling = togglingId === id;
                    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                    const discountPercent = hasDiscount
                      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                      : 0;

                    const thumbnail = Array.isArray(product.images) && product.images.length > 0
                      ? product.images[0]
                      : typeof product.images === 'string' && product.images
                      ? product.images
                      : null;

                    return (
                      <tr key={id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .15s' }}>
                        {/* Thumbnail */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              background: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package size={20} color="#94a3b8" />
                            )}
                          </div>
                        </td>

                        {/* Name & Brand */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {product.brand || 'CLOSET'} • SKU: {String(id).slice(-6).toUpperCase()}
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              background: '#f1f5f9',
                              color: '#334155',
                              fontSize: '12px',
                              fontWeight: 600,
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {product.category}
                          </span>
                        </td>

                        {/* Price & Original Price */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                            {formatCurrency(product.price)}
                          </div>
                          {hasDiscount && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                {formatCurrency(product.originalPrice)}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                }}
                              >
                                -{discountPercent}%
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Stock */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          {product.stock <= 0 ? (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: '1px solid #fecaca',
                              }}
                            >
                              Hết hàng (0)
                            </span>
                          ) : product.stock <= 10 ? (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: '#fffbeb',
                                color: '#d97706',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: '1px solid #fde68a',
                              }}
                            >
                              {product.stock} (Sắp hết)
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: '#f0fdf4',
                                color: '#16a34a',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: '1px solid #bbf7d0',
                              }}
                            >
                              {product.stock}
                            </span>
                          )}
                        </td>

                        {/* 1-Click Active Toggle */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product)}
                            disabled={isToggling}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: isToggling ? 'not-allowed' : 'pointer',
                              border: isActive ? '1px solid #86efac' : '1px solid #fca5a5',
                              background: isActive ? '#f0fdf4' : '#fef2f2',
                              color: isActive ? '#16a34a' : '#dc2626',
                              transition: 'all .2s ease',
                              whiteSpace: 'nowrap',
                            }}
                            title={isActive ? 'Nhấn để tạm ẩn sản phẩm' : 'Nhấn để hiển thị sản phẩm'}
                            aria-label={`${isActive ? 'Tạm ẩn' : 'Hiển thị'} sản phẩm ${product.name}`}
                          >
                            {isToggling ? (
                              <RefreshCw size={13} className="admin-users-spin" />
                            ) : isActive ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <XCircle size={13} />
                            )}
                            <span>{isActive ? 'Hoạt động' : 'Tạm ẩn'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              className="icon-action-btn edit-btn"
                              aria-label={`Chỉnh sửa ${product.name}`}
                              title="Chỉnh sửa sản phẩm"
                              onClick={() => handleOpenEditModal(product)}
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn delete-btn"
                              aria-label={`Xóa ${product.name}`}
                              title="Xóa sản phẩm"
                              onClick={() => setDeleteTarget(product)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#fafbfc' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Trang {page} / {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setPage(pNum)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      border: pNum === page ? '1px solid #0f172a' : '1px solid #cbd5e1',
                      background: pNum === page ? '#0f172a' : '#ffffff',
                      color: pNum === page ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {showModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !submitting) setShowModal(false);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Đóng cửa sổ"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="modal-form">
              {/* Product Name */}
              <div className="form-group">
                <label htmlFor="product-name" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Tên sản phẩm <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  required
                  placeholder="VD: Áo Sơ Mi Nam Oxford Cổ Đức"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Category & Brand */}
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="product-category" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Danh mục <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="product-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      background: '#fff',
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="product-brand" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Thương hiệu
                  </label>
                  <input
                    id="product-brand"
                    type="text"
                    placeholder="CLOSET"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
              </div>

              {/* Price & Original Price */}
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="product-price" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Giá bán (VND) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="1000"
                    required
                    placeholder="299000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="product-original-price" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Giá gốc niêm yết (VND)
                  </label>
                  <input
                    id="product-original-price"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="399000"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                </div>
              </div>

              {/* Stock & Active */}
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="product-stock" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Số lượng tồn kho <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="product-stock"
                    type="number"
                    min="0"
                    required
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                  <label className="checkbox-label" htmlFor="product-active">
                    <input
                      id="product-active"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 600, color: '#334155' }}>Kích hoạt hiển thị sản phẩm</span>
                  </label>
                </div>
              </div>

              {/* Images URL */}
              <div className="form-group">
                <label htmlFor="product-images" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Đường dẫn ảnh (URL)
                </label>
                <input
                  id="product-images"
                  type="text"
                  placeholder="https://images.unsplash.com/... (phân tách nhiều ảnh bằng dấu phẩy)"
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                />
                {formData.images && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                      <img
                        src={formData.images.split(',')[0].trim()}
                        alt="Xem trước"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Ảnh xem trước</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="product-desc" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Mô tả sản phẩm <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="product-desc"
                  rows={3}
                  required
                  placeholder="Mô tả chi tiết về kiểu dáng, chất liệu, hướng dẫn sử dụng..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting && <RefreshCw size={14} className="admin-users-spin" />}
                  <span>{editingProduct ? 'Cập Nhật Sản Phẩm' : 'Tạo Sản Phẩm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <div className="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 id="delete-dialog-title">Xác Nhận Xóa Sản Phẩm?</h3>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Đóng hộp thoại"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={22} color="#dc2626" />
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>
                  Bạn có chắc chắn muốn xóa sản phẩm <strong>&ldquo;{deleteTarget.name}&rdquo;</strong>?
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Hành động này sẽ xóa vĩnh viễn sản phẩm khỏi cơ sở dữ liệu và không thể khôi phục lại.
                </p>
              </div>
            </div>
            <div className="modal-actions" style={{ padding: '0 24px 24px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting && <RefreshCw size={14} className="admin-users-spin" />}
                <span>{deleting ? 'Đang xóa...' : 'Xóa Vĩnh Viễn'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
