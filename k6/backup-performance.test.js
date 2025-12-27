// k6 Performance Test - Backup version using HTTPBin for guaranteed data generation
import { group, sleep, check } from 'k6';
import http from 'k6/http';

// Performance test configuration with HTTPBin fallback
const performanceTestConfig = {
  stages: [
    { duration: '30s', target: 10, name: 'ramp-up' },      // Light load
    { duration: '1m', target: 10, name: 'steady' },        // Steady state
    { duration: '30s', target: 50, name: 'medium-load' },  // Medium load
    { duration: '1m', target: 50, name: 'sustained' },     // Sustained medium load
    { duration: '30s', target: 100, name: 'high-load' },   // High load
    { duration: '1m', target: 100, name: 'peak' },         // Peak load
    { duration: '30s', target: 0, name: 'ramp-down' }      // Cooldown
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],      // Allow up to 5% failed requests
    http_req_duration: ['p(95)<2000'],   // 95% of requests under 2s
    checks: ['rate>0.95']               // 95% of checks pass
  }
};

export const options = performanceTestConfig;

export default function () {
  // Test HTTPBin endpoints for guaranteed responses
  group('HTTPBin Performance Tests', function () {
    // Fast GET request
    const fastResponse = http.get('https://httpbin.org/get', {
      tags: { name: 'httpbin_performance_fast' }
    });
    check(fastResponse, {
      'Fast GET status is 200': (r) => r.status === 200,
      'Fast GET response time < 1s': (r) => r.timings.duration < 1000
    });
    
    // POST request with data
    const postResponse = http.post('https://httpbin.org/post', JSON.stringify({
      performance: 'test',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'httpbin_performance_post' }
    });
    check(postResponse, {
      'POST status is 200': (r) => r.status === 200,
      'POST response time < 2s': (r) => r.timings.duration < 2000
    });
    
    sleep(0.5);
  });

  // Test response times under load
  group('Response Time Tests', function () {
    const endpoints = [
      'https://httpbin.org/delay/0.1',
      'https://httpbin.org/delay/0.5',
      'https://httpbin.org/delay/1.0'
    ];
    
    endpoints.forEach((endpoint, index) => {
      const response = http.get(endpoint, {
        tags: { name: `httpbin_delay_${index}` }
      });
      
      check(response, {
        [`Delay ${index} status is 200`]: (r) => r.status === 200,
        [`Delay ${index} response time acceptable`]: (r) => r.timings.duration < 3000
      });
      
      sleep(0.2);
    });
  });
  
  // Generate performance metrics
  group('Performance Metrics Generation', function () {
    for (let i = 0; i < 5; i++) {
      const metricResponse = http.get(`https://httpbin.org/anything?test=${i}`, {
        tags: { name: 'performance_metrics' }
      });
      
      check(metricResponse, {
        'Metric request successful': (r) => r.status === 200,
        'Metric response time acceptable': (r) => r.timings.duration < 2000
      });
      
      sleep(0.1);
    }
  });
}