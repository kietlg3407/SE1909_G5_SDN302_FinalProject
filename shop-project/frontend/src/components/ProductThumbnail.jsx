import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import api from '../services/api';

/**
 * Chuẩn hóa URL ảnh sản phẩm:
 * - Giữ nguyên Data URL (Base64) và URL hợp lệ.
 * - Tự động ghép baseURL nếu là đường dẫn /uploads/... từ máy chủ.
 * - Trích xuất link ảnh thật nếu người dùng lỡ dán link tìm kiếm Google Images.
 */
export const resolveImageUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    const baseUrl = api?.defaults?.baseURL || 'http://localhost:5000';
    return `${baseUrl}${trimmed}`;
  }

  if (trimmed.includes('google.com/imgres') && trimmed.includes('imgurl=')) {
    try {
      const parsed = new URL(trimmed);
      const actualUrl = parsed.searchParams.get('imgurl');
      if (actualUrl) return actualUrl;
    } catch {
      // Bỏ qua nếu URL không hợp lệ
    }
  }

  return trimmed;
};

/**
 * Hiển thị ảnh sản phẩm kèm icon Package dự phòng khi ảnh trống hoặc lỗi tải.
 */
const ProductThumbnail = ({ src, alt, iconSize = 44, style }) => {
  const resolvedSrc = resolveImageUrl(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || hasError) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          background: '#f8fafc',
        }}
      >
        <Package size={iconSize} />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...style,
      }}
      onError={() => setHasError(true)}
    />
  );
};

export default ProductThumbnail;

