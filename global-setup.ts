import axios from "axios";
import fs from "fs";
import path from "path";

async function globalSetup() {
  try {
    // Check if we have API credentials for dynamic test data
    const apiToken = process.env.API_TOKEN;
    const testDataApi = process.env.TEST_DATA_API;
    
    if (apiToken && testDataApi) {
      console.log("Fetching dynamic test data from API...");
      
      const response = await axios.get(
        testDataApi,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        }
      );

      // Write runtime test data
      const runtimeDataPath = path.resolve(__dirname, "runtime-data.json");
      fs.writeFileSync(
        runtimeDataPath,
        JSON.stringify(response.data, null, 2)
      );
      
      console.log("Dynamic test data fetched and saved to runtime-data.json");
    } else {
      console.log("No API credentials found, using fallback test data from .env");
      
      // Create fallback test data from environment variables
      const fallbackData = {
        pet: {
          id: Math.floor(Math.random() * 1000000),
          name: process.env.TEST_PET_NAME || 'TestPet',
          status: process.env.TEST_PET_STATUS || 'available'
        },
        user: {
          id: Math.floor(Math.random() * 1000000),
          username: process.env.TEST_USERNAME || `testuser_${Math.floor(Math.random() * 10000)}`,
          firstName: process.env.TEST_USER_FIRSTNAME || 'Test',
          lastName: process.env.TEST_USER_LASTNAME || 'User',
          email: process.env.TEST_USER_EMAIL || 'test@example.com',
          password: process.env.TEST_PASSWORD || 'TestPassword123!',
          phone: process.env.TEST_USER_PHONE || '1234567890',
          userStatus: parseInt(process.env.TEST_USER_STATUS || '1')
        },
        order: {
          id: Math.floor(Math.random() * 1000000),
          petId: Math.floor(Math.random() * 1000),
          quantity: parseInt(process.env.TEST_ORDER_QUANTITY || '1'),
          shipDate: new Date().toISOString(),
          status: process.env.TEST_ORDER_STATUS || 'placed',
          complete: true
        }
      };

      const runtimeDataPath = path.resolve(__dirname, "runtime-data.json");
      fs.writeFileSync(
        runtimeDataPath,
        JSON.stringify(fallbackData, null, 2)
      );
      
      console.log("Fallback test data created and saved to runtime-data.json");
    }
  } catch (error) {
    console.error("Failed to fetch dynamic test data:", error instanceof Error ? error.message : String(error));
    console.log("Using fallback test data...");
    
    // Create fallback test data
    const fallbackData = {
      pet: {
        id: Math.floor(Math.random() * 1000000),
        name: process.env.TEST_PET_NAME || 'TestPet',
        status: process.env.TEST_PET_STATUS || 'available'
      },
      user: {
        id: Math.floor(Math.random() * 1000000),
        username: process.env.TEST_USERNAME || `testuser_${Math.floor(Math.random() * 10000)}`,
        firstName: process.env.TEST_USER_FIRSTNAME || 'Test',
        lastName: process.env.TEST_USER_LASTNAME || 'User',
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_PASSWORD || 'TestPassword123!',
        phone: process.env.TEST_USER_PHONE || '1234567890',
        userStatus: parseInt(process.env.TEST_USER_STATUS || '1')
      },
      order: {
        id: Math.floor(Math.random() * 1000000),
        petId: Math.floor(Math.random() * 1000),
        quantity: parseInt(process.env.TEST_ORDER_QUANTITY || '1'),
        shipDate: new Date().toISOString(),
        status: process.env.TEST_ORDER_STATUS || 'placed',
        complete: true
      }
    };

    const runtimeDataPath = path.resolve(__dirname, "runtime-data.json");
    fs.writeFileSync(
      runtimeDataPath,
      JSON.stringify(fallbackData, null, 2)
    );
  }
}

export default globalSetup;