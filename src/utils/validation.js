/**
 * Validation Utilities
 * 
 * Form validation helper functions.
 * 
 * @module utils/validation
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate price value
 * @param {number|string} price - Price to validate
 * @returns {boolean} True if valid (positive number)
 */
export function isValidPrice(price) {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return !isNaN(num) && num > 0
}

/**
 * Validate service charge percentage
 * @param {number|string} percent - Percentage to validate
 * @returns {boolean} True if valid (0-20)
 */
export function isValidServiceCharge(percent) {
  const num = typeof percent === 'string' ? parseFloat(percent) : percent
  return !isNaN(num) && num >= 0 && num <= 20
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if not empty
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

/**
 * Validate quantity
 * @param {number|string} quantity - Quantity to validate
 * @returns {boolean} True if valid (positive integer, max 99)
 */
export function isValidQuantity(quantity) {
  const num = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity
  return Number.isInteger(num) && num > 0 && num <= 99
}

/**
 * Validate phone number (simple check for MVP)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid (10+ digits)
 */
export function isValidPhone(phone) {
  if (!phone) return true // Optional field
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10
}
