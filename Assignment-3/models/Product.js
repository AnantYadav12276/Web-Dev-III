const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [150, 'Product name cannot exceed 150 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    reorderLevel: {
      type: Number,
      default: 5,
      min: [0, 'Reorder level cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Reorder level must be an integer',
      },
    },
    supplier: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common filter and sort operations
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ quantity: 1, reorderLevel: 1 });

// Derived field: total value of stock held for this product
productSchema.virtual('stockValue').get(function () {
  return Math.round(this.price * this.quantity * 100) / 100;
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
