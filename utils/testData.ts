 // utils/testData.ts

// Test data variables from schema with dynamic generation
export const testData = {
  // Dynamic generation methods that follow schema patterns
  
  generateUsername: (): string => {
    return `steviebdesigns1+${Math.floor(1000 + Math.random() * 9000)}@gmail.com`;
  },

  generatePassword: (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'Test@';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += Math.floor(10 + Math.random() * 90);
    return result;
  },

  generateFirstName: (): string => {
    const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Thomas', 'Daniel', 'Matthew'];
    return firstNames[Math.floor(Math.random() * firstNames.length)];
  },

  generateLastName: (): string => {
    const lastNames = ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright'];
    return lastNames[Math.floor(Math.random() * lastNames.length)];
  },

  generateEmail: (): string => {
    return `steviebdesigns1+${Math.floor(1000 + Math.random() * 9000)}@gmail.com`;
  },

  generatePhone: (): string => {
    return `+44 7${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(10000 + Math.random() * 90000)}`;
  },

  generatePetName: (): string => {
    const petNames = ['Buddy', 'Max', 'Charlie', 'Jack', 'Cooper', 'Rocky', 'Toby', 'Bear', 'Duke', 'Teddy'];
    return petNames[Math.floor(Math.random() * petNames.length)];
  },

  generateUniqueId: (): number => {
    return Date.now();
  },

  generateRandomOrderId: (): number => {
    return Math.floor(1000000 + Math.random() * 9000000);
  }
};

// Export individual variables for direct import - these now use dynamic generation
export const testUsername = testData.generateUsername();
export const testPassword = testData.generatePassword();
export const testFirstName = testData.generateFirstName();
export const testLastName = testData.generateLastName();
export const testEmail = testData.generateEmail();
export const testPhone = testData.generatePhone();
export const testPetName = testData.generatePetName();

export default testData;