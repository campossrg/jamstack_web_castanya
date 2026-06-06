const test = require('node:test');
const assert = require('node:assert/strict');

function freshRequire(modulePath) {
  // Ensure env var reads at module top-level are re-evaluated.
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

test('payment-process._test.generateSignature produces stable signature', () => {
  const secretKey = Buffer.alloc(24, 7).toString('base64');
  const mod = freshRequire('../netlify/functions/payment-process.js');

  const params = {
    Ds_Merchant_Amount: '100',
    Ds_Merchant_Order: '123456789012',
    Ds_Merchant_MerchantCode: 'MOCK',
    Ds_Merchant_Currency: '978',
    Ds_Merchant_TransactionType: '0',
    Ds_Merchant_Terminal: '001',
  };

  const sig1 = mod._test.generateSignature(params, secretKey);
  const sig2 = mod._test.generateSignature(params, secretKey);
  assert.equal(typeof sig1, 'string');
  assert.equal(sig1, sig2);
});

test('payment-process._test.createMerchantOrderCode returns 12 digits', () => {
  const mod = freshRequire('../netlify/functions/payment-process.js');

  const code = mod._test.createMerchantOrderCode({
    id: 'abc-123',
    public_order_code: 'CV-00000000-ABCD',
  });

  assert.match(code, /^\d{12}$/);
});

test('payment-process._test.normalizePaymentMethod defaults to card', () => {
  const mod = freshRequire('../netlify/functions/payment-process.js');

  assert.equal(mod._test.normalizePaymentMethod(), 'card');
  assert.equal(mod._test.normalizePaymentMethod('card'), 'card');
  assert.equal(mod._test.normalizePaymentMethod('CARD'), 'card');
  assert.equal(mod._test.normalizePaymentMethod('bizum'), 'bizum');
  assert.equal(mod._test.normalizePaymentMethod('anything-else'), 'card');
});

test('payment-process handler returns 404 when order is missing', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  process.env.REDSYS_MERCHANT_CODE = 'merchant';
  process.env.REDSYS_SECRET_KEY = Buffer.alloc(24, 5).toString('base64');
  process.env.URL = 'https://example.com';
  process.env.PAYMENT_PROVIDER = '';

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => [],
  });

  try {
    const mod = freshRequire('../netlify/functions/payment-process.js');
    const response = await mod.handler({
      httpMethod: 'POST',
      body: JSON.stringify({ orderId: 'missing-order' }),
    });

    assert.equal(response.statusCode, 404);
    assert.match(response.body, /Order not found/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('payment-process handler returns 400 when order total is invalid', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  process.env.REDSYS_MERCHANT_CODE = 'merchant';
  process.env.REDSYS_SECRET_KEY = Buffer.alloc(24, 5).toString('base64');
  process.env.URL = 'https://example.com';
  process.env.PAYMENT_PROVIDER = '';

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => [{ id: '1', public_order_code: 'CV-1', total_amount: 0, currency: 'EUR' }],
  });

  try {
    const mod = freshRequire('../netlify/functions/payment-process.js');
    const response = await mod.handler({
      httpMethod: 'POST',
      body: JSON.stringify({ orderId: 'bad-total' }),
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.body, /Order total is not valid for payment/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('payment-process handler returns payment payload for valid order', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  process.env.REDSYS_MERCHANT_CODE = 'merchant';
  process.env.REDSYS_SECRET_KEY = Buffer.alloc(24, 6).toString('base64');
  process.env.URL = 'https://example.com';
  process.env.PAYMENT_PROVIDER = 'mock';
  process.env.REDSYS_SECRET_KEY_DEV = Buffer.alloc(24, 6).toString('base64');

  const originalFetch = global.fetch;
  const fetchCalls = [];
  global.fetch = async (url, options = {}) => {
    fetchCalls.push({ url, options });

    if (String(url).includes('/rest/v1/orders?select=')) {
      return {
        ok: true,
        json: async () => [
          {
            id: 'order-1',
            public_order_code: 'CV-12345678-ABCD',
            total_amount: 12.5,
            currency: 'EUR',
            payment_status: 'pending',
          },
        ],
      };
    }

    if (String(url).includes('/rest/v1/orders?id=eq.order-1')) {
      return {
        ok: true,
        json: async () => [
          {
            id: 'order-1',
            public_order_code: 'CV-12345678-ABCD',
            total_amount: 12.5,
            currency: 'EUR',
            status: 'pending_payment',
            payment_status: 'pending',
            payment_reference: '123456789012',
          },
        ],
      };
    }

    throw new Error(`Unexpected fetch call: ${url}`);
  };

  try {
    const mod = freshRequire('../netlify/functions/payment-process.js');
    const response = await mod.handler({
      httpMethod: 'POST',
      body: JSON.stringify({ orderId: 'order-1' }),
    });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.order.id, 'order-1');
    assert.equal(payload.order.paymentStatus, 'pending');
    assert.equal(payload.order.paymentMethod, 'card');
    assert.equal(payload.payment.redsysUrl, 'https://example.com/.netlify/functions/redsys-mock');
    assert.equal(payload.payment.signatureVersion, 'HMAC_SHA256_V1');
    assert.equal(typeof payload.payment.parameters, 'string');
    assert.equal(typeof payload.payment.signature, 'string');
    const merchantParameters = JSON.parse(
      Buffer.from(payload.payment.parameters, 'base64').toString('utf8'),
    );
    assert.equal(merchantParameters.Ds_Merchant_PayMethods, undefined);
    assert.equal(fetchCalls.length, 2);
  } finally {
    global.fetch = originalFetch;
    delete process.env.REDSYS_SECRET_KEY_DEV;
  }
});

test('payment-process handler includes Bizum pay method when requested', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  process.env.REDSYS_MERCHANT_CODE = 'merchant';
  process.env.REDSYS_SECRET_KEY = Buffer.alloc(24, 16).toString('base64');
  process.env.URL = 'https://example.com';
  process.env.PAYMENT_PROVIDER = 'mock';
  process.env.REDSYS_SECRET_KEY_DEV = Buffer.alloc(24, 16).toString('base64');

  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes('/rest/v1/orders?select=')) {
      return {
        ok: true,
        json: async () => [
          {
            id: 'order-bizum',
            public_order_code: 'CV-BIZUM-1',
            total_amount: 18.75,
            currency: 'EUR',
            payment_status: 'pending',
          },
        ],
      };
    }

    if (String(url).includes('/rest/v1/orders?id=eq.order-bizum')) {
      return {
        ok: true,
        json: async () => [
          {
            id: 'order-bizum',
            public_order_code: 'CV-BIZUM-1',
            total_amount: 18.75,
            currency: 'EUR',
            status: 'pending_payment',
            payment_status: 'pending',
            payment_reference: '123456789012',
          },
        ],
      };
    }

    throw new Error(`Unexpected fetch call: ${url}`);
  };

  try {
    const mod = freshRequire('../netlify/functions/payment-process.js');
    const response = await mod.handler({
      httpMethod: 'POST',
      body: JSON.stringify({ orderId: 'order-bizum', paymentMethod: 'bizum' }),
    });
    const payload = JSON.parse(response.body);
    const merchantParameters = JSON.parse(
      Buffer.from(payload.payment.parameters, 'base64').toString('utf8'),
    );

    assert.equal(response.statusCode, 200);
    assert.equal(payload.order.paymentMethod, 'bizum');
    assert.equal(merchantParameters.Ds_Merchant_PayMethods, 'z');
  } finally {
    global.fetch = originalFetch;
    delete process.env.REDSYS_SECRET_KEY_DEV;
  }
});

