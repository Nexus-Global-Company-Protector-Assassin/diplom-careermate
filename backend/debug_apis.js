const axios = require('axios');

async function testSites() {
    // === Test 1: Trudvsem.ru (Роструд — открытый госпортал занятости) ===
    console.log('\n=== Test 1: trudvsem.ru ===');
    try {
        const r = await axios.get('https://opendata.trudvsem.ru/api/v1/vacancies', {
            params: { limit: 3, offset: 0, region_code: '77' },
            headers: { 'Accept': 'application/json' },
            timeout: 10000
        });
        console.log('Status:', r.status);
        console.log('Count:', r.data?.content?.length);
        console.log('First:', r.data?.content?.[0]?.job?.requirement?.position);
    } catch(e) {
        console.log('FAILED:', e.response?.status, e.message);
    }

    // === Test 2: Trudvsem.ru search by keyword ===
    console.log('\n=== Test 2: trudvsem.ru search ===');
    try {
        const r = await axios.get('https://opendata.trudvsem.ru/api/v1/vacancies', {
            params: { limit: 3, offset: 0, 'text.keywords': 'React', region_code: '77' },
            headers: { 'Accept': 'application/json' },
            timeout: 10000
        });
        console.log('Status:', r.status);
        console.log('Count:', r.data?.content?.length);
        console.log('First:', JSON.stringify(r.data?.content?.[0], null, 2).slice(0, 500));
    } catch(e) {
        console.log('FAILED:', e.response?.status, e.message);
    }
}

testSites();
