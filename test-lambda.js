// Test script for the Lambda function
// Run with: node test-lambda.js

import { handler } from './lambda-function.js';

// Test cases
const testCases = [
  {
    name: 'API Gateway Lambda Proxy Integration',
    event: {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: 'test-image.jpg',
        userId: 'test-user-123',
        contentType: 'image/jpeg'
      }),
      requestContext: {
        requestId: 'test-request-id'
      }
    }
  },
  {
    name: 'Direct Parameters in Event',
    event: {
      filename: 'test-image-2.png',
      userId: 'test-user-456',
      contentType: 'image/png'
    }
  },
  {
    name: 'Missing Body',
    event: {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      requestContext: {
        requestId: 'test-request-id-2'
      }
    }
  },
  {
    name: 'OPTIONS Request',
    event: {
      httpMethod: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json'
      },
      requestContext: {
        requestId: 'test-request-id-3'
      }
    }
  }
];

// Run tests
async function runTests() {
  console.log('🧪 Testing Lambda Function...\n');
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log('📤 Input:', JSON.stringify(testCase.event, null, 2));
    
    try {
      const result = await handler(testCase.event);
      console.log('📥 Output:', JSON.stringify(result, null, 2));
      
      if (result.statusCode === 200) {
        console.log('✅ Test passed');
      } else {
        console.log('⚠️  Test returned non-200 status (this might be expected)');
      }
    } catch (error) {
      console.log('❌ Test failed with error:', error.message);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run the tests
runTests().catch(console.error);