const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên thương hiệu là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên thương hiệu không quá 100 ký tự'],
    },
    nameKey: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    logo: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

brandSchema.pre('validate', function setNameKey() {
  if (this.name) this.nameKey = this.name.trim().toLocaleLowerCase('vi');
});

module.exports = mongoose.model('Brand', brandSchema);
