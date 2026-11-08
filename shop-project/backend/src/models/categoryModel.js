const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên danh mục không quá 100 ký tự'],
    },
    nameKey: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function setNameKey() {
  if (this.name) this.nameKey = this.name.trim().toLocaleLowerCase('vi');
});

module.exports = mongoose.model('Category', categorySchema);
