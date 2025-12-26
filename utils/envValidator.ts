// utils/envValidator.ts
import {
  BASE_URL, TIMEOUT, PET_ID, ORDER_ID, USERNAME, AUTH_KEY,
  TEST_USERNAME, TEST_PASSWORD, TEST_PET_NAME, TEST_PET_STATUS,
  TEST_ORDER_QUANTITY, TEST_ORDER_STATUS, TEST_USER_FIRSTNAME,
  TEST_USER_LASTNAME, TEST_USER_EMAIL, TEST_USER_PHONE, TEST_USER_STATUS,
  TEST_DATA_SCHEMA
} from './env';

/**
 * Validates that all required environment variables are present and properly formatted
 * @throws Error if any required environment variable is missing or invalid
 */
export function validateEnvironment(): void {
  const errors: string[] = [];

  // Validate BASE_URL
  if (!BASE_URL) {
    errors.push('BASE_URL is required');
  } else if (!BASE_URL.startsWith('http')) {
    errors.push('BASE_URL must be a valid HTTP/HTTPS URL');
  }

  // Validate TIMEOUT
  if (!TIMEOUT || TIMEOUT <= 0) {
    errors.push('TIMEOUT must be a positive number');
  }

  // Validate PET_ID (should be a number or convertible to number)
  if (PET_ID && isNaN(Number(PET_ID))) {
    errors.push('PET_ID must be a valid number');
  }

  // Validate ORDER_ID (should be a number or convertible to number)
  if (ORDER_ID && isNaN(Number(ORDER_ID))) {
    errors.push('ORDER_ID must be a valid number');
  }

  // Validate USERNAME
  if (USERNAME && typeof USERNAME !== 'string') {
    errors.push('USERNAME must be a string');
  }
  
  // Validate AUTH_KEY
  if (AUTH_KEY && typeof AUTH_KEY !== 'string') {
    errors.push('AUTH_KEY must be a string');
  }
  
  // Validate TEST_USERNAME
  if (TEST_USERNAME && typeof TEST_USERNAME !== 'string') {
    errors.push('TEST_USERNAME must be a string');
  }
  
  // Validate TEST_PASSWORD
  if (TEST_PASSWORD && typeof TEST_PASSWORD !== 'string') {
    errors.push('TEST_PASSWORD must be a string');
  }
  
  // Validate TEST_PET_NAME
  if (TEST_PET_NAME && typeof TEST_PET_NAME !== 'string') {
    errors.push('TEST_PET_NAME must be a string');
  }
  
  // Validate TEST_PET_STATUS
  if (TEST_PET_STATUS && typeof TEST_PET_STATUS !== 'string') {
    errors.push('TEST_PET_STATUS must be a string');
  }
  
  // Validate TEST_ORDER_QUANTITY
  if (TEST_ORDER_QUANTITY && isNaN(Number(TEST_ORDER_QUANTITY))) {
    errors.push('TEST_ORDER_QUANTITY must be a valid number');
  }
  
  // Validate TEST_ORDER_STATUS
  if (TEST_ORDER_STATUS && typeof TEST_ORDER_STATUS !== 'string') {
    errors.push('TEST_ORDER_STATUS must be a valid string');
  }
  
  // Validate TEST_USER_FIRSTNAME
  if (TEST_USER_FIRSTNAME && typeof TEST_USER_FIRSTNAME !== 'string') {
    errors.push('TEST_USER_FIRSTNAME must be a string');
  }
  
  // Validate TEST_USER_LASTNAME
  if (TEST_USER_LASTNAME && typeof TEST_USER_LASTNAME !== 'string') {
    errors.push('TEST_USER_LASTNAME must be a string');
  }
  
  // Validate TEST_USER_EMAIL
  if (TEST_USER_EMAIL && typeof TEST_USER_EMAIL !== 'string') {
    errors.push('TEST_USER_EMAIL must be a string');
  }
  
  // Validate TEST_USER_PHONE
  if (TEST_USER_PHONE && typeof TEST_USER_PHONE !== 'string') {
    errors.push('TEST_USER_PHONE must be a string');
  }
  
  // Validate TEST_USER_STATUS
  if (TEST_USER_STATUS && isNaN(Number(TEST_USER_STATUS))) {
    errors.push('TEST_USER_STATUS must be a valid number');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  console.log('✅ Environment validation passed');
}

/**
 * Gets a validated environment variable with proper type conversion
 * @param value The environment variable value
 * @param type The expected type ('string', 'number', 'boolean')
 * @param defaultValue Optional default value if the variable is not set
 * @returns The validated and converted value
 */
export function getEnvVariable<T>(value: any, type: 'string', defaultValue?: string): string;
export function getEnvVariable<T>(value: any, type: 'number', defaultValue?: number): number;
export function getEnvVariable<T>(value: any, type: 'boolean', defaultValue?: boolean): boolean;
export function getEnvVariable<T>(value: any, type: string, defaultValue?: any): any {
  if (value === undefined || value === null) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable is required but not set`);
  }

  switch (type) {
    case 'string':
      return String(value);
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Environment variable must be a valid number, got: ${value}`);
      }
      return num;
    case 'boolean':
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}

