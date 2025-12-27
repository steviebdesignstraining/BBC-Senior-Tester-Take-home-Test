// k6 Stress Test - Backup version using HTTPBin for guaranteed data generation
import { group, sleep, check } from 'k6';
import http from 'k6/http';

// Stress test configuration with HTTPBin fallback
const stressTestConfig = {
  stages: [
    { duration: '30s', target: 100, name: 'ramp-up' },     // Rapid ramp-up
    { duration: '2m', target: 100, name: 'sustained' },    // Sustained load
    { duration: '30s', target: 200, name: 'overload' },    // Overload condition
    { duration: '2m', target: 200, name: 'extreme' },      // Extreme load
    { duration: '30s', target: 300, name: 'breaking' },    // Breaking point
    { duration: '1m', target: 300, name: 'failure' },      // Failure analysis
    { duration: '1m', target: 0, name: 'recovery' }        // Recovery period
  ],
  thresholds: {
    http_req_failed: ['rate<0.50'],      // Allow up to 50% failed requests (stress test tolerance)
    http_req_duration: ['p(95)<5000'],   // 95% of requests under 5s (relaxed for stress)
    checks: ['rate>0.50']               // 50% of checks pass (stress test tolerance)
  }
};

export const options = stressTestConfig;

export default function () {
  // Test HTTPBin under stress conditions
  group('HTTPBin Stress Tests', function () {
    // Rapid requests to test system under stress
    for (let i = 0; i < 5; i++) {
      const stressResponse = http.get('https://httpbin.org/get', {
        tags: { name: 'httpbin_stress' }
      });
      
      check(stressResponse, {
        'Stress GET status is 200': (r) => r.status === 200
      });
    }
    
    sleep(0.1);
  });

  // Test multiple concurrent requests
  group('Concurrent Request Tests', function () {
    const concurrentRequests = [];
    
    // Create multiple concurrent requests
    for (let i = 0; i < 10; i++) {
      concurrentRequests.push(
        http.asyncRequest('GET', `https://httpbin.org/delay/${Math.random()}`, null, {
          tags: { name: 'httpbin_concurrent' }
        })
      );
    }
    
    // Wait for all requests to complete
    const responses = http.batch(concurrentRequests);
    
    responses.forEach((response, index) => {
      check(response, {
        [`Concurrent request ${index} successful`]: (r) => r.status === 200
      });
    });
    
    sleep(0.1);
  });
  
  // Generate stress metrics
  group('Stress Metrics Generation', function () {
    for (let i = 0; i < 20; i++) {
      const metricResponse = http.get(`https://httpbin.org/anything?stress=${i}`, {
        tags: { name: 'stress_metrics' }
      });
      
      check(metricResponse, {
        'Stress metric request successful': (r) => r.status === 200
      });
      
      sleep(0.05);
    }
  });
}