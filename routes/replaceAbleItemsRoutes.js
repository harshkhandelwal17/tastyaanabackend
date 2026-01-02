const express  = require('express');
const router  = express.Router();
const {authenticate,authorize} = require('../middlewares/auth');
const {GetReplaceAbleItems,AddReplaceAbleItems} = require('../controllers/replaceableItemsController');
const {multiUpload} = require('../middlewares/upload')
router.use(authenticate);

router.post('/add',multiUpload('item',5),authorize('seller'),AddReplaceAbleItems);

router.get('/',GetReplaceAbleItems);

module.exports = router;