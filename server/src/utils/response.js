const success = (res, data = {}, message = 'OK', status = 200, meta) =>
  res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
module.exports = { success };
