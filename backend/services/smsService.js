const axios = require('axios');

const sendSMS = async (numbers, message, otp = null) => {
  try {
    if (!process.env.FAST2SMS_API_KEY) {
      console.log(`[MOCK SMS] To: ${numbers} | Message: ${message}`);
      return { success: true, message: 'Mock SMS sent' };
    }

    const params = {
      authorization: process.env.FAST2SMS_API_KEY,
      numbers: numbers,
    };

    if (otp) {
      // Use Fast2SMS pre-approved OTP route to avoid DLT / Custom text blocks
      params.route = 'otp';
      params.variables_values = otp;
    } else {
      params.route = 'q';
      params.message = message;
      params.language = 'english';
    }

    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', { params });
    console.log('SMS sent successfully:', response.data);
    return response.data;
  } catch (error) {
    const errorMsg = error.response && error.response.data && error.response.data.message 
      ? error.response.data.message 
      : error.message;
    console.error('Error sending SMS:', errorMsg);
    throw new Error(errorMsg);
  }
};

module.exports = { sendSMS };
