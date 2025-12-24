/**
 * Ortoni Report Configuration
 * Configuration for generating HTML reports using Ortoni
 */

module.exports = {
  // Report output configuration
  output: {
    dir: './reports',
    filename: 'ortoni-report.html',
    open: false // Will be handled by --launch flag
  },
  
  // Report metadata
  metadata: {
    title: 'BBC Senior Tester Take-home Test - Ortoni Report',
    description: 'Comprehensive test results and analysis',
    project: 'BBC Senior Tester Take-home Test',
    version: '1.0.0'
  },
  
  // Test results configuration
  tests: {
    // Include Playwright test results
    playwright: {
      enabled: true,
      reportDir: './playwright-report',
      jsonReport: './playwright-report/results.json'
    },
    
    // Include k6 performance test results
    k6: {
      enabled: true,
      reportDir: './performance-tests/k6/reports',
      files: [
        'load-test-report.html',
        'stress-test-report.html', 
        'security-test-report.html',
        'performance-test-report.html'
      ]
    }
  },
  
  // Report sections configuration
  sections: {
    summary: {
      enabled: true,
      title: 'Test Summary'
    },
    details: {
      enabled: true,
      title: 'Detailed Results'
    },
    performance: {
      enabled: true,
      title: 'Performance Metrics',
      k6Reports: true
    },
    recommendations: {
      enabled: true,
      title: 'Recommendations'
    }
  },
  
  // Styling configuration
  styling: {
    theme: 'bbc', // Custom BBC theme
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/BBC_Logo_2021.svg/320px-BBC_Logo_2021.svg.png',
    colors: {
      primary: '#006699',
      secondary: '#0099cc',
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b'
    }
  },
  
  // Cross-linking configuration
  crossLinking: {
    enabled: true,
    links: [
      {
        text: 'Playwright Test Report',
        url: './playwright-report/index.html'
      },
      {
        text: 'k6 Load Test Report',
        url: './performance-tests/k6/reports/load-test-report.html'
      },
      {
        text: 'k6 Stress Test Report',
        url: './performance-tests/k6/reports/stress-test-report.html'
      },
      {
        text: 'k6 Security Test Report',
        url: './performance-tests/k6/reports/security-test-report.html'
      },
      {
        text: 'k6 Performance Test Report',
        url: './performance-tests/k6/reports/performance-test-report.html'
      },
      {
        text: 'k6 Reports Index',
        url: './performance-tests/k6/reports/index.html'
      }
    ]
  }
};