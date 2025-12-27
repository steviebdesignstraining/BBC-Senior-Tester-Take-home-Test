# BBC Senior/Principle Test Engineer Technical Task

## Purpose

This repository contains the technical assessment for the BBC Senior/Principle Test Engineer position. The task involves testing a new Pet Shop API that provides standard CRUD operations. The assessment evaluates approach to test planning, automated testing implementation, and documentation skills.

The API under test is the Swagger Petstore API, which can be found at: https://petstore.swagger.io/

## Test Plan

### Functional Testing
- **API Authentication & Authorization**
  - Verify API key authentication mechanisms
  - Test unauthorized access scenarios
  - Validate proper error responses for invalid credentials

- **Pet Operations (CRUD)**
  - Create new pets with valid data
  - Retrieve pets by ID
  - Update existing pet information
  - Delete pets from the system
  - Handle edge cases (duplicate IDs, invalid data formats)

- **Store Operations**
  - Place and retrieve orders
  - Verify inventory management
  - Test order status updates
  - Handle order cancellation scenarios

- **User Management**
  - Create, retrieve, and update user accounts
  - Test user login/logout functionality
  - Validate user data integrity

### Non-Functional Testing
- **Performance Testing**
  - Load testing for concurrent API requests
  - Stress testing to identify breaking points
  - Response time validation under various loads

- **Security Testing**
  - Input validation and sanitization
  - SQL injection prevention
  - Cross-site scripting (XSS) protection
  - Authentication bypass attempts

- **Integration Testing**
  - End-to-end workflow validation
  - Data consistency across operations
  - Error handling and recovery scenarios

## Automated Test Scenarios

