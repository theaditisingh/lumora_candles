const router = require('express').Router();
const c = require('../controllers/category.controller');
const { categoryRules } = require('../validators/product.validators');
const validate = require('../middleware/validate');
const { authenticateToken, optionalAuth, authorizeRole } = require('../middleware/auth');

const admin = [authenticateToken, authorizeRole('ADMIN')];

router.get('/', optionalAuth, c.list);
router.post('/', ...admin, categoryRules(true), validate, c.create);
router.put('/:id', ...admin, categoryRules(false), validate, c.update);
router.delete('/:id', ...admin, c.remove);

module.exports = router;
