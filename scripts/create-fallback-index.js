#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create fallback index.html
const fallbackHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QA Test Reports</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .meta-info { background: #e9ecef; padding: 15px; border-radius: 6px; margin-top: 20px; }
        .meta-info p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>QA Test Reports Dashboard</h1>
        <div class="status info">
            <h2>ℹ️ Tests Running</h2>
            <p>Playwright and k6 tests are currently executing. Reports will be available shortly.</p>
        </div>
        <div class="meta-info">
            <h3>Build Information</h3>
            <p><strong>Workflow:</strong> ${process.env.GITHUB_WORKFLOW || 'QA CI Pipeline'}</p>
            <p><strong>Branch:</strong> ${process.env.GITHUB_REF_NAME || 'unknown'}</p>
            <p><strong>Run:</strong> #${process.env.GITHUB_RUN_NUMBER || 'unknown'}</p>
            <p><strong>Commit:</strong> ${process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : 'unknown'}</p>
            <p><strong>Event:</strong> ${process.env.GITHUB_EVENT_NAME || 'unknown'}</p>
        </div>
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
            <p>Reports will be updated automatically when tests complete.</p>
        </div>
    </div>
</body>
</html>`;

// Ensure site directory exists
const siteDir = path.join(__dirname, '..', 'site');
if (!fs.existsSync(siteDir)) {
    fs.mkdirSync(siteDir, { recursive: true });
}

// Write the fallback HTML
fs.writeFileSync(path.join(siteDir, 'index.html'), fallbackHTML);

console.log('✅ Created fallback index.html');