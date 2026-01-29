async function testRateLimit() {
    const url = 'http://localhost:3000/api/auth/status'; // Gateway URL
    const limit = 100;
    const totalRequests = 110; // Send more than the limit

    console.log(`Starting Rate Limit Test: Sending ${totalRequests} requests...`);
    console.log(`Rate Limit is set to: ${limit} requests per 15 minutes.`);

    let successCount = 0;
    let blockedCount = 0;

    const startTime = Date.now();

    for (let i = 1; i <= totalRequests; i++) {
        try {
            const response = await fetch(url);
            
            if (response.status === 200) {
                successCount++;
                process.stdout.write('.'); // Visual progress
            } else if (response.status === 429) {
                blockedCount++;
                process.stdout.write('X'); // Visual progress for blocked
            } else {
                console.log(`\nRequest ${i}: Unexpected status ${response.status}`);
            }
        } catch (error) {
            console.error(`\nRequest ${i} failed:`, error.message);
        }

        // Small delay to not overwhelm the test script itself (optional)
        // await new Promise(r => setTimeout(r, 10)); 
    }

    const duration = (Date.now() - startTime) / 1000;

    console.log('\n\n--- Test Results ---');
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Time Taken: ${duration.toFixed(2)}s`);
    console.log(`Successful Requests (200 OK): ${successCount}`);
    console.log(`Blocked Requests (429 Too Many Requests): ${blockedCount}`);

    if (blockedCount > 0) {
        console.log('\n✅ SUCCESS: Rate limiting is working! Requests were blocked after the limit.');
    } else {
        console.log('\n❌ FAILURE: No requests were blocked. Rate limiting might not be active or the limit is higher.');
    }
}

testRateLimit();
