const nodemailer = require('nodemailer');
const dns = require('dns').promises;

const sendEmail = async ({ to, subject, text, html }) => {
  const hasConfig = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!hasConfig) {
    console.log('=========================================');
    console.log(`[EMAIL SIMULATOR] To: ${to}`);
    console.log(`[EMAIL SIMULATOR] Subject: ${subject}`);
    console.log(`[EMAIL SIMULATOR] Body: ${text}`);
    console.log('=========================================');
    return { simulated: true };
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  let resolvedHost = host;

  // Resolve mail host to IPv4 address to avoid ENETUNREACH IPv6 routing errors on cloud hosts like Render
  try {
    const ipAddresses = await dns.resolve4(host);
    if (ipAddresses && ipAddresses.length > 0) {
      resolvedHost = ipAddresses[0];
      console.log(`Resolved mail host ${host} to IPv4 address: ${resolvedHost}`);
    }
  } catch (dnsErr) {
    console.warn(`IPv4 resolution failed for mail host ${host}, falling back to hostname:`, dnsErr);
  }

  const transporter = nodemailer.createTransport({
    host: resolvedHost,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      servername: host, // Crucial: verify SSL/TLS certificate against the original domain (e.g. smtp.gmail.com)
      rejectUnauthorized: false // Avoid connection blocks on self-signed/incomplete CA chains
    }
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || `"ZenLoan Verification" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email via Nodemailer:', error);
    throw error;
  }
};

module.exports = { sendEmail };
