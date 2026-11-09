const mongoose = require('mongoose');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

// ---------- Helpers ----------

const WRITABLE_FIELDS = [
  'name',
  'sku',
  'category',
  'price',
  'quantity',
  'reorderLevel',
  'supplier',
];

const ALLOWED_SORT_FIELDS = [
  'name',
  'sku',
  'category',
  'price',
  'quantity',
  'reorderLevel',
  'supplier',
  'createdAt',
  'updatedAt',
];

// Only copy known fields from the request body (prevents mass assignment)
const pickWritableFields = (body) => {
  const source = body && typeof body === 'object' ? body : {};
  const result = {};
  for (const field of WRITABLE_FIELDS) {
    if (source[field] !== undefined) {
      result[field] = source[field];
    }
  }
  return result;
};

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid product ID: ${id}`);
  }
};

const parsePositiveInt = (value, name, defaultValue) => {
  if (value === undefined) return defaultValue;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw new ApiError(400, `'${name}' must be a positive integer`);
  }
  return num;
};

const parseNonNegativeNumber = (value, name) => {
  if (value === undefined) return undefined;
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    throw new ApiError(400, `'${name}' must be a non-negative number`);
  }
  return num;
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Accepts "price:asc", "-createdAt", "name:desc", or comma-separated combos
const parseSort = (sortParam) => {
  if (!sortParam) return { createdAt: -1 };

  const sort = {};
  const parts = String(sortParam).split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    let field;
    let direction;

    if (part.includes(':')) {
      [field, direction = 'asc'] = part.split(':');
    } else if (part.startsWith('-')) {
      field = part.slice(1);
      direction = 'desc';
    } else {
      field = part;
      direction = 'asc';
    }

    if (!ALLOWED_SORT_FIELDS.includes(field)) {
      throw new ApiError(
        400,
        `Cannot sort by '${field}'. Allowed fields: ${ALLOWED_SORT_FIELDS.join(', ')}`
      );
    }

    const dir = direction.toLowerCase();
    if (dir !== 'asc' && dir !== 'desc') {
      throw new ApiError(400, `Sort direction must be 'asc' or 'desc' (got '${direction}')`);
    }

    sort[field] = dir === 'desc' ? -1 : 1;
  }

  // Tie-breaker for stable pagination
  sort._id = 1;
  return sort;
};

// ---------- Controllers ----------

// POST /api/products
const createProduct = async (req, res) => {
  const data = pickWritableFields(req.body);
  const product = await Product.create(data);
  res.status(201).json(product);
};

// GET /api/products
// Query params: category, supplier, minPrice, maxPrice, sort, page, limit
const getProducts = async (req, res) => {
  const { category, supplier, minPrice, maxPrice, sort, page, limit } = req.query;

  const pageNum = parsePositiveInt(page, 'page', 1);
  const limitNum = Math.min(parsePositiveInt(limit, 'limit', 10), 100);

  // Filtering
  const filter = {};
  if (category) {
    filter.category = new RegExp(`^${escapeRegex(String(category))}$`, 'i');
  }
  if (supplier) {
    filter.supplier = new RegExp(`^${escapeRegex(String(supplier))}$`, 'i');
  }

  const min = parseNonNegativeNumber(minPrice, 'minPrice');
  const max = parseNonNegativeNumber(maxPrice, 'maxPrice');
  if (min !== undefined || max !== undefined) {
    filter.price = {};
    if (min !== undefined) filter.price.$gte = min;
    if (max !== undefined) filter.price.$lte = max;
  }

  // Sorting
  const sortSpec = parseSort(sort);

  // Pagination
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortSpec).skip(skip).limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    count: products.length,
    products,
  });
};

// GET /api/products/low-stock
// Aggregation: products where quantity <= reorderLevel
const getLowStockProducts = async (req, res) => {
  const lowStockItems = await Product.aggregate([
    { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
    {
      $addFields: {
        id: { $toString: '$_id' },
        stockValue: { $round: [{ $multiply: ['$price', '$quantity'] }, 2] },
      },
    },
    { $sort: { quantity: 1, name: 1 } },
  ]);

  res.json({
    count: lowStockItems.length,
    lowStockItems,
  });
};

// GET /api/products/summary
// Aggregation: per-category totals and average price
const getInventorySummary = async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    {
      $project: {
        _id: 1,
        totalItems: 1,
        totalQuantity: 1,
        totalStockValue: { $round: ['$totalStockValue', 2] },
        avgPrice: { $round: ['$avgPrice', 2] },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    categories: summary.length,
    summary,
  });
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  assertValidId(req.params.id);

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, `Product not found: ${req.params.id}`);
  }

  res.json(product);
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  assertValidId(req.params.id);

  const updates = pickWritableFields(req.body);
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'No valid fields provided for update');
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new ApiError(404, `Product not found: ${req.params.id}`);
  }

  res.json(product);
};

// PATCH /api/products/:id/stock
// Body: { "change": 10 } to restock, { "change": -3 } to record a sale
const adjustStock = async (req, res) => {
  assertValidId(req.params.id);

  const change = req.body ? req.body.change : undefined;
  if (!Number.isInteger(change) || change === 0) {
    throw new ApiError(400, "'change' must be a non-zero integer");
  }

  // For decrements, the filter ensures stock never goes negative.
  // The check and the update happen in one atomic database operation,
  // so two simultaneous sales cannot oversell the same stock.
  const filter = { _id: req.params.id };
  if (change < 0) {
    filter.quantity = { $gte: Math.abs(change) };
  }

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) {
      throw new ApiError(404, `Product not found: ${req.params.id}`);
    }
    throw new ApiError(400, 'Insufficient stock for this adjustment');
  }

  res.json({
    message: 'Stock updated',
    product,
  });
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  assertValidId(req.params.id);

  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new ApiError(404, `Product not found: ${req.params.id}`);
  }

  res.json({
    message: 'Product deleted',
    id: product._id,
  });
};

module.exports = {
  createProduct,
  getProducts,
  getLowStockProducts,
  getInventorySummary,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
};
