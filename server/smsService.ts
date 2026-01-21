let twilioClient: any = null;

async function initializeTwilioClient() {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const { default: twilio } = await import('twilio');
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error);
    }
  }
  return twilioClient;
}

export async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    const client = await initializeTwilioClient();
    
    if (!client || !process.env.TWILIO_PHONE_NUMBER) {
      console.log(`📱 SMS message for ${phone}: ${message}`);
      return true;
    }

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log(`✅ SMS sent successfully to ${phone}`);
    return true;
  } catch (error) {
    console.error('Twilio SMS error:', error);
    console.log(`📱 SMS fallback for ${phone}: ${message}`);
    return false;
  }
}

export async function sendVerificationSMS(phone: string, code: string): Promise<boolean> {
  const message = `Your EatOff verification code is: ${code}. This code will expire in 10 minutes.`;
  return await sendSMS(phone, message);
}