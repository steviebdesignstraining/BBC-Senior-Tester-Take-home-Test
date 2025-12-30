const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Fetch GitHub Actions workflow data
 */
async function fetchGitHubData() {
    const repo = process.env.GITHUB_REPOSITORY || 'steviebdesignstraining/BBC-Senior-Tester-Take-home-Test';
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
        console.warn('⚠️  GITHUB_TOKEN not found, using public API (rate limited)');
    }
    
    const headers = token ? {
        'Authorization': `token ${token}`,
        'User-Agent': 'BBC-Test-Dashboard'
    } : {
        'User-Agent': 'BBC-Test-Dashboard'
    };

    try {
        // Fetch workflow runs
        const workflowRuns = await fetchJSON(`/repos/${repo}/actions/runs?per_page=10`, headers);
        
        if (!workflowRuns || !workflowRuns.workflow_runs || workflowRuns.workflow_runs.length === 0) {
            console.warn('⚠️  No workflow runs found');
            return null;
        }

        // Get the latest run
        const latestRun = workflowRuns.workflow_runs[0];
        
        // Fetch jobs for the latest run
        const jobs = await fetchJSON(`/repos/${repo}/actions/runs/${latestRun.id}/jobs`, headers);
        
        // Analyze job statuses
        const jobStatuses = {
            playwright: 'UNKNOWN',
            k6: 'UNKNOWN'
        };
        
        if (jobs && jobs.jobs) {
            jobs.jobs.forEach(job => {
                if (job.name.toLowerCase().includes('playwright')) {
                    jobStatuses.playwright = job.status === 'completed' ? 
                        (job.conclusion === 'success' ? 'PASSED' : 'FAILED') : 'RUNNING';
                }
                if (job.name.toLowerCase().includes('k6')) {
                    jobStatuses.k6 = job.status === 'completed' ? 
                        (job.conclusion === 'success' ? 'PASSED' : 'FAILED') : 'RUNNING';
                }
            });
        }

        // Calculate overall pipeline status
        let pipelineStatus = 'RUNNING';
        if (jobStatuses.playwright === 'FAILED' || jobStatuses.k6 === 'FAILED') {
            pipelineStatus = 'FAILED';
        } else if (jobStatuses.playwright === 'PASSED' && jobStatuses.k6 === 'PASSED') {
            pipelineStatus = 'PASSED';
        }

        const data = {
            repo: repo,
            run: {
                id: latestRun.id,
                number: latestRun.run_number,
                status: pipelineStatus,
                conclusion: latestRun.conclusion,
                created_at: latestRun.created_at,
                updated_at: latestRun.updated_at,
                head_sha: latestRun.head_sha,
                head_branch: latestRun.head_branch,
                event: latestRun.event,
                workflow_id: latestRun.workflow_id,
                workflow_name: latestRun.name
            },
            jobs: jobStatuses,
            timestamp: new Date().toISOString()
        };

        console.log('✅ GitHub data fetched successfully');
        console.log(`   Run: #${data.run.number}`);
        console.log(`   Status: ${data.run.status}`);
        console.log(`   Playwright: ${data.jobs.playwright}`);
        console.log(`   k6: ${data.jobs.k6}`);
        
        return data;
    } catch (error) {
        console.error('❌ Error fetching GitHub data:', error.message);
        return null;
    }
}

/**
 * Fetch JSON from GitHub API
 */
function fetchJSON(endpoint, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = `https://api.github.com${endpoint}`;
        
        const options = {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                ...headers
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * Save GitHub data to file
 */
function saveGitHubData(data) {
    // Check if we're running from test-output directory (integration test)
    const cwd = process.cwd();
    const isTestOutput = cwd.includes('test-output');

    let siteDir, reportsDir;

    if (isTestOutput) {
        // Adjust paths for integration test environment
        siteDir = path.join(cwd, 'site');
        reportsDir = path.join(siteDir, 'reports');
    } else {
        // Normal paths from project root
        siteDir = path.join(__dirname, '..', 'site');
        reportsDir = path.join(siteDir, 'reports');
    }

    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const githubDataFile = path.join(reportsDir, 'github-data.json');
    fs.writeFileSync(githubDataFile, JSON.stringify(data, null, 2));

    console.log(`✓ GitHub data saved to: ${githubDataFile}`);
}

/**
 * Get fallback data when GitHub API is not available
 */
function getFallbackData() {
    return {
        repo: process.env.GITHUB_REPOSITORY || 'steviebdesignstraining/BBC-Senior-Tester-Take-home-Test',
        run: {
            id: process.env.GITHUB_RUN_ID || 'unknown',
            number: process.env.GITHUB_RUN_NUMBER || 'unknown',
            status: 'RUNNING',
            conclusion: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            head_sha: process.env.GITHUB_SHA || 'unknown',
            head_branch: process.env.GITHUB_REF_NAME || 'main',
            event: process.env.GITHUB_EVENT_NAME || 'push',
            workflow_id: 'unknown',
            workflow_name: process.env.GITHUB_WORKFLOW || 'QA CI Pipeline'
        },
        jobs: {
            playwright: process.env.PLAYWRIGHT_STATUS || 'RUNNING',
            k6: process.env.K6_STATUS || 'RUNNING'
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * Main function
 */
async function main() {
    console.log('📡 Fetching GitHub Actions data...');
    
    let githubData;
    
    // Try to fetch from GitHub API
    if (process.env.GITHUB_ACTIONS) {
        githubData = await fetchGitHubData();
    }
    
    // Use fallback data if API fetch failed or not in GitHub Actions
    if (!githubData) {
        console.log('⚠️  Using fallback data');
        githubData = getFallbackData();
    }
    
    // Save the data
    saveGitHubData(githubData);
    
    return githubData;
}

// Export for use in other scripts
module.exports = { main, fetchGitHubData, getFallbackData };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}