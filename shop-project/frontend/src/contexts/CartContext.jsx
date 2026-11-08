import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // 1. Fetch Cart
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [] });
      setCartTotal(0);
      setCartCount(0);
      return;
    }
    try {
      setLoadingCart(true);
      const res = await api.get('/api/cart');
      if (res.data?.success) {
        setCart(res.data.cart || { items: [] });
        setCartTotal(res.data.totalAmount || 0);
        setCartCount(res.data.totalItems || 0);
      }
    } catch (err) {
      // Quiet fail on network or unauthorized
    } finally {
      setLoadingCart(false);
    }
  }, [isAuthenticated]);

  // 2. Fetch Wishlist
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      setWishlistCount(0);
      return;
    }
    try {
      setLoadingWishlist(true);
      const res = await api.get('/api/wishlist');
      if (res.data?.success) {
        setWishlist(res.data.wishlist?.products || []);
        setWishlistCount(res.data.count || 0);
      }
    } catch (err) {
      // Quiet fail
    } finally {
      setLoadingWishlist(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
  }, [fetchCart, fetchWishlist]);

  // 3. Add to Cart
  const addToCart = async (productId, quantity = 1, variantId = null) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return false;
    }
    try {
      const res = await api.post('/api/cart', { productId, quantity, variantId });
      if (res.data?.success) {
        setCart(res.data.cart);
        setCartCount(res.data.totalItems);
        toast.success(res.data.message || 'Đã thêm vào giỏ hàng');
        fetchCart();
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
      return false;
    }
  };

  // 4. Update Cart Item Quantity
  const updateQuantity = async (productId, quantity, variantId = null) => {
    try {
      const res = await api.put(`/api/cart/${productId}`, { quantity, variantId });
      if (res.data?.success) {
        setCart(res.data.cart);
        setCartCount(res.data.totalItems);
        fetchCart();
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật số lượng');
      return false;
    }
  };

  // 5. Remove from Cart
  const removeFromCart = async (productId, variantId = null) => {
    try {
      const res = await api.delete(`/api/cart/${productId}`, {
        params: variantId ? { variantId } : {},
      });
      if (res.data?.success) {
        setCart(res.data.cart);
        setCartCount(res.data.totalItems);
        toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
        fetchCart();
        return true;
      }
    } catch (err) {
      toast.error('Lỗi khi xóa sản phẩm');
      return false;
    }
  };

  // 6. Clear Cart
  const clearCart = async () => {
    try {
      const res = await api.delete('/api/cart');
      if (res.data?.success) {
        setCart({ items: [] });
        setCartCount(0);
        setCartTotal(0);
        return true;
      }
    } catch (err) {
      toast.error('Lỗi khi làm trống giỏ hàng');
      return false;
    }
  };

  // 7. Add to Wishlist
  const addToWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu sản phẩm yêu thích');
      return false;
    }
    try {
      const res = await api.post('/api/wishlist', { productId });
      if (res.data?.success) {
        setWishlist(res.data.wishlist?.products || []);
        setWishlistCount(res.data.count || 0);
        toast.success(res.data.message || 'Đã thêm vào danh sách yêu thích');
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi thêm vào yêu thích');
      return false;
    }
  };

  // 8. Remove from Wishlist
  const removeFromWishlist = async (productId) => {
    try {
      const res = await api.delete(`/api/wishlist/${productId}`);
      if (res.data?.success) {
        setWishlist(res.data.wishlist?.products || []);
        setWishlistCount(res.data.count || 0);
        toast.success('Đã xóa khỏi danh sách yêu thích');
        return true;
      }
    } catch (err) {
      toast.error('Lỗi khi xóa khỏi yêu thích');
      return false;
    }
  };

  // 9. Check if in Wishlist
  const isInWishlist = (productId) => {
    if (!productId || !wishlist || wishlist.length === 0) return false;
    return wishlist.some((item) => {
      const id = typeof item === 'object' ? item._id : item;
      return id?.toString() === productId?.toString();
    });
  };

  // 10. Move to Cart
  const moveToCart = async (productId, quantity = 1, variantId = null) => {
    try {
      const res = await api.post('/api/wishlist/move-to-cart', { productId, quantity, variantId });
      if (res.data?.success) {
        toast.success('Đã chuyển sản phẩm vào giỏ hàng');
        fetchCart();
        fetchWishlist();
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi chuyển sản phẩm');
      return false;
    }
  };

  const value = {
    cart,
    cartTotal,
    cartCount,
    wishlist,
    wishlistCount,
    loadingCart,
    loadingWishlist,
    fetchCart,
    fetchWishlist,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    moveToCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cart: { items: [] },
      cartTotal: 0,
      cartCount: 0,
      wishlist: [],
      wishlistCount: 0,
      loadingCart: false,
      loadingWishlist: false,
      fetchCart: () => {},
      fetchWishlist: () => {},
      addToCart: async () => false,
      updateQuantity: async () => false,
      removeFromCart: async () => false,
      clearCart: async () => false,
      addToWishlist: async () => false,
      removeFromWishlist: async () => false,
      isInWishlist: () => false,
      moveToCart: async () => false,
    };
  }
  return context;
};

