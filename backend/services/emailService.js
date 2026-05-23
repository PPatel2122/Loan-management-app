const nodemailer = require('nodemailer');

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

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
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
