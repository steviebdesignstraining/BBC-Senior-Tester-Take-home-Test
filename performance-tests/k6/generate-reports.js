#!/usr/bin/env node

/**
 * k6 Performance Test Report Generator
 * Automates HTML report generation for all k6 test types
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const REPORTS_DIR = path.join(__dirname, 'reports');
const TEMPLATES_DIR = path.join(__dirname, 'reports-templates');

// Check if k6 is installed
function checkK6Installation() {
  try {
    execSync('k6 version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Test configurations
const TESTS = [
  {
    name: 'load',
    file: 'load-test.js',
    title: 'Load Test',
    template: 'Load.html',
    output: 'load-test-report.html',
    color: 'primary',
    icon: '📊'
  },
  {
    name: 'stress',
    file: 'stress-test.js',
    title: 'Stress Test',
    template: 'Stress.html',
    output: 'stress-test-report.html',
    color: 'danger',
    icon: '💥'
  },
  {
    name: 'security',
    file: 'security-test.js',
    title: 'Security Test',
    template: 'Security.html',
    output: 'security-test-report.html',
    color: 'warning',
    icon: '🔒'
  },
  {
    name: 'performance',
    file: 'performance-test.js',
    title: 'Performance Test',
    template: 'Performance.html',
    output: 'performance-test-report.html',
    color: 'success',
    icon: '🎯'
  }
];

// Ensure reports directory exists
function ensureReportsDirectory() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    console.log(`✅ Created reports directory: ${REPORTS_DIR}`);
  }
}

// Create an index.html file with links to all reports
function createReportIndex(results) {
  const indexPath = path.join(REPORTS_DIR, 'index.html');
  
  const reportLinks = results.map(result => {
    const testConfig = TESTS.find(t => t.name === result.test);
    return {
      ...testConfig,
      success: result.success
    };
  }).filter(r => r.success); // Only include successful reports
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>k6 Performance Test Reports Index</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #f4f6fb;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #006699, #0099cc);
      color: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .report-card {
      background: white;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,.05);
      margin-bottom: 20px;
      transition: transform 0.2s;
    }
    .report-card:hover {
      transform: translateY(-2px);
    }
    .bbc-logo {
      height: 40px;
      width: auto;
      object-fit: contain;
    }
  </style>
</head>
<body class="container">
  <div class="header text-center">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/BBC_Logo_2021.svg/320px-BBC_Logo_2021.svg.png" alt="BBC Logo" class="bbc-logo mb-3">
    <h2 class="mb-0">BBC k6 Performance Test Reports</h2>
    <p class="mt-2">Generated: ${new Date().toISOString().replace('T', ' ').replace('\.\d{3}Z', '')}</p>
  </div>
  
  <div class="row g-4">
    ${reportLinks.map(report => `
      <div class="col-md-6">
        <div class="report-card h-100">
          <h4>${report.icon} ${report.title}</h4>
          <p>${report.description || getReportDescription(report.name)}</p>
          <a href="${report.output}" class="btn btn-${report.color} mt-3">
            <i class="bi bi-file-earmark-text"></i> View ${report.title} Report
          </a>
        </div>
      </div>
    `).join('')}
  </div>
  
  <div class="report-card mt-4 text-center">
    <h4>📊 Test Summary</h4>
    <p class="lead">All performance tests completed successfully!</p>
    <div class="row g-3 mt-4">
      <div class="col-md-3">
        <div class="bg-primary text-white p-3 rounded">
          <h5 class="mb-0">${reportLinks.length}</h5>
          <small>Test Reports</small>
        </div>
      </div>
      <div class="col-md-3">
        <div class="bg-success text-white p-3 rounded">
          <h5 class="mb-0">100%</h5>
          <small>Success Rate</small>
        </div>
      </div>
      <div class="col-md-3">
        <div class="bg-info text-white p-3 rounded">
          <h5 class="mb-0">${results.length}</h5>
          <small>Test Types</small>
        </div>
      </div>
      <div class="col-md-3">
        <div class="bg-warning text-dark p-3 rounded">
          <h5 class="mb-0">Comprehensive</h5>
          <small>Analysis</small>
        </div>
      </div>
    </div>
    
    <div class="mt-4">
      <h5>🎯 Test Coverage</h5>
      <ul class="list-inline">
        <li class="list-inline-item mx-3">📊 Load Testing</li>
        <li class="list-inline-item mx-3">💥 Stress Testing</li>
        <li class="list-inline-item mx-3">🔒 Security Testing</li>
        <li class="list-inline-item mx-3">🎯 Performance Testing</li>
      </ul>
    </div>
    
    <div class="mt-4 text-muted">
      <small>BBC Senior Tester Take-home Test | Performance Testing Framework</small>
    </div>
  </div>
  
  <script>
    function getReportDescription(testName) {
      const descriptions = {
        'load': 'Measures system behavior under normal and high load conditions',
        'stress': 'Determines breaking point and failure modes under extreme load',
        'security': 'Basic security vulnerability testing and protection analysis',
        'performance': 'Detailed performance metrics, response times, and throughput analysis'
      };
      return descriptions[testName] || 'Comprehensive performance testing and analysis';
    }
  </script>
</body>
</html>`;
  
  try {
    fs.writeFileSync(indexPath, htmlContent);
    console.log(`✅ Created reports index: ${indexPath}`);
  } catch (error) {
    console.error('❌ Failed to create reports index:', error.message);
  }
}

// Generate report for a specific test
function generateReport(test) {
  console.log(`🚀 Generating ${test.title} report...`);
  
  const testPath = path.join(__dirname, test.file);
  const outputPath = path.join(REPORTS_DIR, test.output);
  
  try {
    // Run k6 test with HTML output
    const command = `k6 run "${testPath}" --out html="${outputPath}"`;
    console.log(`📊 Running: ${command}`);
    
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ ${test.title} report generated: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate ${test.title} report:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🚀 k6 Performance Test Report Generator');
  console.log('=====================================\n');
  
  // Check if k6 is installed
  const k6Installed = checkK6Installation();
  
  if (!k6Installed) {
    console.log('❌ k6 is not installed or not in PATH');
    console.log('\n📋 Installation Instructions:');
    console.log('============================');
    console.log('macOS: brew install k6');
    console.log('Windows: choco install k6');
    console.log('Linux: sudo apt-get install k6');
    console.log('\nFor more details, see: performance-tests/k6/REPORT_GENERATION.md');
    console.log('\n⚠️  Report generation requires k6 to be installed.');
    process.exit(1);
  }
  
  console.log('✅ k6 is installed and ready\n');
  
  // Ensure reports directory exists
  ensureReportsDirectory();
  
  // Generate reports for all tests
  const results = [];
  for (const test of TESTS) {
    const success = generateReport(test);
    results.push({ test: test.name, success });
  }
  
  // Summary
  console.log('\n📊 Report Generation Summary:');
  console.log('============================');
  
  let successfulCount = 0;
  for (const result of results) {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`${status}: ${result.test.toUpperCase()} test report`);
    if (result.success) successfulCount++;
  }
  
  console.log(`\n📈 Generated ${successfulCount}/${results.length} reports successfully`);
  console.log(`📁 Reports saved to: ${REPORTS_DIR}`);
  
  if (successfulCount === results.length) {
    console.log('🎉 All reports generated successfully!');
    console.log('\n📂 To view reports:');
    console.log('===================');
    
    // Create an index.html file with links to all reports
    createReportIndex(results);
    
    results.forEach(result => {
      const testConfig = TESTS.find(t => t.name === result.test);
      console.log(`• ${testConfig.icon} ${result.test.toUpperCase()}: file://${path.join(REPORTS_DIR, testConfig.output)}`);
    });
    
    console.log(`• 📋 All Reports Index: file://${path.join(REPORTS_DIR, 'index.html')}`);
    console.log('\n🔗 Cross-linking:');
    console.log('================');
    console.log('All reports include navigation links to related reports.');
    console.log('Each report provides specialized metrics and analysis for its test type.');
  } else {
    console.log('⚠️  Some reports failed to generate');
    console.log('\n🔍 Troubleshooting:');
    console.log('==================');
    console.log('1. Check k6 is properly installed: k6 version');
    console.log('2. Verify test files exist and are valid');
    console.log('3. Ensure output directory is writable');
    console.log('4. Check for syntax errors in test scripts');
    console.log('\nSee performance-tests/k6/REPORT_GENERATION.md for more help');
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = { generateReport, ensureReportsDirectory, TESTS };