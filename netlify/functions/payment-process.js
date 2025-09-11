const crypto = require('crypto');
require('dotenv').config();

const MERCHANT_CODE = process.env.REDSYS_MERCHANT_CODE;
const SECRET_KEY = process.env.REDSYS_SECRET_KEY;
const TERMINAL = '001';
const CURRENCY = '978'; // EUR

// Generate RedSys signature
function generateSignature(parameters, key) {
  const order = parameters.Ds_Merchant_Order;
  const keyBytes = Buffer.from(key, 'base64');
  
  // Encrypt order with 3DES
  const cipher = crypto.createCipher('des-ede3-cbc', keyBytes);
  let encrypted = cipher.update(order, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Create HMAC with encrypted key
  const hmac = crypto.createHmac('sha256', Buffer.from(encrypted, 'base64'));
  hmac.update(Buffer.from(JSON.stringify(parameters), 'utf8').toString('base64'));
  
  return hmac.digest('base64');
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { items, customer, orderId } = JSON.parse(event.body);
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const amountInCents = Math.round(totalAmount * 100);

    // RedSys parameters
    const parameters = {
      Ds_Merchant_Amount: amountInCents.toString(),
      Ds_Merchant_Order: orderId.padStart(12, '0'),
      Ds_Merchant_MerchantCode: MERCHANT_CODE,
      Ds_Merchant_Currency: CURRENCY,
      Ds_Merchant_TransactionType: '0',
      Ds_Merchant_Terminal: TERMINAL,
      Ds_Merchant_MerchantURL: `${process.env.URL}/.netlify/functions/payment-callback`,
      Ds_Merchant_UrlOK: `${process.env.URL}/payment/success`,
      Ds_Merchant_UrlKO: `${process.env.URL}/payment/error`,
      Ds_Merchant_ConsumerLanguage: '001',
      Ds_Merchant_ProductDescription: `Pedido ${orderId}`,
      Ds_Merchant_MerchantName: 'Tu Tienda Online'
    };

    // Generate signature
    const signature = generateSignature(parameters, SECRET_KEY);
    const parametersBase64 = Buffer.from(JSON.stringify(parameters)).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        redsysUrl: 'https://sis-t.redsys.es:25443/sis/realizarPago', // Test environment
        // redsysUrl: 'https://sis.redsys.es/sis/realizarPago', // Production
        parameters: parametersBase64,
        signature: signature,
        signatureVersion: 'HMAC_SHA256_V1'
      })
    };

  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Payment processing failed' })
    };
  }
};