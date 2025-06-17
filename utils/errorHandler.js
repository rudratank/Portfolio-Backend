// utils/errorHandler.js
export class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export const catchAsync = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
  
  export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
  
    if (process.env.NODE_ENV === 'development') {
      return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
      });
    }
  
    // Production error response
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
  
    // Programming or unknown errors: don't leak error details
    console.error('ERROR 💥', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  };
  
  export const validateRequestBody = (schema) => {
    return (req, res, next) => {
      try {
        const { error } = schema.validate(req.body);
        if (error) {
          throw new AppError(error.details[0].message, 400);
        }
        next();
      } catch (err) {
        next(err);
      }
    };
  };
  