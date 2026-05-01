/**
 * Money Calculations Utility
 * 
 * All monetary calculations for the POS system.
 * Uses precise decimal handling to avoid floating-point errors.
 * 
 * @module utils/calculations
 */

/**
 * Calculate line total for an order item
 * @param {number} quantity - Item quantity
 * @param {number} price - Unit price
 * @returns {number} Line total (quantity × price)
 */
export function calculateLineTotal(quantity, price) {
  // Convert to cents to avoid floating point issues
  const quantityInt = Math.round(quantity)
  const priceCents = Math.round(price * 100)
  const totalCents = quantityInt * priceCents
  return totalCents / 100
}

/**
 * Calculate order subtotal from line items
 * @param {Array<{quantity: number, price: number}>} items - Array of order items
 * @returns {number} Subtotal
 */
export function calculateSubtotal(items) {
  if (!items || items.length === 0) return 0
  
  return items.reduce((sum, item) => {
    return sum + calculateLineTotal(item.quantity, item.price)
  }, 0)
}

/**
 * Calculate service charge amount
 * @param {number} subtotal - Order subtotal
 * @param {number} serviceChargePercent - Service charge percentage (0-20)
 * @returns {number} Service charge amount
 */
export function calculateServiceCharge(subtotal, serviceChargePercent) {
  const subtotalCents = Math.round(subtotal * 100)
  const percentDecimal = serviceChargePercent / 100
  const chargeCents = Math.round(subtotalCents * percentDecimal)
  return chargeCents / 100
}

/**
 * Calculate order total (subtotal + service charge)
 * @param {number} subtotal - Order subtotal
 * @param {number} serviceCharge - Service charge amount
 * @returns {number} Total amount
 */
export function calculateTotal(subtotal, serviceCharge) {
  const subtotalCents = Math.round(subtotal * 100)
  const chargeCents = Math.round(serviceCharge * 100)
  return (subtotalCents + chargeCents) / 100
}

/**
 * Round money value to 2 decimal places
 * @param {number} value - Value to round
 * @returns {number} Rounded value
 */
export function roundMoney(value) {
  return Math.round(value * 100) / 100
}
