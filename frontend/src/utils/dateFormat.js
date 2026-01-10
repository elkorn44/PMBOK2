// frontend/src/utils/dateFormat.js

// Force a specific locale or use browser default
// Set to 'en-AU' for Australian format, 'en-US' for American, or undefined for browser default
const FORCE_LOCALE = 'en-AU';  // Change to 'en-AU' if you want to force Australian dates

/**
 * Get the locale to use for date formatting
 */
const getLocale = () => {
  if (FORCE_LOCALE) {
    return FORCE_LOCALE;
  }
  // Use browser's locale
  return navigator.language || navigator.userLanguage;
};

/**
 * Format date using specified or browser's locale settings
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString(getLocale());
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format datetime using specified or browser's locale settings
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'Not set';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleString(getLocale());
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid datetime';
  }
};

/**
 * Format date with explicit options for more control
 */
export const formatDateLong = (dateString) => {
  if (!dateString) return 'Not set';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString(getLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format date with short format (more consistent)
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return 'Not set';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString(getLocale(), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format date for input fields (always YYYY-MM-DD regardless of locale)
 * HTML date inputs require this specific format
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Get today's date in YYYY-MM-DD format for input fields
 */
export const getTodayForInput = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Get date X days in future in YYYY-MM-DD format for input fields
 */
export const getFutureDateForInput = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if a date is overdue (past today)
 */
export const isOverdue = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date < today;
  } catch (error) {
    return false;
  }
};

/**
 * Get relative time description
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const diffMs = date - now;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    
    return formatDate(dateString);
  } catch (error) {
    return 'Invalid date';
  }
};

// Log the locale being used (helpful for debugging)
console.log('📅 Date formatting locale:', getLocale());
