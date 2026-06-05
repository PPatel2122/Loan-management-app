require('./config/env');
const { sendSMS } = require('./services/smsService');

const test = async () => {
  try {
    console.log('Sending test SMS via mock console logger...');
    const res = await sendSMS('9999999999', 'Your verification OTP is 123456');
    console.log('Test result:', res);
  } catch (err) {
    console.error('Test failed:', err);
  }
};

test();
