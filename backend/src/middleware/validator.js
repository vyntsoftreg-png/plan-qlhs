/**
 * Request validation middleware using Joi
 */

const validate = (schema) => {
  return (req, res, next) => {
    // Only validate body for mutation requests, query for reads
    const isReadRequest = ['GET', 'HEAD'].includes(req.method);
    const dataToValidate = isReadRequest ? req.query : req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        errors: details,
        timestamp: new Date().toISOString(),
      });
    }

    // Replace validated data back
    if (isReadRequest) {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};

module.exports = validate;
