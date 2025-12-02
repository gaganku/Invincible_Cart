async function testLogin() {
    try {
        console.log('Testing login directly to Auth Service (port 3001)...');
        const res = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'regular_user', password: 'User123!' })
        });
        
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', data);

    } catch (err) {
        console.error('Error:', err);
    }
}

testLogin();
