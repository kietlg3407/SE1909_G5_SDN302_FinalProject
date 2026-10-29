import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import api from '../../services/api';

const EMPTY_FORM = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderValue: '',
  expiryDate: '',
  usageLimit: '',
};

const getCouponId = (coupon) => coupon?._id || coupon?.id;

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.response?.data?.error || fallback;

const toDateInputValue = (date) => {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '';
  const offset = parsedDate.getTimezoneOffset() * 60000;
  return new Date(parsedDate.getTime() - offset).toISOString().slice(0, 16);
};

const formatDate = (date) => {
  if (!date) return 'Không giới hạn';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Không hợp lệ';
  return parsedDate.toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const isExpired = (coupon) =>
  coupon.expiryDate && new Date(coupon.expiryDate).getTime() < Date.now();

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [minimumExpiryDate] = useState(() => toDateInputValue(new Date()));

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/coupons');
      const receivedCoupons = response.data?.coupons;
      setCoupons(Array.isArray(receivedCoupons) ? receivedCoupons : []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải danh sách mã giảm giá'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    if (!deleteTarget) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !deletingId) setDeleteTarget(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleteTarget, deletingId]);

  const counts = useMemo(() => {
    const expired = coupons.filter(isExpired).length;
    return { all: coupons.length, active: coupons.length - expired, expired };
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return coupons
      .filter((coupon) => {
        const matchesQuery =
          !normalizedQuery ||
          String(coupon.code || '').toLowerCase().includes(normalizedQuery);
        const expired = isExpired(coupon);
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && !expired) ||
          (statusFilter === 'expired' && expired);
        return matchesQuery && matchesStatus;
      })
      .sort((first, second) => {
        const firstDate = first.expiryDate
          ? new Date(first.expiryDate).getTime()
          : Number.MAX_SAFE_INTEGER;
        const secondDate = second.expiryDate
          ? new Date(second.expiryDate).getTime()
          : Number.MAX_SAFE_INTEGER;
        return firstDate - secondDate;
      });
  }, [coupons, query, statusFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setFormError('');
  };

  const handleEdit = (coupon) => {
    setEditingId(getCouponId(coupon));
    setForm({
      code: coupon.code || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue ?? '',
      minOrderValue: coupon.minOrderValue ?? '',
      expiryDate: toDateInputValue(coupon.expiryDate),
      usageLimit: coupon.usageLimit ?? '',
    });
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPayload = () => {
    const normalizedCode = form.code.trim().toUpperCase();
    const discountValue = Number(form.discountValue);
    if (!normalizedCode) throw new Error('Mã giảm giá không được để trống');
    if (!/^[A-Z0-9_-]+$/.test(normalizedCode)) {
      throw new Error('Mã giảm giá chỉ được chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới');
    }
    if (
      form.discountValue === '' ||
      !Number.isFinite(discountValue) ||
      discountValue < 0
    ) {
      throw new Error('Giá trị giảm giá phải là số không âm');
    }
    if (form.discountType === 'percentage' && discountValue > 100) {
      throw new Error('Phần trăm giảm giá không được vượt quá 100');
    }
    if (form.discountType === 'fixed' && !Number.isInteger(discountValue)) {
      throw new Error('Giảm giá cố định phải là số nguyên');
    }

    const payload = {
      code: normalizedCode,
      discountType: form.discountType,
      discountValue,
    };
    if (form.minOrderValue !== '') {
      const minOrderValue = Number(form.minOrderValue);
      if (!Number.isFinite(minOrderValue) || minOrderValue < 0) {
        throw new Error('Giá trị đơn tối thiểu phải là số không âm');
      }
      payload.minOrderValue = minOrderValue;
    }
    if (form.expiryDate) {
      const expiryDate = new Date(form.expiryDate);
      if (Number.isNaN(expiryDate.getTime())) {
        throw new Error('Ngày hết hạn không hợp lệ');
      }
      if (expiryDate.getTime() <= Date.now()) {
        throw new Error('Ngày hết hạn phải nằm trong tương lai');
      }
      payload.expiryDate = expiryDate.toISOString();
    }
    if (form.usageLimit !== '') {
      const usageLimit = Number(form.usageLimit);
      if (!Number.isInteger(usageLimit) || usageLimit < 0) {
        throw new Error('Giới hạn lượt dùng phải là số nguyên không âm');
      }
      payload.usageLimit = usageLimit;
    }
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let payload;
    try {
      payload = buildPayload();
    } catch (error) {
      setFormError(error.message);
      toast.error(error.message);
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        const response = await api.put(`/api/coupons/${editingId}`, payload);
        const updatedCoupon = response.data?.coupon;
        if (updatedCoupon) {
          setCoupons((currentCoupons) =>
            currentCoupons.map((coupon) =>
              getCouponId(coupon) === editingId ? updatedCoupon : coupon
            )
          );
        }
        toast.success('Cập nhật mã giảm giá thành công');
      } else {
        const response = await api.post('/api/coupons', payload);
        if (response.data?.coupon) {
          setCoupons((currentCoupons) => [...currentCoupons, response.data.coupon]);
        }
        toast.success('Tạo mã giảm giá thành công');
      }
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể lưu mã giảm giá'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (coupon) => {
    const couponId = getCouponId(coupon);
    if (!couponId) return;
    setDeleteTarget(coupon);
  };

  const confirmDelete = async () => {
    const couponId = getCouponId(deleteTarget);
    if (!couponId) return;

    try {
      setDeletingId(couponId);
      await api.delete(`/api/coupons/${couponId}`);
      setCoupons((currentCoupons) =>
        currentCoupons.filter((currentCoupon) => getCouponId(currentCoupon) !== couponId)
      );
      if (editingId === couponId) resetForm();
      setDeleteTarget(null);
      toast.success('Đã xóa mã giảm giá');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xóa mã giảm giá'));
    } finally {
      setDeletingId(null);
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Đã sao chép mã');
    } catch {
      toast.error('Không thể sao chép mã giảm giá');
    }
  };

  return (
    <div className="coupons-page">
      <style>{`
        .coupons-page { min-height: 100vh; padding: 36px clamp(16px, 4vw, 56px) 56px; background: #f8fafc; color: #0f172a; }
        .coupons-shell { max-width: 1440px; margin: 0 auto; }
        .coupons-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
        .coupons-eyebrow { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
        .coupons-header h1 { margin: 8px 0 6px; font-size: clamp(26px, 4vw, 36px); letter-spacing: -.04em; }
        .coupons-header p { color: #64748b; font-size: 14px; }
        .coupons-layout { display: grid; grid-template-columns: minmax(280px, 360px) minmax(0, 1fr); gap: 24px; align-items: start; }
        .coupon-card { border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; box-shadow: 0 4px 16px rgb(15 23 42 / 5%); }
        .coupon-form-card { padding: 24px; position: sticky; top: 88px; }
        .coupon-card-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 22px; }
        .coupon-card-title h2 { font-size: 18px; }
        .coupon-card-title p { color: #64748b; font-size: 12px; margin-top: 4px; }
        .coupon-form { display: grid; gap: 15px; }
        .coupon-form label { display: grid; gap: 7px; color: #334155; font-size: 12px; font-weight: 700; }
        .coupon-form input, .coupon-form select, .coupon-search input, .coupon-filter select { width: 100%; border: 1px solid #cbd5e1; border-radius: 9px; background: #fff; color: #0f172a; font: inherit; font-size: 13px; padding: 10px 12px; transition: border-color .2s, box-shadow .2s; }
        .coupon-form input:focus, .coupon-form select:focus, .coupon-search input:focus, .coupon-filter select:focus { outline: none; border-color: #475569; box-shadow: 0 0 0 3px rgb(71 85 105 / 12%); }
        .coupon-form input:invalid, .coupon-form select:invalid { border-color: #fca5a5; }
        .coupon-form-error { display: flex; gap: 7px; align-items: flex-start; padding: 10px 12px; border: 1px solid #fecaca; border-radius: 9px; background: #fef2f2; color: #b91c1c; font-size: 12px; line-height: 1.45; }
        .coupon-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .coupon-input-with-icon { position: relative; }
        .coupon-input-with-icon svg { position: absolute; left: 11px; top: 11px; color: #94a3b8; }
        .coupon-input-with-icon input { padding-left: 35px; text-transform: uppercase; }
        .coupon-actions { display: flex; gap: 10px; margin-top: 4px; }
        .coupon-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 9px; border: 1px solid transparent; padding: 10px 14px; font: inherit; font-size: 13px; font-weight: 700; transition: .2s; }
        .coupon-button:disabled { cursor: not-allowed; opacity: .6; }
        .coupon-button-primary { flex: 1; background: #0f172a; color: #fff; }
        .coupon-button-primary:hover:not(:disabled) { background: #1e293b; }
        .coupon-button-secondary { border-color: #cbd5e1; color: #334155; }
        .coupon-button-secondary:hover:not(:disabled) { background: #f8fafc; }
        .coupon-list-card { min-width: 0; overflow: hidden; }
        .coupon-list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 22px; border-bottom: 1px solid #e2e8f0; }
        .coupon-summary { display: flex; gap: 7px; flex-wrap: wrap; }
        .coupon-pill { display: inline-flex; align-items: center; gap: 5px; border: 1px solid #e2e8f0; border-radius: 999px; padding: 6px 10px; color: #64748b; font-size: 12px; font-weight: 700; white-space: nowrap; }
        .coupon-pill strong { color: #0f172a; }
        .coupon-pill-active { border-color: #bbf7d0; background: #f0fdf4; color: #15803d; }
        .coupon-pill-expired { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
        .coupon-toolbar-tools { display: flex; gap: 8px; }
        .coupon-search { position: relative; min-width: 190px; }
        .coupon-search svg { position: absolute; left: 10px; top: 9px; color: #94a3b8; }
        .coupon-search input { padding-left: 33px; }
        .coupon-filter { position: relative; min-width: 125px; }
        .coupon-filter svg { position: absolute; pointer-events: none; right: 10px; top: 11px; color: #64748b; }
        .coupon-filter select { appearance: none; padding-right: 30px; }
        .coupon-table-wrap { overflow-x: auto; }
        .coupon-table { width: 100%; border-collapse: collapse; min-width: 720px; }
        .coupon-table th { background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 800; letter-spacing: .04em; padding: 12px 18px; text-align: left; text-transform: uppercase; white-space: nowrap; }
        .coupon-table td { border-top: 1px solid #f1f5f9; padding: 15px 18px; font-size: 13px; vertical-align: middle; }
        .coupon-table tbody tr:hover { background: #fafafa; }
        .coupon-code { display: inline-flex; align-items: center; gap: 7px; color: #0f172a; font-weight: 800; letter-spacing: .03em; }
        .coupon-copy { color: #94a3b8; padding: 2px; }
        .coupon-copy:hover { color: #0f172a; }
        .coupon-discount { font-weight: 800; }
        .coupon-subtext { display: block; color: #94a3b8; font-size: 11px; margin-top: 3px; }
        .coupon-status { display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 5px 9px; font-size: 11px; font-weight: 800; white-space: nowrap; }
        .coupon-status-active { background: #dcfce7; color: #15803d; }
        .coupon-status-expired { background: #fee2e2; color: #b91c1c; }
        .coupon-row-actions { display: flex; justify-content: flex-end; gap: 4px; }
        .coupon-icon-button { display: inline-flex; align-items: center; justify-content: center; padding: 7px; border-radius: 7px; color: #64748b; }
        .coupon-icon-button:hover { background: #f1f5f9; color: #0f172a; }
        .coupon-icon-button-danger:hover { background: #fef2f2; color: #dc2626; }
        .coupon-spin { animation: coupon-spin 1s linear infinite; }
        @keyframes coupon-spin { to { transform: rotate(360deg); } }
        .coupon-empty, .coupon-loading, .coupon-error { display: grid; place-items: center; gap: 8px; min-height: 240px; padding: 30px; color: #64748b; text-align: center; font-size: 13px; }
        .coupon-error { color: #b91c1c; }
        .coupon-empty svg, .coupon-error svg { color: #94a3b8; }
        .coupon-modal-copy { display: grid; grid-template-columns: auto 1fr; gap: 10px; padding: 24px; color: #475569; font-size: 14px; }
        .coupon-modal-copy svg { color: #dc2626; }
        .coupon-modal-copy strong { color: #0f172a; }
        .coupon-modal-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 0 24px 24px; }
        .coupon-modal-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border-radius: 8px; padding: 10px 14px; font: inherit; font-size: 13px; font-weight: 700; }
        .coupon-modal-cancel { border: 1px solid #cbd5e1; color: #334155; }
        .coupon-modal-confirm { background: #dc2626; color: #fff; }
        .coupon-modal-button:disabled { cursor: not-allowed; opacity: .6; }
        @media (max-width: 900px) { .coupons-layout { grid-template-columns: 1fr; } .coupon-form-card { position: static; } }
        @media (max-width: 650px) { .coupons-page { padding-top: 24px; } .coupons-header { align-items: flex-start; flex-direction: column; } .coupon-list-toolbar { align-items: stretch; flex-direction: column; } .coupon-toolbar-tools { flex-direction: column; } .coupon-search, .coupon-filter { min-width: 0; } .coupon-field-row { grid-template-columns: 1fr; } }
      `}</style>

      <div className="coupons-shell">
        <header className="coupons-header">
          <div>
            <div className="coupons-eyebrow"><Tag size={15} /> Quản lý khuyến mãi</div>
            <h1>Mã giảm giá</h1>
            <p>Tạo và theo dõi các mã ưu đãi dành cho khách hàng.</p>
          </div>
          <button type="button" className="coupon-button coupon-button-secondary" onClick={fetchCoupons} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'coupon-spin' : ''} /> Làm mới
          </button>
        </header>

        <div className="coupons-layout">
          <section className="coupon-card coupon-form-card">
            <div className="coupon-card-title">
              <div>
                <h2>{editingId ? 'Cập nhật mã' : 'Tạo mã mới'}</h2>
                <p>{editingId ? 'Chỉnh sửa thông tin mã giảm giá' : 'Điền thông tin ưu đãi bên dưới'}</p>
              </div>
              {editingId && <button type="button" className="coupon-icon-button" onClick={resetForm} aria-label="Hủy chỉnh sửa"><X size={17} /></button>}
            </div>
            <form className="coupon-form" onSubmit={handleSubmit}>
              <label>Mã giảm giá
                <div className="coupon-input-with-icon">
                  <Tag size={16} />
                  <input name="code" value={form.code} onChange={handleChange} placeholder="Ví dụ: SUMMER2026" maxLength={30} required />
                </div>
              </label>
              <div className="coupon-field-row">
                <label>Loại giảm
                  <select name="discountType" value={form.discountType} onChange={handleChange}>
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền (VND)</option>
                  </select>
                </label>
                <label>Giá trị giảm
                  <input name="discountValue" type="number" min="0" max={form.discountType === 'percentage' ? 100 : undefined} step={form.discountType === 'percentage' ? '1' : '1000'} value={form.discountValue} onChange={handleChange} placeholder={form.discountType === 'percentage' ? '10' : '50000'} required />
                </label>
              </div>
              <div className="coupon-field-row">
                <label>Đơn tối thiểu (VND)
                  <input name="minOrderValue" type="number" min="0" step="1000" value={form.minOrderValue} onChange={handleChange} placeholder="Không giới hạn" />
                </label>
                <label>Giới hạn lượt dùng
                  <input name="usageLimit" type="number" min="0" step="1" value={form.usageLimit} onChange={handleChange} placeholder="Không giới hạn" />
                </label>
              </div>
              <label>Ngày hết hạn
                <div className="coupon-input-with-icon">
                  <CalendarDays size={16} />
                  <input name="expiryDate" type="datetime-local" min={minimumExpiryDate} value={form.expiryDate} onChange={handleChange} />
                </div>
              </label>
              {formError && <div className="coupon-form-error" role="alert"><AlertTriangle size={15} />{formError}</div>}
              <div className="coupon-actions">
                {editingId && <button type="button" className="coupon-button coupon-button-secondary" onClick={resetForm}>Hủy</button>}
                <button type="submit" className="coupon-button coupon-button-primary" disabled={submitting}>
                  {submitting ? <RefreshCw size={15} className="coupon-spin" /> : <Plus size={15} />}
                  {submitting ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo mã'}
                </button>
              </div>
            </form>
          </section>

          <section className="coupon-card coupon-list-card">
            <div className="coupon-list-toolbar">
              <div className="coupon-summary">
                <span className="coupon-pill"><strong>{counts.all}</strong> Tất cả</span>
                <span className="coupon-pill coupon-pill-active"><strong>{counts.active}</strong> Đang hoạt động</span>
                <span className="coupon-pill coupon-pill-expired"><strong>{counts.expired}</strong> Hết hạn</span>
              </div>
              <div className="coupon-toolbar-tools">
                <div className="coupon-search">
                  <Search size={15} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã..." aria-label="Tìm mã giảm giá" />
                </div>
                <label className="coupon-filter">
                  <ChevronDown size={15} />
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Lọc trạng thái">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="expired">Đã hết hạn</option>
                  </select>
                </label>
              </div>

            </div>

            {loading ? (
              <div className="coupon-loading"><RefreshCw size={23} className="coupon-spin" /> Đang tải danh sách...</div>
            ) : (
              <div className="coupon-table-wrap">
                {filteredCoupons.length === 0 ? (
                  <div className="coupon-empty"><Tag size={25} /> {coupons.length ? 'Không tìm thấy mã phù hợp.' : 'Chưa có mã giảm giá nào.'}</div>
                ) : (
                  <table className="coupon-table">
                    <thead><tr><th>Mã giảm giá</th><th>Mức giảm</th><th>Đơn tối thiểu</th><th>Hạn sử dụng</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
                    <tbody>
                      {filteredCoupons.map((coupon) => {
                        const expired = isExpired(coupon);
                        return (
                          <tr key={getCouponId(coupon) || coupon.code}>
                            <td><span className="coupon-code">{coupon.code}<button type="button" className="coupon-copy" onClick={() => copyCode(coupon.code)} aria-label={`Sao chép ${coupon.code}`}><Copy size={13} /></button></span><span className="coupon-subtext">{coupon.usageLimit ? `Tối đa ${coupon.usageLimit} lượt dùng` : 'Không giới hạn lượt dùng'}</span></td>
                            <td><span className="coupon-discount">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}</span><span className="coupon-subtext">{coupon.discountType === 'percentage' ? 'Theo phần trăm' : 'Theo số tiền'}</span></td>
                            <td>{coupon.minOrderValue ? formatCurrency(coupon.minOrderValue) : 'Không yêu cầu'}</td>
                            <td><span className="coupon-subtext" style={{ marginTop: 0 }}>{coupon.expiryDate ? formatDate(coupon.expiryDate) : 'Không giới hạn'}</span></td>
                            <td><span className={`coupon-status ${expired ? 'coupon-status-expired' : 'coupon-status-active'}`}>{expired ? <Clock3 size={12} /> : <Check size={12} />}{expired ? 'Đã hết hạn' : 'Đang hoạt động'}</span></td>
                            <td><div className="coupon-row-actions"><button type="button" className="coupon-icon-button" onClick={() => handleEdit(coupon)} aria-label={`Sửa ${coupon.code}`}><Edit3 size={15} /></button><button type="button" className="coupon-icon-button coupon-icon-button-danger" onClick={() => handleDelete(coupon)} disabled={deletingId === getCouponId(coupon)} aria-label={`Xóa ${coupon.code}`}>{deletingId === getCouponId(coupon) ? <RefreshCw size={15} className="coupon-spin" /> : <Trash2 size={15} />}</button></div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {deleteTarget && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingId) setDeleteTarget(null);
          }}
        >
          <div className="modal-card animate-scale-up" role="alertdialog" aria-modal="true" aria-labelledby="delete-coupon-title">
            <div className="modal-header">
              <h3 id="delete-coupon-title">Xóa mã giảm giá?</h3>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Đóng xác nhận"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="coupon-modal-copy">
              <AlertTriangle size={22} aria-hidden="true" />
              <p>
                Bạn sắp xóa mã <strong>{deleteTarget.code}</strong>. Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="coupon-modal-actions">
              <button
                type="button"
                className="coupon-modal-button coupon-modal-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="coupon-modal-button coupon-modal-confirm"
                onClick={confirmDelete}
                disabled={Boolean(deletingId)}
              >
                {deletingId ? <RefreshCw size={15} className="coupon-spin" /> : <Trash2 size={15} />}
                Xóa mã
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsPage;