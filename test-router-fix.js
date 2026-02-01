#!/usr/bin/env node

/**
 * Test script to validate router fixes
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Router Fixes...\n');

// Test 1: Check if all react-router-dom imports have been removed
console.log('1. Checking for remaining react-router-dom imports...');
const clientSrcPath = 'client/src';

function findReactRouterImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const reactRouterFiles = [];
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      reactRouterFiles.push(...findReactRouterImports(fullPath));
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('react-router-dom')) {
          reactRouterFiles.push(fullPath);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }
  
  return reactRouterFiles;
}

const reactRouterFiles = findReactRouterImports(clientSrcPath);
if (reactRouterFiles.length === 0) {
  console.log('   ✅ No react-router-dom imports found');
} else {
  console.log('   ❌ Found react-router-dom imports in:');
  reactRouterFiles.forEach(file => console.log(`      - ${file}`));
}

// Test 2: Check if wouter imports are properly used
console.log('2. Checking wouter imports in fixed files...');
const fixedFiles = [
  'client/src/pages/VendorQRCode.tsx',
  'client/src/pages/VoiceTransactionSuccess.tsx',
  'client/src/pages/VoiceRecognitionError.tsx',
  'client/src/pages/VoiceCommandsGuide.tsx',
  'client/src/pages/CustomerVoiceNegotiation.tsx'
];

let allFilesFixed = true;
fixedFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasWouterImport = content.includes('from \'wouter\'') || content.includes('from "wouter"');
    const hasReactRouterImport = content.includes('react-router-dom');
    
    if (hasWouterImport && !hasReactRouterImport) {
      console.log(`   ✅ ${filePath} - properly using wouter`);
    } else if (hasReactRouterImport) {
      console.log(`   ❌ ${filePath} - still has react-router-dom imports`);
      allFilesFixed = false;
    } else {
      console.log(`   ⚠️  ${filePath} - no routing imports found`);
    }
  } else {
    console.log(`   ❌ ${filePath} - file not found`);
    allFilesFixed = false;
  }
});

// Test 3: Check App.tsx uses wouter correctly
console.log('3. Checking App.tsx routing setup...');
const appPath = 'client/src/App.tsx';
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  const hasWouterImport = appContent.includes('from "wouter"');
  const hasRouterComponent = appContent.includes('<Switch>') && appContent.includes('<Route');
  
  if (hasWouterImport && hasRouterComponent) {
    console.log('   ✅ App.tsx properly configured with wouter');
  } else {
    console.log('   ❌ App.tsx routing configuration issue');
    allFilesFixed = false;
  }
} else {
  console.log('   ❌ App.tsx not found');
  allFilesFixed = false;
}

// Test 4: Check for navigation patterns
console.log('4. Checking navigation patterns...');
const navigationPatterns = [
  { pattern: 'window.history.back()', description: 'Back navigation' },
  { pattern: 'setLocation(', description: 'Wouter navigation' }
];

let hasProperNavigation = false;
fixedFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    navigationPatterns.forEach(({ pattern, description }) => {
      if (content.includes(pattern)) {
        hasProperNavigation = true;
      }
    });
  }
});

if (hasProperNavigation) {
  console.log('   ✅ Proper navigation patterns found');
} else {
  console.log('   ⚠️  No navigation patterns detected');
}

// Summary
console.log('\n📊 Router Fix Summary:');
console.log(`   • React Router imports removed: ${reactRouterFiles.length === 0 ? 'Yes' : 'No'}`);
console.log(`   • Wouter imports added: ${allFilesFixed ? 'Yes' : 'Partial'}`);
console.log(`   • Navigation patterns updated: ${hasProperNavigation ? 'Yes' : 'No'}`);

if (reactRouterFiles.length === 0 && allFilesFixed && hasProperNavigation) {
  console.log('\n🎯 Router Fix Complete!');
  console.log('   The useNavigate() error should be resolved.');
  console.log('   All components now use wouter for routing.');
} else {
  console.log('\n⚠️  Router Fix Incomplete');
  console.log('   Some issues may remain. Check the details above.');
}