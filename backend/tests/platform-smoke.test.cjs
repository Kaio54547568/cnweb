const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const test = require('node:test');
const { PrismaClient } = require('@prisma/client');

async function waitFor(check, label) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    const result = await check();
    if (result) return result;
    await delay(200);
  }
  throw new Error('Timed out waiting for ' + label);
}

test('API health, OpenAPI and Redis job persistence', async () => {
  assert.ok(process.env.DATABASE_URL && process.env.REDIS_URL, 'Use a test PostgreSQL and Redis');

  const port = process.env.SMOKE_PORT ?? '3301';
  const token = randomBytes(32).toString('hex');
  const children = [];
  const output = [];
  const base = 'http://127.0.0.1:' + port + '/api/v1';
  const db = new PrismaClient();
  let jobId;

  function start(name) {
    const child = spawn(process.execPath, ['dist/' + name + '.js'], {
      env: { ...process.env, PORT: port, SMOKE_TOKEN: token },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(child);
    for (const stream of [child.stdout, child.stderr]) {
      stream.on('data', (chunk) => output.push(name + ': ' + chunk.toString()));
    }
  }

  const request = (path, options) =>
    fetch(base + path, { ...options, signal: AbortSignal.timeout(3000) });

  try {
    start('api');
    start('worker');
    await waitFor(async () => (await request('/health/live').catch(() => null))?.ok, 'API');
    assert.equal((await request('/health/ready')).status, 200);

    const openapi = await request('/openapi.json');
    assert.equal(openapi.status, 200);
    assert.ok((await openapi.json()).paths['/api/v1/health/ready']);

    const denied = await request('/internal/smoke', { method: 'POST' });
    assert.equal(denied.status, 404);
    assert.equal((await denied.json()).requestId, denied.headers.get('x-request-id'));

    const accepted = await request('/internal/smoke', {
      method: 'POST', headers: { Authorization: 'Bearer ' + token },
    });
    assert.equal(accepted.status, 202);
    const job = await accepted.json();
    jobId = job.jobId;
    assert.ok(jobId);
    assert.ok(job.requestId);
    assert.equal(job.requestId, accepted.headers.get('x-request-id'));

    const saved = await waitFor(() => db.smokeResult.findUnique({ where: { jobId } }), 'worker result');
    assert.equal(saved.requestId, job.requestId);
  } catch (error) {
    console.error(output.join(''));
    throw error;
  } finally {
    for (const child of children) child.kill();
    try {
      if (jobId) await db.smokeResult.deleteMany({ where: { jobId } });
    } finally {
      await db.$disconnect();
    }
  }
});
