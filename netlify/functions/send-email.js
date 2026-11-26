const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

function isBrevoConfigured() {
  return Boolean(process.env.BREVO_API_KEY && process.env.FROM_EMAIL);
}

function getSender() {
  return {
    email: process.env.FROM_EMAIL,
    name: process.env.FROM_NAME || "Castanya de Viladrau",
  };
}

function getRequiredRecipient(type, to) {
  switch (type) {
    case "contact":
    case "activity-booking-notification":
      return process.env.CONTACT_EMAIL;
    case "order-confirmation":
    case "newsletter":
    case "activity-booking-confirmation":
    case "payment-reminder":
      return to;
    case "order-notification":
      return process.env.ORDER_NOTIFICATION_EMAIL;
    default:
      return undefined;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function withEmailContent(emailConfig) {
  const htmlContent = String(
    emailConfig.htmlContent || emailConfig.html || "",
  ).trim();
  const textContent = String(emailConfig.textContent || "").trim();

  return {
    ...emailConfig,
    htmlContent:
      htmlContent ||
      "<p>Hem rebut la teva solicitud correctament. Si us plau, contacta amb nosaltres si necessites ajuda addicional.</p>",
    textContent:
      textContent ||
      "Hem rebut la teva solicitud correctament. Si us plau, contacta amb nosaltres si necessites ajuda addicional.",
  };
}

const ORDER_CONFIRMATION_STRINGS = {
  ca: {
    subject: (id) => `Confirmació de la comanda #${id}`,
    title: "Gràcies per la teva comanda",
    received: (id) => `Hem rebut correctament la comanda <strong>#${id}</strong>.`,
    detailsTitle: "Detalls de la comanda",
    total: "Total",
    pickupTitle: "Recollida de la comanda",
    pickupText: (store) =>
      `Has indicat que vindràs a recollir la comanda a la botiga de <strong>${store}</strong>.`,
    shippingTitle: "Dades d'enviament",
    billingTitle: "Dades de facturació",
    vatLabel: "NIF/VAT",
    invoiceAttached: "Trobaràs la factura de la comanda adjunta en aquest correu (PDF).",
    updates: "T'enviarem noves actualitzacions quan la comanda avanci.",
  },
  es: {
    subject: (id) => `Confirmación de pedido #${id}`,
    title: "Gracias por tu pedido",
    received: (id) => `Hemos recibido correctamente el pedido <strong>#${id}</strong>.`,
    detailsTitle: "Detalles del pedido",
    total: "Total",
    pickupTitle: "Recogida del pedido",
    pickupText: (store) =>
      `Has indicado que vendrás a recoger el pedido a la tienda de <strong>${store}</strong>.`,
    shippingTitle: "Datos de envío",
    billingTitle: "Datos de facturación",
    vatLabel: "NIF/VAT",
    invoiceAttached: "Encontrarás la factura del pedido adjunta en este correo (PDF).",
    updates: "Te enviaremos nuevas actualizaciones cuando el pedido avance.",
  },
  en: {
    subject: (id) => `Order confirmation #${id}`,
    title: "Thank you for your order",
    received: (id) => `We have successfully received your order <strong>#${id}</strong>.`,
    detailsTitle: "Order details",
    total: "Total",
    pickupTitle: "Order pickup",
    pickupText: (store) =>
      `You have chosen to pick up your order at the <strong>${store}</strong> shop.`,
    shippingTitle: "Shipping details",
    billingTitle: "Billing details",
    vatLabel: "VAT/Tax ID",
    invoiceAttached: "You will find the invoice for your order attached to this email (PDF).",
    updates: "We will send you further updates as your order progresses.",
  },
};

function getOrderConfirmationStrings(lang) {
  return ORDER_CONFIRMATION_STRINGS[lang] || ORDER_CONFIRMATION_STRINGS.ca;
}

function buildOrderConfirmationEmail({ to, data }) {
  const t = getOrderConfirmationStrings(data.lang);
  const orderTotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const isPickup = data.customer.fulfillmentMethod === "pickup";
  const itemsList = data.items
    .map(
      (item) =>
        `<li>${escapeHtml(item.name)} (${escapeHtml(item.variantLabel)}) x${item.quantity} - € ${item.lineTotal.toFixed(2)}</li>`,
    )
    .join("");

  const billingBlock = data.billing
    ? `
      <h3>${t.billingTitle}</h3>
      <p>
        ${data.billing.company ? `${escapeHtml(data.billing.company)}<br>` : ""}
        ${data.billing.vat ? `${t.vatLabel}: ${escapeHtml(data.billing.vat)}<br>` : ""}
        ${data.billing.address ? `${escapeHtml(data.billing.address)}<br>` : ""}
        ${data.billing.city || data.billing.postalCode ? `${escapeHtml(data.billing.city || "")}${data.billing.city && data.billing.postalCode ? ", " : ""}${escapeHtml(data.billing.postalCode || "")}<br>` : ""}
        ${data.billing.country ? `${escapeHtml(data.billing.country)}` : ""}
      </p>`
    : "";

  const fulfillmentBlock = isPickup
    ? `
      <h3>${t.pickupTitle}</h3>
      <p>${t.pickupText(escapeHtml(data.customer.pickupStore))}</p>`
    : `
      <h3>${t.shippingTitle}</h3>
      <p>
        ${escapeHtml(data.customer.name)}<br>
        ${escapeHtml(data.customer.address)}<br>
        ${escapeHtml(data.customer.city)}, ${escapeHtml(data.customer.postalCode)}<br>
        ${escapeHtml(data.customer.country)}
      </p>`;

  return {
    to: [{ email: to }],
    sender: getSender(),
    subject: t.subject(data.orderId),
    htmlContent: `
      <h2>${t.title}</h2>
      <p>${t.received(escapeHtml(data.orderId))}</p>

      <h3>${t.detailsTitle}</h3>
      <ul>${itemsList}</ul>

      <p><strong>${t.total}: € ${orderTotal.toFixed(2)}</strong></p>

      ${fulfillmentBlock}
      ${billingBlock}

      ${data.hasInvoice ? `<p>${t.invoiceAttached}</p>` : ""}
      <p>${t.updates}</p>
    `,
  };
}

function buildOrderNotificationEmail({ data }) {
  const orderTotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const isPickup = data.customer.fulfillmentMethod === "pickup";
  const itemsList = data.items
    .map(
      (item) =>
        `<li>${escapeHtml(item.name)} (${escapeHtml(item.variantLabel)}) x${item.quantity} - € ${item.lineTotal.toFixed(2)}</li>`,
    )
    .join("");

  const billingBlock = data.billing
    ? `
      <h3>Dades de facturació</h3>
      <p>
        ${data.billing.company ? `<strong>Empresa:</strong> ${escapeHtml(data.billing.company)}<br>` : ""}
        ${data.billing.vat ? `<strong>NIF/VAT:</strong> ${escapeHtml(data.billing.vat)}<br>` : ""}
        <strong>Adreça:</strong> ${escapeHtml(data.billing.address || "")}<br>
        ${escapeHtml(data.billing.city || "")}${data.billing.city && data.billing.postalCode ? ", " : ""}${escapeHtml(data.billing.postalCode || "")}<br>
        ${escapeHtml(data.billing.country || "")}
      </p>`
    : "";

  const fulfillmentBlock = isPickup
    ? `
      <h3>Recollida a botiga</h3>
      <p>
        <strong>Modalitat:</strong> Recollida a botiga<br>
        <strong>Botiga:</strong> ${escapeHtml(data.customer.pickupStore)}
      </p>`
    : `
      <h3>Adreca d'enviament</h3>
      <p>
        ${escapeHtml(data.customer.address)}<br>
        ${escapeHtml(data.customer.city)}, ${escapeHtml(data.customer.postalCode)}<br>
        ${escapeHtml(data.customer.country)}
      </p>`;

  return {
    to: [{ email: getRequiredRecipient("order-notification") }],
    sender: getSender(),
    subject: `Nou pedido pagat #${data.orderId}`,
    htmlContent: `
      <h2>Nou pedido pagat</h2>
      <p>S'ha confirmat el pagament de la comanda <strong>#${escapeHtml(data.orderId)}</strong>.</p>

      <h3>Dades del client</h3>
      <p>
        <strong>Nom:</strong> ${escapeHtml(data.customer.name)}<br>
        <strong>Email:</strong> ${escapeHtml(data.customer.email)}<br>
        <strong>Telefon:</strong> ${escapeHtml(data.customer.phone || "")}
      </p>

      ${fulfillmentBlock}
      ${billingBlock}

      <h3>Detalls de la comanda</h3>
      <ul>${itemsList}</ul>

      <p><strong>Total: € ${orderTotal.toFixed(2)}</strong></p>
      ${data.customer.notes ? `<p><strong>Notes:</strong> ${escapeHtml(data.customer.notes)}</p>` : ""}
    `,
  };
}

const PAYMENT_REMINDER_STRINGS = {
  ca: {
    subject: (code) => `La teva comanda ${code} està pendent de pagament`,
    title: "La teva comanda encara no s'ha pagat",
    intro: (code, amount) =>
      `Hem vist que la comanda <strong>${code}</strong> (€ ${amount}) es va quedar pendent de pagament.`,
    resume: "Pots acabar-la ara mateix fent clic aquí:",
    resumeLink: "Completar el pagament",
    cancel:
      "Si no vols continuar amb la comanda, no cal que facis res: la cancel·larem automàticament passats uns dies.",
  },
  es: {
    subject: (code) => `Tu pedido ${code} está pendiente de pago`,
    title: "Tu pedido todavía no se ha pagado",
    intro: (code, amount) =>
      `Hemos visto que el pedido <strong>${code}</strong> (€ ${amount}) se quedó pendiente de pago.`,
    resume: "Puedes terminarlo ahora mismo haciendo clic aquí:",
    resumeLink: "Completar el pago",
    cancel:
      "Si no quieres continuar con el pedido, no hace falta que hagas nada: lo cancelaremos automáticamente pasados unos días.",
  },
  en: {
    subject: (code) => `Your order ${code} is awaiting payment`,
    title: "Your order has not been paid yet",
    intro: (code, amount) =>
      `We noticed that order <strong>${code}</strong> (€ ${amount}) was left pending payment.`,
    resume: "You can complete it right now by clicking here:",
    resumeLink: "Complete payment",
    cancel:
      "If you do not want to continue with the order, you do not need to do anything: we will cancel it automatically after a few days.",
  },
};

function buildPaymentReminderEmail({ to, data }) {
  const t = PAYMENT_REMINDER_STRINGS[data.lang] || PAYMENT_REMINDER_STRINGS.ca;
  const amount = Number(data.totalAmount || 0).toFixed(2);

  return {
    to: [{ email: to }],
    sender: getSender(),
    subject: t.subject(data.orderCode),
    htmlContent: `
      <h2>${t.title}</h2>
      <p>${t.intro(escapeHtml(data.orderCode), amount)}</p>
      <p>
        ${t.resume}
        <a href="${escapeHtml(data.resumeUrl)}">${t.resumeLink}</a>.
      </p>
      <p>${t.cancel}</p>
    `,
  };
}

function buildContactEmail({ data }) {
  return {
    to: [{ email: getRequiredRecipient("contact") }],
    sender: getSender(),
    subject: `Nuevo mensaje de contacto de ${data.name}`,
    htmlContent: `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Telefono:</strong> ${escapeHtml(data.phone || "No proporcionado")}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${escapeHtml(data.message)}</p>
    `,
  };
}

function buildActivityBookingNotificationEmail({ data }) {
  return {
    to: [{ email: getRequiredRecipient("activity-booking-notification") }],
    sender: getSender(),
    subject: `Nova solicitud de reserva: ${data.activityTitle}`,
    htmlContent: `
      <h2>Nova solicitud de reserva</h2>
      <p><strong>Activitat:</strong> ${escapeHtml(data.activityTitle)}</p>
      <p><strong>Enllac:</strong> <a href="${escapeHtml(data.activityUrl)}">${escapeHtml(data.activityUrl)}</a></p>
      <p><strong>Nom:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Telefon:</strong> ${escapeHtml(data.phone || "No proporcionat")}</p>
      <p><strong>Data preferida:</strong> ${escapeHtml(data.preferredDate)}</p>
      <p><strong>Nombre de persones:</strong> ${escapeHtml(data.partySize)}</p>
      <p><strong>Comentaris:</strong></p>
      <p>${escapeHtml(data.message || "Sense comentaris addicionals")}</p>
    `,
  };
}

function buildActivityBookingConfirmationEmail({ to, data }) {
  return {
    to: [{ email: getRequiredRecipient("activity-booking-confirmation", to) }],
    sender: getSender(),
    subject: `Hem rebut la teva solicitud: ${data.activityTitle}`,
    htmlContent: `
      <h2>Hem rebut la teva solicitud</h2>
      <p>Gracies, ${escapeHtml(data.name)}. Hem rebut la teva solicitud per a <strong>${escapeHtml(data.activityTitle)}</strong>.</p>
      <p>Et respondrem al mes aviat possible amb la disponibilitat i els seguents passos.</p>
      <ul>
        <li><strong>Data preferida:</strong> ${escapeHtml(data.preferredDate)}</li>
        <li><strong>Nombre de persones:</strong> ${escapeHtml(data.partySize)}</li>
        <li><strong>Telefon:</strong> ${escapeHtml(data.phone || "No proporcionat")}</li>
      </ul>
      ${data.message ? `<p><strong>Comentaris:</strong> ${escapeHtml(data.message)}</p>` : ""}
    `,
  };
}

function buildNewsletterEmail({ to }) {
  return {
    to: [{ email: getRequiredRecipient("newsletter", to) }],
    sender: getSender(),
    subject: "Bienvenido a nuestro newsletter",
    htmlContent: `
      <h2>Bienvenido a nuestro newsletter</h2>
      <p>Gracias por suscribirte. Recibiras nuestras ultimas novedades y ofertas exclusivas.</p>
      <p>Si no deseas recibir mas emails, puedes <a href="${process.env.URL}/unsubscribe">darte de baja aqui</a>.</p>
    `,
  };
}

function buildEmailConfig({ type, to, data }) {
  switch (type) {
    case "contact":
      return buildContactEmail({ data });
    case "order-confirmation":
      return buildOrderConfirmationEmail({ to, data });
    case "order-notification":
      return buildOrderNotificationEmail({ data });
    case "newsletter":
      return buildNewsletterEmail({ to });
    case "activity-booking-notification":
      return buildActivityBookingNotificationEmail({ data });
    case "activity-booking-confirmation":
      return buildActivityBookingConfirmationEmail({ to, data });
    case "payment-reminder":
      return buildPaymentReminderEmail({ to, data });
    default:
      throw new Error("Invalid email type");
  }
}

async function sendActivityBookingEmails({ to, data }) {
  const notificationConfig = withEmailContent(
    buildActivityBookingNotificationEmail({ data }),
  );
  const confirmationConfig = withEmailContent(
    buildActivityBookingConfirmationEmail({ to, data }),
  );

  await sendBrevoEmail(notificationConfig);
  await sendBrevoEmail(confirmationConfig);

  return { success: true };
}

async function sendBrevoEmail(emailConfig) {
  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(emailConfig),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API request failed: ${errorText}`);
  }

  return response.json();
}

async function sendEmail({ type, to, data, attachments }) {
  if (!isBrevoConfigured()) {
    throw new Error("Brevo environment is not configured");
  }

  if (type === "activity-booking") {
    if (!getRequiredRecipient("activity-booking-notification")) {
      throw new Error("Contact email is not configured");
    }

    if (!to) {
      throw new Error("Recipient email is required");
    }

    return sendActivityBookingEmails({ to, data });
  }

  const recipient = getRequiredRecipient(type, to);
  if (!recipient) {
    if (type === "contact" || type === "activity-booking-notification") {
      throw new Error("Contact email is not configured");
    }

    if (type === "order-notification") {
      throw new Error("Order notification email is not configured");
    }

    throw new Error("Recipient email is required");
  }

  let emailConfig = withEmailContent(buildEmailConfig({ type, to, data }));
  if (Array.isArray(attachments) && attachments.length > 0) {
    emailConfig = { ...emailConfig, attachment: attachments };
  }
  await sendBrevoEmail(emailConfig);
  return { success: true };
}

exports.sendEmail = sendEmail;
exports.isBrevoConfigured = isBrevoConfigured;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const { type, to, data } = JSON.parse(event.body || "{}");
    await sendEmail({ type, to, data });

    return jsonResponse(200, {
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Email sending error:", error);

    const statusCode =
      error.message === "Brevo environment is not configured" ? 503 : 500;
    return jsonResponse(statusCode, {
      success: false,
      error: "Failed to send email",
      details: error.message,
    });
  }
};
