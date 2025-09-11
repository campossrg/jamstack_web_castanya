exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    // Here you would typically:
    // 1. Add email to your newsletter database/service
    // 2. Send welcome email
    
    // For now, we'll just send a welcome email
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: email,
      from: process.env.FROM_EMAIL,
      subject: 'Bienvenido a nuestro newsletter',
      html: `
        <h2>¡Gracias por suscribirte!</h2>
        <p>Bienvenido a nuestro newsletter. Recibirás nuestras últimas novedades y ofertas exclusivas directamente en tu bandeja de entrada.</p>
        <p>Si cambias de opinión, puedes <a href="${process.env.URL}/unsubscribe?email=${encodeURIComponent(email)}">darte de baja aquí</a>.</p>
      `
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Successfully subscribed to newsletter' 
      })
    };

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to subscribe to newsletter' 
      })
    };
  }
};