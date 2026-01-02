const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/productController');

router.get('/products', productCtrl.getProducts);
router.get('/products/:id', productCtrl.getProductById);

module.exports = router;