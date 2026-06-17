const querystring = require('querystring');
require('dotenv').config();
const {
  createSignature,
  decodeMerchantParameters,
  getOrderValue,
} = require('./redsys-signature');

const SECRET_KEY =
  process.env.REDSYS_SECRET_KEY_DEV ||
  process.env.REDSYS_SECRET_KEY ||
  null;
const SIGNATURE_VERSION = 'HMAC_SHA512_V2';

function response(statusCode, body, contentType = 'text/html') {
  return {
    statusCode,
    headers: {
      'Content-Type': contentType,
    },
    body,
  };
}

function parseEventBody(event) {
  if (!event.body) {
    return {};
  }

  if (typeof event.body === 'object') {
    return event.body;
  }

  const contentType = String(event.headers?.['content-type'] || event.headers?.['Content-Type'] || '');

  if (contentType.includes('application/json')) {
    return JSON.parse(event.body);
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return querystring.parse(event.body);
  }

  try {
    return JSON.parse(event.body);
  } catch (error) {
    return querystring.parse(event.body);
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderChoicePage({ order, amount, rawParameters, rawSignature, signatureVersion }) {
  const safeOrder = escapeHtml(order);
  const safeAmount = escapeHtml(amount);
  const safeSigVersion = escapeHtml(signatureVersion || SIGNATURE_VERSION);
  const safeParams = escapeHtml(rawParameters);
  const safeSignature = escapeHtml(rawSignature);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>RedSys Mock</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 16px; }
      .card { border: 1px solid rgba(127,127,127,.35); border-radius: 12px; padding: 16px; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      p { margin: 6px 0; }
      .row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
      button { padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(127,127,127,.45); cursor: pointer; }
      button.primary { background: #0b5; color: #fff; border-color: transparent; }
      button.danger { background: #c22; color: #fff; border-color: transparent; }
      small { opacity: .75; }
      details { margin-top: 12px; }
      code { word-break: break-all; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>RedSys Mock (Dev)</h1>
      <p><strong>Order:</strong> <code>${safeOrder}</code></p>
      <p><strong>Amount:</strong> <code>${safeAmount}</code></p>
      <small>This page simulates the payment platform and triggers the Netlify callback.</small>

      <div class="row">
        <form method="POST" action="/.netlify/functions/redsys-mock">
          <input type="hidden" name="action" value="success" />
          <input type="hidden" name="Ds_SignatureVersion" value="${safeSigVersion}" />
          <input type="hidden" name="Ds_MerchantParameters" value="${safeParams}" />
          <input type="hidden" name="Ds_Signature" value="${safeSignature}" />
          <button class="primary" type="submit">Simulate success</button>
        </form>
        <form method="POST" action="/.netlify/functions/redsys-mock">
          <input type="hidden" name="action" value="fail" />
          <input type="hidden" name="Ds_SignatureVersion" value="${safeSigVersion}" />
          <input type="hidden" name="Ds_MerchantParameters" value="${safeParams}" />
          <input type="hidden" name="Ds_Signature" value="${safeSignature}" />
          <button class="danger" type="submit">Simulate failure</button>
        </form>
      </div>

      <details>
        <summary>Debug payload</summary>
        <p><strong>Ds_MerchantParameters</strong></p>
        <code>${safeParams}</code>
      </details>
    </div>
  </body>
</html>`;
}

async function postCallback({ baseUrl, merchantParametersBase64Url, signature }) {
  const callbackUrl = `${baseUrl}/.netlify/functions/payment-callback`;
  const payload = querystring.stringify({
    Ds_SignatureVersion: SIGNATURE_VERSION,
    Ds_MerchantParameters: merchantParametersBase64Url,
    Ds_Signature: signature,
  });

  const callbackResponse = await fetch(callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  });

  if (!callbackResponse.ok) {
    const text = await callbackResponse.text().catch(() => '');
    throw new Error(`Callback failed: ${callbackResponse.status} ${text}`);
  }

  return true;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return response(405, 'Method not allowed', 'text/plain');
  }

  const provider = String(process.env.PAYMENT_PROVIDER || '').trim().toLowerCase();
  if (provider !== 'mock') {
    return response(404, 'Not found', 'text/plain');
  }

  if (!SECRET_KEY) {
    return response(
      503,
      'RedSys mock is enabled but missing REDSYS_SECRET_KEY (or REDSYS_SECRET_KEY_DEV).',
      'text/plain',
    );
  }

  const baseUrl = process.env.URL || '';
  if (!baseUrl) {
    return response(500, 'Missing process.env.URL (Netlify dev should set it).', 'text/plain');
  }

  try {
    const body = parseEventBody(event);
    const action = String(body.action || '').trim().toLowerCase();
    const merchantParameters = String(body.Ds_MerchantParameters || '').trim();
    const incomingSignature = String(body.Ds_Signature || '').trim();
    const signatureVersion = String(body.Ds_SignatureVersion || SIGNATURE_VERSION).trim();

    if (!merchantParameters || !incomingSignature) {
      return response(400, 'Missing payload', 'text/plain');
    }

    const initParams = decodeMerchantParameters(merchantParameters);
    const order = getOrderValue(initParams);
    const amount = String(initParams.DS_MERCHANT_AMOUNT || initParams.Ds_Merchant_Amount || '').trim();

    if (!action) {
      return response(200, renderChoicePage({
        order,
        amount,
        rawParameters: merchantParameters,
        rawSignature: incomingSignature,
        signatureVersion,
      }));
    }

    const dsResponse = action === 'success' ? '0000' : '0101';
    const callbackParameters = {
      Ds_Order: order,
      Ds_Response: dsResponse,
    };
    const callbackMerchantParameters = Buffer.from(JSON.stringify(callbackParameters), 'utf8').toString('base64url');
    const callbackSignature = createSignature(
      callbackMerchantParameters,
      callbackParameters.Ds_Order,
      SECRET_KEY,
    );

    await postCallback({
      baseUrl,
      merchantParametersBase64Url: callbackMerchantParameters,
      signature: callbackSignature,
    });

    const redirectTo = action === 'success' ? '/payment/success' : '/payment/error';
    return {
      statusCode: 302,
      headers: {
        Location: redirectTo,
      },
      body: '',
    };
  } catch (error) {
    console.error('RedSys mock error:', error);
    return response(500, `Mock payment failed: ${error.message}`, 'text/plain');
  }
};
