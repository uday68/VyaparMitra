import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// Test data
const testUsers = [
  { email: 'vendor1@test.com', password: 'password123', type: 'vendor' },
  { email: 'customer1@test.com', password: 'password123', type: 'customer' },
];

const testProducts = [
  { name: 'Test Apples', category: 'Fruits', basePrice: 150, stock: 100 },
  { name: 'Test Bananas', category: 'Fruits', basePrice: 60, stock: 50 },
];

let authTokens = {};

export function setup() {
  console.log('Setting up performance test...');
  
  // Register test users and get auth tokens
  testUsers.forEach(user => {
    const registerResponse = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (registerResponse.status === 201 || registerResponse.status === 409) {
      // Login to get token
      const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
        email: user.email,
        password: user.password,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (loginResponse.status === 200) {
        const loginData = JSON.parse(loginResponse.body);
        authTokens[user.type] = loginData.data.accessToken;
      }
    }
  });
  
  return { authTokens };
}

export default function(data) {
  const { authTokens } = data;
  
  // Test scenarios with different weights
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    testProductListing();
  } else if (scenario < 0.5) {
    testProductCreation(authTokens.vendor);
  } else if (scenario < 0.7) {
    testNegotiationFlow(authTokens);
  } else if (scenario < 0.85) {
    testVoiceProcessing();
  } else {
    testTranslationService();
  }
  
  sleep(1);
}

function testProductListing() {
  const response = http.get(`${BASE_URL}/api/products?page=1&limit=10`);
  
  const success = check(response, {
    'product listing status is 200': (r) => r.status === 200,
    'product listing response time < 200ms': (r) => r.timings.duration < 200,
    'product listing has data': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && Array.isArray(body.data);
    },
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testProductCreation(vendorToken) {
  if (!vendorToken) return;
  
  const product = testProducts[Math.floor(Math.random() * testProducts.length)];
  const productData = {
    ...product,
    name: `${product.name} ${Date.now()}`, // Make unique
  };
  
  const response = http.post(`${BASE_URL}/api/products`, JSON.stringify(productData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${vendorToken}`,
    },
  });
  
  const success = check(response, {
    'product creation status is 201': (r) => r.status === 201,
    'product creation response time < 500ms': (r) => r.timings.duration < 500,
    'product creation returns product': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && body.data && body.data._id;
    },
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testNegotiationFlow(authTokens) {
  if (!authTokens.vendor || !authTokens.customer) return;
  
  // Create a negotiation
  const negotiationData = {
    vendorId: 'test-vendor-id',
    customerId: 'test-customer-id',
    productId: 'test-product-id',
  };
  
  const createResponse = http.post(`${BASE_URL}/api/negotiations`, JSON.stringify(negotiationData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authTokens.customer}`,
    },
  });
  
  const createSuccess = check(createResponse, {
    'negotiation creation status is 201': (r) => r.status === 201,
    'negotiation creation response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  if (!createSuccess) {
    errorRate.add(1);
    return;
  }
  
  const negotiationId = JSON.parse(createResponse.body).data.id;
  
  // Create a bid
  const bidData = {
    bidderType: 'customer',
    bidderId: 'test-customer-id',
    amount: 120,
    message: 'Test bid message',
    language: 'hi',
  };
  
  const bidResponse = http.post(`${BASE_URL}/api/negotiations/${negotiationId}/bids`, JSON.stringify(bidData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authTokens.customer}`,
    },
  });
  
  const bidSuccess = check(bidResponse, {
    'bid creation status is 201': (r) => r.status === 201,
    'bid creation response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  if (!bidSuccess) {
    errorRate.add(1);
  }
}

function testVoiceProcessing() {
  const voiceData = {
    text: 'नमस्ते, मैं सेब खरीदना चाहता हूं',
    language: 'hi',
    userId: 'test-user-id',
    userType: 'customer',
  };
  
  // Test voice intent recognition
  const intentResponse = http.post(`${BASE_URL}/api/voice/intent`, JSON.stringify(voiceData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const intentSuccess = check(intentResponse, {
    'voice intent status is 200': (r) => r.status === 200,
    'voice intent response time < 1000ms': (r) => r.timings.duration < 1000,
    'voice intent returns result': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && body.data && body.data.intent;
    },
  });
  
  // Test TTS generation
  const ttsResponse = http.post(`${BASE_URL}/api/voice/tts`, JSON.stringify(voiceData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const ttsSuccess = check(ttsResponse, {
    'TTS generation status is 200': (r) => r.status === 200,
    'TTS generation response time < 2000ms': (r) => r.timings.duration < 2000,
    'TTS generation returns audio URL': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && body.data && body.data.audioUrl;
    },
  });
  
  if (!intentSuccess || !ttsSuccess) {
    errorRate.add(1);
  }
}

function testTranslationService() {
  const translationData = {
    text: 'Hello, I want to buy apples',
    sourceLanguage: 'en',
    targetLanguage: 'hi',
  };
  
  const response = http.post(`${BASE_URL}/api/translate`, JSON.stringify(translationData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const success = check(response, {
    'translation status is 200': (r) => r.status === 200,
    'translation response time < 1500ms': (r) => r.timings.duration < 1500,
    'translation returns result': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && body.data && body.data.translatedText;
    },
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

export function teardown(data) {
  console.log('Performance test completed');
  console.log(`Auth tokens used: ${Object.keys(data.authTokens).length}`);
}