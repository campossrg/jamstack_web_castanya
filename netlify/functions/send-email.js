const sgMail = require('@sendgrid/mail');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

function isSendgridConfigured() {
  return Boolean(process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL);
}

function configureSendgrid() {
  if (!isSendgridConfigured()) {
    throw new Error('SendGrid environment is not configured');
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildOrderConfirmationEmail({ to, data }) {
  const orderTotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemsList = data.items
    .map(
      (item) =>
        `<li>${escapeHtml(item.name)} (${escapeHtml(item.variantLabel)}) x${item.quantity} - EUR ${item.lineTotal.toFixed(2)}</li>`,
    )
    .join('');

  return {
    to,
    from: process.env.FROM_EMAIL,
    subject: `Confirmacion de pedido #${data.orderId}`,
    html: `
      <h2>Gracies per la teva comanda</h2>
      <p>Hem rebut correctament la comanda <strong>#${escapeHtml(data.orderId)}</strong>.</p>

      <h3>Detalls de la comanda</h3>
      <ul>${itemsList}</ul>

      <p><strong>Total: EUR ${orderTotal.toFixed(2)}</strong></p>

      <h3>Dades d'enviament</h3>
      <p>
        ${escapeHtml(data.customer.name)}<br>
        ${escapeHtml(data.customer.address)}<br>
        ${escapeHtml(data.customer.city)}, ${escapeHtml(data.customer.postalCode)}<br>
        ${escapeHtml(data.customer.country)}
      </p>

      <p>T'enviarem noves actualitzacions quan la comanda avanci.</p>
    `,
  };
}

function buildContactEmail({ data }) {
  return {
    to: process.env.CONTACT_EMAIL,
    from: process.env.FROM_EMAIL,
    subject: `Nuevo mensaje de contacto de ${data.name}`,
    html: `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Telefono:</strong> ${escapeHtml(data.phone || 'No proporcionado')}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${escapeHtml(data.message)}</p>
    `,
  };
}

function buildNewsletterEmail({ to }) {
  return {
    to,
    from: process.env.FROM_EMAIL,
    subject: 'Bienvenido a nuestro newsletter',
    html: `
      <h2>Bienvenido a nuestro newsletter</h2>
      <p>Gracias por suscribirte. Recibiras nuestras ultimas novedades y ofertas exclusivas.</p>
      <p>Si no deseas recibir mas emails, puedes <a href="${process.env.URL}/unsubscribe">darte de baja aqui</a>.</p>
    `,
  };
}

function buildEmailConfig({ type, to, data }) {
  switch (type) {
    case 'contact':
      return buildContactEmail({ data });
    case 'order-confirmation':
      return buildOrderConfirmationEmail({ to, data });
    case 'newsletter':
      return buildNewsletterEmail({ to });
    default:
      throw new Error('Invalid email type');
  }
}

async function sendEmail({ type, to, data }) {
  configureSendgrid();
  const emailConfig = buildEmailConfig({ type, to, data });
  await sgMail.send(emailConfig);
  return { success: true };
}

exports.sendEmail = sendEmail;
exports.isSendgridConfigured = isSendgridConfigured;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const { type, to, data } = JSON.parse(event.body || '{}');
    await sendEmail({ type, to, data });

    return jsonResponse(200, { success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email sending error:', error);

    const statusCode = error.message === 'SendGrid environment is not configured' ? 503 : 500;
    return jsonResponse(statusCode, {
      success: false,
      error: 'Failed to send email',
      details: error.message,
    });
  }
};
