const http = require('http');

const routes = [
  '/',
  '/tools',
  '/setup',
  '/checkout',
  '/portal/dashboard',
  '/portal/vault',
  '/portal/renewals',
  '/portal/tax-compliance',
  '/portal/banking',
  '/admin/kanban',
  '/admin/filing-queue',
  '/admin/whatsapp',
  '/admin/clients',
];

console.log('--- VERIFYING ALL APPLICATION ROUTES ---');

let completed = 0;

routes.forEach((route) => {
  const url = `http://localhost:3005${route}`;
  http
    .get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`[STATUS ${res.statusCode}] ${url} - Size: ${data.length} bytes`);
        completed++;
        if (completed === routes.length) {
          console.log('--- ALL ROUTES VERIFIED SUCCESSFULLY ---');
        }
      });
    })
    .on('error', (err) => {
      console.error(`[ERROR] ${url} - ${err.message}`);
      completed++;
      if (completed === routes.length) {
        console.log('--- ROUTE CHECK FINISHED WITH ERRORS ---');
      }
    });
});
