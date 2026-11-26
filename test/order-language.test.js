const test = require('node:test');
const assert = require('node:assert/strict');

function freshRequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

const baseOrder = {
  orderId: 'CV-LANG-1',
  hasInvoice: true,
  items: [
    { name: 'Marron glace', variantLabel: '250 g', quantity: 1, lineTotal: 10, vatRate: 0.1 },
  ],
  customer: {
    name: 'Test Buyer',
    fulfillmentMethod: 'pickup',
    pickupStore: 'Viladrau',
  },
  billing: { company: 'Acme', vat: 'B123', address: 'Street 1', city: 'Girona', postalCode: '17001', country: 'ES' },
};

async function captureBrevoPayload(type, to, data) {
  process.env.BREVO_API_KEY = 'brevo-key';
  process.env.FROM_EMAIL = 'from@example.com';
  const originalFetch = global.fetch;
  let payload;
  global.fetch = async (url, options) => {
    payload = JSON.parse(options.body);
    return { ok: true, json: async () => ({}) };
  };
  try {
    const mod = freshRequire('../netlify/functions/send-email.js');
    await mod.sendEmail({ type, to, data });
  } finally {
    global.fetch = originalFetch;
  }
  return payload;
}

test('order confirmation email follows the order language and falls back to Catalan', async () => {
  const ca = await captureBrevoPayload('order-confirmation', 'a@example.com', { ...baseOrder, lang: 'ca' });
  const es = await captureBrevoPayload('order-confirmation', 'a@example.com', { ...baseOrder, lang: 'es' });
  const en = await captureBrevoPayload('order-confirmation', 'a@example.com', { ...baseOrder, lang: 'en' });
  const missing = await captureBrevoPayload('order-confirmation', 'a@example.com', baseOrder);

  assert.equal(ca.subject, 'Confirmació de la comanda #CV-LANG-1');
  assert.equal(es.subject, 'Confirmación de pedido #CV-LANG-1');
  assert.equal(en.subject, 'Order confirmation #CV-LANG-1');
  assert.equal(missing.subject, ca.subject);
  assert.match(en.htmlContent, /Thank you for your order/);
  assert.match(en.htmlContent, /VAT\/Tax ID: B123/);
  assert.match(es.htmlContent, /adjunta en este correo/);
});

test('order confirmation omits the invoice line when no invoice was generated', async () => {
  const payload = await captureBrevoPayload('order-confirmation', 'a@example.com', {
    ...baseOrder,
    lang: 'en',
    hasInvoice: false,
  });
  assert.doesNotMatch(payload.htmlContent, /invoice/i);
});

test('provider notification stays in Catalan regardless of order language', async () => {
  process.env.ORDER_NOTIFICATION_EMAIL = 'orders@example.com';
  const en = await captureBrevoPayload('order-notification', undefined, { ...baseOrder, lang: 'en' });
  assert.equal(en.subject, 'Nou pedido pagat #CV-LANG-1');
});

test('payment reminder email follows the order language', async () => {
  const data = { orderCode: 'CV-1', totalAmount: 10, resumeUrl: 'https://example.com/en/shop/cart/?resume=CV-1' };
  const en = await captureBrevoPayload('payment-reminder', 'a@example.com', { ...data, lang: 'en' });
  const es = await captureBrevoPayload('payment-reminder', 'a@example.com', { ...data, lang: 'es' });
  assert.equal(en.subject, 'Your order CV-1 is awaiting payment');
  assert.equal(es.subject, 'Tu pedido CV-1 está pendiente de pago');
});

test('payment reminder resume URL points to the language-specific cart', () => {
  process.env.URL = 'https://example.com';
  const mod = freshRequire('../netlify/functions/payment-reminder.js');
  const code = 'CV-1';

  assert.equal(mod._test.buildResumeUrl({ public_order_code: code, language: 'ca' }), 'https://example.com/shop/cart/?resume=CV-1');
  assert.equal(mod._test.buildResumeUrl({ public_order_code: code, language: 'es' }), 'https://example.com/es/shop/cart/?resume=CV-1');
  assert.equal(mod._test.buildResumeUrl({ public_order_code: code, language: 'en' }), 'https://example.com/en/shop/cart/?resume=CV-1');
});

test('invoice PDF is rendered per language, with the provider version unchanged by default', async () => {
  const { buildOrderInvoicePdf } = require('../netlify/functions/lib/invoice-pdf');
  const input = {
    code: 'CV-LANG-1',
    date: new Date('2026-01-15T12:00:00Z'),
    client: { name: 'Test Buyer', address: 'Street 1', city: 'Girona', postalCode: '17001', country: 'ES', email: 'a@example.com', phone: '+34600000000' },
    items: [{ name: 'Marron glace', variantLabel: '250 g', quantity: 1, lineTotal: 10, vatRate: 0.1 }],
    shipping: { amount: 5, vatRate: 0.21 },
  };

  const [legacy, provider, ca, es, en] = await Promise.all([
    buildOrderInvoicePdf(input),
    buildOrderInvoicePdf({ ...input, lang: 'provider' }),
    buildOrderInvoicePdf({ ...input, lang: 'ca' }),
    buildOrderInvoicePdf({ ...input, lang: 'es' }),
    buildOrderInvoicePdf({ ...input, lang: 'en' }),
  ]);

  // pdf-lib stamps creation/modification dates, so compare sizes + header only.
  assert.equal(legacy.length, provider.length);
  assert.ok([ca, es, en].every((pdf) => pdf.subarray(0, 5).toString() === '%PDF-'));
  assert.equal(new Set([ca.length, es.length, en.length]).size >= 2, true);
});
