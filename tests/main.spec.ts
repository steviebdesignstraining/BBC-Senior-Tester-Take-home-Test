// tests/main.spec.ts
// Import the environment validation utilities
import { getEnvironmentConfig, validateEnvironment } from '../utils/envValidator';
import { writeEnv } from '../utils/envWriter.ts';
import { test, expect } from '@playwright/test';

// Basic test to verify the environment variables are loaded correctly
test('should load BASE_URL and TIMEOUT from env', async () => {
  // Validate environment first
  validateEnvironment();
  
  const envConfig = getEnvironmentConfig();
  
  console.log('BASE_URL:', envConfig.baseUrl);
  console.log('TIMEOUT:', envConfig.timeout);
  
  // Assert that the environment variables are defined
  expect(envConfig.baseUrl).toBeDefined();
  expect(envConfig.timeout).toBeDefined();
  
  // Assert that the environment variables have the expected values
  expect(envConfig.baseUrl).toBe('https://petstore.swagger.io/v2');
  expect(envConfig.timeout).toBe(30000);
  
  // Test that we can access all environment variables
  expect(envConfig).toHaveProperty('authKey');
  expect(envConfig).toHaveProperty('petId');
  expect(envConfig).toHaveProperty('orderId');
  expect(envConfig).toHaveProperty('username');
});
