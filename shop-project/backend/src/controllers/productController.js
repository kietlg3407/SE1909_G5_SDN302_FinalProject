const mongoose = require('mongoose');
const Product = require('../models/productModel');

/**
 * @desc Lấy danh sách sản phẩm (hỗ trợ phân trang, tìm kiếm, lọc & sắp xếp)
 * @route GET /api/products
 * @access Public
 */
const getProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const query = {};

    // Mặc định chỉ hiển thị sản phẩm đang hoạt động, trừ khi admin/staff yêu cầu xem tất cả
    const isStaffOrAdminReq = req.user && ['admin', 'staff'].includes(req.user.role);
    if (isStaffOrAdminReq) {
      if (req.query.isActive !== undefined && req.query.isActive !== 'all') {
        query.isActive = req.query.isActive === 'true';
      }
    } else {
      query.isActive = true;
    }

    // 1. Tìm kiếm theo từ khóa (Search)
    const rawSearch = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;
    if (typeof rawSearch === 'string' && rawSearch.trim()) {
      const sanitizedSearch = rawSearch
        .replace(/\0/g, '')
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (sanitizedSearch) {
        query.$or = [
          { name: { $regex: sanitizedSearch, $options: 'i' } },
          { description: { $regex: sanitizedSearch, $options: 'i' } },
          { brand: { $regex: sanitizedSearch, $options: 'i' } },
        ];
      }
    }

    // 2. Lọc theo danh mục (Category Filter)
    const rawCategory = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;
    if (typeof rawCategory === 'string' && rawCategory.trim() && rawCategory.trim() !== 'all') {
      query.category = rawCategory.trim();
    }

    // Lọc theo thương hiệu (Brand Filter)
    const rawBrand = Array.isArray(req.query.brand) ? req.query.brand[0] : req.query.brand;
    if (typeof rawBrand === 'string' && rawBrand.trim() && rawBrand.trim() !== 'all') {
      query.brand = rawBrand.trim();
    }

    // 3. Lọc theo khoảng giá (Price Filter)
    const hasMin = req.query.minPrice !== undefined && req.query.minPrice !== '';
    const hasMax = req.query.maxPrice !== undefined && req.query.maxPrice !== '';
    const minVal = hasMin ? Number(req.query.minPrice) : null;
    const maxVal = hasMax ? Number(req.query.maxPrice) : null;

    if ((minVal !== null && !isNaN(minVal)) || (maxVal !== null && !isNaN(maxVal))) {
      query.price = {};
      if (minVal !== null && !isNaN(minVal)) {
        query.price.$gte = minVal;
      }
      if (maxVal !== null && !isNaN(maxVal)) {
        query.price.$lte = maxVal;
      }
    }

    // 4. Lọc trạng thái còn hàng (In Stock Filter)
    if (req.query.inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // 5. Sắp xếp (Sort)
    let sort = { createdAt: -1 }; // Mặc định mới nhất
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'price_asc':
          sort = { price: 1 };
          break;
        case 'price_desc':
          sort = { price: -1 };
          break;
        case 'rating_desc':
          sort = { rating: -1 };
          break;
        case 'name_asc':
          sort = { name: 1 };
          break;
        case 'name_desc':
          sort = { name: -1 };
          break;
        case 'oldest':
          sort = { createdAt: 1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }

    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: products.length,
      products,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      limit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách sản phẩm', error: error.message });
  }
};

/**
 * @desc Lấy chi tiết một sản phẩm theo ID
 * @route GET /api/products/:id
 * @access Public
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết sản phẩm', error: error.message });
  }
};

const isInvalidNumber = (v) => v === undefined || v === null || v === '' || isNaN(Number(v)) || Number(v) < 0;

/**
 * @desc Tạo mới sản phẩm
 * @route POST /api/products
 * @access Private (Admin & Staff)
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, brand, stock, images, isActive } = req.body;

    if (!name || !description || isInvalidNumber(price) || !category || isInvalidNumber(stock)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ và hợp lệ: Tên, Mô tả, Giá, Danh mục và Số lượng kho',
      });
    }

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category: category.trim(),
      brand: brand ? brand.trim() : 'CLOSET',
      stock: Number(stock),
      images: Array.isArray(images) ? images : images ? [images] : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    const savedProduct = await product.save();
    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', product: savedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', error: error.message });
  }
};

/**
 * @desc Cập nhật thông tin sản phẩm
 * @route PUT /api/products/:id
 * @access Private (Admin & Staff)
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    if (req.body.price !== undefined && isInvalidNumber(req.body.price)) {
      return res.status(400).json({ success: false, message: 'Giá sản phẩm không hợp lệ' });
    }
    if (req.body.stock !== undefined && isInvalidNumber(req.body.stock)) {
      return res.status(400).json({ success: false, message: 'Số lượng tồn kho không hợp lệ' });
    }

    const fields = ['name', 'description', 'price', 'originalPrice', 'category', 'brand', 'stock', 'images', 'isActive'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'price' || field === 'stock' || field === 'originalPrice') {
          product[field] = req.body[field] !== null ? Number(req.body[field]) : null;
        } else if (typeof req.body[field] === 'string') {
          product[field] = req.body[field].trim();
        } else {
          product[field] = req.body[field];
        }
      }
    });

    const updatedProduct = await product.save();
    res.json({ success: true, message: 'Cập nhật sản phẩm thành công', product: updatedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Cập nhật sản phẩm thất bại', error: error.message });
  }
};

/**
 * @desc Xóa sản phẩm
 * @route DELETE /api/products/:id
 * @access Private (Admin & Staff)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ success: true, message: 'Xóa sản phẩm thành công', productId: id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa sản phẩm', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
