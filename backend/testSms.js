require('./config/env');
const { sendSMS } = require('./services/smsService');

const test = async () => {
  try {
    console.log('Sending test SMS with Fast2SMS key:', process.env.FAST2SMS_API_KEY ? 'Set' : 'Missing');
    // Replace with a valid Indian mobile number. Using a generic one might fail if Fast2SMS validates it.
    // However, fast2sms API typically just returns success=false if the route or message is invalid.
    const res = await sendSMS('9999999999', 'Your verification OTP is 123456');
    console.log('Test result:', res);
  } catch (err) {
    console.error('Test failed:', err);
  }
};

test();
