const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const axios = require('axios');

const sendOTPEmail = async (email, otp) => {
  console.log(`[EMAIL SERVICE] Generated OTP for ${email}: ${otp}`);

  // 1. Check if Brevo API Key is configured. If so, send via HTTPS REST API (bypasses all SMTP blocks!)
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            name: process.env.BREVO_SENDER_NAME || 'Ekaakshara Finance',
            email: process.env.BREVO_SENDER_EMAIL || 'ekaaksharafinanceservices@gmail.com'
          },
          to: [
            {
              email: email
            }
          ],
          subject: 'Ekaakshara Finance - Email Verification OTP',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px; max-width: 600px;">
              <h2 style="color: #4f46e5;">Ekaakshara Finance Services</h2>
              <p>Hello,</p>
              <p>Your verification OTP is:</p>
              <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e1b4b;">${otp}</span>
              </div>
              <p>This OTP is valid for 10 minutes. Please enter this code in the portal to verify your email address.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; color: #6b7280;">This is an automated message. Please do not reply to this email.</p>
            </div>
          `
        },
        {
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
          }
        }
      );
      console.log(`[EMAIL SERVICE] OTP email sent successfully to ${email} via Brevo HTTPS API. ID: ${response.data.messageId}`);
      return;
    } catch (error) {
      console.error(`[EMAIL SERVICE] Failed to send email to ${email} via Brevo API:`, error.response?.data || error.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(error.response?.data?.message || error.message);
      }
      // If Brevo API failed and we are not in production, fall back to Resend / SMTP / Ethereal.
    }
  }

  // 2. Check if Resend API Key is configured. If so, send via HTTPS REST API (bypasses all SMTP blocks!)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: process.env.RESEND_FROM || 'onboarding@resend.dev',
          to: email,
          subject: 'Ekaakshara Finance - Email Verification OTP',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px; max-width: 600px;">
              <h2 style="color: #4f46e5;">Ekaakshara Finance Services</h2>
              <p>Hello,</p>
              <p>Your verification OTP is:</p>
              <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e1b4b;">${otp}</span>
              </div>
              <p>This OTP is valid for 10 minutes. Please enter this code in the portal to verify your email address.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; color: #6b7280;">This is an automated message. Please do not reply to this email.</p>
            </div>
          `
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`[EMAIL SERVICE] OTP email sent successfully to ${email} via Resend HTTPS API. ID: ${response.data.id}`);
      return;
    } catch (error) {
      console.error(`[EMAIL SERVICE] Failed to send email to ${email} via Resend API:`, error.response?.data || error.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(error.response?.data?.message || error.message);
      }
      // If Resend API failed and we are not in production, fall back to standard SMTP / Ethereal.
    }
  }

  try {
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      let host = process.env.SMTP_HOST;
      let tlsOptions = {};

      // Resolve hostname manually to IPv4 to prevent IPv6 ENETUNREACH on platforms like Render
      if (/[a-zA-Z]/.test(host)) {
        try {
          const addresses = await dns.resolve4(host);
          if (addresses && addresses.length > 0) {
            console.log(`[EMAIL SERVICE] Resolved ${host} to IPv4: ${addresses[0]}`);
            host = addresses[0];
            tlsOptions = { servername: process.env.SMTP_HOST };
          }
        } catch (dnsErr) {
          console.error(`[EMAIL SERVICE] Manual DNS resolution failed for ${host}:`, dnsErr.message);
        }
      }

      transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: tlsOptions,
        connectionTimeout: 5000, // 5 seconds
        socketTimeout: 5000,     // 5 seconds
      });
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not configured in production environment variables.');
      }
      // Dynamic Ethereal fallback configuration to avoid expired credentials
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const mailOptions = {
      from: '"Ekaakshara Finance" <noreply@ekaakshara.com>',
      to: email,
      subject: 'Ekaakshara Finance - Email Verification OTP',
      text: `Hello,

Your verification OTP is: ${otp}

This OTP is valid for 10 minutes. Please enter this code in the portal to verify your email address.

Regards,
Ekaakshara Finance Services`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px; max-width: 600px;">
          <h2 style="color: #4f46e5;">Ekaakshara Finance Services</h2>
          <p>Hello,</p>
          <p>Your verification OTP is:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e1b4b;">${otp}</span>
          </div>
          <p>This OTP is valid for 10 minutes. Please enter this code in the portal to verify your email address.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #6b7280;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] OTP email sent successfully to ${email}. MessageID: ${info.messageId}`);
    
    // Ethereal testing url preview
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL SERVICE] Preview Sent Email URL: ${previewUrl}`);
    }
  } catch (error) {
    console.error(`[EMAIL SERVICE] Failed to send email to ${email}:`, error.message);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    // Do not throw the error to prevent local testing without internet from failing,
    // since the OTP is already logged to the console.
  }
};

module.exports = { sendOTPEmail };
