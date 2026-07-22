/**
 * Request validation middleware factory.
 * Validates that required fields exist in req.body.
 *
 * @param {Array<{field: string, type: string, message?: string}>} rules
 */
function validate(rules) {
  return (req, res, next) => {
    const errors = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check presence
      if (value === undefined || value === null || value === '') {
        errors.push(rule.message || `${rule.field} is required`);
        continue;
      }

      // Check type
      if (rule.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${rule.field} must be a valid email address`);
        }
      }

      if (rule.type === 'number') {
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${rule.field} must be a number`);
        }
      }

      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push(`${rule.field} must be a string`);
      }

      // Check min length
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
      }

      // Check max length
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(`${rule.field} must be at most ${rule.maxLength} characters`);
      }

      // Check min value for numbers
      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        errors.push(`${rule.field} must be at least ${rule.min}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
}

module.exports = { validate };
