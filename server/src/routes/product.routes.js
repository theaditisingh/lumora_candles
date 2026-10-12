const router = require('express').Router();
const c = require('../controllers/product.controller');
const v = require('../validators/product.validators');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { authenticateToken, optionalAuth, authorizeRole } = require('../middleware/auth');

const admin = [authenticateToken, authorizeRole('ADMIN')];

router.get('/', optionalAuth, v.listProductRules, validate, c.list);
router.get('/:id', optionalAuth, c.getOne);

router.post('/', ...admin, v.createProductRules, validate, c.create);
router.put('/:id', ...admin, v.updateProductRules, validate, c.update);
router.delete('/:id', ...admin, c.remove);
router.post('/:id/images', ...admin, upload.array('images', 6), c.addImages);
router.delete('/:id/images/:imageId', ...admin, c.removeImage);

module.exports = router;
