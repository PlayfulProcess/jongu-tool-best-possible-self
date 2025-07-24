#!/usr/bin/env node

// Test script to verify the project setup
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Best Possible Self Project...\n');

// Test 1: Check required files exist
console.log('1. Checking file structure...');
const requiredFiles = [
  'package.json',
  'src/app/page.tsx',
  'src/components/BestPossibleSelfForm.tsx',
  'src/components/AIAssistant.tsx',
  'src/components/Timer.tsx',
  'src/app/api/ai/chat/route.ts',
  'src/app/api/test/route.ts'
];

const missingFiles = [];
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('❌ Missing files:', missingFiles);
} else {
  console.log('✅ All required files exist');
}

// Test 2: Check environment setup
console.log('\n2. Checking environment configuration...');
const hasEnvExample = fs.existsSync('.env.local.example');
const hasEnvLocal = fs.existsSync('.env.local');

if (hasEnvExample) {
  console.log('✅ Environment template (.env.local.example) exists');
} else {
  console.log('❌ Missing .env.local.example file');
}

if (hasEnvLocal) {
  console.log('✅ Local environment file (.env.local) exists');
} else {
  console.log('⚠️  .env.local file not found - you need to create this for OpenAI API');
}

// Test 3: Check package.json scripts
console.log('\n3. Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const expectedScripts = ['dev', 'build', 'start', 'lint'];
const missingScripts = expectedScripts.filter(script => !packageJson.scripts[script]);

if (missingScripts.length > 0) {
  console.log('❌ Missing scripts:', missingScripts);
} else {
  console.log('✅ All required scripts exist');
}

// Test 4: Check dependencies
console.log('\n4. Checking critical dependencies...');
const criticalDeps = ['next', 'react', 'openai', '@headlessui/react'];
const missingDeps = criticalDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.log('❌ Missing dependencies:', missingDeps);
} else {
  console.log('✅ All critical dependencies are installed');
}

console.log('\n🏁 Testing complete!');
console.log('\nNext steps:');
console.log('1. Copy .env.local.example to .env.local');
console.log('2. Add your OpenAI API key to .env.local');
console.log('3. Run "npm run dev" to start the development server');
console.log('4. Test the AI functionality in the application');
