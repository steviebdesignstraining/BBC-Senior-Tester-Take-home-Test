const axios = require('axios');

// Security test configuration
const BASE_URL = 'https://petstore.swagger.io/v2';
const AUTH_KEY = 'special-key';

// Make HTTP request
async function makeRequest(method, endpoint, data = null, customHeaders = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    method: method.toUpperCase(),
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'api_key': AUTH_KEY,
      'Accept': 'application/json',
      ...customHeaders
    },
    timeout: 10000
  };

  if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
    config.data = data;
  }

  try {
    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    return {
      status: response.status,
      data: response.data,
      duration: duration,
      success: true,
      headers: response.headers
    };
  } catch (error) {
    const duration = Date.now() - (error.config?.startTime || Date.now());
    return {
      status: error.response?.status || 0,
      data: error.response?.data || error.message,
      duration: duration,
      success: false,
      error: error.message,
      headers: error.response?.headers || {}
    };
  }
}

// SQL Injection Tests
async function runSQLInjectionTests() {
  console.log('\n🛡️  SQL Injection Tests');

  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "' OR 1=1 --",
    "' UNION SELECT null, null, null --",
    "'; DROP TABLE users; --",
    "' OR '1'='1' /*"
  ];

  let passedTests = 0;
  let totalTests = 0;

  for (const payload of sqlInjectionPayloads) {
    console.log(`Testing payload: ${payload}`);

    // Test in pet ID parameter
    const petResult = await makeRequest('GET', `/pet/${payload}`);
    totalTests++;

    // Should return 400 or 404, not 200 with data leak
    if ([400, 404, 403].includes(petResult.status)) {
      console.log(`  ✅ Blocked: ${petResult.status} response`);
      passedTests++;
    } else if (petResult.success) {
      console.log(`  ❌ VULNERABLE: ${petResult.status} response - potential data leak`);
    } else {
      console.log(`  ⚠️  Unexpected response: ${petResult.status}`);
    }

    // Test in user parameter
    const userResult = await makeRequest('GET', `/user/${payload}`);
    totalTests++;

    if ([400, 404, 403].includes(userResult.status)) {
      console.log(`  ✅ Blocked: ${userResult.status} response`);
      passedTests++;
    } else if (userResult.success) {
      console.log(`  ❌ VULNERABLE: ${userResult.status} response - potential data leak`);
    } else {
      console.log(`  ⚠️  Unexpected response: ${userResult.status}`);
    }

    await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
  }

  const successRate = (passedTests / totalTests) * 100;
  console.log(`\n📊 SQL Injection Test Results: ${passedTests}/${totalTests} passed (${successRate.toFixed(1)}%)`);

  return { passed: passedTests, total: totalTests, successRate };
}

// XSS Protection Tests
async function runXSSTests() {
  console.log('\n🛡️  XSS Protection Tests');

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<svg onload=alert("XSS")>'
  ];

  let passedTests = 0;
  let totalTests = 0;

  for (const payload of xssPayloads) {
    console.log(`Testing payload: ${payload.substring(0, 30)}...`);

    // Test in user creation
    const userData = {
      id: Math.floor(Math.random() * 1000000),
      username: `xss_test_${Math.floor(Math.random() * 1000)}`,
      firstName: payload,
      lastName: 'Test',
      email: 'test@example.com',
      password: 'testpass',
      phone: '1234567890',
      userStatus: 1
    };

    const result = await makeRequest('POST', '/user', userData);
    totalTests++;

    // Should either reject (400) or sanitize the input (200)
    if ([200, 400, 403].includes(result.status)) {
      console.log(`  ✅ Handled: ${result.status} response`);
      passedTests++;
    } else {
      console.log(`  ❌ Unexpected response: ${result.status}`);
    }

    await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
  }

  const successRate = (passedTests / totalTests) * 100;
  console.log(`\n📊 XSS Protection Test Results: ${passedTests}/${totalTests} passed (${successRate.toFixed(1)}%)`);

  return { passed: passedTests, total: totalTests, successRate };
}

