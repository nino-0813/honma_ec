import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { URL } from 'node:url';
import Stripe from 'stripe';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    // .env.local の変更が反映されるように、常に上書きする
    process.env[key] = value;
  }
}

function getStripeFromEnv() {
  // 毎リクエストで読み直す（.env.local を変更しても再起動不要にする）
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  const key = process.env.STRIPE_SECRET_KEY;
  const prefix = key
    ? (key.startsWith('sk_test') ? 'sk_test' : key.startsWith('sk_live') ? 'sk_live' : 'unknown')
    : 'missing';

  if (!key) return { stripe: null, secretKeyPrefix: prefix };
  return { stripe: new Stripe(key), secretKeyPrefix: prefix };
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(obj));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');

  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (url.pathname === '/api/create-payment-intent' && req.method === 'POST') {
    const { stripe, secretKeyPrefix } = getStripeFromEnv();
    if (!stripe) return sendJson(res, 500, { error: 'STRIPE_SECRET_KEYが設定されていません', secretKeyPrefix });

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { error: 'JSONが不正です' });
    }

    const amount = Number(body.amount);
    const currency = String(body.currency || 'jpy').toLowerCase();
    const metadata = body.metadata || {};

    if (!amount || amount <= 0) {
      return sendJson(res, 400, { error: '金額が無効です' });
    }

    try {
      const pi = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency,
        metadata,
        automatic_payment_methods: { enabled: true },
      });
      return sendJson(res, 200, {
        clientSecret: pi.client_secret,
        paymentIntentId: pi.id,
        livemode: pi.livemode,
        secretKeyPrefix,
      });
    } catch (e) {
      return sendJson(res, 500, { error: e?.message || 'PaymentIntentの作成に失敗しました' });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

const port = Number(process.env.DEV_API_PORT || 3011);
server.listen(port, () => {
  console.log(`[dev-api] listening on http://localhost:${port}`);
});
