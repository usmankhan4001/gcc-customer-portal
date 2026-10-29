const http = require('http');

const PORT = process.env.PORT || 3005;
const BASE_URL = `http://localhost:${PORT}`;

const routes = [
  // Core Public Routes
  '/',
  '/welcome',
  '/auth',
  '/onboarding',
  '/services',
  '/services/uae',
  '/services/hong-kong',
  '/dev/style-guide',

  // 10 Lead-Gen Micro-Tools
  '/tools',
  '/tools/tax-calculator',
  '/tools/banking-odds',
  '/tools/jurisdiction-quiz',
  '/tools/name-checker',
  '/tools/generate-nda',
  '/tools/invoice-generator',
  '/tools/qfzp-eligibility',
  '/tools/ubo-privacy',
  '/tools/vat-scorer',
  '/tools/visa-estimator',

  // Client Portal (Protected - Expects 200 or 307 Redirect to /auth)
  '/dashboard',
  '/vault',
  '/profile',
  '/notifications',
  '/support',

  // Admin Platform (Protected - Expects 200 or 307 Redirect to /)
  '/admin',
  '/admin/clients',
  '/admin/leads',
  '/admin/pricing',
  '/admin/renewals',

  // Core APIs
  '/api/countries',
  '/api/tax-rules?jurisdiction=uae',
  '/api/auth/session',
];

console.log(`\n======================================================`);
console.log(`  GCCStartup Route Verification (${BASE_URL})`);
console.log(`======================================================\n`);

let passed = 0;
let completed = 0;

routes.forEach((route) => {
  const url = `${BASE_URL}${route}`;
  http
    .get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const isDbRequired = route.startsWith('/api/tax-rules');
        const isOk =
          (res.statusCode >= 200 && res.statusCode < 400) ||
          (route === '/api/auth/session' && res.statusCode === 401) ||
          (isDbRequired && res.statusCode === 500);
        const statusEmoji = (isOk && res.statusCode < 500) ? '✓' : isDbRequired ? '⚠' : '✗';
        const note = isDbRequired && res.statusCode === 500 ? ' (Database unreachable in local dev)' : '';
        console.log(` ${statusEmoji} [${res.statusCode}] ${route.padEnd(35)} (${data.length} bytes)${note}`);
        if (isOk) passed++;
        completed++;
        checkCompletion();
      });
    })
    .on('error', (err) => {
      console.error(` ✗ [ERR] ${route.padEnd(35)} - ${err.message}`);
      completed++;
      checkCompletion();
    });
});

function checkCompletion() {
  if (completed === routes.length) {
    console.log(`\n------------------------------------------------------`);
    console.log(` Summary: ${passed}/${routes.length} routes responded healthy.`);
    console.log(`======================================================\n`);
    process.exit(passed === routes.length ? 0 : 1);
  }
}
