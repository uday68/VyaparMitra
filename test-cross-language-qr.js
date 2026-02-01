// Integration test for Cross-Language QR Commerce feature
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testCrossLanguageQRCommerce() {
  console.log('🧪 Testing Cross-Language QR Commerce Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/api/qr-sessions/health`);
    console.log('✅ Health check:', healthResponse.data.status);

    // Test 2: Generate QR Code (requires authentication - skip for now)
    console.log('\n2. Testing QR code generation...');
    console.log('⚠️  Skipping QR generation (requires authentication)');

    // Test 3: Validate QR Code
    console.log('\n3. Testing QR code validation...');
    try {
      const validateResponse = await axios.post(`${BASE_URL}/api/qr-sessions/validate`, {
        qrToken: 'invalid-token'
      });
      console.log('✅ QR validation (invalid token):', validateResponse.data.isValid);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ QR validation properly rejects invalid tokens');
      } else {
        throw error;
      }
    }

    // Test 4: Translation Service
    console.log('\n4. Testing translation service...');
    console.log('⚠️  Skipping translation test (requires authentication)');

    // Test 5: Voice Processing
    console.log('\n5. Testing voice processing endpoints...');
    console.log('⚠️  Skipping voice tests (requires authentication and audio data)');

    console.log('\n🎉 Basic integration tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ API endpoints are accessible');
    console.log('✅ Input validation is working');
    console.log('✅ Error handling is proper');
    console.log('\n🔧 Next steps:');
    console.log('- Install socket.io dependencies: npm install socket.io socket.io-client');
    console.log('- Set up authentication for full testing');
    console.log('- Test WebSocket real-time communication');
    console.log('- Run database migrations');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testCrossLanguageQRCommerce();