import React, { useCallback, useEffect, useState } from 'react';
import { useInRouterContext, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CheckCircle2,
  Edit,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = ['Áo', 'Quần', 'Váy', 'Áo khoác', 'Phụ kiện', 'Giày dép', 'Khác'];

const SORT_OPTIONS = [
  { label: 'Sắp xếp: Mới nhất', value: '' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'Giá: Thấp đến Cao', value: 'price_asc' },
  { label: 'Giá: Cao đến Thấp', value: 'price_desc' },
  { label: 'Tên: A đến Z', value: 'name_asc' },
];

export const parseImagesList = (imgs) => {
  if (Array.isArray(imgs)) return imgs.filter(Boolean);
  if (typeof imgs === 'string' && imgs.trim()) {
    return imgs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const INITIAL_FORM = {
  name: '',
  category: 'Áo',
  brand: 'CLOSET',
  price: '',
  originalPrice: '',
  stock: '',
  images: [],
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

const AdminProductsContent = ({ searchParams, setSearchParams }) => {
  // Read state from URL search params (Single Source of Truth)
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'all';
  const urlStatus = searchParams.get('status') || 'all';
  const urlSortBy = searchParams.get('sortBy') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  // Local state for search bar & UI feedback
  const [localQuery, setLocalQuery] = useState(urlSearch);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Data state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  // Status toggle & Delete dialog states
  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Synchronize local input when URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    setLocalQuery(urlSearch);
  }, [urlSearch]);

  // Two-way URL Sync helper: strips default/falsy parameters
  const updateParams = useCallback(
    (newParams) => {
      setSearchParams((prev) => {
        const updated = new URLSearchParams(prev);
        Object.entries(newParams).forEach(([key, value]) => {
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            value === 'Tất cả' ||
            value === 'all' ||
            (key === 'page' && Number(value) === 1)
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
    if (localQuery.trim() === urlSearch) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setIsDebouncing(false);
      updateParams({
        search: localQuery.trim() || undefined,
        page: 1,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, urlSearch, updateParams]);

  // Fetch products from backend based on URL parameters
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: urlPage,
        limit: 10,
      };

      if (urlSearch) params.search = urlSearch;
      if (urlCategory !== 'all') params.category = urlCategory;
      if (urlStatus === 'active') params.isActive = 'true';
      if (urlStatus === 'inactive') params.isActive = 'false';
      if (urlSortBy) params.sortBy = urlSortBy;

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
  }, [urlPage, urlSearch, urlCategory, urlStatus, urlSortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Clear search query
  const handleClearQuery = () => {
    setLocalQuery('');
    setIsDebouncing(false);
    updateParams({ search: undefined, page: 1 });
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData(INITIAL_FORM);
    setShowUrlInput(false);
    setManualUrl('');
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setShowUrlInput(false);
    setManualUrl('');
    setFormData({
      name: product.name || '',
      category: product.category || 'Áo',
      brand: product.brand || 'CLOSET',
      price: product.price ?? '',
      originalPrice: product.originalPrice ?? '',
      stock: product.stock ?? '',
      images: parseImagesList(product.images),
      description: product.description || '',
      isActive: product.isActive !== false,
    });
    setShowModal(true);
  };

  // Xử lý chọn file ảnh từ máy tính
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" không phải là ảnh hợp lệ`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" vượt quá kích thước tối đa 10MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) return;

    try {
      setUploadingImage(true);

      // 1. Thử tải file lên backend lưu trữ trong thư mục /uploads
      let uploadedUrls = [];
      try {
        const uploadData = new FormData();
        validFiles.forEach((f) => uploadData.append('images', f));
        const res = await api.post('/api/products/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.success && Array.isArray(res.data?.urls) && res.data.urls.length > 0) {
          uploadedUrls = res.data.urls;
        }
      } catch (_) {
        // Dự phòng: Nếu server không hỗ trợ multipart trong môi trường test/mock, dùng Data URL
      }

      // 2. Dự phòng: Đọc file thành Data URL (Base64) hiển thị trực tiếp
      if (!uploadedUrls.length) {
        const dataUrlPromises = validFiles.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          });
        });
        const results = await Promise.all(dataUrlPromises);
        uploadedUrls = results.filter(Boolean);
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...parseImagesList(prev.images), ...uploadedUrls],
        }));
        toast.success(`Đã thêm ${uploadedUrls.length} ảnh từ máy tính`);
      }
    } catch (err) {
      toast.error('Lỗi khi tải ảnh từ máy tính');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Xóa ảnh đã chọn trong danh sách xem trước
  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: parseImagesList(prev.images).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Thêm ảnh thủ công qua URL nếu muốn
  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...parseImagesList(prev.images), manualUrl.trim()],
    }));
    setManualUrl('');
    toast.success('Đã thêm liên kết ảnh');
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

    const imageArray = parseImagesList(formData.images);

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
              <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
                {isDebouncing || (loading && Boolean(urlSearch)) ? (
                  <RefreshCw
                    size={16}
                    className="admin-users-spin"
                    style={{ position: 'absolute', top: '11px', left: '12px', color: '#64748b' }}
                  />
                ) : (
                  <Search
                    size={16}
                    style={{ position: 'absolute', top: '11px', left: '12px', color: '#94a3b8' }}
                  />
                )}
                <input
                  type="text"
                  placeholder="Tìm theo tên, thương hiệu, danh mục..."
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleClearQuery();
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      setIsDebouncing(false);
                      if (localQuery.trim() !== urlSearch) {
                        updateParams({ search: localQuery.trim() || undefined, page: 1 });
                      }
                    }
                  }}
                  aria-label="Tìm kiếm sản phẩm trong quản trị"
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
                {localQuery && (
                  <button
                    type="button"
                    onClick={handleClearQuery}
                    style={{
                      position: 'absolute',
                      top: '9px',
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
                    title="Xóa tìm kiếm"
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                aria-label="Lọc theo danh mục"
                value={urlCategory}
                onChange={(e) => updateParams({ category: e.target.value, page: 1 })}
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
                value={urlStatus}
                onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
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

              {/* Sort By Filter */}
              <select
                aria-label="Sắp xếp sản phẩm"
                value={urlSortBy}
                onChange={(e) => updateParams({ sortBy: e.target.value, page: 1 })}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#ffffff',
                  color: '#334155',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
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
            urlSearch ? (
              <div className="empty-state-box" style={{ margin: '30px' }}>
                <Search size={44} className="empty-icon" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Không tìm thấy sản phẩm
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 auto 16px', maxWidth: '420px', lineHeight: 1.5 }}>
                  Không tìm thấy sản phẩm phù hợp với từ khóa <strong style={{ color: '#0f172a' }}>&ldquo;{urlSearch}&rdquo;</strong>.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClearQuery}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                >
                  <RotateCcw size={14} />
                  <span>Xóa bộ lọc tìm kiếm</span>
                </button>
              </div>
            ) : (
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
            )
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
                Trang {urlPage} / {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => updateParams({ page: Math.max(1, urlPage - 1) })}
                  disabled={urlPage <= 1}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => updateParams({ page: pNum })}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
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

              {/* Image Upload from Computer */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor="product-file-upload" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Hình ảnh sản phẩm (Tải file từ máy)
                  </label>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {parseImagesList(formData.images).length > 0
                      ? `${parseImagesList(formData.images).length} ảnh đã chọn`
                      : 'Chưa có ảnh'}
                  </span>
                </div>

                {/* Dropzone / Upload area */}
                <label
                  htmlFor="product-file-upload"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '18px 16px',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#0f172a';
                    e.currentTarget.style.background = '#f1f5f9';
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f8fafc';
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileSelect({ target: { files: e.dataTransfer.files, value: '' } });
                    }
                  }}
                >
                  <input
                    id="product-file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImage}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  {uploadingImage ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                      <RefreshCw size={18} className="admin-users-spin" />
                      <span>Đang xử lý ảnh từ máy tính...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={26} color="#64748b" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                        Nhấn để chọn ảnh từ máy tính
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Hỗ trợ PNG, JPG, JPEG, WEBP (chọn được nhiều ảnh, tối đa 10MB)
                      </div>
                    </>
                  )}
                </label>

                {/* Previews Grid */}
                {parseImagesList(formData.images).length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
                        gap: '10px',
                        padding: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                      }}
                    >
                      {parseImagesList(formData.images).map((imgUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'relative',
                            width: '100%',
                            paddingTop: '100%',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: idx === 0 ? '2px solid #0f172a' : '1px solid #cbd5e1',
                            background: '#ffffff',
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={`Ảnh ${idx + 1}`}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {idx === 0 && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '4px',
                                left: '4px',
                                background: 'rgba(15, 23, 42, 0.85)',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                pointerEvents: 'none',
                              }}
                            >
                              Ảnh chính
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            aria-label={`Xóa ảnh ${idx + 1}`}
                            title="Xóa ảnh này"
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: '#ef4444',
                              color: '#ffffff',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional toggle for URL input */}
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#475569',
                      fontSize: '12px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showUrlInput ? 'Ẩn ô nhập URL ảnh' : '+ Hoặc thêm ảnh bằng đường dẫn URL'}
                  </button>
                  {showUrlInput && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                        }}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleAddManualUrl}
                        style={{ padding: '8px 14px', fontSize: '12px' }}
                      >
                        Thêm
                      </button>
                    </div>
                  )}
                </div>
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

const AdminProductsWithRouter = (props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  return <AdminProductsContent searchParams={searchParams} setSearchParams={setSearchParams} {...props} />;
};

const AdminProductsStandalone = (props) => {
  const [params, setParams] = useState(
    () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  );
  return <AdminProductsContent searchParams={params} setSearchParams={setParams} {...props} />;
};

const AdminProductsPage = (props) => {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <AdminProductsWithRouter {...props} />;
  }
  return <AdminProductsStandalone {...props} />;
};

export default AdminProductsPage;
