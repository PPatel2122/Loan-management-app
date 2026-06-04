const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp) => {
  console.log(`[EMAIL SERVICE] Generated OTP for ${email}: ${otp}`);

  try {
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
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
