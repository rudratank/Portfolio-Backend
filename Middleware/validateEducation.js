import jwt from 'jsonwebtoken';

// Authentication middleware
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

// Validation middleware
export const validateEducation = (req, res, next) => {
  const { title, institution, period, description } = req.body;

  const errors = [];

  // Title validation
  if (!title) {
    errors.push("Title is required");
  } else if (title.length < 2 || title.length > 100) {
    errors.push("Title must be between 2 and 100 characters");
  }

  // Institution validation
  if (!institution) {
    errors.push("Institution is required");
  } else if (institution.length < 2 || institution.length > 100) {
    errors.push("Institution must be between 2 and 100 characters");
  }

  // Period validation
  if (!period) {
    errors.push("Period is required");
  } else if (!/^\d{4}-\d{4}$/.test(period)) {
    errors.push("Period must be in format YYYY-YYYY");
  }

  // Description validation
  if (!description) {
    errors.push("Description is required");
  } else if (description.length < 10 || description.length > 1000) {
    errors.push("Description must be between 10 and 1000 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }

  next();
};