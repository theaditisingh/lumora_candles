const { body, query } = require('express-validator');

const rules = (isCreate) => {
  const req = (chain) => (isCreate ? chain : chain.optional());
  return [
    req(body('name').trim().isLength({ min: 2, max: 150 })).withMessage('Name must be 2 to 150 characters'),
    req(body('description').trim().isLength({ min: 10 })).withMessage('Description is too short'),
    req(body('shortDescription').trim().isLength({ min: 5, max: 300 })).withMessage('Short description must be 5 to 300 characters'),
    req(body('price').isFloat({ gt: 0 })).withMessage('Price must be greater than 0'),
    body('discountPrice').optional({ nullable: true, checkFalsy: true }).isFloat({ gt: 0 }).withMessage('Discount price must be greater than 0')
      .custom((v, { req: r }) => (r.body.price === undefined || Number(v) < Number(r.body.price)))
      .withMessage('Discount price must be lower than the price'),
    req(body('sku').trim().isLength({ min: 3, max: 40 })).withMessage('SKU must be 3 to 40 characters'),
    req(body('fragrance').trim().notEmpty()).withMessage('Fragrance is required'),
    req(body('waxType').trim().notEmpty()).withMessage('Wax type is required'),
    req(body('burnTimeHours').isInt({ min: 1 })).withMessage('Burn time must be a whole number of hours'),
    req(body('weightGrams').isInt({ min: 1 })).withMessage('Weight must be a whole number of grams'),
    req(body('dimensions').trim().notEmpty()).withMessage('Dimensions are required'),
    req(body('stockQuantity').isInt({ min: 0 })).withMessage('Stock must be 0 or more'),
    req(body('categoryId').isString().notEmpty()).withMessage('Category is required'),
    body('isFeatured').optional().isBoolean(),
    body('isBestseller').optional().isBoolean(),
    body('isNewArrival').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
  ];
};

exports.createProductRules = rules(true);
exports.updateProductRules = rules(false);

exports.listProductRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page'),
  query('limit').optional().isInt({ min: 1, max: 60 }).withMessage('Limit must be 1 to 60'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Invalid minimum price'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Invalid maximum price'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Invalid rating'),
];

exports.categoryRules = (isCreate) => [
  (isCreate ? body('name') : body('name').optional()).trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2 to 80 characters'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
];
