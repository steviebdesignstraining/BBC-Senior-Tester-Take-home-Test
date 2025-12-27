#!/bin/bash

# Test script to verify k6 backup tests work correctly
echo "🧪 Testing k6 backup tests..."

# Check if k6 is available
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 is not installed. Please install k6 first."
    echo "   Visit: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

echo "✅ k6 is installed: $(k6 version)"

# Test each backup test file
for test_type in load performance stress security; do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Testing k6 backup-${test_type}.test.js"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -f "k6/backup-${test_type}.test.js" ]; then
        echo "✅ Backup test file found: k6/backup-${test_type}.test.js"
        
        # Run a quick test (1 virtual user, 10 second duration)
        echo "🚀 Running quick test..."
        k6 run --vus 1 --duration 10s k6/backup-${test_type}.test.js
        
        if [ $? -eq 0 ]; then
            echo "✅ k6 backup-${test_type}.test.js PASSED"
        else
            echo "❌ k6 backup-${test_type}.test.js FAILED"
        fi
    else
        echo "❌ Backup test file not found: k6/backup-${test_type}.test.js"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 k6 backup test verification complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"