const http = require('http');

// Simulates a user rapid-firing the "Send" button 10 times in exactly the same millisecond
async function testRaceCondition() {
  console.log('🏁 Starting Race Condition Load Test...');
  console.log('Sending 10 simultaneous transfer requests of $500 (50000 cents)...');
  console.log('Alice (ID: 1) has $1000. She should only be able to send 2 successful transfers.');

  const postData = JSON.stringify({
    senderId: 1, // Alice
    receiverId: 2, // Bob
    amount: 50000 // $500
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/transfer',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const makeRequest = (requestNumber) => {
    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ requestNumber, status: res.statusCode, data: JSON.parse(data) });
        });
      });

      req.on('error', (e) => {
        resolve({ requestNumber, status: 500, data: { error: e.message } });
      });

      req.write(postData);
      req.end();
    });
  };

  // Fire 10 requests concurrently
  const promises = [];
  for (let i = 1; i <= 10; i++) {
    promises.push(makeRequest(i));
  }

  const results = await Promise.all(promises);

  let successCount = 0;
  let failCount = 0;

  console.log('\n📊 Results:');
  results.forEach(r => {
    if (r.status === 200) {
      console.log(`✅ Request ${r.requestNumber}: SUCCESS`);
      successCount++;
    } else {
      console.log(`❌ Request ${r.requestNumber}: FAILED (${r.data.error})`);
      failCount++;
    }
  });

  console.log(`\nTotal Success: ${successCount} (Expected: 2)`);
  console.log(`Total Fails: ${failCount} (Expected: 8)`);
}

testRaceCondition();
