
async function testProduct() {
    console.log('Testing Products Service (Port 3002)...');
    try {
        const res = await fetch('http://127.0.0.1:3002/api/products');
        console.log('Product Response Status:', res.status);
    } catch (e) {
        console.error('Product Error:', e.message);
    }
}

(async () => {
    await testProduct();
})();