| Test Description | Steps | Behaviour | Cucumber Scenario | Expected Result | Body/Header Variables/Credentials | Body Response |
|------------------|-------|-----------|-------------------|-----------------|-----------------------------------|---------------|
| **Pet Creation** | 1. Send POST request to /pet endpoint with valid pet data<br>2. Verify response status and content | API should create new pet record | **Scenario:** Create new pet successfully<br>**Given:** Valid pet data is provided<br>**When:** POST request is sent to /pet endpoint<br>**Then:** Pet is created with unique ID<br>**And:** Response contains pet details | HTTP 200 OK with pet object containing ID, name, category, and status | **Headers:** Content-Type: application/json<br>**Body:** { "id": 0, "category": {"id": 1, "name": "Dogs"}, "name": "Buddy", "photoUrls": ["url1"], "tags": [{"id": 0, "name": "friendly"}], "status": "available" } | **Response:** { "id": 12345, "category": {"id": 1, "name": "Dogs"}, "name": "Buddy", "photoUrls": ["url1"], "tags": [{"id": 0, "name": "friendly"}], "status": "available", "message": "12345" } |
| **Pet Retrieval** | 1. Send GET request to /pet/{petId} with existing pet ID<br>2. Verify response contains correct pet data | API should return pet details for valid ID | **Scenario:** Retrieve existing pet<br>**Given:** Pet exists in system with ID 12345<br>**When:** GET request is sent to /pet/12345<br>**Then:** Pet details are returned successfully | HTTP 200 OK with complete pet object | **Headers:** Content-Type: application/json<br>**Path Parameter:** petId = 12345 | **Response:** { "id": 12345, "category": {"id": 1, "name": "Dogs"}, "name": "Buddy", "photoUrls": ["url1"], "tags": [{"id": 0, "name": "friendly"}], "status": "available" } |
| **Pet Update** | 1. Send PUT request to /pet endpoint with updated pet data<br>2. Verify pet information is modified | API should update existing pet record | **Scenario:** Update pet information<br>**Given:** Pet exists with ID 12345<br>**When:** PUT request is sent with updated pet data<br>**Then:** Pet information is updated successfully | HTTP 200 OK with updated pet object | **Headers:** Content-Type: application/json<br>**Body:** { "id": 12345, "category": {"id": 1, "name": "Dogs"}, "name": "Buddy Updated", "photoUrls": ["url1", "url2"], "tags": [{"id": 0, "name": "friendly"}, {"id": 1, "name": "trained"}], "status": "sold" } | **Response:** { "id": 12345, "category": {"id": 1, "name": "Dogs"}, "name": "Buddy Updated", "photoUrls": ["url1", "url2"], "tags": [{"id": 0, "name": "friendly"}, {"id": 1, "name": "trained"}], "status": "sold", "message": "12345" } |
| **Pet Deletion** | 1. Send DELETE request to /pet/{petId} with existing pet ID<br>2. Verify pet is removed from system | API should delete pet record | **Scenario:** Delete existing pet<br>**Given:** Pet exists with ID 12345<br>**When:** DELETE request is sent to /pet/12345<br>**Then:** Pet is removed from system | HTTP 200 OK with success message | **Headers:** Content-Type: application/json<br>**Path Parameter:** petId = 12345 | **Response:** { "code": 200, "type": "unknown", "message": "12345" } |
| **Order Placement** | 1. Send POST request to /store/order with valid order data<br>2. Verify order is created | API should create new order | **Scenario:** Place new order<br>**Given:** Valid order data is provided<br>**When:** POST request is sent to /store/order<br>**Then:** Order is created with unique ID | HTTP 200 OK with order details | **Headers:** Content-Type: application/json<br>**Body:** { "id": 0, "petId": 12345, "quantity": 1, "shipDate": "2023-12-01T10:00:00Z", "status": "placed", "complete": false } | **Response:** { "id": 67890, "petId": 12345, "quantity": 1, "shipDate": "2023-12-01T10:00:00Z", "status": "placed", "complete": false } |
| **User Registration** | 1. Send POST request to /user with valid user data<br>2. Verify user account is created | API should create new user account | **Scenario:** Register new user<br>**Given:** Valid user registration data is provided<br>**When:** POST request is sent to /user<br>**Then:** User account is created successfully | HTTP 200 OK with success message | **Headers:** Content-Type: application/json<br>**Body:** { "id": 0, "username": "testuser", "firstName": "Test", "lastName": "User", "email": "test@example.com", "password": "password123", "phone": "1234567890", "userStatus": 0 } | **Response:** { "code": 200, "type": "unknown", "message": "0" } |
| **User Login** | 1. Send GET request to /user/login with valid credentials<br>2. Verify successful authentication | API should authenticate user and return session token | **Scenario:** User login with valid credentials<br>**Given:** User account exists with username and password<br>**When:** GET request is sent to /user/login with credentials<br>**Then:** User is authenticated successfully | HTTP 200 OK with session information | **Headers:** Content-Type: application/json<br>**Query Parameters:** username=testuser, password=password123 | **Response:** { "code": 200, "type": "unknown", "message": "logged in user session:12345" } |
| **Invalid Data Handling** | 1. Send request with malformed or invalid data<br>2. Verify appropriate error response | API should reject invalid data with proper error messages | **Scenario:** Handle invalid pet data<br>**Given:** Invalid pet data is provided (missing required fields)<br>**When:** POST request is sent to /pet endpoint<br>**Then:** Request is rejected with error message | HTTP 400 Bad Request with error details | **Headers:** Content-Type: application/json<br>**Body:** { "name": "Buddy" } (missing required fields) | **Response:** { "code": 400, "type": "unknown", "message": "Invalid input" } |
| **Non-existent Resource Access** | 1. Send request for non-existent resource ID<br>2. Verify appropriate error response | API should return 404 for non-existent resources | **Scenario:** Access non-existent pet<br>**Given:** Pet ID does not exist in system<br>**When:** GET request is sent to /pet/99999<br>**Then:** Resource not found error is returned | HTTP 404 Not Found with error message | **Headers:** Content-Type: application/json<br>**Path Parameter:** petId = 99999 | **Response:** { "code": 1, "type": "error", "message": "Pet not found" } |

## Setup and Execution Instructions

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Git for version control

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd BBC-Senior-Tester-Take-home-Test
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the `.env.example` file to `.env` and update with your configuration:
   ```bash
   cp .env.example .env
   ```

### Test Execution

#### Automated Functional Tests

**Run all tests:**
```bash
npm test
```

