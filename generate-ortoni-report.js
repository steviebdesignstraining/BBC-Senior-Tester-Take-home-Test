#!/usr/bin/env node

const { execSync } = require('child_process');

async function generateReport() {
  // Generate the Ortoni report by running Playwright tests with the Ortoni reporter
  try {
    console.log('Generating Ortoni report...');
    // Run Playwright tests with the Ortoni reporter
    execSync('npx playwright test --reporter=ortoni-report', { stdio: 'inherit' });
    console.log('Ortoni report generated successfully!');
  } catch (error) {
    console.error('Error generating Ortoni report:', error.message);
    process.exit(1);
  }
}

generateReport();