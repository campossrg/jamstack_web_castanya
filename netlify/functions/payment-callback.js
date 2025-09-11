exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { Ds_MerchantParameters, Ds_Signature, Ds_SignatureVersion } = event.body;
    
    // Decode parameters
    const parametersJson = Buffer.from(Ds_MerchantParameters, 'base64').toString('utf8');
    const parameters = JSON.parse(parametersJson);
    
    // Verify signature (implement signature verification)
    // This is a simplified version - implement proper signature verification
    
    const responseCode = parameters.Ds_Response;
    const orderId = parameters.Ds_Order;
    
    if (responseCode >= 0 && responseCode <= 99) {
      // Payment successful
      console.log(`Payment successful for order ${orderId}`);
      
      // Here you would:
      // 1. Update order status in your database
      // 2. Send confirmation email
      // 3. Update inventory
      
      return {
        statusCode: 200,
        body: 'OK'
      };
    } else {
      // Payment failed
      console.log(`Payment failed for order ${orderId}, code: ${responseCode}`);
      
      return {
        statusCode: 200,
        body: 'Payment failed'
      };
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    return {
      statusCode: 500,
      body: 'Error processing payment callback'
    };
  }
};