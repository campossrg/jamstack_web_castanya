const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { type, to, data } = JSON.parse(event.body);
    
    let emailConfig = {};

    switch (type) {
      case 'contact':
        emailConfig = {
          to: process.env.CONTACT_EMAIL,
          from: process.env.FROM_EMAIL,
          subject: `Nuevo mensaje de contacto de ${data.name}`,
          html: `
            <h2>Nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Teléfono:</strong> ${data.phone || 'No proporcionado'}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${data.message}</p>
          `
        };
        break;

      case 'order-confirmation':
        const orderTotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemsList = data.items.map(item => 
          `<li>${item.name} x${item.quantity} - €${(item.price * item.quantity).toFixed(2)}</li>`
        ).join('');

        emailConfig = {
          to: to,
          from: process.env.FROM_EMAIL,
          subject: `Confirmación de pedido #${data.orderId}`,
          html: `
            <h2>¡Gracias por tu pedido!</h2>
            <p>Hemos recibido tu pedido #${data.orderId} correctamente.</p>
            
            <h3>Detalles del pedido:</h3>
            <ul>${itemsList}</ul>
            
            <p><strong>Total: €${orderTotal.toFixed(2)}</strong></p>
            
            <h3>Datos de envío:</h3>
            <p>
              ${data.customer.name}<br>
              ${data.customer.address}<br>
              ${data.customer.city}, ${data.customer.postalCode}<br>
              ${data.customer.country}
            </p>
            
            <p>Te enviaremos información de seguimiento una vez que el pedido sea enviado.</p>
            
            <p>Gracias por confiar en nosotros.</p>
          `
        };
        break;

      case 'newsletter':
        emailConfig = {
          to: to,
          from: process.env.FROM_EMAIL,
          subject: 'Bienvenido a nuestro newsletter',
          html: `
            <h2>¡Bienvenido a nuestro newsletter!</h2>
            <p>Gracias por suscribirte. Recibirás nuestras últimas novedades y ofertas exclusivas.</p>
            <p>Si no deseas recibir más emails, puedes <a href="${process.env.URL}/unsubscribe">darte de baja aquí</a>.</p>
          `
        };
        break;

      default:
        throw new Error('Invalid email type');
    }

    await sgMail.send(emailConfig);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true, message: 'Email sent successfully' })
    };

  } catch (error) {
    console.error('Email sending error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to send email',
        details: error.message 
      })
    };
  }
};