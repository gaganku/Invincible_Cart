

async function testDirect() {
    console.log('Testing Direct Auth Service (Port 3001)...');
    try {
        const res = await fetch('http://127.0.0.1:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin_user', password: 'Admin123!' })
        });
        const data = await res.json();
        console.log('Direct Response:', res.status, data);
    } catch (e) {
        console.error('Direct Error:', e.message);
    }
}

async function testGateway() {
    console.log('\nTesting Gateway (Port 3000)...');
    try {
        const res = await fetch('http://127.0.0.1:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin_user', password: 'Admin123!' })
        });
        console.log('Gateway Response Headers:', [...res.headers.entries()]);
        const data = await res.json();
        console.log('Gateway Response:', res.status, data);
    } catch (e) {
        console.error('Gateway Error:', e.message);
    }
}

(async () => {
    await testDirect();
    await testGateway();
})();
