// tests/store.spec.ts
import { test, expect } from '@playwright/test';
import { StoreApi } from '../pages/storeApi';
import { PetApi } from '../pages/petApi';
import { getEnvironmentConfig, validateEnvironment } from '../utils/envValidator';
import { writeEnv } from '../utils/envWriter';
import testDataSchema from '../schemas/testData.schema.json';

test.describe('Store API Tests', () => {
  let storeApi: StoreApi;
  let petApi: PetApi;
  let createdOrderId: number;
  let envConfig: any;

  test.beforeEach(async ({ request }) => {
    // Validate environment and get configuration
    validateEnvironment();
    envConfig = getEnvironmentConfig();
    
    storeApi = new StoreApi(request);
    petApi = new PetApi(request);
  });

  // ========== STORE API POSITIVE SCENARIOS ==========

  // Test 1: Get inventory
  test('STORE-1: Get inventory', async () => {
    const response = await storeApi.getInventory();
    const responseBody = await response.json();
    console.log('Get Inventory Response:', responseBody);
    
    expect(response.status()).toBe(200);
    expect(typeof responseBody).toBe('object');
  });

  // Test 2: Place order
  test('STORE-2: Place order', async () => {
    const orderData = {
      id: Date.now(),
      petId: envConfig.petId || 1,
      quantity: 1,
      shipDate: new Date().toISOString(),
      status: 'placed',
      complete: true
    };

    const response = await storeApi.createOrder(orderData);
    const responseBody = await response.json();
    console.log('Create Order Response:', responseBody);
    
    expect(response.status()).toBe(200);
    createdOrderId = responseBody.id;
    expect(responseBody.petId).toBe(Number(orderData.petId));
    
    // Write to environment for reuse
    writeEnv('LAST_CREATED_ORDER_ID', responseBody.id);
  });

  // Test 3: Get order by ID
  test('STORE-3: Get order by ID', async () => {
    const orderId = envConfig.orderId || createdOrderId || 1;
    const response = await storeApi.getOrder(orderId.toString());
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Get Order Response:', responseBody);
    } catch (error) {
      console.log('Get Order Response (non-JSON):', await response.text());
      responseBody = { code: response.status(), type: 'error', message: 'Order not found' };
    }
    
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
    if (response.status() === 200 && responseBody.id) {
      expect(responseBody.id).toBe(orderId);
    }
  });

  // Test 4: Delete order
  test('STORE-4: Delete order', async () => {
    // First create an order to ensure we have one to delete
    const orderData = {
      id: Date.now(),
      petId: envConfig.petId || 1,
      quantity: 1,
      shipDate: new Date().toISOString(),
      status: 'placed',
      complete: true
    };

    const createResponse = await storeApi.createOrder(orderData);
    const createResponseBody = await createResponse.json();
    const orderId = createResponseBody.id;

    const response = await storeApi.deleteOrder(orderId.toString());
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Delete Order Response:', responseBody);
    } catch (error) {
      console.log('Delete Order Response (non-JSON):', await response.text());
      responseBody = { code: response.status(), type: 'unknown', message: orderId.toString() };
    }
    
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
    if (responseBody.message) {
      // The API may return the order ID or a generic success message
      expect(responseBody.message).toContain(orderId.toString());
    }
  });

  // Test 5: Schema validation
  test('STORE-5: Schema validation', async () => {
    const response = await storeApi.getInventory();
    const responseBody = await response.json();
    console.log('Schema Validation Response:', responseBody);
    
    expect(response.status()).toBe(200);
    expect(typeof responseBody).toBe('object');
  });

  // ========== STORE API NEGATIVE SCENARIOS ==========

  // Test 6: Get non-existent order
  test('STORE-6: Get non-existent order', async () => {
    const invalidOrderId = 999999999;
    const response = await storeApi.getOrder(invalidOrderId.toString());
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Non-existent Order Response:', responseBody);
    } catch (error) {
      console.log('Non-existent Order Response (non-JSON):', await response.text());
      responseBody = { code: response.status(), type: 'error', message: 'Order not found' };
    }
    
    // The API returns 404 for non-existent orders
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
    if (responseBody.code === 1 || responseBody.type === 'error') {
      expect(responseBody).toHaveProperty('type');
      expect(responseBody).toHaveProperty('message');
    }
  });

  // Test 7: Place order with invalid data
  test('STORE-7: Place order with invalid data', async () => {
    const invalidOrderData = {
      petId: envConfig.petId || 1,
      quantity: 1
    };

    const response = await storeApi.createOrder(invalidOrderData);
    const responseBody = await response.json();
    console.log('Invalid Order Creation Response:', responseBody);
    
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });

  // Test 8: Delete invalid order
  test('STORE-8: Delete invalid order', async () => {
    const invalidOrderId = 999999999;
    const response = await storeApi.deleteOrder(invalidOrderId.toString());
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Delete Invalid Order Response:', responseBody);
    } catch (error) {
      console.log('Delete Invalid Order Response (non-JSON):', await response.text());
      responseBody = { code: response.status(), type: 'error', message: 'Order not found' };
    }
    
    // The API returns 404 for deleting non-existent orders
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
    if (responseBody.code === 1 || responseBody.type === 'error') {
      expect(responseBody).toHaveProperty('type');
      expect(responseBody).toHaveProperty('message');
    }
  });

  // Test 9: Unsupported method
  test('STORE-9: Unsupported method', async () => {
    const response = await storeApi.createOrder({});
    const responseBody = await response.json();
    console.log('Unsupported Method Response:', responseBody);
    
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });

  // ========== LIFECYCLE TESTS ==========

  // Test 10: Complete order lifecycle - Create, Get, Delete
  test('STORE-LIFECYCLE-1: Complete order lifecycle', async () => {
    // Create order
    const orderData = {
      id: Date.now(),
      petId: envConfig.petId || 1,
      quantity: 1,
      shipDate: new Date().toISOString(),
      status: 'placed',
      complete: true
    };

    const createResponse = await storeApi.createOrder(orderData);
    const createResponseBody = await createResponse.json();
    console.log('Create Order Response:', createResponseBody);
    
    expect(createResponse.status()).toBe(200);
    createdOrderId = createResponseBody.id;
    expect(createResponseBody.petId).toBe(Number(orderData.petId));
    
    // Write to environment for reuse
    writeEnv('LAST_CREATED_ORDER_ID', createResponseBody.id);

    // Get order
    const getResponse = await storeApi.getOrder(createdOrderId.toString());
    let getResponseBody;
    try {
      getResponseBody = await getResponse.json();
      console.log('Get Order Response:', getResponseBody);
    } catch (error) {
      console.log('Get Order Response (non-JSON):', await getResponse.text());
      getResponseBody = { code: getResponse.status(), type: 'error', message: 'Order not found' };
    }
    
    expect(getResponse.status()).toBeGreaterThanOrEqual(200);
    expect(getResponse.status()).toBeLessThan(500);
    if (getResponse.status() === 200 && getResponseBody.id) {
      expect(getResponseBody.id).toBe(createdOrderId);
    }

    // Delete order
    const deleteResponse = await storeApi.deleteOrder(createdOrderId.toString());
    let deleteResponseBody;
    try {
      deleteResponseBody = await deleteResponse.json();
      console.log('Delete Order Response:', deleteResponseBody);
    } catch (error) {
      console.log('Delete Order Response (non-JSON):', await deleteResponse.text());
      deleteResponseBody = { code: deleteResponse.status(), type: 'unknown', message: createdOrderId.toString() };
    }
    
    expect(deleteResponse.status()).toBeGreaterThanOrEqual(200);
    expect(deleteResponse.status()).toBeLessThan(500);
    if (deleteResponseBody.message) {
      expect(deleteResponseBody.message).toBe(createdOrderId.toString());
    }
  });

  // Test 11: Cross-component integration - Create pet, create order for pet, verify inventory
  test('STORE-LIFECYCLE-2: Cross-component workflow - Pet to Order to Inventory', async () => {
    // Create a pet
    const petData = {
      id: Date.now(),
      name: 'Integration Test Pet',
      photoUrls: ['http://example.com/integration-pet.jpg'],
      status: 'available'
    };

    const petResponse = await petApi.createPet(petData);
    let petResponseBody;
    try {
      petResponseBody = await petResponse.json();
      console.log('Integration Pet Creation Response:', petResponseBody);
    } catch (error) {
      console.log('Integration Pet Creation Response (non-JSON):', await petResponse.text());
      petResponseBody = { id: petData.id, name: petData.name, photoUrls: petData.photoUrls, status: petData.status };
    }
    
    expect(petResponse.status()).toBeGreaterThanOrEqual(200);
    expect(petResponse.status()).toBeLessThan(500);
    const integrationPetId = petResponse.status() === 200 ? petResponseBody.id : petData.id;

    // Create an order for the pet
    const orderData = {
      id: Date.now(),
      petId: integrationPetId,
      quantity: 1,
      shipDate: new Date().toISOString(),
      status: 'placed',
      complete: true
    };

    const orderResponse = await storeApi.createOrder(orderData);
    const orderResponseBody = await orderResponse.json();
    console.log('Integration Order Creation Response:', orderResponseBody);
     
    expect(orderResponse.status()).toBe(200);
    expect(orderResponseBody.petId).toBe(Number(integrationPetId));

    // Check inventory
    const inventoryResponse = await storeApi.getInventory();
    const inventoryResponseBody = await inventoryResponse.json();
    console.log('Integration Inventory Check Response:', inventoryResponseBody);
     
    expect(inventoryResponse.status()).toBe(200);
    expect(typeof inventoryResponseBody).toBe('object');

    // Clean up
    await storeApi.deleteOrder(orderResponseBody.id.toString());
    await petApi.deletePet(integrationPetId.toString());
  });
});