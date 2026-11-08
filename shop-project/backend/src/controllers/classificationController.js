const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const Product = require('../models/productModel');

const listRecords = (Model) => async (req, res) => {
  try {
    const filter = req.path.endsWith('/manage') ? {} : { isActive: true };
    const records = await Model.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Không thể tải dữ liệu phân loại', error: error.message });
  }
};

const createRecord = (Model, label, extraFields = []) => async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) return res.status(400).json({ success: false, message: `Vui lòng nhập tên ${label}` });
    if (req.body.isActive !== undefined && typeof req.body.isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Trạng thái hoạt động không hợp lệ' });
    }

    const record = await Model.create({
      name,
      description: typeof req.body.description === 'string' ? req.body.description.trim() : '',
      ...Object.fromEntries(extraFields.filter((field) => typeof req.body[field] === 'string').map((field) => [field, req.body[field].trim()])),
      isActive: req.body.isActive === undefined ? true : req.body.isActive,
    });
    res.status(201).json({ success: true, record });
  } catch (error) {
    const duplicate = error.code === 11000;
    res.status(duplicate ? 409 : 400).json({
      success: false,
      message: duplicate ? `${label} đã tồn tại` : `Không thể tạo ${label}`,
      error: error.message,
    });
  }
};

const updateRecord = (Model, label, productField, extraFields = []) => async (req, res) => {
  try {
    const record = await Model.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: `Không tìm thấy ${label}` });

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
        return res.status(400).json({ success: false, message: `Tên ${label} không hợp lệ` });
      }
      if (req.body.name.trim() !== record.name) {
        const usageCount = await Product.countDocuments({ [productField]: record.name });
        if (usageCount) {
          return res.status(409).json({
            success: false,
            message: `Không thể đổi tên ${label} đang được ${usageCount} sản phẩm sử dụng`,
          });
        }
      }
      record.name = req.body.name.trim();
    }
    if (req.body.description !== undefined) record.description = String(req.body.description).trim();
    if (req.body.isActive !== undefined) {
      if (typeof req.body.isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'Trạng thái hoạt động không hợp lệ' });
      }
      record.isActive = req.body.isActive;
    }
    extraFields.forEach((field) => {
      if (req.body[field] !== undefined) record[field] = String(req.body[field]).trim();
    });

    await record.save();
    res.json({ success: true, record });
  } catch (error) {
    const duplicate = error.code === 11000;
    res.status(duplicate ? 409 : 400).json({
      success: false,
      message: duplicate ? `${label} đã tồn tại` : `Không thể cập nhật ${label}`,
      error: error.message,
    });
  }
};

const deleteRecord = (Model, label, productField) => async (req, res) => {
  try {
    const record = await Model.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: `Không tìm thấy ${label}` });

    const usageCount = await Product.countDocuments({ [productField]: record.name });
    if (usageCount) {
      return res.status(409).json({
        success: false,
        message: `Không thể xóa ${label} đang được ${usageCount} sản phẩm sử dụng`,
      });
    }

    await record.deleteOne();
    res.json({ success: true, message: `Đã xóa ${label}` });
  } catch (error) {
    res.status(500).json({ success: false, message: `Không thể xóa ${label}`, error: error.message });
  }
};

exports.getCategories = listRecords(Category);
exports.getManagedCategories = listRecords(Category);
exports.createCategory = createRecord(Category, 'danh mục');
exports.updateCategory = updateRecord(Category, 'danh mục', 'category');
exports.deleteCategory = deleteRecord(Category, 'danh mục', 'category');

exports.getBrands = listRecords(Brand);
exports.getManagedBrands = listRecords(Brand);
exports.createBrand = createRecord(Brand, 'thương hiệu', ['logo']);
exports.updateBrand = updateRecord(Brand, 'thương hiệu', 'brand', ['logo']);
exports.deleteBrand = deleteRecord(Brand, 'thương hiệu', 'brand');
