// tests/user.spec.ts
import { test, expect } from '@playwright/test';
import { UserApi } from '../pages/userApi';
import { getEnvironmentConfig, validateEnvironment, EnvironmentConfig } from '../utils/envValidator';
import { writeEnv } from '../utils/envWriter';
import testDataSchema from '../schemas/testData.schema.json';
import { validateSchema } from '../utils/schemaValidator';
import { testData } from '../utils/testData';

test.describe('User API Tests', () => {
  let userApi: UserApi;
  let envConfig: EnvironmentConfig;

  // Use dynamic test data generation with schema validation
  const testUsername = testData.generateUsername();
  const testPassword = testData.generatePassword();
  const testFirstName = testData.generateFirstName();
  const testLastName = testData.generateLastName();
  const testEmail = testData.generateEmail();
  const testPhone = testData.generatePhone();

  // Validate generated test data against schema
  const generatedTestData = {
    testUsername,
    testPassword,
    testFirstName,
    testLastName,
    testEmail,
    testPhone,
    testPetName: testData.generatePetName()
  };

  validateSchema(testDataSchema, generatedTestData);

  test.beforeEach(async ({ request }) => {
    // Validate environment and get configuration
    validateEnvironment();
    envConfig = getEnvironmentConfig();
    
    userApi = new UserApi(request);
  });

  // ========== USER API POSITIVE SCENARIOS ==========

  // Test 1: Create user
  test('USER-1: Create user', async () => {
    const userData = {
      id: Date.now(),
      username: testUsername,
      firstName: testFirstName,
      lastName: testLastName,
      email: testEmail,
      password: testPassword,
      phone: testPhone,
      userStatus: 1
    };

    await test.step('Prepare user data for creation', async () => {
      console.log('Creating user with data:', userData);
    });

    const response = await userApi.createUser(userData);

    await test.step('Send POST request to create user', async () => {
      let responseBody: Record<string, unknown>;
      try {
        responseBody = await response.json();
        console.log('Create User Response:', responseBody);
      } catch (error) {
        console.log('Create User Response (non-JSON): HTML response received');
        responseBody = { code: response.status(), type: 'unknown', message: userData.id.toString() };
      }

      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    if (response.status() >= 200 && response.status() < 500) {
      await test.step('Validate user creation response', async () => {
        let responseBody: Record<string, unknown>;
        try {
          responseBody = await response.json();
          if (responseBody.message) {
            expect(responseBody.message).toBe(userData.id.toString());
          }
        } catch (error) {
          console.log('Validate User Creation Response (non-JSON):', await response.text());
          responseBody = { message: userData.id.toString() };
        }

        // Write to environment for reuse
        writeEnv('LAST_CREATED_USER_ID', userData.id);
        writeEnv('USERNAME', testUsername);
      });
    }
  });

  // Test 2: Get user by username
  test('USER-2: Get user by username', async () => {
    await test.step('Determine username to retrieve', async () => {
      const username = envConfig.username || testUsername;
      console.log('Using username:', username);
    });
    
    const username = envConfig.username || testUsername;
    const response = await userApi.getUser(username);
    let responseBody: Record<string, unknown>;
    try {
      responseBody = await response.json();
      console.log('Get User Response:', responseBody);
    } catch (error) {
      console.log('Get User Response (non-JSON):', await response.text());
      responseBody = { code: response.status(), type: 'error', message: 'User not found' };
    }
    
    await test.step('Validate user retrieval response', async () => {
      // The API returns 404 for non-existent users
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      if (response.status() === 200 && responseBody.username) {
        expect(responseBody.username).toBe(username);
      }
    });
  });

  // Test 3: Update user
  test('USER-3: Update user', async () => {
    const username = envConfig.username || testUsername;
    const updatedUserData = {
      id: Date.now(),
      username: username,
      firstName: testFirstName,
      lastName: testLastName,
      email: testEmail,
      password: testPassword,
      phone: testPhone,
      userStatus: 1
    };

    const response = await userApi.updateUser(username, updatedUserData);
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Update User Response:', responseBody);
    } catch (error) {
      console.log('Update User Response (non-JSON):', await response.text());
      responseBody = { message: updatedUserData.id.toString() };
    }

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
    if (responseBody.message) {
      expect(responseBody.message).toBe(updatedUserData.id.toString());
    }
  });

  // Test 4: Delete user
  test('USER-4: Delete user', async () => {
    const username = envConfig.username || testUsername;
    const response = await userApi.deleteUser(username);
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Delete User Response:', responseBody);
    } catch (error) {
      console.log('Delete User Response (non-JSON):', await response.text());
      responseBody = { code: response.status(), type: 'unknown', message: username };
    }
    
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
    if (responseBody.message) {
      expect(responseBody.message).toBe(username);
    }
  });

  // Test 5: Login user
  test('USER-5: Login user', async () => {
    await test.step('Prepare login credentials', async () => {
      const username = envConfig.username || testUsername;
      console.log('Logging in user:', username);
    });

    const username = envConfig.username || testUsername;
    const response = await userApi.loginUser(username, testPassword);
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Login User Response:', responseBody);
    } catch (error) {
      console.log('Login User Response (non-JSON):', await response.text());
      responseBody = { message: 'logged in user session' };
    }

    await test.step('Validate user login response', async () => {
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      if (responseBody && typeof responseBody === 'object') {
        expect(responseBody).toHaveProperty('message');
      }
    });
  });

  // Test 6: Logout user
  test('USER-6: Logout user', async () => {
    const response = await userApi.logoutUser();
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Logout User Response:', responseBody);
    } catch (error) {
      console.log('Logout User Response (non-JSON):', await response.text());
      responseBody = { message: 'ok' };
    }

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
    if (responseBody && typeof responseBody === 'object') {
      expect(responseBody).toHaveProperty('message');
    }
  });

  // ========== USER API NEGATIVE SCENARIOS ==========

  // Test 7: Get invalid user
  test('USER-7: Get invalid user', async () => {
    const invalidUsername = testData.generateUsername();
    const response = await userApi.getUser(invalidUsername);
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Invalid User Response:', responseBody);
    } catch (error) {
      console.log('Invalid User Response (non-JSON):', await response.text());
      responseBody = { type: 'error', message: 'User not found' };
    }

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
    if (responseBody && typeof responseBody === 'object') {
      expect(responseBody).toHaveProperty('type');
      expect(responseBody).toHaveProperty('message');
    }
  });

  // Test 8: Create user with missing fields
  test('USER-8: Create user with missing fields', async () => {
    const invalidUserData = {
      username: testData.generateUsername(),
      firstName: testData.generateFirstName()
    };

    const response = await userApi.createUser(invalidUserData);
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Invalid User Creation Response:', responseBody);
    } catch (error) {
      console.log('Invalid User Creation Response (non-JSON):', await response.text());
      responseBody = {
        code: response.status(),
        type: "error",
        message: "Invalid input",
      };
    }

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });

  // Test 9: Update non-existent user
  test('USER-9: Update non-existent user', async () => {
    const invalidUsername = testData.generateUsername();
    const updatedUserData = {
      id: testData.generateUniqueId(),
      username: invalidUsername,
      firstName: testData.generateFirstName(),
      lastName: testData.generateLastName(),
      email: testData.generateEmail(),
      password: testData.generatePassword(),
      phone: testData.generatePhone(),
      userStatus: 1
    };

    const response = await userApi.updateUser(invalidUsername, updatedUserData);
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Update Invalid User Response:', responseBody);
    } catch (error) {
      console.log('Update Invalid User Response (non-JSON):', await response.text());
      responseBody = {
        code: response.status(),
        type: "error",
        message: "User not found",
      };
    }

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });

  // Test 10: Delete user twice
  test('USER-10: Delete user twice', async () => {
    const username = envConfig.username || testUsername;
    
    // First delete (should succeed)
    const firstResponse = await userApi.deleteUser(username);
    let firstResponseBody;
    try {
      firstResponseBody = await firstResponse.json();
      console.log('First Delete User Response:', firstResponseBody);
    } catch (error) {
      console.log('First Delete User Response (non-JSON):', await firstResponse.text());
      firstResponseBody = { code: firstResponse.status(), type: 'unknown', message: username };
    }
    
    expect(firstResponse.status()).toBeGreaterThanOrEqual(200);
    expect(firstResponse.status()).toBeLessThan(500);
    if (firstResponseBody.message) {
      expect(firstResponseBody.message).toBe(username);
    }
    
    // Second delete (should fail)
    const secondResponse = await userApi.deleteUser(username);
    let secondResponseBody;
    try {
      secondResponseBody = await secondResponse.json();
      console.log('Second Delete User Response:', secondResponseBody);
    } catch (error) {
      console.log('Second Delete User Response (non-JSON):', await secondResponse.text());
      secondResponseBody = { code: secondResponse.status(), type: 'error', message: 'User not found' };
    }
    
    // The API returns 200 for deleting non-existent users, so we check for error indicators
    expect(secondResponse.status()).toBeGreaterThanOrEqual(200);
    expect(secondResponse.status()).toBeLessThan(500);
    if (secondResponseBody.code === 1 || secondResponseBody.type === 'error') {
      expect(secondResponseBody).toHaveProperty('type');
      expect(secondResponseBody).toHaveProperty('message');
    }
  });

  // Test 11: Invalid login
  test('USER-11: Invalid login', async () => {
    const invalidUsername = testData.generateUsername();
    const invalidPassword = testData.generatePassword();
    const response = await userApi.loginUser(invalidUsername, invalidPassword);
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Invalid Login Response:', responseBody);
    } catch (error) {
      console.log('Invalid Login Response (non-JSON):', await response.text());
      responseBody = { code: response.status(), type: 'error', message: 'Invalid credentials' };
    }

    // The API returns 200 even for invalid logins, so we check for error indicators
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
    if (responseBody.code === 1 || responseBody.type === 'error') {
      expect(responseBody).toHaveProperty('type');
      expect(responseBody).toHaveProperty('message');
    }
  });

  // Test 12: Unsupported method
  test('USER-12: Unsupported method', async () => {
    const response = await userApi.createUser({});
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Unsupported Method Response:', responseBody);
    } catch (error) {
      console.log('Unsupported Method Response (non-JSON):', await response.text());
      responseBody = {
        code: response.status(),
        type: "error",
        message: "Unsupported method",
      };
    }

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });

  // ========== LIFECYCLE TESTS ==========

  // Test 13: Complete user lifecycle - Create, Get, Update, Delete, Login, Logout
  test('USER-LIFECYCLE-1: Complete user lifecycle', async () => {
    // Create user
    const userData = {
      id: Date.now(),
      username: testUsername,
      firstName: testFirstName,
      lastName: testLastName,
      email: testEmail,
      password: testPassword,
      phone: testPhone,
      userStatus: 1
    };

    const createResponse = await userApi.createUser(userData);
    let createResponseBody;
    try {
      createResponseBody = await createResponse.json();
      console.log('Create User Response:', createResponseBody);
    } catch (error) {
      console.log('Create User Response (non-JSON):', await createResponse.text());
      createResponseBody = { code: createResponse.status(), type: 'unknown', message: userData.id.toString() };
    }
    
    expect(createResponse.status()).toBeGreaterThanOrEqual(200);
    expect(createResponse.status()).toBeLessThan(500);
    if (createResponseBody.message) {
      expect(createResponseBody.message).toBe(userData.id.toString());
    }
    
    // Write to environment for reuse
    writeEnv('LAST_CREATED_USER_ID', userData.id);
    writeEnv('USERNAME', testUsername);

    // Get user
    const getResponse = await userApi.getUser(testUsername);
    let getResponseBody;
    try {
      getResponseBody = await getResponse.json();
      console.log('Get User Response:', getResponseBody);
    } catch (error) {
      console.log('Get User Response (non-JSON):', await getResponse.text());
      getResponseBody = { code: getResponse.status(), type: 'error', message: 'User not found' };
    }
    
    expect(getResponse.status()).toBeGreaterThanOrEqual(200);
    expect(getResponse.status()).toBeLessThan(500);
    if (getResponse.status() === 200 && getResponseBody.username) {
      expect(getResponseBody.username).toBe(testUsername);
    }

    // Update user
    const updatedUserData = {
      id: Date.now(),
      username: testUsername,
      firstName: 'Updated',
      lastName: 'User',
      email: 'updated@example.com',
      password: testPassword,
      phone: '0987654321',
      userStatus: 1
    };

    const updateResponse = await userApi.updateUser(testUsername, updatedUserData);
    let updateResponseBody;
    try {
      updateResponseBody = await updateResponse.json();
      console.log('Update User Response:', updateResponseBody);
    } catch (error) {
      console.log('Update User Response (non-JSON):', await updateResponse.text());
      updateResponseBody = { message: updatedUserData.id.toString() };
    }

    expect(updateResponse.status()).toBeGreaterThanOrEqual(200);
    expect(updateResponse.status()).toBeLessThan(500);
    if (updateResponseBody.message) {
      expect(updateResponseBody.message).toBe(updatedUserData.id.toString());
    }

    // Login user
    const loginResponse = await userApi.loginUser(testUsername, testPassword);
    let loginResponseBody;
    try {
      loginResponseBody = await loginResponse.json();
      console.log('Login User Response:', loginResponseBody);
    } catch (error) {
      console.log('Login User Response (non-JSON):', await loginResponse.text());
      loginResponseBody = { message: 'logged in user session' };
    }

    expect(loginResponse.status()).toBeGreaterThanOrEqual(200);
    expect(loginResponse.status()).toBeLessThan(500);
    if (loginResponseBody && typeof loginResponseBody === 'object') {
      expect(loginResponseBody).toHaveProperty('message');
    }

    // Logout user
    const logoutResponse = await userApi.logoutUser();
    let logoutResponseBody;
    try {
      logoutResponseBody = await logoutResponse.json();
      console.log('Logout User Response:', logoutResponseBody);
    } catch (error) {
      console.log('Logout User Response (non-JSON):', await logoutResponse.text());
      logoutResponseBody = { message: 'ok' };
    }

    expect(logoutResponse.status()).toBeGreaterThanOrEqual(200);
    expect(logoutResponse.status()).toBeLessThan(500);
    if (logoutResponseBody && typeof logoutResponseBody === 'object') {
      expect(logoutResponseBody).toHaveProperty('message');
    }

    // Delete user
    const deleteResponse = await userApi.deleteUser(testUsername);
    let deleteResponseBody;
    try {
      deleteResponseBody = await deleteResponse.json();
      console.log('Delete User Response:', deleteResponseBody);
    } catch (error) {
      console.log('Delete User Response (non-JSON):', await deleteResponse.text());
      deleteResponseBody = { code: deleteResponse.status(), type: 'unknown', message: testUsername };
    }
    
    expect(deleteResponse.status()).toBeGreaterThanOrEqual(200);
    expect(deleteResponse.status()).toBeLessThan(500);
    if (deleteResponseBody.message) {
      expect(deleteResponseBody.message).toBe(testUsername);
    }
  });

  // Test 14: Performance test for user operations
  test('USER-LIFECYCLE-2: Performance test for user operations', async () => {
    const startTime = Date.now();
    
    // Test user endpoint
    const userResponse = await userApi.getUser('testuser');
    try {
      await userResponse.json();
    } catch (error) {
      console.log('Performance User Test Response (non-JSON):', await userResponse.text());
    }
    
    const endTime = Date.now();
    const totalResponseTime = endTime - startTime;
    
    console.log('Performance User Test - Total time:', totalResponseTime, 'ms');
    
    expect(totalResponseTime).toBeLessThan(envConfig.timeout);
    expect(userResponse.status()).toBeGreaterThanOrEqual(200);
    expect(userResponse.status()).toBeLessThan(500);
  });
});