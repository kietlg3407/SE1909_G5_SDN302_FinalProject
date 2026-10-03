import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-main">
        {/* Cột 1: Thương hiệu */}
        <div className="footer-col brand-col">
          <div className="brand-logo-footer">
            <span className="brand-name">
              CLOSET<span className="brand-accent">STUDIO</span>
            </span>
          </div>
          <p className="footer-intro">
            Thương hiệu thời trang tối giản hướng đến trải nghiệm thanh lịch, hiện đại và chất liệu bền vững. Tự tin khẳng định phong cách riêng của bạn.
          </p>
        </div>

        {/* Cột 2: Danh mục */}
        <div className="footer-col">
          <h4 className="footer-heading">Bộ Sưu Tập</h4>
          <ul className="footer-links">
            <li><a href="#new">Hàng mới về</a></li>
            <li><a href="#bestseller">Sản phẩm bán chạy</a></li>
            <li><a href="#men">Thời trang nam</a></li>
            <li><a href="#women">Thời trang nữ</a></li>
            <li><a href="#sale">Khuyến mãi & Giảm giá</a></li>
          </ul>
        </div>

        {/* Cột 3: Hỗ trợ khách hàng */}
        <div className="footer-col">
          <h4 className="footer-heading">Chăm Sóc Khách Hàng</h4>
          <ul className="footer-links">
            <li><a href="#faq">Câu hỏi thường gặp</a></li>
            <li><a href="#size-guide">Hướng dẫn chọn size</a></li>
            <li><a href="#returns">Chính sách đổi trả 30 ngày</a></li>
            <li><a href="#shipping">Chính sách vận chuyển</a></li>
            <li><a href="#privacy">Chính sách bảo mật thông tin</a></li>
          </ul>
        </div>

        {/* Cột 4: Liên hệ */}
        <div className="footer-col contact-col">
          <h4 className="footer-heading">Liên Hệ & Hỗ Trợ</h4>
          <div className="footer-contact-item">
            <Phone size={16} />
            <span>Hotline: 1900 6868 (8:00 - 22:00)</span>
          </div>
          <div className="footer-contact-item">
            <Mail size={16} />
            <span>Email: cskh@closetstudio.vn</span>
          </div>
          <div className="footer-contact-item">
            <MapPin size={16} />
            <span>Hệ thống 15 cửa hàng trên toàn quốc</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>© {new Date().getFullYear()} CLOSET STUDIO. Bản quyền thuộc về CLOSET STUDIO.</p>
          <div className="footer-badges">
            <span>Đã thông báo Bộ Công Thương</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
