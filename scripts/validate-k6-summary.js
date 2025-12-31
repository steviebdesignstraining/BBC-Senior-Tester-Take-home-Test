const fs = require('fs');

const file = 'site/reports/k6-summary.json';

if (!fs.existsSync(file)) {
    console.error('❌ Missing k6-summary.json');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));

let failed = false;

for (const test of data) {
    const total = test.totalRequests;
    const failedReqs = test.failedRequests;
    const successRate = parseFloat(test.successRate);

    if (total <= 0) {
        console.error(`❌ ${test.test}: totalRequests must be > 0`);
        failed = true;
    }

    const calculatedSuccess =
        total > 0 ? ((total - failedReqs) / total) * 100 : 0;

    if (Math.abs(calculatedSuccess - successRate) > 1) {
        console.error(`❌ ${test.test}: success rate mismatch`);
        failed = true;
    }

    if (test.p95 <= 0) {
        console.error(`❌ ${test.test}: invalid p95`);
        failed = true;
    }
}

if (failed) {
    console.error('❌ k6 summary validation failed');
    process.exit(1);
}

console.log('✅ k6 summary validation passed');