/**
 * Environment configuration with proper typing
 */
export interface EnvironmentConfig {
  baseUrl: string;
  timeout: number;
  petId?: number;
  orderId?: number;
  username?: string;
  authKey?: string;
  testUsername?: string;
  testPassword?: string;
  testPetName?: string;
  testPetStatus?: string;
  testOrderQuantity?: number;
  testOrderStatus?: string;
  testUserFirstname?: string;
  testUserLastname?: string;
  testUserEmail?: string;
  testUserPhone?: string;
  testUserStatus?: number;
  testDataSchema?: string;
}

/**
 * Gets the complete validated environment configuration
 * @returns Validated environment configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    baseUrl: getEnvVariable(BASE_URL, 'string', 'https://petstore.swagger.io/v2'),
    timeout: getEnvVariable(TIMEOUT, 'number', 30000),
    petId: PET_ID ? getEnvVariable(PET_ID, 'number') : undefined,
    orderId: ORDER_ID ? getEnvVariable(ORDER_ID, 'number') : undefined,
    username: USERNAME ? getEnvVariable(USERNAME, 'string') : undefined,
    authKey: AUTH_KEY ? getEnvVariable(AUTH_KEY, 'string') : undefined,
    testUsername: TEST_USERNAME ? getEnvVariable(TEST_USERNAME, 'string') : undefined,
    testPassword: TEST_PASSWORD ? getEnvVariable(TEST_PASSWORD, 'string') : undefined,
    testPetName: TEST_PET_NAME ? getEnvVariable(TEST_PET_NAME, 'string') : undefined,
    testPetStatus: TEST_PET_STATUS ? getEnvVariable(TEST_PET_STATUS, 'string') : undefined,
    testOrderQuantity: TEST_ORDER_QUANTITY ? getEnvVariable(TEST_ORDER_QUANTITY, 'number') : undefined,
    testOrderStatus: TEST_ORDER_STATUS ? getEnvVariable(TEST_ORDER_STATUS, 'string') : undefined,
    testUserFirstname: TEST_USER_FIRSTNAME ? getEnvVariable(TEST_USER_FIRSTNAME, 'string') : undefined,
    testUserLastname: TEST_USER_LASTNAME ? getEnvVariable(TEST_USER_LASTNAME, 'string') : undefined,
    testUserEmail: TEST_USER_EMAIL ? getEnvVariable(TEST_USER_EMAIL, 'string') : undefined,
    testUserPhone: TEST_USER_PHONE ? getEnvVariable(TEST_USER_PHONE, 'string') : undefined,
    testUserStatus: TEST_USER_STATUS ? getEnvVariable(TEST_USER_STATUS, 'number') : undefined,
    testDataSchema: TEST_DATA_SCHEMA ? getEnvVariable(TEST_DATA_SCHEMA, 'string') : undefined,
  };
}