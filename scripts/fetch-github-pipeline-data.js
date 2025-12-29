const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Enhanced script to fetch detailed GitHub Actions pipeline data
 * Specifically targets the latest CI/CD pipeline run and extracts k6 performance test results
 */

async function fetchGitHubPipelineData() {
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
        console.log('🔍 Fetching latest CI/CD pipeline run data...');
        
        // Fetch workflow runs - specifically look for the QA CI Pipeline
        const workflowRuns = await fetchJSON(`/repos/${repo}/actions/runs?per_page=5`, headers);
        
        if (!workflowRuns || !workflowRuns.workflow_runs || workflowRuns.workflow_runs.length === 0) {
            console.warn('⚠️  No workflow runs found');
            return null;
        }
        
        // Find the latest QA CI Pipeline run
        const qaRuns = workflowRuns.workflow_runs.filter(run => 
            run.name === 'QA CI Pipeline' || run.name.includes('QA')
        );
        
        if (qaRuns.length === 0) {
            console.warn('⚠️  No QA CI Pipeline runs found');
            return null;
        }
        
        // Get the most recent QA CI Pipeline run
        const latestRun = qaRuns[0];
        console.log(`📊 Found latest QA CI Pipeline run: #${latestRun.run_number} (${latestRun.id})`);
        
        // Fetch detailed information about this specific run
        const runDetails = await fetchJSON(`/repos/${repo}/actions/runs/${latestRun.id}`, headers);
        
        // Fetch jobs for this run to get k6 test matrix results
        const jobs = await fetchJSON(`/repos/${repo}/actions/runs/${latestRun.id}/jobs`, headers);
        
        // Analyze job statuses with focus on k6 performance tests
        const jobStatuses = {
            playwright: 'UNKNOWN',
            k6: 'UNKNOWN'
        };
        
        const k6TestResults = {
            load: { status: 'UNKNOWN', conclusion: 'UNKNOWN' },
            performance: { status: 'UNKNOWN', conclusion: 'UNKNOWN' },
            stress: { status: 'UNKNOWN', conclusion: 'UNKNOWN' },
            security: { status: 'UNKNOWN', conclusion: 'UNKNOWN' }
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
                    
                    // Extract specific k6 test type from matrix
                    if (job.name.includes('load')) {
                        k6TestResults.load = { status: job.status, conclusion: job.conclusion };
                    } else if (job.name.includes('performance')) {
                        k6TestResults.performance = { status: job.status, conclusion: job.conclusion };
                    } else if (job.name.includes('stress')) {
                        k6TestResults.stress = { status: job.status, conclusion: job.conclusion };
                    } else if (job.name.includes('security')) {
                        k6TestResults.security = { status: job.status, conclusion: job.conclusion };
                    }
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
        
        // Fetch artifacts to get k6 performance test results
        const artifacts = await fetchJSON(`/repos/${repo}/actions/runs/${latestRun.id}/artifacts`, headers);
        
        const k6Artifacts = [];
        if (artifacts && artifacts.artifacts) {
            artifacts.artifacts.forEach(artifact => {
                if (artifact.name.includes('k6-reports')) {
                    k6Artifacts.push({
                        name: artifact.name,
                        id: artifact.id,
                        size: artifact.size_in_bytes,
                        created_at: artifact.created_at,
                        expires_at: artifact.expires_at
                    });
                }
            });
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
                workflow_name: latestRun.name,
                html_url: latestRun.html_url,
                run_attempt: latestRun.run_attempt
            },
            jobs: jobStatuses,
            k6_tests: k6TestResults,
            artifacts: {
                k6_reports: k6Artifacts,
                total_count: artifacts ? artifacts.total_count : 0
            },
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ GitHub pipeline data fetched successfully');
        console.log(`   Run: #${data.run.number} (${data.run.id})`);
        console.log(`   Status: ${data.run.status}`);
        console.log(`   URL: ${data.run.html_url}`);
        console.log(`   Playwright: ${data.jobs.playwright}`);
        console.log(`   k6: ${data.jobs.k6}`);
        console.log(`   k6 Test Results:`);
        console.log(`     - Load: ${k6TestResults.load.conclusion}`);
        console.log(`     - Performance: ${k6TestResults.performance.conclusion}`);
        console.log(`     - Stress: ${k6TestResults.stress.conclusion}`);
        console.log(`     - Security: ${k6TestResults.security.conclusion}`);
        console.log(`   Artifacts: ${k6Artifacts.length} k6 report artifacts found`);
        
        return data;
    } catch (error) {
        console.error('❌ Error fetching GitHub pipeline data:', error.message);
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
 * Save pipeline data to file
 */
function savePipelineData(data) {
    const siteDir = path.join(__dirname, '..', 'site');
    const reportsDir = path.join(siteDir, 'reports');
    
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const pipelineDataFile = path.join(reportsDir, 'pipeline-data.json');
    fs.writeFileSync(pipelineDataFile, JSON.stringify(data, null, 2));
    
    console.log(`✓ Pipeline data saved to: ${pipelineDataFile}`);
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
            workflow_name: process.env.GITHUB_WORKFLOW || 'QA CI Pipeline',
            html_url: 'https://github.com/steviebdesignstraining/BBC-Senior-Tester-Take-home-Test/actions',
            run_attempt: 1
        },
        jobs: {
            playwright: process.env.PLAYWRIGHT_STATUS || 'RUNNING',
            k6: process.env.K6_STATUS || 'RUNNING'
        },
        k6_tests: {
            load: { status: 'UNKNOWN', conclusion: 'UNKNOWN' },
            performance: { status: 'UNKNOWN', conclusion: 'UNKNOWN' },
            stress: { status: 'UNKNOWN', conclusion: 'UNKNOWN' },
            security: { status: 'UNKNOWN', conclusion: 'UNKNOWN' }
        },
        artifacts: {
            k6_reports: [],
            total_count: 0
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * Main function
 */
async function main() {
    console.log('🔧 Fetching detailed GitHub Actions pipeline data...');
    
    let pipelineData;
    
    // Try to fetch from GitHub API
    if (process.env.GITHUB_ACTIONS) {
        pipelineData = await fetchGitHubPipelineData();
    }
    
    // Use fallback data if API fetch failed or not in GitHub Actions
    if (!pipelineData) {
        console.log('⚠️  Using fallback pipeline data');
        pipelineData = getFallbackData();
    }
    
    // Save the data
    savePipelineData(pipelineData);
    
    return pipelineData;
}

// Export for use in other scripts
module.exports = { main, fetchGitHubPipelineData, getFallbackData };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}