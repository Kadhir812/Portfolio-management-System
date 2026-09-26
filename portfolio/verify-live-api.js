const http = require('http');

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body == null ? null : Buffer.from(JSON.stringify(body));
    const req = http.request({
      host: 'localhost',
      port: 8080,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': String(payload.length) } : {})
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null, raw });
        } catch (err) {
          resolve({ status: res.statusCode, body: raw, raw });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  const create = await request('POST', '/api/portfolios', {
    name: 'Test Portfolio',
    type: 'RUPEE',
    currency: 'INR',
    benchmark: 'NIFTY50',
    exchange: 'NSE',
    rebalanceFrequency: 'MONTHLY',
    amount: 100000
  });
  console.log('CREATE_STATUS', create.status);
  console.log('CREATE_BODY', JSON.stringify(create.body));

  const id = create.body && create.body.id;
  const theme = await request('PUT', `/api/portfolios/${id}/theme`, { theme: 'AGGRESSIVE' });
  console.log('THEME_STATUS', theme.status);
  console.log('THEME_BODY', JSON.stringify(theme.body));

  const fetched = await request('GET', `/api/portfolios/${id}`);
  console.log('FETCH_STATUS', fetched.status);
  console.log('FETCH_BODY', JSON.stringify(fetched.body));
})().catch(err => {
  console.error('VERIFY_ERROR', err && err.message ? err.message : err);
  process.exit(1);
});