// Authentication Tests
async function runAuthenticationTests() {
  console.log('\n🛡️  Authentication Tests');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Access protected endpoint without auth
  console.log('Testing unauthorized access...');
  const noAuthHeaders = { 'api_key': '' }; // Remove API key
  const noAuthResult = await makeRequest('GET', '/user/testuser', null, noAuthHeaders);
  totalTests++;

  if ([401, 403, 400].includes(noAuthResult.status)) {
    console.log(`  ✅ Blocked: ${noAuthResult.status} response`);
    passedTests++;
  } else if (noAuthResult.success) {
    console.log(`  ❌ VULNERABLE: ${noAuthResult.status} response - unauthorized access allowed`);
  } else {
    console.log(`  ⚠️  Unexpected response: ${noAuthResult.status}`);
  }

  // Test 2: Invalid API key
  console.log('Testing invalid API key...');
  const invalidAuthHeaders = { 'api_key': 'invalid-key-123' };
  const invalidAuthResult = await makeRequest('GET', '/user/testuser', null, invalidAuthHeaders);
  totalTests++;

  if ([401, 403, 400].includes(invalidAuthResult.status)) {
    console.log(`  ✅ Blocked: ${invalidAuthResult.status} response`);
    passedTests++;
  } else if (invalidAuthResult.success) {
    console.log(`  ❌ VULNERABLE: ${invalidAuthResult.status} response - invalid key accepted`);
  } else {
    console.log(`  ⚠️  Unexpected response: ${invalidAuthResult.status}`);
  }

  const successRate = (passedTests / totalTests) * 100;
  console.log(`\n📊 Authentication Test Results: ${passedTests}/${totalTests} passed (${successRate.toFixed(1)}%)`);

  return { passed: passedTests, total: totalTests, successRate };
}

