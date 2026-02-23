// frontend/src/utils/testLocale.js

export const testLocale = () => {
  console.log('='.repeat(60));
  console.log('BROWSER LOCALE TEST');
  console.log('='.repeat(60));
  
  // Get browser locale
  const locale = navigator.language || navigator.userLanguage;
  console.log('Browser Locale:', locale);
  
  // Test date formatting
  const testDate = new Date('2025-01-15');
  
  console.log('\nDate Formatting Tests:');
  console.log('ISO String:', testDate.toISOString());
  console.log('toLocaleDateString():', testDate.toLocaleDateString());
  console.log('toLocaleString():', testDate.toLocaleString());
  console.log('toDateString():', testDate.toDateString());
  
  console.log('\nExplicit Locale Tests:');
  console.log('en-AU:', testDate.toLocaleDateString('en-AU'));
  console.log('en-US:', testDate.toLocaleDateString('en-US'));
  console.log('en-GB:', testDate.toLocaleDateString('en-GB'));
  
  console.log('='.repeat(60));
  
  return locale;
};
