/**
 * Formatting Utilities
 * 
 * Functions for formatting currency, dates, and other display values.
 * 
 * @module utils/formatting
 */

/**
 * Format currency value based on currency code
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code ('LKR' or 'USD')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'LKR') {
  const roundedAmount = Math.round(amount * 100) / 100
  
  if (currencyCode === 'LKR') {
    // Sri Lankan Rupees format: Rs. 1,250.00
    return `Rs. ${roundedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  } else if (currencyCode === 'USD') {
    // US Dollars format: $1,250.00
    return `$${roundedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  
  // Fallback for unknown currency
  return roundedAmount.toFixed(2)
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export function formatDate(date, includeTime = false) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (includeTime) {
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format time from date
 * @param {Date|string} date - Date to extract time from
 * @returns {string} Formatted time string (HH:MM AM/PM)
 */
export function formatTime(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format phone number (simple version for MVP)
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export function formatPhone(phone) {
  if (!phone) return ''
  // Simple formatting - just remove non-numeric and add spaces
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
