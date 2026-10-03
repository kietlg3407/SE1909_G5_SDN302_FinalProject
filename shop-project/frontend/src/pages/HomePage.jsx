import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sparkles, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Tag
} from 'lucide-react';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      {/* Hero Banner Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Định Hình Phong Cách <br />
            <span className="gradient-text">Thời Thượng & Tinh Tế</span>
          </h1>
          <p className="hero-desc">
            Khám phá những thiết kế tối giản, hiện đại được may từ chất liệu cao cấp.
            Tôn vinh vẻ đẹp tự tin và phong cách sống riêng của bạn mỗi ngày.
          </p>
          <div className="hero-actions">
            <a href="#products" className="btn-primary btn-lg">
              <span>Khám phá bộ sưu tập</span>
              <ArrowRight size={20} />
            </a>
            {!isAuthenticated && (
              <Link to="/login" className="btn-secondary btn-lg">
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Cam kết dịch vụ khách hàng */}
      <section className="service-commitments">
        <div className="commitment-item">
          <div className="commitment-icon">
            <Truck size={24} />
          </div>
          <div>
            <h4>Miễn Phí Giao Hàng</h4>
            <p>Áp dụng cho mọi đơn hàng từ 499.000đ</p>
          </div>
        </div>

        <div className="commitment-item">
          <div className="commitment-icon">
            <RotateCcw size={24} />
          </div>
          <div>
            <h4>Đổi Trả Trong 30 Ngày</h4>
            <p>Thủ tục đơn giản, nhanh chóng tại nhà</p>
          </div>
        </div>

        <div className="commitment-item">
          <div className="commitment-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4>Chất Lượng Cam Kết</h4>
            <p>100% sợi dệt tự nhiên, bền đẹp</p>
          </div>
        </div>

        <div className="commitment-item">
          <div className="commitment-icon">
            <CreditCard size={24} />
          </div>
          <div>
            <h4>Thanh Toán Linh Hoạt</h4>
            <p>COD, thẻ ngân hàng, ví điện tử</p>
          </div>
        </div>
      </section>

      {/* Danh mục sản phẩm nổi bật */}
      <section className="collection-preview-section">
        <div className="section-title-center">
          <span className="badge-tag">DANH MỤC NỔI BẬT</span>
          <h2>Lựa Chọn Phong Cách Phù Hợp</h2>
          <p>Các dòng sản phẩm được yêu thích và săn đón nhiều nhất trong tuần</p>
        </div>

        <div className="category-grid">
          <div className="category-card cat-men">
            <div className="category-overlay">
              <span className="category-tag">Xu Hướng</span>
              <h3>Áo Thun & Polo</h3>
              <p>Form dáng regular & oversize thoáng mát</p>
              <button className="btn-category-action">
                <span>Xem chi tiết</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="category-card cat-women">
            <div className="category-overlay">
              <span className="category-tag">Bán Chạy</span>
              <h3>Sơ Mi & Công Sở</h3>
              <p>Chất vải chống nhăn cao cấp, lịch lãm</p>
              <button className="btn-category-action">
                <span>Xem chi tiết</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="category-card cat-accessories">
            <div className="category-overlay">
              <span className="category-tag">Mới Về</span>
              <h3>Quần & Phụ Kiện</h3>
              <p>Jean, Kaki, túi xách & thắt lưng da</p>
              <button className="btn-category-action">
                <span>Xem chi tiết</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Banner khuyến mãi */}
      <section className="promo-banner">
        <div className="promo-content">
          <span className="promo-tag">Ưu đãi độc quyền</span>
          <h2>Đăng ký thành viên nhận ngay Voucher 10%</h2>
          <p>Cùng hàng loạt quyền lợi tích điểm đổi quà và quà tặng sinh nhật dành riêng cho thành viên.</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn-primary btn-lg mt-4">
              <span>Đăng Ký Thành Viên Ngay</span>
              <ArrowRight size={20} />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
