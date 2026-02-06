/**
 * Load Testing Script using Autocannon
 * 
 * Tests critical API endpoints under simulated load.
 * Run with: node scripts/load-test.mjs
 */

import autocannon from 'autocannon';

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const STORE_ID = process.env.TEST_STORE_ID || 'test-store';

// Test configurations
const tests = {
  // Products list - Most hit endpoint
  products: {
    url: `${BASE_URL}/products`,
    method: 'GET',
    headers: {
      'X-Store-Id': STORE_ID,
    },
  },
  
  // Categories - Frequently hit
  categories: {
    url: `${BASE_URL}/categories`,
    method: 'GET',
    headers: {
      'X-Store-Id': STORE_ID,
    },
  },
  
  // Store config - Initial load
  config: {
    url: `${BASE_URL}/config`,
    method: 'GET',
    headers: {
      'X-Store-Id': STORE_ID,
    },
  },
  
  // Health check - Baseline
  health: {
    url: `${BASE_URL.replace('/api', '')}/api/health`,
    method: 'GET',
  },
};

async function runTest(name, config) {
  console.log(`\n🚀 Testing: ${name.toUpperCase()}`);
  console.log(`   URL: ${config.url}`);
  console.log(`   Duration: 10s, Connections: 50`);
  
  const result = await autocannon({
    url: config.url,
    method: config.method,
    headers: config.headers,
    connections: 50,      // Concurrent connections
    duration: 10,         // Test duration in seconds
    pipelining: 1,        // Requests per connection
  });
  
  return {
    name,
    requests: result.requests.total,
    throughput: Math.round(result.throughput.average),
    latencyAvg: result.latency.average,
    latencyP99: result.latency.p99,
    errors: result.errors,
    timeouts: result.timeouts,
  };
}

async function main() {
  console.log('═'.repeat(60));
  console.log('         LOAD TESTING - Tiendita API');
  console.log('═'.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Store: ${STORE_ID}`);
  console.log('');
  
  const results = [];
  
  // Run tests sequentially
  for (const [name, config] of Object.entries(tests)) {
    try {
      const result = await runTest(name, config);
      results.push(result);
    } catch (error) {
      console.error(`❌ Test ${name} failed:`, error);
      results.push({
        name,
        requests: 0,
        throughput: 0,
        latencyAvg: 0,
        latencyP99: 0,
        errors: 1,
        timeouts: 0,
      });
    }
  }
  
  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('                    RESULTS SUMMARY');
  console.log('═'.repeat(60));
  console.log('');
  console.log('| Endpoint   | Requests | Throughput | Avg (ms) | P99 (ms) | Errors |');
  console.log('|------------|----------|------------|----------|----------|--------|');
  
  for (const r of results) {
    const status = r.errors === 0 ? '✅' : '❌';
    console.log(
      `| ${r.name.padEnd(10)} | ${r.requests.toString().padStart(8)} | ${(r.throughput / 1024).toFixed(1).padStart(7)} KB/s | ${r.latencyAvg.toFixed(1).padStart(8)} | ${r.latencyP99.toFixed(1).padStart(8)} | ${status} ${r.errors.toString().padStart(4)} |`
    );
  }
  
  console.log('');
  
  // Performance assessment
  const avgLatency = results.reduce((sum, r) => sum + r.latencyAvg, 0) / results.length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  
  if (avgLatency < 50 && totalErrors === 0) {
    console.log('🎉 EXCELLENT! API is performing optimally.');
  } else if (avgLatency < 200 && totalErrors === 0) {
    console.log('✅ GOOD. API is performing within acceptable limits.');
  } else if (totalErrors > 0) {
    console.log('⚠️ WARNING: Some requests failed. Check server logs.');
  } else {
    console.log('🔴 NEEDS ATTENTION: High latency detected.');
  }
  
  console.log('');
  console.log('═'.repeat(60));
}

main().catch(console.error);
