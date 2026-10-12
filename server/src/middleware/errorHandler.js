const { Prisma } = require('@prisma/client');
const { isProd } = require('../config/env');

const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Something went wrong';

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') { status = 409; message = 'A record with this value already exists'; }
    else if (err.code === 'P2025') { status = 404; message = 'Record not found'; }
    else if (err.code === 'P2003') { status = 409; message = 'This record is referenced by other data'; }
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401; message = 'Invalid or expired session. Please log in again.';
  }
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON body'; }
  if (err.code === 'LIMIT_FILE_SIZE') { status = 400; message = 'Image is too large (max 5 MB)'; }

  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message,
    ...(err.errors ? { errors: err.errors } : {}),
    ...(!isProd && status >= 500 ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
