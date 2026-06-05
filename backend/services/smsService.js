const sendSMS = async (numbers, message) => {
  try {
    console.log(`[SMS NOTIFICATION] Sent to: ${numbers} | Content: ${message}`);
    return { success: true, message: 'SMS logged to console successfully' };
  } catch (error) {
    console.error('Error in mock SMS logging:', error.message);
    throw error;
  }
};

module.exports = { sendSMS };
