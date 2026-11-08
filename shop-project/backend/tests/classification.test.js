jest.mock('../src/models/categoryModel', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));
jest.mock('../src/models/brandModel', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));
jest.mock('../src/models/productModel', () => ({
  findById: jest.fn(),
  countDocuments: jest.fn(),
}));

const Category = require('../src/models/categoryModel');
const Product = require('../src/models/productModel');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../src/controllers/classificationController');
const { createProductVariant } = require('../src/controllers/productController');
const { isStaffOrAdmin } = require('../src/middlewares/authMiddleware');

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('category management', () => {
  test('public category list only includes active records', async () => {
    const records = [{ name: 'Áo', isActive: true }];
    Category.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(records) }),
    });
    const res = makeResponse();

    await getCategories({ path: '/' }, res);

    expect(Category.find).toHaveBeenCalledWith({ isActive: true });
    expect(res.json).toHaveBeenCalledWith({ success: true, records });
  });

  test('rejects empty names without writing', async () => {
    const res = makeResponse();

    await createCategory({ body: { name: '  ' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Category.create).not.toHaveBeenCalled();
  });

  test('reports duplicate names as a conflict', async () => {
    Category.create.mockRejectedValue(Object.assign(new Error('duplicate'), { code: 11000 }));
    const res = makeResponse();

    await createCategory({ body: { name: 'Áo' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('prevents deleting categories used by products', async () => {
    Category.findById.mockResolvedValue({ name: 'Áo' });
    Product.countDocuments.mockResolvedValue(2);
    const res = makeResponse();

    await deleteCategory({ params: { id: 'category-id' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('prevents renaming categories used by products', async () => {
    Category.findById.mockResolvedValue({
      name: 'Áo',
      save: jest.fn(),
    });
    Product.countDocuments.mockResolvedValue(1);
    const res = makeResponse();

    await updateCategory({ params: { id: 'category-id' }, body: { name: 'Áo thun' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('product variants', () => {
  test('creates an option with non-negative integer stock', async () => {
    const product = { variants: [], save: jest.fn().mockResolvedValue(undefined) };
    Product.findById.mockResolvedValue(product);
    const res = makeResponse();

    await createProductVariant({
      params: { id: '64b000000000000000000001' },
      body: { size: 'M', color: 'Navy', stock: 3 },
    }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0]).toMatchObject({ size: 'M', color: 'Navy', stock: 3 });
  });

  test('rejects variant without size or color', async () => {
    Product.findById.mockResolvedValue({ variants: [], save: jest.fn() });
    const res = makeResponse();

    await createProductVariant({
      params: { id: '64b000000000000000000001' },
      body: { stock: 3 },
    }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('classification permissions', () => {
  test('allows staff and denies customers', () => {
    const staffNext = jest.fn();
    const staffResponse = makeResponse();
    isStaffOrAdmin({ user: { role: 'staff' } }, staffResponse, staffNext);
    expect(staffNext).toHaveBeenCalled();

    const customerResponse = makeResponse();
    isStaffOrAdmin({ user: { role: 'customer' } }, customerResponse, jest.fn());
    expect(customerResponse.status).toHaveBeenCalledWith(403);
  });
});
