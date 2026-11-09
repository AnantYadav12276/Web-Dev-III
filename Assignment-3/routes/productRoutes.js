const express = require('express');
const {
  createProduct,
  getProducts,
  getLowStockProducts,
  getInventorySummary,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

// Static routes are declared before '/:id' so they are not captured as IDs
router.route('/')
  .post(createProduct)
  .get(getProducts);

router.get('/low-stock', getLowStockProducts);
router.get('/summary', getInventorySummary);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

router.patch('/:id/stock', adjustStock);

module.exports = router;