**Run specific test suites:**
```bash
# Run only API tests
npm run test:api

# Run only integration tests
npm run test:integration

# Run tests with detailed reporting
npm run test:report
```

#### Performance Tests

**Load Testing:**
```bash
npm run test:load
```

**Stress Testing:**
```bash
npm run test:stress
```

**Performance Benchmarking:**
```bash
npm run test:performance
```

#### Security Tests

**Run security validation tests:**
```bash
npm run test:security
```

### Test Framework and Tools

- **Playwright:** End-to-end API testing framework
- **K6:** Performance and load testing
- **Ortoni:** Test reporting and documentation
- **GitHub Actions:** CI/CD pipeline for automated testing

### Test Data Management

Test data is managed through:
- Environment-specific configuration files
- Dynamic data generation for unique test scenarios
- Cleanup procedures to maintain test isolation

### Reporting

Test results are automatically generated and available in:
- HTML reports in the `reports/` directory
- JSON summaries for programmatic analysis
- CI/CD pipeline integration for continuous validation

## Project Structure

```
BBC-Senior-Tester-Take-home-Test/
├── pages/                    # API page objects and client implementations
├── tests/                    # Test specifications and scenarios
├── performance-tests/        # K6 performance test scripts
├── reports/                  # Generated test reports and artifacts
├── scripts/                  # Utility scripts for test execution
├── .github/workflows/        # CI/CD pipeline configurations
├── playwright.config.ts      # Playwright test configuration
├── package.json             # Project dependencies and scripts
└── README.md               # This documentation file
```

## Quality Assurance Standards

### Test Coverage
- **Functional Coverage:** All CRUD operations for pets, users, and orders
- **Edge Case Coverage:** Invalid inputs, boundary conditions, error scenarios
- **Integration Coverage:** End-to-end workflow validation
- **Performance Coverage:** Load, stress, and performance benchmarking

### Code Quality
- **Linting:** ESLint configuration for code standards
- **Formatting:** Prettier for consistent code formatting
- **Type Safety:** TypeScript for enhanced type checking
- **Documentation:** Comprehensive inline documentation

### Continuous Integration
- **Automated Testing:** GitHub Actions workflow for CI/CD
- **Quality Gates:** Test execution and quality checks on every commit
- **Reporting:** Automated report generation and artifact collection

## API Endpoints Tested

### Pet Operations
- `POST /pet` - Create pet
- `GET /pet/{petId}` - Get pet by ID
- `PUT /pet` - Update pet
- `DELETE /pet/{petId}` - Delete pet
- `GET /pet/findByStatus` - Find pets by status

### Store Operations
- `POST /store/order` - Place order
- `GET /store/order/{orderId}` - Get order by ID
- `DELETE /store/order/{orderId}` - Delete order
- `GET /store/inventory` - Get inventory status

### User Operations
- `POST /user` - Create user
- `GET /user/{username}` - Get user by username
- `PUT /user/{username}` - Update user
- `DELETE /user/{username}` - Delete user
- `GET /user/login` - User login
- `GET /user/logout` - User logout

## Troubleshooting

### Common Issues

1. **Test Failures Due to Network Issues:**
   - Check internet connectivity
   - Verify API endpoint availability
   - Review timeout configurations

2. **Environment Configuration Problems:**
   - Ensure `.env` file is properly configured
   - Verify all required environment variables are set
   - Check file permissions

3. **Dependency Installation Issues:**
   - Clear npm cache: `npm cache clean --force`
   - Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

### Getting Help

For additional support or questions about the test implementation:
- Review the test documentation in the `reports/` directory
- Check the CI/CD pipeline logs for detailed error information
- Examine the API specification at https://petstore.swagger.io/

## Conclusion

This test suite provides comprehensive coverage of the Pet Shop API functionality, ensuring both functional correctness and non-functional requirements are met. The automated testing approach enables efficient validation of API behavior across multiple scenarios and load conditions.

The implementation demonstrates modern testing practices including:
- Behavior-driven development (BDD) with Cucumber scenarios
- Comprehensive test coverage across functional and non-functional aspects
- Performance and security testing integration
- Automated reporting and CI/CD pipeline integration
- Professional documentation and maintainable code structure