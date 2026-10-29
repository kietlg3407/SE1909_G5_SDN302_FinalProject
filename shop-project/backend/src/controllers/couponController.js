const Coupon = require('../models/couponModel');

const couponFields = [
  'code',
  'discountType',
  'discountValue',
  'minOrderValue',
  'expiryDate',
  'usageLimit',
];

const getErrorMessage = (error) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An unexpected error occurred while processing the coupon request';
};

// Helper function to validate pagination parameters
const validatePaginationParams = (page, limit) => {
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);

  if (isNaN(parsedPage) || parsedPage < 1) {
    return { valid: false, error: 'Page must be a positive integer' };
  }

  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    return { valid: false, error: 'Limit must be a positive integer between 1 and 100' };
  }

  return { valid: true, page: parsedPage, limit: parsedLimit };
};

// Helper function to validate sort parameter
const validateSortParam = (sortBy) => {
  const validSortFields = ['expiryDate', 'createdAt', 'discountValue', 'code'];
  const validSortOrders = ['asc', 'desc', '1', '-1'];

  if (!sortBy) {
    return { valid: true, sortBy: 'createdAt', sortOrder: 'desc' };
  }

  const [field, order] = sortBy.split(':');

  if (!validSortFields.includes(field)) {
    return {
      valid: false,
      error: `Invalid sort field. Valid fields are: ${validSortFields.join(', ')}`,
    };
  }

  if (order && !validSortOrders.includes(order)) {
    return {
      valid: false,
      error: `Invalid sort order. Valid orders are: ${validSortOrders.join(', ')}`,
    };
  }

  return {
    valid: true,
    sortBy: field,
    sortOrder: order === 'asc' || order === '1' ? 'asc' : 'desc',
  };
};

// Helper function to validate filter parameters
const validateFilterParams = (status, discountType) => {
  const validStatuses = ['active', 'expired'];
  const validDiscountTypes = ['percentage', 'fixed'];

  if (status && !validStatuses.includes(status)) {
    return {
      valid: false,
      error: `Invalid status. Valid values are: ${validStatuses.join(', ')}`,
    };
  }

  if (discountType && !validDiscountTypes.includes(discountType)) {
    return {
      valid: false,
      error: `Invalid discountType. Valid values are: ${validDiscountTypes.join(', ')}`,
    };
  }

  return { valid: true };
};

// Helper function to build filter query
const buildFilterQuery = (status, discountType) => {
  const query = {};

  if (status === 'active') {
    query.expiryDate = { $gte: new Date() };
  } else if (status === 'expired') {
    query.expiryDate = { $lt: new Date() };
  }

  if (discountType) {
    query.discountType = discountType;
  }

  return query;
};

// Helper function to log request details
const logRequest = (req, additionalInfo = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    ...additionalInfo,
  };
  console.log('[Coupon API Request]', JSON.stringify(logData, null, 2));
};

// Helper function to validate coupon code format
const validateCouponCode = (code) => {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Coupon code is required and must be a string' };
  }

  // Convert to uppercase for validation
  const upperCode = code.toUpperCase();

  // Allow alphanumeric characters, hyphens, and underscores
  // Minimum 3 characters, maximum 50 characters
  const codeRegex = /^[A-Z0-9_-]{3,50}$/;
  
  if (!codeRegex.test(upperCode)) {
    return {
      valid: false,
      error: 'Coupon code must be 3-50 characters long and contain only letters, numbers, hyphens, and underscores',
    };
  }

  return { valid: true };
};

