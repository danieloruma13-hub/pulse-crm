const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const { smtp } = require('../config/env');

let cachedIPv4Host = null;

async function resolveIPv4Host(hostname) {
  if (cachedIPv4Host) return cachedIPv4Host;
  try {
    const addresses = await dns.resolve4(hostname);
    cachedIPv4Host = addresses[0];
    console.log(`Resolved ${hostname} to IPv4 ${cachedIPv4Host} for SMTP`);
  } catch (err) {
    console.error(`IPv4 resolution failed for ${hostname}, falling back to hostname:`, err.message);
    cachedIPv4Host = hostname;
  }
  return cachedIPv4Host;
}

async function sendEmail({ to, subject, html }) {
  if (!smtp.host || !smtp.user || !smtp.pass) {
    console.log('--- [DEV EMAIL — SMTP not configured] ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log(html);
    console.log('------------------------------------------');
    return;
  }

  const connectHost = await resolveIPv4Host(smtp.host);
  const port = Number(smtp.port) || 587;

  const transporter = nodemailer.createTransport({
    host: connectHost,
    port,
    secure: port === 465, // implicit TLS on 465, STARTTLS on 587/others
    auth: { user: smtp.user, pass: smtp.pass },
    tls: { servername: smtp.host },
    connectionTimeout: 15000,
  });

  await transporter.sendMail({
    from: `"AI CRM" <${smtp.user}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendEmail };
