import React, { useCallback, useEffect, useState } from 'react';
import { Boxes, Edit, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EMPTY_RECORD = { name: '', description: '', logo: '', isActive: true };
const EMPTY_VARIANT = { sku: '', size: '', color: '', price: '', stock: 0, isActive: true };

const AdminClassificationsPage = () => {
  const [tab, setTab] = useState('categories');
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [recordForm, setRecordForm] = useState(EMPTY_RECORD);
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/${tab}/manage`);
      setRecords(data.records || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải dữ liệu phân loại');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get('/api/products', { params: { limit: 100, status: 'all' } });
      const list = data.products || [];
      setProducts(list);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách sản phẩm');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'variants') fetchProducts();
    else fetchRecords();
  }, [tab, fetchProducts, fetchRecords]);

  const openNewForm = () => {
    setEditing(null);
    setRecordForm(EMPTY_RECORD);
    setVariantForm(EMPTY_VARIANT);
    setShowForm(true);
  };

  const openRecordForm = (record) => {
    setEditing(record);
    setRecordForm({
      name: record.name || '',
      description: record.description || '',
      logo: record.logo || '',
      isActive: record.isActive !== false,
    });
    setShowForm(true);
  };

  const openVariantForm = (variant) => {
    setEditing(variant || null);
    setVariantForm({
      sku: variant?.sku || '',
      size: variant?.size || '',
      color: variant?.color || '',
      price: variant?.price ?? '',
      stock: variant?.stock ?? 0,
      isActive: variant?.isActive !== false,
    });
    setShowForm(true);
  };

  const saveRecord = async (event) => {
    event.preventDefault();
    const name = recordForm.name.trim();
    if (!name) {
      toast.error('Vui lòng nhập tên');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        ...recordForm,
        name,
        description: recordForm.description.trim(),
        logo: recordForm.logo.trim(),
      };
      if (editing) await api.put(`/api/${tab}/${editing._id}`, payload);
      else await api.post(`/api/${tab}`, payload);
      toast.success(editing ? 'Đã cập nhật' : 'Đã tạo mới');
      setShowForm(false);
      setLoading(true);
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu dữ liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const saveVariant = async (event) => {
    event.preventDefault();
    if (!activeProductId) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }
    if (!variantForm.size.trim() && !variantForm.color.trim()) {
      toast.error('Nhập kích thước hoặc màu sắc cho biến thể');
      return;
    }
    const stock = Number(variantForm.stock);
    const price = variantForm.price === '' ? null : Number(variantForm.price);
    if (!Number.isInteger(stock) || stock < 0 || (price !== null && (!Number.isFinite(price) || price < 0))) {
      toast.error('Giá và tồn kho phải là số không âm hợp lệ');
      return;
    }

    try {
      setSubmitting(true);
      const payload = { ...variantForm, stock, price };
      const product = products.find((item) => item._id === activeProductId);
      if (editing) {
        await api.put(`/api/products/${activeProductId}/variants/${editing._id}`, payload);
      } else {
        await api.post(`/api/products/${activeProductId}/variants`, payload);
      }
      toast.success(editing ? 'Đã cập nhật biến thể' : 'Đã thêm biến thể');
      setShowForm(false);
      setLoading(true);
      await fetchProducts();
      if (product) setSelectedProductId(product._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu biến thể');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRecord = async (record) => {
    try {
      await api.put(`/api/${tab}/${record._id}`, { isActive: !record.isActive });
      setLoading(true);
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const deleteRecord = async (record) => {
    if (!window.confirm(`Xóa "${record.name}"?`)) return;
    try {
      await api.delete(`/api/${tab}/${record._id}`);
      toast.success('Đã xóa');
      setLoading(true);
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa mục đang được sử dụng');
    }
  };

  const deleteVariant = async (variant) => {
    if (!activeProductId || !window.confirm('Xóa biến thể này?')) return;
    try {
      await api.delete(`/api/products/${activeProductId}/variants/${variant._id}`);
      toast.success('Đã xóa biến thể');
      setLoading(true);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa biến thể');
    }
  };

  const activeProductId = selectedProductId || products[0]?._id || '';
  const activeProduct = products.find((product) => product._id === activeProductId);
  const isVariantTab = tab === 'variants';

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px 60px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, fontWeight: 700 }}>
              <Boxes size={16} /> QUẢN LÝ PHÂN LOẠI
            </div>
            <h1 style={{ margin: '6px 0', color: '#0f172a', fontSize: 28 }}>Danh mục, thương hiệu & biến thể</h1>
            <p style={{ margin: 0, color: '#64748b' }}>Quản lý các nhóm phân loại và tùy chọn tồn kho của sản phẩm.</p>
          </div>
          <button type="button" className="btn-primary" onClick={openNewForm} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
            <Plus size={18} /> {isVariantTab ? 'Thêm biến thể' : `Thêm ${tab === 'categories' ? 'danh mục' : 'thương hiệu'}`}
          </button>
        </header>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            ['categories', 'Danh mục'],
            ['brands', 'Thương hiệu'],
            ['variants', 'Biến thể sản phẩm'],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => { setLoading(true); setTab(value); }} aria-pressed={tab === value}
              style={{ border: `1px solid ${tab === value ? '#2563eb' : '#cbd5e1'}`, background: tab === value ? '#eff6ff' : '#fff', color: tab === value ? '#1d4ed8' : '#475569', borderRadius: 8, padding: '9px 14px', fontWeight: 600, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          {isVariantTab && (
            <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0' }}>
              <label htmlFor="variant-product" style={{ display: 'block', marginBottom: 6, color: '#475569', fontWeight: 600 }}>Sản phẩm</label>
              <select id="variant-product" value={activeProductId} onChange={(event) => setSelectedProductId(event.target.value)} style={{ width: '100%', maxWidth: 480, padding: 10, border: '1px solid #cbd5e1', borderRadius: 8 }}>
                {products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}
              </select>
            </div>
          )}
          {loading ? <p style={{ padding: 24, color: '#64748b' }}>Đang tải...</p> : isVariantTab ? (
            activeProduct ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead><tr style={{ background: '#f8fafc', color: '#64748b' }}>
                    {['SKU', 'Kích thước', 'Màu sắc', 'Giá riêng', 'Tồn kho', 'Trạng thái', ''].map((heading) => <th key={heading} style={{ padding: 12 }}>{heading}</th>)}
                  </tr></thead>
                  <tbody>
                    {(activeProduct.variants || []).map((variant) => (
                      <tr key={variant._id} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: 12 }}>{variant.sku || '—'}</td>
                        <td style={{ padding: 12 }}>{variant.size || '—'}</td>
                        <td style={{ padding: 12 }}>{variant.color || '—'}</td>
                        <td style={{ padding: 12 }}>{variant.price == null ? 'Theo giá sản phẩm' : `${Number(variant.price).toLocaleString('vi-VN')} ₫`}</td>
                        <td style={{ padding: 12 }}>{variant.stock}</td>
                        <td style={{ padding: 12 }}>{variant.isActive ? 'Đang bán' : 'Tạm ẩn'}</td>
                        <td style={{ padding: 12, whiteSpace: 'nowrap' }}>
                          <button type="button" onClick={() => openVariantForm(variant)} aria-label="Sửa biến thể" style={{ border: 0, background: 'none', color: '#2563eb', cursor: 'pointer', marginRight: 8 }}><Edit size={17} /></button>
                          <button type="button" onClick={() => deleteVariant(variant)} aria-label="Xóa biến thể" style={{ border: 0, background: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={17} /></button>
                        </td>
                      </tr>
                    ))}
                    {!activeProduct.variants?.length && <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Sản phẩm chưa có biến thể.</td></tr>}
                  </tbody>
                </table>
              </div>
            ) : <p style={{ padding: 24, color: '#64748b' }}>Chưa có sản phẩm để tạo biến thể.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead><tr style={{ background: '#f8fafc', color: '#64748b' }}>
                  <th style={{ padding: 12 }}>Tên</th><th style={{ padding: 12 }}>Mô tả</th>{tab === 'brands' && <th style={{ padding: 12 }}>Logo</th>}<th style={{ padding: 12 }}>Trạng thái</th><th style={{ padding: 12 }}>Thao tác</th>
                </tr></thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 12, fontWeight: 600 }}>{record.name}</td><td style={{ padding: 12 }}>{record.description || '—'}</td>
                      {tab === 'brands' && <td style={{ padding: 12 }}>{record.logo ? <a href={record.logo} target="_blank" rel="noreferrer">Xem logo</a> : '—'}</td>}
                      <td style={{ padding: 12 }}>
                        <button type="button" onClick={() => toggleRecord(record)} style={{ border: 0, borderRadius: 20, padding: '5px 10px', cursor: 'pointer', background: record.isActive ? '#dcfce7' : '#f1f5f9', color: record.isActive ? '#15803d' : '#64748b' }}>{record.isActive ? 'Hoạt động' : 'Tạm ẩn'}</button>
                      </td>
                      <td style={{ padding: 12, whiteSpace: 'nowrap' }}>
                        <button type="button" onClick={() => openRecordForm(record)} aria-label="Sửa" style={{ border: 0, background: 'none', color: '#2563eb', cursor: 'pointer', marginRight: 8 }}><Edit size={17} /></button>
                        <button type="button" onClick={() => deleteRecord(record)} aria-label="Xóa" style={{ border: 0, background: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={17} /></button>
                      </td>
                    </tr>
                  ))}
                  {!records.length && <tr><td colSpan={tab === 'brands' ? 5 : 4} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Chưa có dữ liệu.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>{isVariantTab ? (editing ? 'Cập nhật biến thể' : 'Thêm biến thể') : (editing ? 'Cập nhật thông tin' : 'Thêm mới')}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowForm(false)} aria-label="Đóng">×</button>
            </div>
            {isVariantTab ? (
              <form className="modal-form" onSubmit={saveVariant}>
                {[
                  ['sku', 'Mã SKU', 'text'],
                  ['size', 'Kích thước', 'text'],
                  ['color', 'Màu sắc', 'text'],
                  ['price', 'Giá riêng (để trống dùng giá sản phẩm)', 'number'],
                  ['stock', 'Tồn kho', 'number'],
                ].map(([key, label, type]) => (
                  <div className="form-group" key={key}><label htmlFor={`variant-${key}`}>{label}</label><input id={`variant-${key}`} type={type} min={type === 'number' ? 0 : undefined} step={key === 'price' ? 'any' : '1'} value={variantForm[key]} onChange={(event) => setVariantForm((form) => ({ ...form, [key]: event.target.value }))} /></div>
                ))}
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={variantForm.isActive} onChange={(event) => setVariantForm((form) => ({ ...form, isActive: event.target.checked }))} /> Đang hoạt động</label>
                <div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Hủy</button><button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu biến thể'}</button></div>
              </form>
            ) : (
              <form className="modal-form" onSubmit={saveRecord}>
                <div className="form-group"><label htmlFor="classification-name">Tên</label><input id="classification-name" value={recordForm.name} maxLength={100} onChange={(event) => setRecordForm((form) => ({ ...form, name: event.target.value }))} required /></div>
                <div className="form-group"><label htmlFor="classification-description">Mô tả</label><textarea id="classification-description" value={recordForm.description} maxLength={500} onChange={(event) => setRecordForm((form) => ({ ...form, description: event.target.value }))} rows={3} /></div>
                {tab === 'brands' && <div className="form-group"><label htmlFor="classification-logo">URL logo</label><input id="classification-logo" type="url" value={recordForm.logo} onChange={(event) => setRecordForm((form) => ({ ...form, logo: event.target.value }))} /></div>}
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={recordForm.isActive} onChange={(event) => setRecordForm((form) => ({ ...form, isActive: event.target.checked }))} /> Đang hoạt động</label>
                <div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Hủy</button><button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu'}</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClassificationsPage;
