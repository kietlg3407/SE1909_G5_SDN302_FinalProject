import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MapPin, Plus, Trash2, Edit3, CheckCircle2, Phone, Home, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AddressManager = () => {
  const { refreshUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    phone: '',
    isDefault: false,
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users/addresses');
      setAddresses(res.data);
    } catch (error) {
      toast.error('Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setFormData({
      street: '',
      city: '',
      state: '',
      phone: '',
      isDefault: false,
    });
    setEditingAddressId(null);
    setIsModalOpen(false);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddressId(addr._id);
    setFormData({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      phone: addr.phone,
      isDefault: addr.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.street || !formData.city || !formData.state || !formData.phone) {
      return toast.error('Vui lòng điền đầy đủ các thông tin địa chỉ!');
    }

    try {
      if (editingAddressId) {
        // Cập nhật
        const res = await api.put(`/api/users/addresses/${editingAddressId}`, formData);
        setAddresses(res.data);
        toast.success('Cập nhật địa chỉ thành công!');
      } else {
        // Thêm mới
        const res = await api.post('/api/users/addresses', formData);
        setAddresses(res.data);
        toast.success('Thêm địa chỉ giao hàng thành công!');
      }
      refreshUser();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu địa chỉ');
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này không?')) return;

    try {
      const res = await api.delete(`/api/users/addresses/${addressId}`);
      setAddresses(res.data);
      refreshUser();
      toast.success('Đã xóa địa chỉ');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa địa chỉ');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const res = await api.put(`/api/users/addresses/${addressId}/default`);
      setAddresses(res.data);
      refreshUser();
      toast.success('Đã đặt làm địa chỉ mặc định');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật mặc định');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải sổ địa chỉ...</div>;
  }

  return (
    <div className="address-manager">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Sổ Địa Chỉ Giao Hàng</h2>
          <p className="section-subtitle">Quản lý danh sách địa chỉ nhận hàng của bạn</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn-primary add-addr-btn">
          <Plus size={18} />
          <span>Thêm địa chỉ mới</span>
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="empty-state-box">
          <MapPin size={48} className="empty-icon" />
          <h3>Chưa có địa chỉ nào</h3>
          <p>Thêm địa chỉ để việc mua sắm và thanh toán trở nên nhanh chóng hơn.</p>
          <button onClick={handleOpenAddModal} className="btn-primary mt-4">
            <Plus size={18} />
            <span>Thêm địa chỉ đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="address-grid">
          {addresses.map((addr) => (
            <div key={addr._id} className={`address-card ${addr.isDefault ? 'is-default' : ''}`}>
              {addr.isDefault && (
                <div className="default-badge">
                  <CheckCircle2 size={14} />
                  <span>Mặc định</span>
                </div>
              )}
              <div className="address-card-body">
                <div className="address-detail-row">
                  <Home size={18} className="addr-icon" />
                  <span className="addr-text">
                    <strong>{addr.street}</strong>
                  </span>
                </div>
                <div className="address-detail-row">
                  <MapPin size={18} className="addr-icon" />
                  <span className="addr-text">
                    {addr.city}, {addr.state}
                  </span>
                </div>
                <div className="address-detail-row">
                  <Phone size={18} className="addr-icon" />
                  <span className="addr-text">{addr.phone}</span>
                </div>
              </div>

              <div className="address-card-actions">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr._id)}
                    className="btn-text-action set-default-link"
                  >
                    Thiết lập mặc định
                  </button>
                )}
                <div className="action-buttons-group">
                  <button
                    onClick={() => handleOpenEditModal(addr)}
                    className="icon-action-btn edit-btn"
                    title="Chỉnh sửa"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    className="icon-action-btn delete-btn"
                    title="Xóa địa chỉ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm / Sửa địa chỉ */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card animate-scale-up">
            <div className="modal-header">
              <h3>{editingAddressId ? 'Cập Nhật Địa Chỉ' : 'Thêm Địa Chỉ Giao Hàng'}</h3>
              <button onClick={resetForm} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Số nhà, tên đường *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 123 Nguyễn Văn Cừ"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Phường / Xã *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Phường An Khánh"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quận / Huyện / Tỉnh *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Ninh Kiều, Cần Thơ"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0912345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  <span>Đặt làm địa chỉ giao hàng mặc định</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary">
                  {editingAddressId ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressManager;