// Helper function to validate coupon data before database operations
const validateCouponData = (couponData) => {
  const errors = [];

  // Validate required fields
  if (!couponData.code) {
    errors.push('Coupon code is required');
  } else {
    const codeValidation = validateCouponCode(couponData.code);
    if (!codeValidation.valid) {
      errors.push(codeValidation.error);
    }
  }

  if (!couponData.discountType) {
    errors.push('Discount type is required');
  } else if (!['percentage', 'fixed'].includes(couponData.discountType)) {
    errors.push('Discount type must be either "percentage" or "fixed"');
  }

  if (couponData.discountValue === undefined || couponData.discountValue === null) {
    errors.push('Discount value is required');
  } else {
    const discountValue = Number(couponData.discountValue);
    if (isNaN(discountValue) || discountValue < 0) {
      errors.push('Discount value must be a non-negative number');
    } else if (couponData.discountType === 'percentage' && discountValue > 100) {
      errors.push('Percentage discount cannot exceed 100%');
    } else if (couponData.discountType === 'fixed' && discountValue === 0) {
      errors.push('Fixed discount value must be greater than 0');
    }
  }

  // Validate optional fields
  if (couponData.minOrderValue !== undefined && couponData.minOrderValue !== null) {
    const minOrderValue = Number(couponData.minOrderValue);
    if (isNaN(minOrderValue) || minOrderValue < 0) {
      errors.push('Minimum order value must be a non-negative number');
    }
  }

  if (couponData.usageLimit !== undefined && couponData.usageLimit !== null) {
    const usageLimit = Number(couponData.usageLimit);
    if (isNaN(usageLimit) || usageLimit < 0 || !Number.isInteger(usageLimit)) {
      errors.push('Usage limit must be a non-negative integer');
    }
  }

  if (couponData.expiryDate !== undefined && couponData.expiryDate !== null) {
    const expiryDate = new Date(couponData.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      errors.push('Expiry date must be a valid date');
    } else if (expiryDate <= new Date()) {
      errors.push('Expiry date must be in the future');
    }
  }

  return errors;
};

// Helper function to validate coupon update data (partial updates)
const validateCouponUpdate = (updates, existingCoupon) => {
  const errors = [];

  // Validate discountType if being updated
  if (updates.discountType !== undefined && updates.discountType !== null) {
    if (!['percentage', 'fixed'].includes(updates.discountType)) {
      errors.push('Discount type must be either "percentage" or "fixed"');
    }
  }

  // Validate discountValue if being updated
  if (updates.discountValue !== undefined && updates.discountValue !== null) {
    const discountValue = Number(updates.discountValue);
    if (isNaN(discountValue) || discountValue < 0) {
      errors.push('Discount value must be a non-negative number');
    } else {
      // Use the updated discountType if provided, otherwise use existing
      const discountType = updates.discountType || existingCoupon.discountType;
      if (discountType === 'percentage' && discountValue > 100) {
        errors.push('Percentage discount cannot exceed 100%');
      } else if (discountType === 'fixed' && discountValue === 0) {
        errors.push('Fixed discount value must be greater than 0');
      }
    }
  }

  // Validate minOrderValue if being updated
  if (updates.minOrderValue !== undefined && updates.minOrderValue !== null) {
    const minOrderValue = Number(updates.minOrderValue);
    if (isNaN(minOrderValue) || minOrderValue < 0) {
      errors.push('Minimum order value must be a non-negative number');
    }
  }

  // Validate usageLimit if being updated
  if (updates.usageLimit !== undefined && updates.usageLimit !== null) {
    const usageLimit = Number(updates.usageLimit);
    if (isNaN(usageLimit) || usageLimit < 0 || !Number.isInteger(usageLimit)) {
      errors.push('Usage limit must be a non-negative integer');
    }
  }

  // Validate expiryDate if being updated
  if (updates.expiryDate !== undefined && updates.expiryDate !== null) {
    const expiryDate = new Date(updates.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      errors.push('Expiry date must be a valid date');
    } else if (expiryDate <= new Date()) {
      errors.push('Expiry date must be in the future');
    }
  }

  return errors;
};

