// Script to identify missing translations across all language files
const fs = require('fs');
const path = require('path');

// Read English file as reference
const enFile = JSON.parse(fs.readFileSync('client/src/i18n/locales/en.json', 'utf8'));

// List of language files to update
const languages = ['as', 'bn', 'gu', 'hi', 'kn', 'ml', 'mr', 'or', 'pa', 'ta', 'te'];

// Function to get all keys from nested object
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Get all English keys
const enKeys = getAllKeys(enFile);
console.log(`English file has ${enKeys.length} translation keys`);

// Check each language file
languages.forEach(lang => {
  const langFile = JSON.parse(fs.readFileSync(`client/src/i18n/locales/${lang}.json`, 'utf8'));
  const langKeys = getAllKeys(langFile);
  const missingKeys = enKeys.filter(key => !langKeys.includes(key));
  
  console.log(`\n${lang.toUpperCase()} missing ${missingKeys.length} keys:`);
  missingKeys.slice(0, 20).forEach(key => console.log(`  - ${key}`));
  if (missingKeys.length > 20) {
    console.log(`  ... and ${missingKeys.length - 20} more`);
  }
});