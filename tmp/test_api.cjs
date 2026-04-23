const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:3000/api/counselors');
        console.log('Counselors:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
