import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const getErrorMessage = (error, fallback) => {
  const backendMsg = error.response?.data?.error || error.response?.data?.message;
  if (!backendMsg) return fallback;
  
  if (typeof backendMsg === 'string') {
    if (backendMsg.toLowerCase().includes('already exists') || backendMsg.toLowerCase().includes('duplicate')) {
      return 'Mã giảm giá này đã tồn tại trong hệ thống. Vui lòng nhập mã khác!';
    }
    if (backendMsg.toLowerCase().includes('validation failed')) {
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường thông tin!';
    }
    if (backendMsg.toLowerCase().includes('not found')) {
      return 'Không tìm thấy mã giảm giá trong hệ thống!';
    }
  }
  
  return backendMsg || fallback;
};

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
  const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('expiryDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [minimumExpiryDate] = useState(() => toDateInputValue(new Date()));
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showUpdateConfirmDialog, setShowUpdateConfirmDialog] = useState(false);
  const [originalCoupon, setOriginalCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (query.trim()) params.append('search', query.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (discountTypeFilter !== 'all') params.append('discountType', discountTypeFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', page);
      params.append('limit', limit);

      const response = await api.get(`/api/coupons?${params.toString()}`);
      const rawData = response.data;
      
      const couponList = Array.isArray(rawData?.data?.coupons)
        ? rawData.data.coupons
        : Array.isArray(rawData?.coupons)
        ? rawData.coupons
        : [];

      const totalCount = rawData?.data?.pagination?.totalItems 
        ?? rawData?.pagination?.total 
        ?? couponList.length;

      const pagesCount = rawData?.data?.pagination?.totalPages 
        ?? rawData?.pagination?.totalPages 
        ?? Math.ceil(totalCount / limit) 
        ?? 1;

      setCoupons(couponList);
      setTotal(totalCount);
      setTotalPages(pagesCount);
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Không thể tải danh sách mã giảm giá');
      toast.error(errorMessage);
      setCoupons([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter, discountTypeFilter, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchCoupons();
  }, [page, statusFilter, discountTypeFilter, sortBy, sortOrder, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchCoupons();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

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
    return { all: total, active: coupons.length - expired, expired, displayed: coupons.length };
  }, [total, coupons]);

  const handleSortSelect = (event) => {
    const [newSortBy, newSortOrder] = event.target.value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(Number(newLimit));
    setPage(1);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setOriginalCoupon(null);
    setFormError('');
    setFieldErrors({});
    setTouchedFields({});
    setShowConfirmDialog(false);
    setShowUpdateConfirmDialog(false);
  };

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    
    switch (name) {
      case 'code': {
        const normalizedCode = value.trim().toUpperCase();
        if (!normalizedCode) {
          errors.code = 'Mã giảm giá không được để trống';
        } else if (!/^[A-Z0-9_-]+$/.test(normalizedCode)) {
          errors.code = 'Chỉ chứa chữ hoa, số, dấu gạch ngang (-) hoặc gạch dưới (_)';
        } else if (normalizedCode.length < 3) {
          errors.code = 'Mã phải có ít nhất 3 ký tự';
        } else if (normalizedCode.length > 30) {
          errors.code = 'Mã không được vượt quá 30 ký tự';
        } else {
          delete errors.code;
        }
        break;
      }
      case 'discountValue': {
        const numValue = Number(value);
        if (value === '' || !Number.isFinite(numValue)) {
          errors.discountValue = 'Giá trị giảm giá là bắt buộc';
        } else if (numValue < 0) {
          errors.discountValue = 'Giá trị phải không âm';
        } else if (form.discountType === 'percentage' && numValue > 100) {
          errors.discountValue = 'Phần trăm không được vượt quá 100%';
        } else if (form.discountType === 'percentage' && numValue === 0) {
          errors.discountValue = 'Phần trăm phải lớn hơn 0';
        } else if (form.discountType === 'fixed' && !Number.isInteger(numValue)) {
          errors.discountValue = 'Giá trị phải là số nguyên';
        } else if (form.discountType === 'fixed' && numValue === 0) {
          errors.discountValue = 'Giá trị phải lớn hơn 0';
        } else {
          delete errors.discountValue;
        }
        break;
      }
      case 'minOrderValue': {
        if (value !== '') {
          const numValue = Number(value);
          if (!Number.isFinite(numValue) || numValue < 0) {
            errors.minOrderValue = 'Giá trị phải là số không âm';
          } else if (!Number.isInteger(numValue)) {
            errors.minOrderValue = 'Giá trị phải là số nguyên';
          } else {
            delete errors.minOrderValue;
          }
        } else {
          delete errors.minOrderValue;
        }
        break;
      }
      case 'expiryDate': {
        if (value) {
          const expiryDate = new Date(value);
          if (Number.isNaN(expiryDate.getTime())) {
            errors.expiryDate = 'Ngày hết hạn không hợp lệ';
          } else if (expiryDate.getTime() <= Date.now()) {
            errors.expiryDate = 'Ngày hết hạn phải trong tương lai';
          } else {
            delete errors.expiryDate;
          }
        } else {
          delete errors.expiryDate;
        }
        break;
      }
      case 'usageLimit': {
        if (value !== '') {
          const numValue = Number(value);
          if (!Number.isInteger(numValue) || numValue < 0) {
            errors.usageLimit = 'Giới hạn phải là số nguyên không âm';
          } else {
            delete errors.usageLimit;
          }
        } else {
          delete errors.usageLimit;
        }
        break;
      }
      default:
        break;
    }
    
    return errors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setFormError('');
    
    // Real-time validation for touched fields
    if (touchedFields[name]) {
      setFieldErrors(validateField(name, value));
    }
    
    // Re-validate discountValue when discountType changes
    if (name === 'discountType' && touchedFields.discountValue) {
      setFieldErrors(validateField('discountValue', form.discountValue));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    setFieldErrors(validateField(name, value));
  };

  const handleEdit = (coupon) => {
    const couponId = getCouponId(coupon);
    
    // Show warning if already editing another coupon
    if (editingId && editingId !== couponId) {
      const currentCoupon = coupons.find(c => getCouponId(c) === editingId);
      if (!confirm(`Bạn đang chỉnh sửa mã ${currentCoupon?.code || ''}. Bạn có muốn hủy và chuyển sang mã ${coupon.code} không?`)) {
        return;
      }
    }
    
    setEditingId(couponId);
    setOriginalCoupon(coupon);
    setForm({
      code: coupon.code || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue ?? '',
      minOrderValue: coupon.minOrderValue ?? '',
      expiryDate: toDateInputValue(coupon.expiryDate),
      usageLimit: coupon.usageLimit ?? '',
    });
    setFormError('');
    setFieldErrors({});
    setTouchedFields({});
    setShowUpdateConfirmDialog(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPayload = () => {
    const normalizedCode = form.code.trim().toUpperCase();
    const discountValue = Number(form.discountValue);
    
    // Validate all fields
    if (!normalizedCode) throw new Error('Mã giảm giá không được để trống');
    if (normalizedCode.length < 3) throw new Error('Mã giảm giá phải có ít nhất 3 ký tự');
    if (normalizedCode.length > 30) throw new Error('Mã giảm giá không được vượt quá 30 ký tự');
    if (!/^[A-Z0-9_-]+$/.test(normalizedCode)) {
      throw new Error('Mã giảm giá chỉ được chứa chữ hoa, số, dấu gạch ngang hoặc gạch dưới');
    }
    
    if (form.discountValue === '' || !Number.isFinite(discountValue)) {
      throw new Error('Giá trị giảm giá là bắt buộc');
    }
    if (discountValue < 0) {
      throw new Error('Giá trị giảm giá phải là số không âm');
    }
    if (form.discountType === 'percentage') {
      if (discountValue > 100) throw new Error('Phần trăm giảm giá không được vượt quá 100%');
      if (discountValue === 0) throw new Error('Phần trăm giảm giá phải lớn hơn 0');
    }
    if (form.discountType === 'fixed') {
      if (!Number.isInteger(discountValue)) throw new Error('Giảm giá cố định phải là số nguyên');
      if (discountValue === 0) throw new Error('Giảm giá cố định phải lớn hơn 0');
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
      if (!Number.isInteger(minOrderValue)) {
        throw new Error('Giá trị đơn tối thiểu phải là số nguyên');
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

  const executeSaveCoupon = async () => {
    let payload;
    try {
      payload = buildPayload();
    } catch (error) {
      setFormError(error.message);
      toast.error(error.message);
      setShowConfirmDialog(false);
      setShowUpdateConfirmDialog(false);
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        const response = await api.put(`/api/coupons/${editingId}`, payload);
        const updatedCoupon = response.data?.coupon || response.data?.data?.coupon;
        if (updatedCoupon) {
          setCoupons((currentCoupons) =>
            currentCoupons.map((coupon) =>
              getCouponId(coupon) === editingId ? updatedCoupon : coupon
            )
          );
        }
        toast.success(`Cập nhật mã giảm giá "${payload.code}" thành công`);
        await fetchCoupons();
      } else {
        const response = await api.post('/api/coupons', payload);
        const createdCoupon = response.data?.coupon || response.data?.data?.coupon;
        if (createdCoupon) {
          setCoupons((currentCoupons) => [createdCoupon, ...currentCoupons]);
          setTotal((prev) => prev + 1);
        }
        toast.success(`Tạo mã giảm giá "${payload.code}" thành công`);
        await fetchCoupons();
      }
      resetForm();
    } catch (error) {
      const isDuplicate = error.response?.status === 409 || 
        JSON.stringify(error.response?.data || '').toLowerCase().includes('already exists');
        
      const errorMsg = isDuplicate
        ? `Mã giảm giá "${payload.code}" đã tồn tại. Vui lòng chọn mã khác!`
        : (editingId 
            ? getErrorMessage(error, `Không thể cập nhật mã ${payload.code}`)
            : getErrorMessage(error, 'Không thể tạo mã giảm giá'));
            
      toast.error(errorMsg);
      setFormError(errorMsg);
      if (isDuplicate) {
        setFieldErrors((prev) => ({ ...prev, code: 'Mã giảm giá này đã tồn tại' }));
        setTouchedFields((prev) => ({ ...prev, code: true }));
      }
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
      setShowUpdateConfirmDialog(false);
    }
  };

  const handleSubmit = (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    
    // Mark all fields as touched and validate
    const allTouched = Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouchedFields(allTouched);
    
    // Validate all fields
    let errors = {};
    Object.keys(form).forEach((key) => {
      errors = { ...errors, ...validateField(key, form[key]) };
    });
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setFormError('Vui lòng sửa các lỗi trong biểu mẫu');
      toast.error('Vui lòng sửa các lỗi trong biểu mẫu');
      return;
    }

    try {
      buildPayload();
    } catch (error) {
      setFormError(error.message);
      toast.error(error.message);
      return;
    }
    
    // Show confirmation dialog
    if (editingId) {
      setShowUpdateConfirmDialog(true);
    } else {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSubmit = () => {
    executeSaveCoupon();
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
  };

  const handleConfirmUpdate = () => {
    executeSaveCoupon();
  };

  const handleCancelUpdate = () => {
    setShowUpdateConfirmDialog(false);
  };

  const handleDelete = (coupon) => {
    const couponId = getCouponId(coupon);
    if (!couponId) return;
    setDeleteTarget(coupon);
  };

  const confirmDelete = async () => {
    const couponId = getCouponId(deleteTarget);
    const targetCode = deleteTarget?.code;
    if (!couponId) return;

    const previousCoupons = [...coupons];
    const previousTotal = total;
    
    // Optimistic UI update
    setCoupons((currentCoupons) =>
      currentCoupons.filter((currentCoupon) => getCouponId(currentCoupon) !== couponId)
    );
    setTotal((prevTotal) => Math.max(0, prevTotal - 1));

    try {
      setDeletingId(couponId);
      await api.delete(`/api/coupons/${couponId}`);
      if (editingId === couponId) resetForm();
      setDeleteTarget(null);
      toast.success(targetCode ? `Đã xóa mã giảm giá "${targetCode}" thành công` : 'Đã xóa mã giảm giá thành công');

      // If we just deleted the only item on a page > 1, go back to previous page
      if (coupons.length === 1 && page > 1) {
        setPage((prevPage) => prevPage - 1);
      } else {
        await fetchCoupons();
      }
    } catch (error) {
      // Revert optimistic update on error
      setCoupons(previousCoupons);
      setTotal(previousTotal);
      toast.error(getErrorMessage(error, targetCode ? `Không thể xóa mã ${targetCode}` : 'Không thể xóa mã giảm giá'));
    } finally {
      setDeletingId(null);
    }
  };

  const copyCode = async (code) => {
    if (!code) return;

    let success = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        success = true;
      } catch {
        // Fallback below
      }
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) success = true;
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopiedCode(code);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
      toast.success(`Đã sao chép mã "${code}"`);
    } else {
      toast.error('Không thể sao chép mã');
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
        .coupon-form-card { padding: 24px; position: sticky; top: 88px; transition: border-color .3s, box-shadow .3s; }
        .coupon-form-card.is-editing { border-color: #0284c7; box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2), 0 4px 20px rgba(2, 132, 199, 0.12); }
        .coupon-edit-code-badge { display: inline-flex; align-items: center; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-size: 13px; font-weight: 800; letter-spacing: 0.04em; }
        .coupon-edit-banner { display: flex; flex-direction: column; gap: 8px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 12px; margin-bottom: 16px; font-size: 12px; color: #0369a1; }
        .coupon-edit-banner-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .coupon-edit-banner-title { display: flex; align-items: center; gap: 6px; font-weight: 700; color: #0369a1; }
        .coupon-original-values-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 12px; padding-top: 8px; border-top: 1px dashed #bae6fd; font-size: 11px; }
        .coupon-original-item { display: flex; justify-content: space-between; gap: 4px; }
        .coupon-original-label { color: #64748b; }
        .coupon-original-val { font-weight: 700; color: #0f172a; }
        .coupon-card-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 22px; }
        .coupon-card-title h2 { font-size: 18px; }
        .coupon-card-title p { color: #64748b; font-size: 12px; margin-top: 4px; }
        .coupon-form { display: grid; gap: 15px; }
        .coupon-form label { display: grid; gap: 7px; color: #334155; font-size: 12px; font-weight: 700; }
        .coupon-label-text { display: flex; align-items: center; gap: 4px; }
        .coupon-required { color: #dc2626; }
        .coupon-form input, .coupon-form select, .coupon-search input, .coupon-filter select { width: 100%; border: 1px solid #cbd5e1; border-radius: 9px; background: #fff; color: #0f172a; font: inherit; font-size: 13px; padding: 10px 12px; transition: border-color .2s, box-shadow .2s; }
        .coupon-form input:focus, .coupon-form select:focus, .coupon-search input:focus, .coupon-filter select:focus { outline: none; border-color: #475569; box-shadow: 0 0 0 3px rgb(71 85 105 / 12%); }
        .coupon-form input:invalid, .coupon-form select:invalid { border-color: #fca5a5; }
        .coupon-input-error { border-color: #dc2626 !important; }
        .coupon-input-error:focus { box-shadow: 0 0 0 3px rgb(220 38 38 / 12%) !important; }
        .coupon-helper-text { color: #94a3b8; font-size: 11px; font-weight: 400; }
        .coupon-field-error { color: #dc2626; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
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
        .coupon-table tbody tr.is-editing { background: #f0fdf4; border-left: 3px solid #15803d; }
        .coupon-code { display: inline-flex; align-items: center; gap: 7px; color: #0f172a; font-weight: 800; letter-spacing: .03em; }
        .coupon-copy { display: inline-flex; align-items: center; justify-content: center; color: #94a3b8; padding: 4px; border-radius: 5px; background: transparent; border: none; cursor: pointer; transition: all .15s ease; }
        .coupon-copy:hover { color: #0f172a; background: #f1f5f9; }
        .coupon-copy.is-copied { color: #15803d; background: #dcfce7; }
        .coupon-copy-check { color: #15803d; animation: copy-pop .2s ease-out; }
        @keyframes copy-pop { 0% { transform: scale(0.6); } 80% { transform: scale(1.2); } 100% { transform: scale(1); } }
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
        .coupon-modal-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border-radius: 8px; padding: 10px 16px; font: inherit; font-size: 13px; font-weight: 700; min-height: 40px; cursor: pointer; transition: all .2s ease; }
        .coupon-modal-cancel { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
        .coupon-modal-cancel:hover:not(:disabled) { background: #f8fafc; color: #0f172a; }
        .coupon-modal-confirm { background: #dc2626; border: 1px solid transparent; color: #fff; }
        .coupon-modal-confirm:hover:not(:disabled) { background: #b91c1c; }
        .coupon-modal-button:disabled { cursor: not-allowed; opacity: .6; }
        .coupon-skeleton-text { height: 14px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: coupon-skeleton-shimmer 1.5s infinite; border-radius: 4px; width: 80%; }
        .coupon-skeleton-badge { height: 24px; width: 80px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: coupon-skeleton-shimmer 1.5s infinite; border-radius: 999px; }
        .coupon-skeleton-actions { display: flex; gap: 4px; justify-content: flex-end; }
        .coupon-skeleton-actions::before, .coupon-skeleton-actions::after { content: ''; width: 32px; height: 32px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: coupon-skeleton-shimmer 1.5s infinite; border-radius: 7px; }
        @keyframes coupon-skeleton-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .coupon-pagination { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 22px; border-top: 1px solid #e2e8f0; flex-wrap: wrap; }
        .coupon-pagination-info { color: #64748b; font-size: 12px; }
        .coupon-pagination-controls { display: flex; align-items: center; gap: 8px; }
        .coupon-page-size { min-width: 100px; }
        .coupon-pagination-numbers { display: flex; gap: 4px; }
        .coupon-pagination-number { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; border-radius: 7px; border: 1px solid #cbd5e1; background: #fff; color: #334155; font-size: 12px; font-weight: 700; transition: .2s; }
        .coupon-pagination-number:hover:not(.coupon-pagination-number-active) { background: #f8fafc; border-color: #94a3b8; }
        .coupon-pagination-number-active { background: #0f172a; border-color: #0f172a; color: #fff; }
        .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-card { background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.2); max-width: 480px; width: 100%; overflow: hidden; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
        .modal-header h3 { font-size: 18px; font-weight: 700; margin: 0; }
        .modal-close-btn { display: flex; align-items: center; justify-content: center; padding: 8px; border: none; background: transparent; border-radius: 8px; color: #64748b; cursor: pointer; transition: .2s; }
        .modal-close-btn:hover { background: #f1f5f9; color: #0f172a; }
        .modal-close-btn:disabled { opacity: .5; cursor: not-allowed; }
        .animate-scale-up { animation: modal-scale-up 0.2s ease-out; }
        @keyframes modal-scale-up { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @media (max-width: 900px) { .coupons-layout { grid-template-columns: 1fr; } .coupon-form-card { position: static; } }
        @media (max-width: 650px) { .coupons-page { padding-top: 24px; } .coupons-header { align-items: flex-start; flex-direction: column; } .coupon-list-toolbar { align-items: stretch; flex-direction: column; } .coupon-toolbar-tools { flex-direction: column; } .coupon-search, .coupon-filter { min-width: 0; } .coupon-field-row { grid-template-columns: 1fr; } .coupon-pagination { flex-direction: column; align-items: stretch; } .coupon-pagination-controls { flex-direction: column; } .coupon-actions { flex-direction: column-reverse; gap: 10px; } .coupon-button { min-height: 44px; width: 100%; } .coupon-original-values-grid { grid-template-columns: 1fr; } .coupon-modal-actions { flex-direction: column-reverse; gap: 10px; padding: 0 20px 20px; } .coupon-modal-button { min-height: 44px; width: 100%; font-size: 14px; } }
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
          <section className={`coupon-card coupon-form-card ${editingId ? 'is-editing' : ''}`}>
            <div className="coupon-card-title">
              <div>
                <h2>
                  <span>{editingId ? 'Cập nhật mã' : 'Tạo mã mới'}</span>
                  {editingId && (originalCoupon?.code || form.code.trim()) && (
                    <span className="coupon-edit-code-badge" style={{ marginLeft: '8px' }}>
                      {originalCoupon?.code || form.code.trim().toUpperCase()}
                    </span>
                  )}
                </h2>
                <p>{editingId ? 'Chỉnh sửa thông tin và lưu các thay đổi của mã giảm giá' : 'Điền thông tin ưu đãi bên dưới'}</p>
              </div>
              {editingId && <button type="button" className="coupon-icon-button" onClick={resetForm} aria-label="Hủy chỉnh sửa" title="Hủy chỉnh sửa"><X size={17} /></button>}
            </div>

            {editingId && originalCoupon && (
              <div className="coupon-edit-banner" role="region" aria-label="Thông tin mã đang chỉnh sửa">
                <div className="coupon-edit-banner-top">
                  <div className="coupon-edit-banner-title">
                    <Edit3 size={15} />
                    <span>Đang sửa mã: <strong>{originalCoupon.code}</strong></span>
                  </div>
                  <span className="coupon-edit-code-badge">Chế độ sửa</span>
                </div>
                <div className="coupon-original-values-grid">
                  <div className="coupon-original-item">
                    <span className="coupon-original-label">Mức giảm gốc:</span>
                    <span className="coupon-original-val">
                      {originalCoupon.discountType === 'percentage'
                        ? `${originalCoupon.discountValue}%`
                        : formatCurrency(originalCoupon.discountValue)}
                    </span>
                  </div>
                  <div className="coupon-original-item">
                    <span className="coupon-original-label">Đơn tối thiểu:</span>
                    <span className="coupon-original-val">
                      {originalCoupon.minOrderValue ? formatCurrency(originalCoupon.minOrderValue) : 'Không có'}
                    </span>
                  </div>
                  <div className="coupon-original-item">
                    <span className="coupon-original-label">Giới hạn dùng:</span>
                    <span className="coupon-original-val">
                      {originalCoupon.usageLimit ?? 'Không giới hạn'}
                    </span>
                  </div>
                  <div className="coupon-original-item">
                    <span className="coupon-original-label">Hạn dùng:</span>
                    <span className="coupon-original-val">
                      {formatDate(originalCoupon.expiryDate)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <form className="coupon-form" onSubmit={handleSubmit}>
              <label>
                <span className="coupon-label-text">Mã giảm giá <span className="coupon-required">*</span></span>
                <div className="coupon-input-with-icon">
                  <Tag size={16} />
                  <input 
                    name="code" 
                    value={form.code} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    placeholder="Ví dụ: SUMMER2026" 
                    maxLength={30} 
                    required 
                    className={fieldErrors.code ? 'coupon-input-error' : ''}
                  />
                </div>
                <span className="coupon-helper-text">3-30 ký tự, chữ hoa, số, dấu gạch ngang (-) hoặc gạch dưới (_)</span>
                {fieldErrors.code && <span className="coupon-field-error">{fieldErrors.code}</span>}
              </label>
              
              <div className="coupon-field-row">
                <label>
                  <span className="coupon-label-text">Loại giảm <span className="coupon-required">*</span></span>
                  <select 
                    name="discountType" 
                    value={form.discountType} 
                    onChange={handleChange}
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền (VND)</option>
                  </select>
                </label>
                <label>
                  <span className="coupon-label-text">Giá trị giảm <span className="coupon-required">*</span></span>
                  <input 
                    name="discountValue" 
                    type="number" 
                    min="0" 
                    max={form.discountType === 'percentage' ? 100 : undefined} 
                    step={form.discountType === 'percentage' ? '1' : '1000'} 
                    value={form.discountValue} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    placeholder={form.discountType === 'percentage' ? '10' : '50000'} 
                    required 
                    className={fieldErrors.discountValue ? 'coupon-input-error' : ''}
                  />
                  <span className="coupon-helper-text">
                    {form.discountType === 'percentage' ? '1-100%' : 'Số nguyên, ví dụ: 50000'}
                  </span>
                  {fieldErrors.discountValue && <span className="coupon-field-error">{fieldErrors.discountValue}</span>}
                </label>
              </div>
              
              <div className="coupon-field-row">
                <label>
                  <span className="coupon-label-text">Đơn tối thiểu (VND)</span>
                  <input 
                    name="minOrderValue" 
                    type="number" 
                    min="0" 
                    step="1000" 
                    value={form.minOrderValue} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    placeholder="Không giới hạn" 
                    className={fieldErrors.minOrderValue ? 'coupon-input-error' : ''}
                  />
                  <span className="coupon-helper-text">Để trống nếu không giới hạn</span>
                  {fieldErrors.minOrderValue && <span className="coupon-field-error">{fieldErrors.minOrderValue}</span>}
                </label>
                <label>
                  <span className="coupon-label-text">Giới hạn lượt dùng</span>
                  <input 
                    name="usageLimit" 
                    type="number" 
                    min="0" 
                    step="1" 
                    value={form.usageLimit} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    placeholder="Không giới hạn" 
                    className={fieldErrors.usageLimit ? 'coupon-input-error' : ''}
                  />
                  <span className="coupon-helper-text">Để trống nếu không giới hạn</span>
                  {fieldErrors.usageLimit && <span className="coupon-field-error">{fieldErrors.usageLimit}</span>}
                </label>
              </div>
              
              <label>
                <span className="coupon-label-text">Ngày hết hạn</span>
                <div className="coupon-input-with-icon">
                  <CalendarDays size={16} />
                  <input 
                    name="expiryDate" 
                    type="datetime-local" 
                    min={minimumExpiryDate} 
                    value={form.expiryDate} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    className={fieldErrors.expiryDate ? 'coupon-input-error' : ''}
                  />
                </div>
                <span className="coupon-helper-text">Để trống nếu mã không hết hạn</span>
                {fieldErrors.expiryDate && <span className="coupon-field-error">{fieldErrors.expiryDate}</span>}
              </label>
              
              {formError && <div className="coupon-form-error" role="alert"><AlertTriangle size={15} />{formError}</div>}
              
              <div className="coupon-actions">
                {editingId && (
                  <button
                    type="button"
                    className="coupon-button coupon-button-secondary"
                    onClick={resetForm}
                    aria-label="Hủy chỉnh sửa"
                  >
                    Hủy
                  </button>
                )}
                <button type="submit" className="coupon-button coupon-button-primary" disabled={submitting}>
                  {submitting ? <RefreshCw size={15} className="coupon-spin" /> : editingId ? <Edit3 size={15} /> : <Plus size={15} />}
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
                <label className="coupon-filter">
                  <ChevronDown size={15} />
                  <select value={discountTypeFilter} onChange={(event) => setDiscountTypeFilter(event.target.value)} aria-label="Lọc loại giảm giá">
                    <option value="all">Tất cả loại</option>
                    <option value="percentage">Phần trăm</option>
                    <option value="fixed">Số tiền</option>
                  </select>
                </label>
                <label className="coupon-filter">
                  <ChevronDown size={15} />
                  <select value={`${sortBy}-${sortOrder}`} onChange={handleSortSelect} aria-label="Sắp xếp">
                    <option value="expiryDate-asc">Hết hạn: Cũ nhất</option>
                    <option value="expiryDate-desc">Hết hạn: Mới nhất</option>
                    <option value="discountValue-desc">Giảm giá: Cao nhất</option>
                    <option value="discountValue-asc">Giảm giá: Thấp nhất</option>
                    <option value="code-asc">Mã: A-Z</option>
                    <option value="code-desc">Mã: Z-A</option>
                    <option value="createdAt-desc">Tạo: Mới nhất</option>
                    <option value="createdAt-asc">Tạo: Cũ nhất</option>
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="coupon-table-wrap">
                <table className="coupon-table">
                  <thead><tr><th>Mã giảm giá</th><th>Mức giảm</th><th>Đơn tối thiểu</th><th>Hạn sử dụng</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
                  <tbody>
                    {[...Array(limit)].map((_, index) => (
                      <tr key={`skeleton-${index}`}>
                        <td><div className="coupon-skeleton-text" /></td>
                        <td><div className="coupon-skeleton-text" /></td>
                        <td><div className="coupon-skeleton-text" /></td>
                        <td><div className="coupon-skeleton-text" /></td>
                        <td><div className="coupon-skeleton-badge" /></td>
                        <td><div className="coupon-skeleton-actions" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="coupon-table-wrap">
                {coupons.length === 0 ? (
                  <div className="coupon-empty"><Tag size={25} /> {total === 0 ? 'Chưa có mã giảm giá nào.' : 'Không tìm thấy mã phù hợp.'}</div>
                ) : (
                  <table className="coupon-table">
                    <thead><tr><th>Mã giảm giá</th><th>Mức giảm</th><th>Đơn tối thiểu</th><th>Hạn sử dụng</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
                    <tbody>
                      {coupons.map((coupon) => {
                        const expired = isExpired(coupon);
                        const isEditing = getCouponId(coupon) === editingId;
                        return (
                          <tr key={getCouponId(coupon) || coupon.code} className={isEditing ? 'is-editing' : ''}>
                            <td>
                              <span className="coupon-code">
                                {coupon.code}
                                {isEditing && <span style={{ color: '#15803d', fontSize: '11px', marginLeft: '8px', fontWeight: '600' }}>(Đang chỉnh sửa)</span>}
                                <button
                                  type="button"
                                  className={`coupon-copy ${copiedCode === coupon.code ? 'is-copied' : ''}`}
                                  onClick={() => copyCode(coupon.code)}
                                  aria-label={copiedCode === coupon.code ? 'Đã sao chép mã' : `Sao chép mã ${coupon.code}`}
                                  title={copiedCode === coupon.code ? 'Đã sao chép!' : 'Sao chép mã'}
                                >
                                  {copiedCode === coupon.code ? (
                                    <Check size={13} className="coupon-copy-check" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>
                              </span>
                              <span className="coupon-subtext">
                                {coupon.usageLimit ? `Tối đa ${coupon.usageLimit} lượt dùng` : 'Không giới hạn lượt dùng'}
                              </span>
                            </td>
                            <td><span className="coupon-discount">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}</span><span className="coupon-subtext">{coupon.discountType === 'percentage' ? 'Theo phần trăm' : 'Theo số tiền'}</span></td>
                            <td>{coupon.minOrderValue ? formatCurrency(coupon.minOrderValue) : 'Không yêu cầu'}</td>
                            <td><span className="coupon-subtext" style={{ marginTop: 0 }}>{coupon.expiryDate ? formatDate(coupon.expiryDate) : 'Không giới hạn'}</span></td>
                            <td><span className={`coupon-status ${expired ? 'coupon-status-expired' : 'coupon-status-active'}`}>{expired ? <Clock3 size={12} /> : <Check size={12} />}{expired ? 'Đã hết hạn' : 'Đang hoạt động'}</span></td>
                            <td><div className="coupon-row-actions"><button type="button" className="coupon-icon-button" onClick={() => handleEdit(coupon)} aria-label={`Sửa ${coupon.code}`}><Edit3 size={15} /></button><button type="button" className="coupon-icon-button coupon-icon-button-danger" onClick={() => handleDelete(coupon)} aria-label={`Xóa ${coupon.code}`} title={coupon.code === 'WELCOME10' ? 'Mã hệ thống không thể xóa' : 'Xóa mã'} disabled={coupon.code === 'WELCOME10' || deletingId === getCouponId(coupon)} style={coupon.code === 'WELCOME10' ? { opacity: 0.35, cursor: 'not-allowed' } : {}}>{deletingId === getCouponId(coupon) ? <RefreshCw size={15} className="coupon-spin" /> : <Trash2 size={15} />}</button></div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="coupon-pagination">
                <div className="coupon-pagination-info">
                  Hiển thị {coupons.length} trong {total} mã giảm giá - Trang {page} / {totalPages}
                </div>
                <div className="coupon-pagination-controls">
                  <label className="coupon-filter coupon-page-size">
                    <ChevronDown size={15} />
                    <select value={limit} onChange={(event) => handleLimitChange(event.target.value)} aria-label="Số dòng mỗi trang">
                      <option value={5}>5 / trang</option>
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                      <option value={50}>50 / trang</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className="coupon-button coupon-button-secondary"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    aria-label="Trang trước"
                  >
                    Trước
                  </button>
                  <div className="coupon-pagination-numbers">
                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = index + 1;
                      } else if (page <= 3) {
                        pageNum = index + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + index;
                      } else {
                        pageNum = page - 2 + index;
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          className={`coupon-pagination-number ${page === pageNum ? 'coupon-pagination-number-active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                          aria-label={`Trang ${pageNum}`}
                          aria-current={page === pageNum ? 'page' : undefined}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="coupon-button coupon-button-secondary"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    aria-label="Trang sau"
                  >
                    Sau
                  </button>
                </div>
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
                {deletingId ? 'Đang xóa...' : 'Xóa mã'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateConfirmDialog && editingId && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) handleCancelUpdate();
          }}
        >
          <div className="modal-card animate-scale-up" role="alertdialog" aria-modal="true" aria-labelledby="update-coupon-title">
            <div className="modal-header">
              <h3 id="update-coupon-title">Xác nhận cập nhật mã giảm giá?</h3>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Đóng xác nhận"
                onClick={handleCancelUpdate}
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>
            <div className="coupon-modal-copy">
              <Edit3 size={22} aria-hidden="true" style={{ color: '#0ea5e9' }} />
              <div>
                <p>
                  Bạn sắp cập nhật mã giảm giá <strong>{form.code.trim().toUpperCase()}</strong>
                  {originalCoupon?.code && originalCoupon.code !== form.code.trim().toUpperCase() && (
                    <span style={{ fontSize: '12px', color: '#64748b' }}> (mã gốc: {originalCoupon.code})</span>
                  )}.
                </p>
                <div style={{ marginTop: '10px', fontSize: '13px', background: '#f8fafc', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Thông tin cập nhật:</div>
                  <div>
                    {form.discountType === 'percentage' 
                      ? `• Giảm: ${form.discountValue}% trên đơn hàng${form.minOrderValue ? ` từ ${formatCurrency(form.minOrderValue)}` : ''}`
                      : `• Giảm: ${formatCurrency(form.discountValue)} trên đơn hàng${form.minOrderValue ? ` từ ${formatCurrency(form.minOrderValue)}` : ''}`
                    }
                  </div>
                  <div>• Lượt dùng: {form.usageLimit ? `${form.usageLimit} lượt` : 'Không giới hạn'}</div>
                  <div>• Hết hạn: {form.expiryDate ? formatDate(form.expiryDate) : 'Không giới hạn'}</div>
                </div>
              </div>
            </div>
            <div className="coupon-modal-actions">
              <button
                type="button"
                className="coupon-modal-button coupon-modal-cancel"
                onClick={handleCancelUpdate}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="coupon-modal-button"
                style={{ background: '#0ea5e9', color: '#fff' }}
                onClick={handleConfirmUpdate}
                disabled={submitting}
              >
                {submitting ? <RefreshCw size={15} className="coupon-spin" /> : <Edit3 size={15} />}
                Xác nhận cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog && !editingId && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) handleCancelSubmit();
          }}
        >
          <div className="modal-card animate-scale-up" role="alertdialog" aria-modal="true" aria-labelledby="confirm-coupon-title">
            <div className="modal-header">
              <h3 id="confirm-coupon-title">Xác nhận tạo mã giảm giá?</h3>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Đóng xác nhận"
                onClick={handleCancelSubmit}
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>
            <div className="coupon-modal-copy">
              <Check size={22} aria-hidden="true" style={{ color: '#15803d' }} />
              <div>
                <p>
                  Bạn sắp tạo mã giảm giá <strong>{form.code.trim().toUpperCase()}</strong>.
                </p>
                <p style={{ marginTop: '8px', fontSize: '13px' }}>
                  {form.discountType === 'percentage' 
                    ? `Giảm ${form.discountValue}% trên đơn hàng${form.minOrderValue ? ` từ ${formatCurrency(form.minOrderValue)}` : ''}`
                    : `Giảm ${formatCurrency(form.discountValue)} trên đơn hàng${form.minOrderValue ? ` từ ${formatCurrency(form.minOrderValue)}` : ''}`
                  }
                  {form.usageLimit && ` • Tối đa ${form.usageLimit} lượt dùng`}
                  {form.expiryDate && ` • Hết hạn: ${formatDate(form.expiryDate)}`}
                </p>
              </div>
            </div>
            <div className="coupon-modal-actions">
              <button
                type="button"
                className="coupon-modal-button coupon-modal-cancel"
                onClick={handleCancelSubmit}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="coupon-modal-button"
                style={{ background: '#15803d', color: '#fff' }}
                onClick={handleConfirmSubmit}
                disabled={submitting}
              >
                {submitting ? <RefreshCw size={15} className="coupon-spin" /> : <Check size={15} />}
                Xác nhận tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CouponsPage);