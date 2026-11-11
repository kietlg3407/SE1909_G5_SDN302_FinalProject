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

    // Mặc định chỉ hiển thị sản phẩm đang hoạt động, trừ khi admin/staff yêu cầu xem tất cả hoặc lọc theo trạng thái
    const isStaffOrAdminReq = req.user && ['admin', 'staff'].includes(req.user.role);
    if (isStaffOrAdminReq) {
      const statusParam = req.query.status;
      const isActiveParam = req.query.isActive;

      if (statusParam !== undefined && statusParam !== 'all') {
        if (statusParam === 'active' || statusParam === 'true' || statusParam === true) {
          query.isActive = true;
        } else if (statusParam === 'inactive' || statusParam === 'false' || statusParam === false) {
          query.isActive = false;
        }
      } else if (isActiveParam !== undefined && isActiveParam !== 'all') {
        query.isActive = isActiveParam === 'true' || isActiveParam === true;
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

    // 2. Lọc theo danh mục (Category Filter - bỏ qua nếu 'Tất cả' hoặc 'all')
    const rawCategory = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;
    if (typeof rawCategory === 'string' && rawCategory.trim()) {
      const cat = rawCategory.trim();
      if (cat !== 'all' && cat.toLowerCase() !== 'tất cả') {
        query.category = cat;
      }
    }

    // Lọc theo thương hiệu (Brand Filter)
    const rawBrand = Array.isArray(req.query.brand) ? req.query.brand[0] : req.query.brand;
    if (typeof rawBrand === 'string' && rawBrand.trim() && rawBrand.trim() !== 'all') {
      query.brand = rawBrand.trim();
    }

    // 3. Lọc theo khoảng giá (Price Filter - validate số không âm)
    const rawMinPrice = Array.isArray(req.query.minPrice) ? req.query.minPrice[0] : req.query.minPrice;
    const rawMaxPrice = Array.isArray(req.query.maxPrice) ? req.query.maxPrice[0] : req.query.maxPrice;
    const hasMin = rawMinPrice !== undefined && rawMinPrice !== '';
    const hasMax = rawMaxPrice !== undefined && rawMaxPrice !== '';
    const minVal = hasMin ? Number(rawMinPrice) : null;
    const maxVal = hasMax ? Number(rawMaxPrice) : null;

    const isValidMin = minVal !== null && !isNaN(minVal) && minVal >= 0;
    const isValidMax = maxVal !== null && !isNaN(maxVal) && maxVal >= 0;

    if (isValidMin || isValidMax) {
      query.price = {};
      if (isValidMin) {
        query.price.$gte = minVal;
      }
      if (isValidMax) {
        query.price.$lte = maxVal;
      }
    }

    // 4. Lọc trạng thái còn hàng (In Stock Filter)
    const rawInStock = Array.isArray(req.query.inStock) ? req.query.inStock[0] : req.query.inStock;
    if (rawInStock === 'true' || rawInStock === true) {
      query.stock = { $gt: 0 };
    }

    // 5. Sắp xếp (Sort)
    let sort = { createdAt: -1 }; // Mặc định mới nhất
    const sortParam = req.query.sortBy || req.query.sort;
    const rawSort = Array.isArray(sortParam) ? sortParam[0] : sortParam;
    if (rawSort) {
      switch (rawSort) {
        case 'price-asc':
        case 'price_asc':
          sort = { price: 1 };
          break;
        case 'price-desc':
        case 'price_desc':
          sort = { price: -1 };
          break;
        case 'rating':
        case 'rating_desc':
        case 'rating-desc':
          sort = { rating: -1 };
          break;
        case 'name-asc':
        case 'name_asc':
          sort = { name: 1 };
          break;
        case 'name-desc':
        case 'name_desc':
          sort = { name: -1 };
          break;
        case 'oldest':
          sort = { createdAt: 1 };
          break;
        case 'newest':
        default:
          sort = { createdAt: -1 };
      }
    }

    const isNameSort = ['name-asc', 'name_asc', 'name-desc', 'name_desc'].includes(rawSort);
    let productQuery = Product.find(query).sort(sort);
    if (isNameSort) {
      productQuery = productQuery.collation({ locale: 'vi' });
    }

    const [products, total] = await Promise.all([
      productQuery.skip(skip).limit(limit).lean(),
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

const isInvalidNumber = (v) =>
  v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) || Number(v) < 0;
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateVariant = (variant, existingVariants = [], currentId = null) => {
  const sku = typeof variant.sku === 'string' ? variant.sku.trim() : '';
  const size = typeof variant.size === 'string' ? variant.size.trim() : '';
  const color = typeof variant.color === 'string' ? variant.color.trim() : '';
  const stock = Number(variant.stock);
  const hasPrice = variant.price !== undefined && variant.price !== null && variant.price !== '';

  if ((!size && !color) || !Number.isInteger(stock) || stock < 0) {
    return 'Biến thể cần có kích thước hoặc màu sắc và tồn kho là số nguyên không âm';
  }
  if (hasPrice && isInvalidNumber(variant.price)) return 'Giá biến thể không hợp lệ';
  if (variant.isActive !== undefined && typeof variant.isActive !== 'boolean') return 'Trạng thái biến thể không hợp lệ';
  if (sku && existingVariants.some((item) => item.sku === sku && String(item._id) !== String(currentId))) {
    return 'Mã SKU đã được sử dụng trong sản phẩm này';
  }
  return null;
};

const getProductForVariant = async (id, res) => {
  if (!isValidObjectId(id)) {
    res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    return null;
  }
  const product = await Product.findById(id);
  if (!product) res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
  return product;
};

const createProductVariant = async (req, res) => {
  try {
    const product = await getProductForVariant(req.params.id, res);
    if (!product) return;

    const error = validateVariant(req.body, product.variants);
    if (error) return res.status(400).json({ success: false, message: error });

    product.variants.push({
      sku: req.body.sku || '',
      size: req.body.size || '',
      color: req.body.color || '',
      price: req.body.price === '' || req.body.price === undefined ? null : Number(req.body.price),
      stock: Number(req.body.stock),
      isActive: req.body.isActive === undefined ? true : req.body.isActive,
    });
    await product.save();
    res.status(201).json({
      success: true,
      message: 'Tạo biến thể thành công',
      variant: product.variants[product.variants.length - 1],
      product,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Không thể tạo biến thể', error: error.message });
  }
};

const updateProductVariant = async (req, res) => {
  try {
    const product = await getProductForVariant(req.params.id, res);
    if (!product) return;
    if (!isValidObjectId(req.params.variantId)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể' });
    }

    const variant = product.variants.id(req.params.variantId);
    if (!variant) return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể' });

    const updated = {
      sku: req.body.sku !== undefined ? req.body.sku : variant.sku,
      size: req.body.size !== undefined ? req.body.size : variant.size,
      color: req.body.color !== undefined ? req.body.color : variant.color,
      price: req.body.price !== undefined ? req.body.price : variant.price,
      stock: req.body.stock !== undefined ? req.body.stock : variant.stock,
      isActive: req.body.isActive !== undefined ? req.body.isActive : variant.isActive,
    };
    const error = validateVariant(updated, product.variants, variant._id);
    if (error) return res.status(400).json({ success: false, message: error });

    Object.assign(variant, updated, {
      price: updated.price === '' || updated.price === null ? null : Number(updated.price),
      stock: Number(updated.stock),
    });
    variant.isActive = updated.isActive;
    await product.save();
    res.json({ success: true, message: 'Cập nhật biến thể thành công', variant, product });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Không thể cập nhật biến thể', error: error.message });
  }
};

const deleteProductVariant = async (req, res) => {
  try {
    const product = await getProductForVariant(req.params.id, res);
    if (!product) return;
    if (!isValidObjectId(req.params.variantId)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể' });
    }
    const variant = product.variants.id(req.params.variantId);
    if (!variant) return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể' });
    variant.deleteOne();
    await product.save();
    res.json({ success: true, message: 'Đã xóa biến thể', product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Không thể xóa biến thể', error: error.message });
  }
};

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

/**
 * @desc Tải lên file ảnh sản phẩm từ máy tính
 * @route POST /api/products/upload
 * @access Private (Admin & Staff)
 */
const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      if (req.file) {
        return res.json({
          success: true,
          urls: [`/uploads/${req.file.filename}`],
          url: `/uploads/${req.file.filename}`,
        });
      }
      return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 file hình ảnh' });
    }

    const urls = req.files.map((file) => `/uploads/${file.filename}`);
    res.json({
      success: true,
      message: `Đã tải lên ${urls.length} ảnh thành công`,
      urls,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải ảnh lên', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  uploadProductImages,
};