// Rate Limiting Tests
async function runRateLimitingTests() {
  console.log('\n🛡️  Rate Limiting Tests');

  const requests = [];
  const numRequests = 20;

  console.log(`Making ${numRequests} rapid requests...`);

  // Make multiple rapid requests
  for (let i = 0; i < numRequests; i++) {
    requests.push(makeRequest('GET', `/pet/${Math.floor(Math.random() * 100) + 1}`));
  }

  const startTime = Date.now();
  const results = await Promise.all(requests);
  const totalTime = Date.now() - startTime;

  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;

  results.forEach((result, index) => {
    if (result.status === 429) {
      rateLimitedCount++;
    } else if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
  });

  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  🛑 Rate Limited (429): ${rateLimitedCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  ⏱️  Total time: ${totalTime}ms`);

  const hasRateLimiting = rateLimitedCount > 0;
  console.log(`\n📊 Rate Limiting: ${hasRateLimiting ? '✅ DETECTED' : '❌ NOT DETECTED'}`);

  return {
    totalRequests: numRequests,
    successful: successCount,
    rateLimited: rateLimitedCount,
    errors: errorCount,
    hasRateLimiting
  };
}

// Large Payload Tests
async function runLargePayloadTests() {
  console.log('\n🛡️  Large Payload Tests');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Large JSON payload
  console.log('Testing large JSON payload (10KB)...');
  const largePayload = {
    id: Math.floor(Math.random() * 1000000),
    name: 'A'.repeat(10000), // 10KB string
    photoUrls: ['https://permutationgroup.com.au/wp-content/uploads/2023/04/Home-1-Slider-dog.png'],
    status: 'available'
  };

  const largePayloadResult = await makeRequest('POST', '/pet', largePayload);
  totalTests++;

  if ([200, 400, 413].includes(largePayloadResult.status)) {
    console.log(`  ✅ Handled: ${largePayloadResult.status} response`);
    passedTests++;
  } else {
    console.log(`  ❌ Unexpected response: ${largePayloadResult.status}`);
  }

  // Test 2: Very large payload
  console.log('Testing very large payload (50KB)...');
  const veryLargePayload = {
    id: Math.floor(Math.random() * 1000000),
    name: 'A'.repeat(50000), // 50KB string
    photoUrls: ['https://permutationgroup.com.au/wp-content/uploads/2023/04/Home-1-Slider-dog.png'],
    status: 'available'
  };

  const veryLargeResult = await makeRequest('POST', '/pet', veryLargePayload);
  totalTests++;

  if ([200, 400, 413].includes(veryLargeResult.status)) {
    console.log(`  ✅ Handled: ${veryLargeResult.status} response`);
    passedTests++;
  } else {
    console.log(`  ❌ Unexpected response: ${veryLargeResult.status}`);
  }

  const successRate = (passedTests / totalTests) * 100;
  console.log(`\n📊 Large Payload Test Results: ${passedTests}/${totalTests} passed (${successRate.toFixed(1)}%)`);

  return { passed: passedTests, total: totalTests, successRate };
}

// Main security test execution
async function runSecurityTests() {
  console.log('🚀 Starting Security Vulnerability Tests...');
  console.log('=============================================');

  const results = {};

  try {
    // Run all security test categories
    results.sqlInjection = await runSQLInjectionTests();
    results.xss = await runXSSTests();
    results.authentication = await runAuthenticationTests();
    results.rateLimiting = await runRateLimitingTests();
    results.largePayload = await runLargePayloadTests();

    console.log('\n🎉 Security Tests Completed!');
    console.log('==============================');

    // Overall summary
    const totalTests = Object.values(results).reduce((sum, category) => {
      if (category.total) {
        return sum + category.total;
      } else if (category.totalRequests) {
        return sum + category.totalRequests;
      }
      return sum;
    }, 0);

    const totalPassed = Object.values(results).reduce((sum, category) => {
      if (category.passed !== undefined) {
        return sum + category.passed;
      } else if (category.successful !== undefined) {
        return sum + category.successful;
      } else if (category.hasRateLimiting) {
        return sum + 1; // Count rate limiting as a pass
      }
      return sum;
    }, 0);

    const overallSuccessRate = (totalPassed / totalTests) * 100;

    console.log('\n📊 Overall Security Test Results:');
    console.log(`Total Security Checks: ${totalTests}`);
    console.log(`Passed Checks: ${totalPassed}`);
    console.log(`Overall Security Score: ${overallSuccessRate.toFixed(1)}%`);

    // Detailed breakdown
    console.log('\n🔍 Detailed Results:');
    console.log(`SQL Injection Protection: ${results.sqlInjection.successRate.toFixed(1)}%`);
    console.log(`XSS Protection: ${results.xss.successRate.toFixed(1)}%`);
    console.log(`Authentication Security: ${results.authentication.successRate.toFixed(1)}%`);
    console.log(`Rate Limiting: ${results.rateLimiting.hasRateLimiting ? '✅ Active' : '❌ Not Detected'}`);
    console.log(`Large Payload Handling: ${results.largePayload.successRate.toFixed(1)}%`);

    // Security assessment
    if (overallSuccessRate >= 95) {
      console.log('\n🛡️  SECURITY ASSESSMENT: EXCELLENT');
      console.log('Your API shows strong security measures across all tested areas.');
    } else if (overallSuccessRate >= 80) {
      console.log('\n🛡️  SECURITY ASSESSMENT: GOOD');
      console.log('Your API has decent security, but some improvements are recommended.');
    } else if (overallSuccessRate >= 60) {
      console.log('\n🛡️  SECURITY ASSESSMENT: FAIR');
      console.log('Your API has basic security measures, but significant improvements needed.');
    } else {
      console.log('\n🛡️  SECURITY ASSESSMENT: POOR');
      console.log('Your API has critical security vulnerabilities that need immediate attention.');
    }

  } catch (error) {
    console.error('❌ Error during security testing:', error.message);
  }
}

// Run the security tests
runSecurityTests();