const getAllCoupons = async (req, res) => {
  try {
    // Log incoming request
    logRequest(req, { action: 'getAllCoupons' });

    // Extract query parameters
    const { page = 1, limit = 20, sortBy, status, discountType } = req.query;

    // Validate pagination parameters
    const paginationValidation = validatePaginationParams(page, limit);
    if (!paginationValidation.valid) {
      return res.status(400).json({
        message: 'Invalid pagination parameters',
        error: paginationValidation.error,
      });
    }

    // Validate sort parameter
    const sortValidation = validateSortParam(sortBy);
    if (!sortValidation.valid) {
      return res.status(400).json({
        message: 'Invalid sort parameter',
        error: sortValidation.error,
      });
    }

    // Validate filter parameters
    const filterValidation = validateFilterParams(status, discountType);
    if (!filterValidation.valid) {
      return res.status(400).json({
        message: 'Invalid filter parameters',
        error: filterValidation.error,
      });
    }

    // Build filter query
    const filterQuery = buildFilterQuery(status, discountType);

    // Build sort object
    const sortObj = {};
    sortObj[sortValidation.sortBy] = sortValidation.sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value for pagination
    const skip = (paginationValidation.page - 1) * paginationValidation.limit;

    // Get total count of documents matching the filter
    const totalCount = await Coupon.countDocuments(filterQuery);

    // Get paginated and sorted results
    const coupons = await Coupon.find(filterQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(paginationValidation.limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / paginationValidation.limit);
    const hasNextPage = paginationValidation.page < totalPages;
    const hasPrevPage = paginationValidation.page > 1;

    // Log successful response
    logRequest(req, {
      action: 'getAllCoupons',
      result: 'success',
      count: coupons.length,
      totalCount,
      currentPage: paginationValidation.page,
    });

    return res.status(200).json({
      message: 'Coupons retrieved successfully',
      data: {
        coupons,
        pagination: {
          currentPage: paginationValidation.page,
          itemsPerPage: paginationValidation.limit,
          totalItems: totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          status: status || 'all',
          discountType: discountType || 'all',
        },
        sorting: {
          sortBy: sortValidation.sortBy,
          sortOrder: sortValidation.sortOrder,
        },
      },
    });
  } catch (error) {
    // Log error
    logRequest(req, {
      action: 'getAllCoupons',
      result: 'error',
      error: getErrorMessage(error),
    });

    return res.status(500).json({
      message: 'Failed to retrieve coupons',
      error: getErrorMessage(error),
    });
  }
};

const createCoupon = async (req, res) => {
  try {
    // Log incoming request
    logRequest(req, { action: 'createCoupon', body: req.body });

    // Perform pre-validation before database operations
    const validationErrors = validateCouponData(req.body);
    
    if (validationErrors.length > 0) {
      logRequest(req, {
        action: 'createCoupon',
        result: 'validation_error',
        errors: validationErrors,
      });
      
      return res.status(400).json({
        message: 'Coupon validation failed',
        errors: validationErrors,
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ 
      code: req.body.code.toUpperCase() 
    });
    
    if (existingCoupon) {
      logRequest(req, {
        action: 'createCoupon',
        result: 'duplicate_error',
        code: req.body.code,
      });
      
      return res.status(409).json({
        message: 'Coupon code already exists',
        error: `A coupon with code "${req.body.code}" already exists. Please use a different code.`,
        field: 'code',
      });
    }

    // Create the coupon with validated data
    const couponData = {
      ...req.body,
      code: req.body.code.toUpperCase(), // Ensure uppercase
    };

    const coupon = await Coupon.create(couponData);

    // Log successful creation
    logRequest(req, {
      action: 'createCoupon',
      result: 'success',
      couponId: coupon._id,
      code: coupon.code,
    });

    return res.status(201).json({
      message: 'Coupon created successfully',
      data: {
        coupon,
      },
    });
  } catch (error) {
    // Log error
    logRequest(req, {
      action: 'createCoupon',
      result: 'error',
      error: getErrorMessage(error),
    });

    // Handle specific error cases
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Coupon validation failed',
        errors: validationErrors,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Coupon code already exists',
        error: 'A coupon with this code already exists. Please use a different code.',
        field: 'code',
      });
    }

    return res.status(500).json({
      message: 'Failed to create coupon',
      error: getErrorMessage(error),
    });
  }
};

