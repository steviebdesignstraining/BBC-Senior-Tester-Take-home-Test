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
  
  // Assert that the environment variables have valid values (not hardcoded)
  expect(envConfig.baseUrl).toMatch(/^https?:\/\//);
  expect(envConfig.timeout).toBeGreaterThan(0);
  expect(envConfig.timeout).toBeLessThan(120000);
  
  // Test that we can access all environment variables
  expect(envConfig).toHaveProperty('authKey');
  expect(envConfig).toHaveProperty('petId');
  expect(envConfig).toHaveProperty('orderId');
  expect(envConfig).toHaveProperty('username');
});
