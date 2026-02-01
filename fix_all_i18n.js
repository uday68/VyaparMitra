const fs = require('fs');

// Translation mappings for each language
const translations = {
  // Bengali translations
  bn: {
    "common.of": "এর",
    "navigation.goToDashboard": "ড্যাশবোর্ডে যান",
    "auth.register.languageNote": "ভাষা উপরের সিলেক্টর থেকে স্বয়ংক্রিয়ভাবে সেট হয়",
    "auth.languageNote": "উপরের সিলেক্টর ব্যবহার করে ভাষা পরিবর্তন করুন",
    "auth.currentUserType": "বর্তমান ব্যবহারকারীর ধরন",
    "auth.switchAccount": "অ্যাকাউন্ট পরিবর্তন করুন"
  },
  // Tamil translations  
  ta: {
    "navigation.goToDashboard": "டாஷ்போர்டுக்கு செல்லுங்கள்",
    "auth.register.languageNote": "மொழி மேலே உள்ள தேர்வாளரிலிருந்து தானாகவே அமைக்கப்படுகிறது",
    "auth.languageNote": "மேலே உள்ள தேர்வாளரைப் பயன்படுத்தி மொழியை மாற்றவும்",
    "auth.currentUserType": "தற்போதைய பயனர் வகை",
    "auth.switchAccount": "கணக்கை மாற்றவும்"
  },
  // Telugu translations
  te: {
    "common.and": "మరియు",
    "common.canBeChanged": "సెట్టింగ్స్‌లో ఎప్పుడైనా మార్చవచ్చు",
    "common.or": "లేదా",
    "common.of": "యొక్క",
    "navigation.goToDashboard": "డాష్‌బోర్డ్‌కు వెళ్లండి",
    "auth.register.languageNote": "భాష పైన ఉన్న సెలెక్టర్ నుండి స్వయంచాలకంగా సెట్ చేయబడుతుంది",
    "auth.languageNote": "పైన ఉన్న సెలెక్టర్‌ను ఉపయోగించి భాషను మార్చండి",
    "auth.currentUserType": "ప్రస్తుత వినియోగదారు రకం",
    "auth.switchAccount": "ఖాతాను మార్చండి"
  }
};

// Function to update a language file
function updateLanguageFile(langCode) {
  const filePath = `client/src/i18n/locales/${langCode}.json`;
  console.log(`Updating ${langCode}.json...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Add missing translations if they exist for this language
    if (translations[langCode]) {
      Object.entries(translations[langCode]).forEach(([key, value]) => {
        const keys = key.split('.');
        let current = data;
        
        // Navigate to the correct nested object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        // Set the value
        current[keys[keys.length - 1]] = value;
      });
    }
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Updated ${langCode}.json`);
    
  } catch (error) {
    console.error(`❌ Error updating ${langCode}.json:`, error.message);
  }
}

// Update all languages
const languages = ['bn', 'ta', 'te'];
languages.forEach(updateLanguageFile);

console.log('Translation update complete!');