import { sendSMS } from './smsService';
import { sendOrderConfirmationToCustomer } from './emailService';

interface NotificationData {
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  reservationId: number;
  restaurantName: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  status: 'confirmed' | 'rejected';
}

export async function sendReservationStatusNotification(data: NotificationData): Promise<boolean> {
  try {
    console.log(`Sending reservation ${data.status} notification to ${data.customerEmail}`);
    
    // Prepare notification message
    const message = data.status === 'confirmed' 
      ? `Great news! Your reservation at ${data.restaurantName} for ${data.partySize} people on ${data.reservationDate} at ${data.reservationTime} has been CONFIRMED. We look forward to serving you!`
      : `We're sorry, but your reservation at ${data.restaurantName} for ${data.reservationDate} at ${data.reservationTime} has been declined. Please try selecting a different date/time or contact the restaurant directly.`;

    // Send email notification
    try {
      const emailSubject = data.status === 'confirmed' 
        ? `Reservation Confirmed - ${data.restaurantName}` 
        : `Reservation Update - ${data.restaurantName}`;
        
      // Create a simple email template
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${data.status === 'confirmed' ? '#10b981' : '#ef4444'};">
            Reservation ${data.status === 'confirmed' ? 'Confirmed' : 'Update'}
          </h2>
          <p>Hello ${data.customerName},</p>
          <p>${message}</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Reservation Details:</h3>
            <p><strong>Restaurant:</strong> ${data.restaurantName}</p>
            <p><strong>Date:</strong> ${data.reservationDate}</p>
            <p><strong>Time:</strong> ${data.reservationTime}</p>
            <p><strong>Party Size:</strong> ${data.partySize} people</p>
          </div>
          <p>Best regards,<br>EatOff Team</p>
        </div>
      `;

      // For now, log the email since SendGrid requires setup
      console.log(`EMAIL NOTIFICATION:
To: ${data.customerEmail}
Subject: ${emailSubject}
Content: ${message}`);
      
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    // Send SMS notification if phone number available
    if (data.customerPhone) {
      try {
        await sendSMS(data.customerPhone, message);
        console.log(`SMS notification sent to ${data.customerPhone}`);
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
      }
    }

    return true;
  } catch (error) {
    console.error('Notification service error:', error);
    return false;
  }
}

export async function sendReservationNotificationToRestaurant(reservationData: any): Promise<boolean> {
  try {
    console.log(`Sending new reservation notification to restaurant`);
    
    const message = `New reservation request received:
- Customer: ${reservationData.customerName}
- Date: ${reservationData.date}
- Time: ${reservationData.time}
- Party Size: ${reservationData.partySize}
- Special Requests: ${reservationData.specialRequests || 'None'}
Please log into your restaurant portal to confirm or decline this reservation.`;

    // Log restaurant notification (in production, this would be sent via email/SMS to restaurant)
    console.log(`RESTAURANT NOTIFICATION:
Restaurant: ${reservationData.restaurantName}
Content: ${message}`);

    return true;
  } catch (error) {
    console.error('Restaurant notification error:', error);
    return false;
  }
}