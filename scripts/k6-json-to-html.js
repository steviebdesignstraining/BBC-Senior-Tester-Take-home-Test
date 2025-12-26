#!/usr/bin/env node

/**
 * Converts k6 JSON output into a simple HTML report
 * Usage:
 *   node k6-json-to-html.js input.json output.html
 */

const fs = require("fs");
const path = require("path");

const [,, inputFile, outputFile] = process.argv;

if (!inputFile || !outputFile) {
  console.error("Usage: node k6-json-to-html.js <input.json> <output.html>");
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`Input file not found: ${inputFile}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

const metrics = data.metrics || {};
const checks = metrics.checks?.values || {};
const httpReqDuration = metrics.http_req_duration?.values || {};

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>k6 Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 2rem; }
    h1 { color: #d32f2f; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #ccc; padding: 8px; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>k6 Performance Report</h1>
  <p><strong>Generated:</strong> ${new Date().toISOString()}</p>

  <h2>Checks</h2>
  <pre>${JSON.stringify(checks, null, 2)}</pre>

  <h2>HTTP Request Duration</h2>
  <pre>${JSON.stringify(httpReqDuration, null, 2)}</pre>

  <h2>Raw Metrics</h2>
  <pre>${JSON.stringify(metrics, null, 2)}</pre>
</body>
</html>
`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, html);

console.log(`✅ k6 HTML report generated: ${outputFile}`);