const updateCoupon = async (req, res) => {
  try {
    // Log incoming request
    logRequest(req, { action: 'updateCoupon', body: req.body, id: req.params.id });

    // Extract only allowed fields from request body
    const updates = couponFields.reduce((fields, field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        fields[field] = req.body[field];
      }
      return fields;
    }, {});

    // Check if there are any fields to update
    if (Object.keys(updates).length === 0) {
      logRequest(req, {
        action: 'updateCoupon',
        result: 'validation_error',
        error: 'No fields provided for update',
      });
      
      return res.status(400).json({
        message: 'No update data provided',
        error: 'Please provide at least one field to update. Valid fields are: ' + couponFields.join(', '),
      });
    }

    // First, check if the coupon exists
    const existingCoupon = await Coupon.findById(req.params.id);
    
    if (!existingCoupon) {
      logRequest(req, {
        action: 'updateCoupon',
        result: 'not_found',
        id: req.params.id,
      });
      
      return res.status(404).json({
        message: 'Coupon not found',
        error: `No coupon found with ID: ${req.params.id}`,
      });
    }

    // If code is being updated, validate it and check for duplicates
    if (updates.code) {
      const codeValidation = validateCouponCode(updates.code);
      if (!codeValidation.valid) {
        logRequest(req, {
          action: 'updateCoupon',
          result: 'validation_error',
          error: codeValidation.error,
          field: 'code',
        });
        
        return res.status(400).json({
          message: 'Coupon code validation failed',
          error: codeValidation.error,
          field: 'code',
        });
      }
      
      // Check if new code already exists (excluding current coupon)
      const duplicateCoupon = await Coupon.findOne({ 
        code: updates.code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      
      if (duplicateCoupon) {
        logRequest(req, {
          action: 'updateCoupon',
          result: 'duplicate_error',
          code: updates.code,
        });
        
        return res.status(409).json({
          message: 'Coupon code already exists',
          error: `A coupon with code "${updates.code}" already exists. Please use a different code.`,
          field: 'code',
        });
      }
      
      // Convert code to uppercase
      updates.code = updates.code.toUpperCase();
    }

    // Validate other update fields
    const validationErrors = validateCouponUpdate(updates, existingCoupon);
    
    if (validationErrors.length > 0) {
      logRequest(req, {
        action: 'updateCoupon',
        result: 'validation_error',
        errors: validationErrors,
      });
      
      return res.status(400).json({
        message: 'Coupon update validation failed',
        errors: validationErrors,
      });
    }

    // Perform the update
    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    // Log successful update
    logRequest(req, {
      action: 'updateCoupon',
      result: 'success',
      couponId: updatedCoupon._id,
      code: updatedCoupon.code,
      updatedFields: Object.keys(updates),
    });

    return res.status(200).json({
      message: 'Coupon updated successfully',
      data: {
        coupon: updatedCoupon,
        updatedFields: Object.keys(updates),
      },
    });
  } catch (error) {
    // Log error
    logRequest(req, {
      action: 'updateCoupon',
      result: 'error',
      error: getErrorMessage(error),
    });

    // Handle specific error cases
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        message: 'Coupon validation failed',
        errors: validationErrors,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid coupon ID',
        error: 'The provided coupon ID is not valid',
        field: 'id',
      });
    }

    if (error.code === 11000) {
      // Extract the duplicate field from the error
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'code';
      return res.status(409).json({
        message: 'Duplicate field value',
        error: `A coupon with this ${duplicateField} already exists`,
        field: duplicateField,
      });
    }

    return res.status(500).json({
      message: 'Failed to update coupon',
      error: getErrorMessage(error),
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    // Log incoming request
    logRequest(req, { action: 'deleteCoupon', id: req.params.id });

    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      logRequest(req, {
        action: 'deleteCoupon',
        result: 'not_found',
        id: req.params.id,
      });
      
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Log successful deletion
    logRequest(req, {
      action: 'deleteCoupon',
      result: 'success',
      couponId: coupon._id,
      code: coupon.code,
    });

    return res.status(200).json({
      message: 'Coupon deleted successfully',
      data: {
        coupon,
      },
    });
  } catch (error) {
    // Log error
    logRequest(req, {
      action: 'deleteCoupon',
      result: 'error',
      error: getErrorMessage(error),
    });

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid coupon ID',
        error: 'The provided coupon ID is not valid',
        field: 'id',
      });
    }

    return res.status(500).json({
      message: 'Failed to delete coupon',
      error: getErrorMessage(error),
    });
  }
};

module.exports = {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};