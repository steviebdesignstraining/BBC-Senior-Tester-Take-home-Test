const fs = require('fs');
const path = require('path');

const run = process.env.GITHUB_RUN_NUMBER || 'local';
const dir = `history/${run}`;

fs.mkdirSync(dir, { recursive: true });

fs.copyFileSync('index.html', `${dir}/index.html`);
fs.copyFileSync('stats/playwright.json', `${dir}/stats.json`);