test('payment-process handler returns 409 when order is already paid', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  process.env.REDSYS_MERCHANT_CODE = 'merchant';
  process.env.REDSYS_SECRET_KEY = Buffer.alloc(24, 11).toString('base64');
  process.env.URL = 'https://example.com';
  process.env.PAYMENT_PROVIDER = '';

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => [
      {
        id: 'order-paid',
        public_order_code: 'CV-PAID',
        total_amount: 12.5,
        currency: 'EUR',
        payment_status: 'paid',
      },
    ],
  });

  try {
    const mod = freshRequire('../netlify/functions/payment-process.js');
    const response = await mod.handler({
      httpMethod: 'POST',
      body: JSON.stringify({ orderId: 'order-paid' }),
    });

    assert.equal(response.statusCode, 409);
    assert.match(response.body, /Order already paid/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('payment-process handler returns 503 when payment provider env is missing', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  process.env.REDSYS_MERCHANT_CODE = '';
  process.env.REDSYS_SECRET_KEY = '';
  process.env.URL = 'https://example.com';
  process.env.PAYMENT_PROVIDER = '';

  const mod = freshRequire('../netlify/functions/payment-process.js');
  const response = await mod.handler({
    httpMethod: 'POST',
    body: JSON.stringify({ orderId: 'order-1' }),
  });

  assert.equal(response.statusCode, 503);
  assert.match(response.body, /Payment provider not configured/);
});
