// utils/env.ts
export const BASE_URL =
  process.env.BASE_URL || 'https://petstore.swagger.io/v2';

export const TIMEOUT =
  Number(process.env.TIMEOUT || 30000);

export const PET_ID =
  process.env.PET_ID;

export const ORDER_ID =
  process.env.ORDER_ID;

export const USERNAME =
  process.env.USERNAME;

export const AUTH_KEY =
  process.env.AUTH_KEY;

export const API_VERSION =
  process.env.API_VERSION;

export const USER_ID =
  process.env.USER_ID;

export const LAST_CREATED_PET_ID =
  process.env.LAST_CREATED_PET_ID;

export const LAST_CREATED_ORDER_ID =
  process.env.LAST_CREATED_ORDER_ID;

export const LAST_CREATED_USER_ID =
  process.env.LAST_CREATED_USER_ID;

export const MAX_RETRIES =
  process.env.MAX_RETRIES;

export const RETRY_DELAY =
  process.env.RETRY_DELAY;

export const DEBUG_MODE =
  process.env.DEBUG_MODE;

export const PET_ENDPOINT =
  process.env.PET_ENDPOINT;

export const STORE_ENDPOINT =
  process.env.STORE_ENDPOINT;

export const USER_ENDPOINT =
  process.env.USER_ENDPOINT;

// Additional environment variables for comprehensive testing
export const TEST_USERNAME =
  process.env.TEST_USERNAME;

export const TEST_PASSWORD =
  process.env.TEST_PASSWORD;

export const TEST_PET_NAME =
  process.env.TEST_PET_NAME;

export const TEST_PET_STATUS =
  process.env.TEST_PET_STATUS;

export const TEST_ORDER_QUANTITY =
  process.env.TEST_ORDER_QUANTITY;

export const TEST_ORDER_STATUS =
  process.env.TEST_ORDER_STATUS;

export const TEST_USER_FIRSTNAME =
  process.env.TEST_USER_FIRSTNAME;

export const TEST_USER_LASTNAME =
  process.env.TEST_USER_LASTNAME;

export const TEST_USER_EMAIL =
  process.env.TEST_USER_EMAIL;

export const TEST_USER_PHONE =
  process.env.TEST_USER_PHONE;

export const TEST_USER_STATUS =
  process.env.TEST_USER_STATUS;

export const TEST_DATA_SCHEMA =
  process.env.TEST_DATA_SCHEMA;
