# 🚀 k6 Performance Test Suite

This directory contains comprehensive performance tests for the PetStore API using [k6](https://k6.io/), an open-source load testing tool.

## 📁 Test Suite Overview

### Test Categories

| Test Type | File | Purpose |
|-----------|------|---------|
| **Load Testing** | `load-test.js` | Measures system behavior under normal and high load conditions |
| **Stress Testing** | `stress-test.js` | Determines breaking point and failure modes under extreme load |
| **Security Testing** | `security-test.js` | Basic security vulnerability testing (SQLi, XSS, auth bypass) |
| **Performance Testing** | `performance-test.js` | Measures response times, throughput, and resource usage |

### Configuration

| File | Purpose |
|------|---------|
| `config.js` | Shared configuration, test data generation, and helper functions |
| `README.md` | Documentation (this file) |

## 🎯 Test Scenarios

### 1. Load Testing (`load-test.js`)

**Objective**: Measure system behavior under normal and high load conditions

**Scenarios**:
- ✅ **Ramp-up Phase**: Gradually increase load from 0 to 50 VUs over 30 seconds
- ✅ **Steady State**: Maintain 50 VUs for 2 minutes to observe stable performance
- ✅ **High Load Phase**: Increase to 100 VUs over 30 seconds
- ✅ **Sustained High Load**: Maintain 100 VUs for 1 minute
- ✅ **Ramp-down Phase**: Gradually decrease load to 0 VUs

**Endpoints Tested**:
- Pet API: Create, Read, Update, Delete operations
- User API: Create, Read, Update, Delete operations  
- Store API: Order creation, retrieval, and deletion

**Thresholds**:
- `<1%` failed requests
- `95%` of requests under 1 second
- `>95%` of checks pass

### 2. Stress Testing (`stress-test.js`)

**Objective**: Determine breaking point and failure modes under extreme load

**Scenarios**:
- ✅ **Initial Load**: Start with 100 VUs for 1 minute
- ✅ **Rapid Ramp-up**: Increase to 300 VUs over 2 minutes
- ✅ **High Stress**: Maintain 500 VUs for 3 minutes
- ✅ **Breaking Point**: Push to 800 VUs over 2 minutes
- ✅ **Recovery**: Ramp down to 0 VUs

**Focus Areas**:
- Critical path operations (Pet/User/Order CRUD)
- Error handling under stress conditions
- System recovery behavior

**Thresholds**:
- `<10%` failed requests (more lenient for stress)
- `99%` of requests under 3 seconds
- `>80%` of checks pass

### 3. Security Testing (`security-test.js`)

**Objective**: Basic security vulnerability testing

**Test Areas**:

**SQL Injection Testing**:
- ✅ Test common SQLi patterns in ID parameters
- ✅ Verify proper error handling (400/404 responses)
- ✅ Ensure no data leakage

**XSS Protection Testing**:
- ✅ Test XSS payloads in user input fields
- ✅ Verify input sanitization or rejection
- ✅ Test multiple XSS attack vectors

**Authentication Testing**:
- ✅ Test access to protected endpoints without auth
- ✅ Verify proper 401/403 responses
- ✅ Test auth header manipulation

**Rate Limiting Testing**:
- ✅ Make rapid successive requests
- ✅ Verify 429 responses when limits exceeded
- ✅ Test different endpoint rate limits

**Large Payload Testing**:
- ✅ Test with oversized data (10KB+ strings)
- ✅ Verify proper handling (200/400/413 responses)
- ✅ Test memory handling

### 4. Performance Testing (`performance-test.js`)

**Objective**: Measure response times, throughput, and resource usage

**Scenarios**:

**Baseline API Performance**:
- ✅ CRUD operations with strict timing thresholds
- ✅ Create: `<500ms` response time
- ✅ Read: `<300ms` response time  
- ✅ Update: `<500ms` response time
- ✅ Delete: `<300ms` response time

**Concurrent Operations**:
- ✅ Parallel user, order, and pet operations
- ✅ Measure batch processing performance
- ✅ Test transaction consistency

**Response Size Analysis**:
- ✅ Test different endpoint response sizes
- ✅ Verify reasonable payload sizes (10B - 10KB)
- ✅ Monitor bandwidth usage

**Caching Behavior**:
- ✅ Multiple identical requests for caching analysis
- ✅ Measure cache hit/miss patterns
- ✅ Test cache expiration

**Long Transaction Simulation**:
- ✅ Complex user journeys with multiple steps
- ✅ End-to-end transaction timing
- ✅ Multi-resource operations

**Thresholds**:
- **Average response time**: `<500ms`
- **90th percentile**: `<800ms`
- **95th percentile**: `<1000ms`
- `<1%` failed requests
- `>99%` of checks pass
- Data received: `<1MB` per VU
- Data sent: `<500KB` per VU

## 🛠️ Setup & Installation

### Prerequisites

1. Install [k6](https://k6.io/docs/get-started/installation/)
2. Node.js (for running supporting scripts)

```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Windows - Chocolatey)
choco install k6

# Install k6 (Linux - apt)
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## 🚀 Running Tests

### Run Load Tests

```bash
k6 run performance-tests/k6/load-test.js
```

### Run Stress Tests

```bash
k6 run performance-tests/k6/stress-test.js
```

### Run Security Tests

```bash
k6 run performance-tests/k6/security-test.js
```

### Run Performance Tests

```bash
k6 run performance-tests/k6/performance-test.js
```

### Run with Custom Environment Variables

```bash
K6_VUS=100 K6_DURATION=30s k6 run performance-tests/k6/load-test.js
```

### Run with Specific Base URL

```bash
BASE_URL=https://your-api.example.com k6 run performance-tests/k6/load-test.js
```

## 📊 Test Results & Reporting

### Console Output

k6 provides real-time metrics during test execution:

```
          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /  ‾‾\
   /          \   |  |\  \ |  |
  / __________ \  |__| \__\ \__|

  execution: local
     script: performance-tests/k6/load-test.js
     output: -

  scenarios: (100.00%) 1 scenario, 100 max VUs, 4m30s max duration (incl. graceful stop):
           * default: Up to 100 looping VUs for 4m0s over 5 stages (gracefulRampDown: 30s)

running (4m00.0s), 000/100 VUs, 1000 complete and 0 interrupted iterations
default ✓ [======================================] 000/100 VUs  4m0s

     ✓ checks.........................: 100.00% ✓ 4000      ✗ 0
     ✓ http_req_duration..............: avg=245.67ms min=45ms    med=189.5ms max=1.2s   p(90)=456.78ms p(95)=678.9ms
     ✓ http_req_failed................: 0.00%   ✓ 0        ✗ 1000
     data_received..................: 1.2 MB  4.8 kB/s
     data_sent......................: 650 kB  2.6 kB/s
     http_req_blocked...............: avg=1.23ms min=1µs     med=500µs  max=12.4ms p(90)=2.1ms   p(95)=3.5ms
     http_req_connecting............: avg=876µs  min=0s      med=0s     max=10.2ms p(90)=1.8ms   p(95)=2.9ms
     http_req_receiving.............: avg=123µs  min=45µs    med=98µs   max=1.1s   p(90)=245µs  p(95)=389µs
     http_req_sending...............: avg=45µs   min=12µs    med=38µs   max=245µs  p(90)=89µs   p(95)=132µs
     http_req_tls_handshaking.......: avg=0s     min=0s      med=0s     max=0s     p(90)=0s     p(95)=0s
     http_req_waiting...............: avg=244ms  min=44ms    med=188ms  max=1.2s   p(90)=455ms  p(95)=677ms
     http_reqs......................: 1000    4.166667/s
     iteration_duration.............: avg=1.25s  min=1.01s   med=1.18s max=2.45s  p(90)=1.56s  p(95)=1.89s
     iterations.....................: 1000    4.166667/s
     vus.............................: 50     min=0      max=100
     vus_max.........................: 100    min=100    max=100
```

### HTML Reports

Generate HTML reports using the k6 HTML reporter:

```bash
# Install k6 HTML reporter
npm install -g k6-reporter

# Run test with HTML output
k6 run performance-tests/k6/load-test.js --out html=reports/load-test-report.html
```

### JSON Output for CI/CD

```bash
k6 run performance-tests/k6/load-test.js --out json=reports/load-test-results.json
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://petstore.swagger.io/v2` | Base API URL |
| `AUTH_KEY` | `special-key` | API authentication key |

### Test Data Generation

The `config.js` file provides dynamic test data generation:

- **Pet Data**: Random IDs, names, and statuses
- **User Data**: Unique usernames, emails, and profiles
- **Order Data**: Random order details and quantities

### Custom Headers

All requests include standard headers:
```json
{
  "Content-Type": "application/json",
  "api_key": "{{AUTH_KEY}}",
  "Accept": "application/json"
}
```

## 📈 Performance Metrics Tracked

### Core Metrics

- **Response Times**: Average, median, 90th/95th percentiles
- **Request Success Rate**: Percentage of successful requests
- **Throughput**: Requests per second
- **Error Rates**: Failed request percentages
- **Data Transfer**: Bandwidth usage (sent/received)

### Custom Metrics

- Transaction completion times
- Batch operation performance
- Cache hit/miss ratios
- Concurrent operation efficiency

## 🎯 Best Practices

### Test Execution

1. **Start with Load Tests**: Establish baseline performance
2. **Run Stress Tests**: Identify breaking points
3. **Execute Security Tests**: Verify vulnerability protection
4. **Conduct Performance Tests**: Measure detailed metrics

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Performance Testing
  run: |
    npm install -g k6
    k6 run performance-tests/k6/load-test.js --out json=reports/load-test.json
    k6 run performance-tests/k6/security-test.js --out json=reports/security-test.json
```

### Monitoring

- Set up alerts for threshold violations
- Monitor long-term performance trends
- Compare results across deployments

## 🚨 Common Issues & Solutions

### Issue: High Error Rates

**Solution**: Check API health, verify authentication, review test data

### Issue: Slow Response Times

**Solution**: Optimize API, add caching, review database queries

### Issue: Rate Limiting (429 Errors)

**Solution**: Adjust test intensity, implement proper delays

### Issue: Memory Issues

**Solution**: Reduce VU count, optimize test scripts

## 📚 Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [k6 Results Analysis](https://k6.io/docs/results-analysis/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)

## 🔒 Security Notes

- Never commit real API keys or credentials
- Use environment variables for sensitive data
- Rotate test credentials regularly
- Review security test results carefully

## 📋 Changelog

**v1.0.0** (Current)
- Initial comprehensive k6 test suite
- Load, stress, security, and performance tests
- Complete documentation and examples
- Environment variable support
- Threshold-based validation

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Add new test scenarios with clear documentation
2. Maintain consistent coding style
3. Include appropriate thresholds
4. Update documentation for new features
5. Test changes thoroughly before committing