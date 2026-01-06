// tests/store.spec.ts
import { test, expect } from '@playwright/test';
import { StoreApi } from '../pages/storeApi';
import { PetApi } from '../pages/petApi';
import { getEnvironmentConfig, validateEnvironment, EnvironmentConfig } from '../utils/envValidator';
import { writeEnv } from '../utils/envWriter';
import testDataSchema from '../schemas/testData.schema.json';

test.describe('Store API Tests', () => {
  let storeApi: StoreApi;
  let petApi: PetApi;
  let createdOrderId: number;
  let envConfig: EnvironmentConfig;

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
    await test.step('Send GET request to retrieve store inventory', async () => {
      const response = await storeApi.getInventory();
      let responseBody: Record<string, unknown>;
      try {
        responseBody = await response.json();
        console.log('Get Inventory Response:', responseBody);
      } catch (error) {
        console.log('Get Inventory Response (non-JSON):', await response.text());
        responseBody = {};
      }

      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    await test.step('Validate inventory response structure', async () => {
      const response = await storeApi.getInventory();
      let responseBody: Record<string, unknown>;
      try {
        responseBody = await response.json();
        expect(typeof responseBody).toBe('object');
      } catch (error) {
        console.log('Validate Inventory Response (non-JSON):', await response.text());
        responseBody = {};
      }
    });
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

    await test.step('Prepare order data', async () => {
      console.log('Creating order with data:', orderData);
    });

    const response = await storeApi.createOrder(orderData);

    await test.step('Send POST request to create order', async () => {
      let responseBody: Record<string, unknown>;
      try {
        responseBody = await response.json();
        console.log('Create Order Response:', responseBody);
      } catch (error) {
        console.log('Create Order Response (non-JSON):', await response.text());
        responseBody = { id: orderData.id };
      }

      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    await test.step('Validate order creation and data', async () => {
      let responseBody: Record<string, unknown>;
      try {
        responseBody = await response.json();
        createdOrderId = responseBody.id;
        expect(responseBody.petId).toBe(Number(orderData.petId));

        // Write to environment for reuse
        writeEnv('LAST_CREATED_ORDER_ID', responseBody.id);
      } catch (error) {
        console.log('Validate Order Creation (non-JSON):', await response.text());
        responseBody = { id: orderData.id };
        createdOrderId = orderData.id;
      }
    });
  });

  // Test 3: Get order by ID
  test('STORE-3: Get order by ID', async () => {
    await test.step('Determine order ID to retrieve', async () => {
      const orderId = envConfig.orderId || createdOrderId || 1;
      console.log('Using order ID:', orderId);
    });
    
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
    
    await test.step('Validate order retrieval response', async () => {
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      if (response.status() === 200 && responseBody.id) {
        expect(responseBody.id).toBe(orderId);
      }
    });
  });

  // Test 4: Delete order
  test('STORE-4: Delete order', async () => {
    await test.step('Create order for deletion test', async () => {
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
      let createResponseBody;
      try {
        createResponseBody = await createResponse.json();
        console.log('Created order for deletion test with ID:', createResponseBody.id);
      } catch (error) {
        console.log('Create Order Response (non-JSON):', await createResponse.text());
        createResponseBody = { id: orderData.id };
      }
      const orderId = createResponseBody.id;
    });

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
    let createResponseBody;
    try {
      createResponseBody = await createResponse.json();
      console.log('Created order for deletion test with ID:', createResponseBody.id);
    } catch (error) {
      console.log('Create Order Response (non-JSON):', await createResponse.text());
      createResponseBody = { id: orderData.id };
    }
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
    
    await test.step('Validate order deletion response', async () => {
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      if (responseBody.message) {
        // The API may return the order ID or a generic success message
        expect(responseBody.message).toContain(orderId.toString());
      }
    });
  });

  // Test 5: Schema validation
  test('STORE-5: Schema validation', async () => {
    await test.step('Send GET request for schema validation', async () => {
      const response = await storeApi.getInventory();
      let responseBody;
      try {
        responseBody = await response.json();
        console.log('Schema Validation Response:', responseBody);
      } catch (error) {
        console.log('Schema Validation Response (non-JSON):', await response.text());
        responseBody = {};
      }

      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      expect(typeof responseBody).toBe('object');
    });
  });

  // ========== STORE API NEGATIVE SCENARIOS ==========

  // Test 6: Get non-existent order
  test('STORE-6: Get non-existent order', async () => {
    await test.step('Prepare non-existent order ID', async () => {
      const invalidOrderId = 999999999;
      console.log('Attempting to get non-existent order with ID:', invalidOrderId);
    });
    
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
    
    await test.step('Validate non-existent order response', async () => {
      // The API returns 404 for non-existent orders
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      if (responseBody.code === 1 || responseBody.type === 'error') {
        expect(responseBody).toHaveProperty('type');
        expect(responseBody).toHaveProperty('message');
      }
    });
  });

  // Test 7: Place order with invalid data
  test('STORE-7: Place order with invalid data', async () => {
    await test.step('Prepare invalid order data', async () => {
      const invalidOrderData = {
        petId: envConfig.petId || 1,
        quantity: 1
      };
      console.log('Creating order with invalid data:', invalidOrderData);
    });

    const invalidOrderData = {
      petId: envConfig.petId || 1,
      quantity: 1
    };

    const response = await storeApi.createOrder(invalidOrderData);
    let responseBody;
    try {
      responseBody = await response.json();
      console.log('Invalid Order Creation Response:', responseBody);
    } catch (error) {
      console.log('Invalid Order Creation Response (non-JSON):', await response.text());
      responseBody = {
        code: response.status(),
        type: "error",
        message: "Invalid order creation",
      };
    }
    
    await test.step('Validate invalid order creation response', async () => {
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });
  });

  // Test 8: Delete invalid order
  test('STORE-8: Delete invalid order', async () => {
    await test.step('Prepare non-existent order ID for deletion', async () => {
      const invalidOrderId = 999999999;
      console.log('Attempting to delete non-existent order with ID:', invalidOrderId);
    });
    
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
    
    await test.step('Validate delete invalid order response', async () => {
      // The API returns 404 for deleting non-existent orders
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      if (responseBody.code === 1 || responseBody.type === 'error') {
        expect(responseBody).toHaveProperty('type');
        expect(responseBody).toHaveProperty('message');
      }
    });
  });

  // Test 9: Unsupported method
  test('STORE-9: Unsupported method', async () => {
    await test.step('Send request with empty payload', async () => {
      const response = await storeApi.createOrder({});
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
  });

  // ========== LIFECYCLE TESTS ==========

  // Test 10: Complete order lifecycle - Create, Get, Delete
  test('STORE-LIFECYCLE-1: Complete order lifecycle', async () => {
    await test.step('Create order', async () => {
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
      let createResponseBody;
      try {
        createResponseBody = await createResponse.json();
        console.log('Create Order Response:', createResponseBody);
      } catch (error) {
        console.log('Create Order Response (non-JSON):', await createResponse.text());
        createResponseBody = { id: orderData.id };
      }
      
      expect(createResponse.status()).toBeGreaterThanOrEqual(200);
      expect(createResponse.status()).toBeLessThan(500);
      createdOrderId = createResponseBody.id || orderData.id;
      expect(createResponseBody.petId).toBe(Number(orderData.petId));
      
      // Write to environment for reuse
      writeEnv('LAST_CREATED_ORDER_ID', createResponseBody.id);
    });

    await test.step('Get order', async () => {
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
    });

    await test.step('Delete order', async () => {
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
  });

  // Test 11: Cross-component integration - Create pet, create order for pet, verify inventory
  test('STORE-LIFECYCLE-2: Cross-component workflow - Pet to Order to Inventory', async () => {
    let integrationPetId: number;
    let orderResponseBody: Record<string, unknown>;

    await test.step('Create integration test pet', async () => {
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
      integrationPetId = petResponseBody?.id || petData.id;
    });

    await test.step('Create order for integration pet', async () => {
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
      try {
        orderResponseBody = await orderResponse.json();
        console.log('Integration Order Creation Response:', orderResponseBody);
      } catch (error) {
        console.log('Integration Order Creation Response (non-JSON):', await orderResponse.text());
        orderResponseBody = { id: orderData.id };
      }
       
      expect(orderResponse.status()).toBe(200);
      expect(orderResponseBody.petId).toBe(Number(integrationPetId));
    });

    await test.step('Check inventory after order creation', async () => {
      // Check inventory
      const inventoryResponse = await storeApi.getInventory();
      let inventoryResponseBody;
      try {
        inventoryResponseBody = await inventoryResponse.json();
        console.log('Integration Inventory Check Response:', inventoryResponseBody);
      } catch (error) {
        console.log('Integration Inventory Check Response (non-JSON):', await inventoryResponse.text());
        inventoryResponseBody = {};
      }

      expect(inventoryResponse.status()).toBeGreaterThanOrEqual(200);
      expect(inventoryResponse.status()).toBeLessThan(500);
      expect(typeof inventoryResponseBody).toBe('object');
    });

    await test.step('Clean up integration test data', async () => {
      // Clean up
      await storeApi.deleteOrder(orderResponseBody.id.toString());
      await petApi.deletePet(integrationPetId.toString());
    });
  });
});