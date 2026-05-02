export const SHIPPING_CONSTANTS = {
  DEFAULT_WEIGHT_GRAMS: 1000,
  MAX_WEIGHT_GRAMS: 30000,
  MIN_WEIGHT_GRAMS: 100,
  FREE_SHIPPING_THRESHOLD: 150000,
  DEFAULT_INSURANCE_RATE: 0.002, // 0.2% of item value
  REPOSITORY_TOKEN: 'SHIPPING_REPOSITORY',
  PROVIDER_TOKEN: 'SHIPPING_PROVIDER',
};

export const SHIPPING_ERRORS = {
  NOT_FOUND: 'Shipping not found',
  ALREADY_DELIVERED: 'Shipping has already been delivered',
  ALREADY_CANCELLED: 'Shipping has already been cancelled',
  INVALID_STATUS_TRANSITION: 'Invalid shipping status transition',
  CANNOT_CANCEL: 'Shipping cannot be cancelled at this stage',
  ORIGIN_REQUIRED: 'Origin city is required',
  DESTINATION_REQUIRED: 'Destination city is required',
  INVALID_WEIGHT: 'Weight must be between 100g and 30kg',
};