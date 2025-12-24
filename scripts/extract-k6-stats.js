const fs = require('fs');
const path = require('path');

const files = {
  load: 'performance-tests/k6/results/load.json',
  stress: 'performance-tests/k6/results/stress.json',
  perf: 'performance-tests/k6/results/performance.json'
};

const output = {};

for (const [key, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    output[key] = 0;
    continue;
  }

  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  output[key] = data.metrics.checks?.passes || 0;
}

fs.writeFileSync(
  'stats/k6.json',
  JSON.stringify(output, null, 2)
);