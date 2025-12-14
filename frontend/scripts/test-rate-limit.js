const http = require('http');
const https = require('https');

const url = 'http://localhost:3000'; // Adjust if running on a different port
const limit = 150;
const duration = 1000; // 1 second

async function sendRequest(i) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve({ status: res.statusCode, i });
    });
    req.on('error', (e) => {
      resolve({ status: 'error', error: e.message, i });
    });
  });
}

async function runTest() {
  console.log(`Starting rate limit test: sending ${limit + 10} requests...`);
  const promises = [];
  const start = Date.now();

  for (let i = 0; i < limit + 10; i++) {
    promises.push(sendRequest(i));
  }

  const results = await Promise.all(promises);
  const end = Date.now();
  
  const success = results.filter(r => r.status === 200 || r.status === 307 || r.status === 404).length; // 307 is redirect, 404 is not found but allowed
  const limited = results.filter(r => r.status === 429).length;
  
  console.log(`Test completed in ${end - start}ms`);
  console.log(`Successful requests (200/3xx/404): ${success}`);
  console.log(`Rate limited requests (429): ${limited}`);

  if (limited > 0) {
    console.log('SUCCESS: Rate limiting is working.');
  } else {
    console.log('FAILURE: No requests were rate limited.');
  }
}

runTest();
