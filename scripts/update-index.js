const fs = require('fs');
const path = require('path');

// Template for the main dashboard
const dashboardTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Reports Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        .card {
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .report-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .category-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 0.5rem;
            margin-bottom: 2rem;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-passed {
            background-color: #28a745;
        }
        .status-failed {
            background-color: #dc3545;
        }
        .status-warning {
            background-color: #ffc107;
        }
        .pipeline-info {
            font-size: 0.9rem;
            color: #666;
            margin-top: 10px;
        }
    </style>
</head>
<body class="bg-light">
    <div class="container py-5">
        <div class="category-header text-center">
            <h1 class="display-4 fw-bold"><i class="bi bi-speedometer2"></i> Test Reports Dashboard</h1>
            <p class="lead">BBC Senior Tester Take-home Test - Automated Test Results</p>
        </div>

        <!-- Pipeline Status -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="card-title mb-2">
                                    <span class="status-indicator {{PIPELINE_STATUS_CLASS}}"></span>
                                    {{PIPELINE_STATUS_TEXT}}
                                </h5>
                                <div class="pipeline-info">
                                    <div class="row">
                                        <div class="col-md-3">
                                            <strong>Playwright:</strong>
                                            <span class="badge {{PLAYWRIGHT_STATUS_CLASS}}">{{PLAYWRIGHT_STATUS}}</span>
                                        </div>
                                        <div class="col-md-3">
                                            <strong>k6 Tests:</strong>
                                            <span class="badge {{K6_STATUS_CLASS}}">{{K6_STATUS}}</span>
                                        </div>
                                        <div class="col-md-3">
                                            <strong>Workflow:</strong> {{WORKFLOW_NAME}}
                                        </div>
                                        <div class="col-md-3">
                                            <strong>Branch:</strong> {{BRANCH}}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="text-end">
                                <div class="text-muted small">
                                    <div>Run: #{{RUN_NUMBER}}</div>
                                    <div>Commit: {{COMMIT_SHORT}}</div>
                                    <div>Last Run: {{LAST_RUN}}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Build Information -->
        <div class="row mb-5">
            <div class="col-12">
                <h2 class="mb-4"><i class="bi bi-info-circle"></i> Build Information</h2>
            </div>
            <div class="col-md-3 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-calendar-event report-icon text-primary"></i>
                        <h5 class="card-title">Last Run</h5>
                        <p class="card-text">{{LAST_RUN}}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-hash report-icon text-success"></i>
                        <h5 class="card-title">Commit</h5>
                        <p class="card-text">{{COMMIT_SHORT}}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-gear report-icon text-warning"></i>
                        <h5 class="card-title">Run</h5>
                        <p class="card-text">#{{RUN_NUMBER}}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-branch report-icon text-info"></i>
                        <h5 class="card-title">Branch</h5>
                        <p class="card-text">{{BRANCH}}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-diagram-3 report-icon text-danger"></i>
                        <h5 class="card-title">Workflow</h5>
                        <p class="card-text">{{WORKFLOW_NAME}}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-cloud-arrow-up report-icon text-secondary"></i>
                        <h5 class="card-title">Event</h5>
                        <p class="card-text">{{EVENT}}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-globe report-icon text-dark"></i>
                        <h5 class="card-title">Environment</h5>
                        <p class="card-text">{{ENVIRONMENT}}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Playwright Test Reports -->
        <div class="row mb-5">
            <div class="col-12">
                <h2 class="mb-4"><i class="bi bi-bug"></i> Playwright Test Reports</h2>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-house report-icon text-primary"></i>
                        <h5 class="card-title">Pet Tests</h5>
                        <p class="card-text">Playwright tests for Pet API endpoints</p>
                        <a href="{{ORTONI_LINK}}" class="btn btn-primary" target="_blank">
                            <i class="bi bi-eye"></i> View Report
                        </a>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-shop report-icon text-success"></i>
                        <h5 class="card-title">Store Tests</h5>
                        <p class="card-text">Playwright tests for Store API endpoints</p>
                        <a href="{{ORTONI_LINK}}" class="btn btn-success" target="_blank">
                            <i class="bi bi-eye"></i> View Report
                        </a>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-person report-icon text-info"></i>
                        <h5 class="card-title">User Tests</h5>
                        <p class="card-text">Playwright tests for User API endpoints</p>
                        <a href="{{ORTONI_LINK}}" class="btn btn-info" target="_blank">
                            <i class="bi bi-eye"></i> View Report
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Ortoni Report -->
        <div class="row mb-5">
            <div class="col-12">
                <h2 class="mb-4"><i class="bi bi-clipboard-data"></i> Comprehensive Test Report</h2>
            </div>
            <div class="col-12">
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="bi bi-graph-up report-icon text-warning"></i>
                        <h5 class="card-title">Ortoni HTML Report</h5>
                        <p class="card-text">Combined test report with all Playwright and k6 test results</p>
                        <a href="{{ORTONI_LINK}}" class="btn btn-warning btn-lg" target="_blank">
                            <i class="bi bi-eye"></i> View Ortoni Report
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- k6 Performance Test Reports -->
        <div class="row mb-5">
            <div class="col-12">
                <h2 class="mb-4"><i class="bi bi-lightning"></i> k6 Performance Test Reports</h2>
            </div>
            <div class="col-md-3 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-arrow-up-right report-icon text-danger"></i>
                        <h5 class="card-title">Load Test</h5>
                        <p class="card-text">Performance test under expected load</p>
                        <a href="{{K6_LOAD}}" class="btn btn-danger" target="_blank">
                            <i class="bi bi-eye"></i> View Report
                        </a>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-battery-full report-icon text-warning"></i>
                        <h5 class="card-title">Stress Test</h5>
                        <p class="card-text">Performance test under extreme load</p>
                        <a href="{{K6_STRESS}}" class="btn btn-warning" target="_blank">
                            <i class="bi bi-eye"></i> View Report
                        </a>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-shield-check report-icon text-success"></i>
                        <h5 class="card-title">Security Test</h5>
                        <p class="card-text">Security-focused performance tests</p>
                        <a href="{{K6_SECURITY}}" class="btn btn-success" target="_blank">
                            <i class="bi bi-eye"></i> View Report
                        </a>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-speedometer report-icon text-primary"></i>
                        <h5 class="card-title">Performance Test</h5>
                        <p class="card-text">General performance benchmark tests</p>
                        <a href="{{K6_PERFORMANCE}}" class="btn btn-primary" target="_blank">
                            <i class="bi bi-eye"></i> View Report
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="row">
            <div class="col-12 text-center text-muted">
                <p><i class="bi bi-github"></i> BBC Senior Tester Take-home Test</p>
                <p class="small">Reports generated automatically by GitHub Actions</p>
                <p class="small">Environment: {{ENVIRONMENT}}</p>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`;

function main() {
    const siteDir = path.join(__dirname, '..', 'site');
    const reportsDir = path.join(siteDir, 'reports');
    const metadataFile = path.join(reportsDir, 'metadata.json');
    
    // Create directories if they don't exist
    if (!fs.existsSync(siteDir)) {
        fs.mkdirSync(siteDir);
    }
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir);
    }

    // Debug: Check if we're in GitHub Actions environment
    console.log('GitHub Actions Environment:', {
        GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
        GITHUB_SHA: process.env.GITHUB_SHA,
        GITHUB_REF: process.env.GITHUB_REF,
        GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
        GITHUB_RUN_NUMBER: process.env.GITHUB_RUN_NUMBER
    });

    // Extract branch name from GITHUB_REF
    const branch = process.env.GITHUB_REF ? process.env.GITHUB_REF.replace('refs/heads/', '') :
                   process.env.GITHUB_REF_NAME || 'unknown';

    // Determine test statuses from environment variables
    const playwrightStatus = process.env.PLAYWRIGHT_STATUS || 'RUNNING';
    const k6Status = process.env.K6_STATUS || 'RUNNING';
    
    // Calculate overall pipeline status
    let pipelineStatus = 'RUNNING';
    let pipelineStatusClass = '';
    
    if (playwrightStatus === 'FAILED' || k6Status === 'FAILED') {
        pipelineStatus = 'FAILED';
        pipelineStatusClass = 'status-failed';
    } else if (playwrightStatus === 'PASSED' && k6Status === 'PASSED') {
        pipelineStatus = 'PASSED';
        pipelineStatusClass = 'status-passed';
    } else {
        pipelineStatus = 'RUNNING';
        pipelineStatusClass = 'status-warning';
    }

    // Read metadata or create default
    let metadata = {
        lastRun: process.env.GITHUB_RUN_ID ? new Date().toISOString() : new Date().toISOString(),
        commit: process.env.GITHUB_SHA || process.env.GITHUB_REF_NAME || 'unknown',
        commitShort: process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : 'unknown',
        runId: process.env.GITHUB_RUN_ID || 'unknown',
        runNumber: process.env.GITHUB_RUN_NUMBER || 'unknown',
        branch: branch,
        workflowName: process.env.GITHUB_WORKFLOW || 'QA CI Pipeline',
        event: process.env.GITHUB_EVENT_NAME || 'push',
        ortoni: 'reports/ortoni-report.html',
        k6: {
            load: 'k6/load/index.html',
            performance: 'k6/performance/index.html',
            stress: 'k6/stress/index.html',
            security: 'k6/security/index.html'
        },
        // Test status information
        playwrightStatus: playwrightStatus,
        k6Status: k6Status,
        pipelineStatus: pipelineStatus,
        pipelineStatusClass: pipelineStatusClass,
        playwrightStatusClass: playwrightStatus === 'FAILED' ? 'bg-danger text-white' : (playwrightStatus === 'PASSED' ? 'bg-success text-white' : 'bg-warning text-dark'),
        k6StatusClass: k6Status === 'FAILED' ? 'bg-danger text-white' : (k6Status === 'PASSED' ? 'bg-success text-white' : 'bg-warning text-dark')
    };

    // Only load existing metadata if we're in a GitHub Actions environment
    // This prevents local runs from overwriting the correct paths
    // However, prioritize GitHub Actions environment variables over existing metadata
    if (process.env.GITHUB_ACTIONS && fs.existsSync(metadataFile)) {
        try {
            const existingMetadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
            // Merge existing metadata but prioritize GitHub Actions environment variables
            metadata = {
                ...existingMetadata,
                ...metadata // GitHub Actions values take precedence
            };
        } catch (error) {
            console.warn('Failed to read existing metadata, using defaults:', error.message);
        }
    }

    // Generate dashboard
    let dashboard = dashboardTemplate
        .replace('{{LAST_RUN}}', new Date(metadata.lastRun).toLocaleString())
        .replace('{{COMMIT_SHORT}}', metadata.commitShort)
        .replace('{{RUN_NUMBER}}', metadata.runNumber)
        .replace('{{WORKFLOW_NAME}}', metadata.workflowName)
        .replace('{{BRANCH}}', metadata.branch)
        .replace('{{EVENT}}', metadata.event)
        .replace('{{ORTONI_LINK}}', metadata.ortoni)
        .replace('{{K6_LOAD}}', metadata.k6.load)
        .replace('{{K6_PERFORMANCE}}', metadata.k6.performance)
        .replace('{{K6_STRESS}}', metadata.k6.stress)
        .replace('{{K6_SECURITY}}', metadata.k6.security)
        .replace('{{TIMESTAMP}}', new Date().toISOString())
        .replace('{{ENVIRONMENT}}', process.env.BASE_URL || 'Unknown')
        .replace('{{PIPELINE_STATUS_TEXT}}', metadata.pipelineStatus)
        .replace('{{PIPELINE_STATUS_CLASS}}', metadata.pipelineStatusClass)
        .replace('{{PLAYWRIGHT_STATUS}}', metadata.playwrightStatus)
        .replace('{{PLAYWRIGHT_STATUS_CLASS}}', metadata.playwrightStatusClass)
        .replace('{{K6_STATUS}}', metadata.k6Status)
        .replace('{{K6_STATUS_CLASS}}', metadata.k6StatusClass);

    const dashboardFile = path.join(siteDir, 'index.html');
    fs.writeFileSync(dashboardFile, dashboard);
    
    // Save metadata
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    
    console.log(`✓ Generated dashboard: ${dashboardFile}`);
    console.log(`✓ Updated metadata: ${metadataFile}`);
}

if (require.main === module) {
    main();
}

module.exports = { main };