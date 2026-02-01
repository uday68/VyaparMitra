// Test script to validate translation keys
const fs = require('fs');

// Read the translation files
const enTranslations = JSON.parse(fs.readFileSync('./client/src/i18n/locales/en.json', 'utf8'));
const hiTranslations = JSON.parse(fs.readFileSync('./client/src/i18n/locales/hi.json', 'utf8'));

// List of translation keys used in Vendor.tsx
const vendorKeys = [
  'vendor.stats.totalRevenue',
  'vendor.stats.activeNegotiations',
  'vendor.stats.totalProducts',
  'vendor.stats.inventoryValue',
  'vendor.dashboard.welcome',
  'vendor.language.chooseLanguage',
  'vendor.sections.shopLocation',
  'vendor.sections.qrCode',
  'vendor.sections.businessOverview',
  'vendor.sections.quickActions',
  'vendor.sections.activeNegotiations',
  'vendor.sections.yourProducts',
  'vendor.sections.recentOrders',
  'vendor.sections.inventoryAnalytics',
  'vendor.sections.profitabilityAnalysis',
  'vendor.sections.negotiationPerformance',
  'vendor.sections.fastMovingItems',
  'vendor.sections.reorderRecommendations',
  'vendor.sections.voiceVsTextPerformance',
  'vendor.quickActions.addProduct',
  'vendor.quickActions.viewOrders',
  'vendor.quickActions.voiceSettings',
  'vendor.voice.listening',
  'vendor.voice.ready',
  'vendor.voice.stop',
  'vendor.voice.tryVoice',
  'vendor.negotiations.viewAll',
  'vendor.negotiations.noActive',
  'vendor.negotiations.newWillAppear',
  'vendor.negotiations.accept',
  'vendor.negotiations.counter',
  'vendor.negotiations.reject',
  'vendor.negotiations.addNew',
  'vendor.products.stock',
  'vendor.products.left',
  'vendor.analytics.salesPerDay',
  'vendor.analytics.daysLeft',
  'vendor.analytics.current',
  'vendor.analytics.recommended',
  'vendor.analytics.margin',
  'vendor.analytics.revenue',
  'vendor.analytics.profit',
  'vendor.analytics.roi',
  'vendor.analytics.successRate',
  'vendor.analytics.avgTime',
  'vendor.analytics.avgDiscount',
  'vendor.analytics.totalNegotiations',
  'vendor.analytics.voice',
  'vendor.analytics.text',
  'vendor.analytics.negotiations',
  'vendor.analytics.loadingAnalytics'
];

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

console.log('Testing translation keys...\n');

let missingEnKeys = [];
let missingHiKeys = [];

vendorKeys.forEach(key => {
  const enValue = getNestedValue(enTranslations, key);
  const hiValue = getNestedValue(hiTranslations, key);
  
  if (!enValue) {
    missingEnKeys.push(key);
  }
  
  if (!hiValue) {
    missingHiKeys.push(key);
  }
});

if (missingEnKeys.length > 0) {
  console.log('Missing English keys:');
  missingEnKeys.forEach(key => console.log(`  - ${key}`));
  console.log('');
}

if (missingHiKeys.length > 0) {
  console.log('Missing Hindi keys:');
  missingHiKeys.forEach(key => console.log(`  - ${key}`));
  console.log('');
}

if (missingEnKeys.length === 0 && missingHiKeys.length === 0) {
  console.log('✅ All translation keys are present in both languages!');
} else {
  console.log('❌ Some translation keys are missing.');
}