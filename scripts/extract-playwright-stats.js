const fs = require('fs');

const report = JSON.parse(
  fs.readFileSync('reports/ortoni-report.json', 'utf8')
);

const passed = report.stats.expected || 0;
const failed = report.stats.unexpected || 0;

fs.writeFileSync(
  'stats/playwright.json',
  JSON.stringify({ passed, failed }, null, 2)
);