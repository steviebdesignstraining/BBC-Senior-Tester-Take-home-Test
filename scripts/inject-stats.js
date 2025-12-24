const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const pw = JSON.parse(fs.readFileSync('stats/playwright.json'));
const k6 = JSON.parse(fs.readFileSync('stats/k6.json'));

const replacements = {
  '{{PW_PASSED}}': pw.passed,
  '{{PW_FAILED}}': pw.failed,
  '{{K6_LOAD_PASSED}}': k6.load,
  '{{K6_STRESS_PASSED}}': k6.stress,
  '{{K6_PERF_PASSED}}': k6.perf,
  '{{LAST_UPDATED}}': new Date().toISOString(),
  '{{RUN_ID}}': process.env.GITHUB_RUN_NUMBER || 'local'
};

for (const [key, value] of Object.entries(replacements)) {
  html = html.replaceAll(key, String(value));
}

fs.writeFileSync('index.html', html);