import { MailService } from '@sendgrid/mail';
import type { Order, OrderItem, Restaurant, MenuItem } from '@shared/schema';

const mailService = new MailService();

if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface OrderWithDetails extends Order {
  restaurant: Restaurant;
  items: (OrderItem & { menuItem: MenuItem })[];
}

// Email verification service
export async function sendVerificationEmail(email: string, code: string, firstName: string): Promise<boolean> {
  try {
    // Always log verification codes for testing during development
    console.log(`📧 Email verification code for ${email}: ${code}`);
    
    if (!process.env.SENDGRID_API_KEY) {
      return true;
    }

    const msg = {
      to: email,
      from: 'noreply@sendgrid.net',
      subject: 'EatOff - Verify Your Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">EatOff</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Restaurant Vouchers</p>
          </div>
          
          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to EatOff, ${firstName}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Thank you for creating your EatOff account. To complete your registration, please verify your email address using the code below:
            </p>
            
            <div style="background: #f8f9fa; border: 2px solid #ff6b35; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code:</p>
              <h1 style="color: #ff6b35; font-size: 36px; letter-spacing: 4px; margin: 0; font-family: monospace;">${code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              This code will expire in 10 minutes. If you didn't create an EatOff account, please ignore this email.
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                EatOff - Discover amazing restaurant vouchers and save on your favorite meals
              </p>
            </div>
          </div>
        </div>
      `,
      text: `Welcome to EatOff, ${firstName}! Your verification code is: ${code}. This code will expire in 10 minutes.`
    };

    await mailService.send(msg);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    // Fallback to console logging if email fails
    console.log(`📧 Email verification code for ${email}: ${code}`);
    return false;
  }
}

export async function sendOrderNotificationToRestaurant(order: OrderWithDetails): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid API key not configured, skipping email notification');
    return false;
  }

  if (!order.restaurant.email) {
    console.log('Restaurant email not configured, skipping email notification');
    return false;
  }

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.menuItem.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${item.unitPrice}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${item.totalPrice}</td>
      ${item.specialRequests ? `<td style="padding: 8px; border-bottom: 1px solid #eee;">${item.specialRequests}</td>` : ''}
    </tr>
  `).join('');

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
        New Order Received - #${order.orderNumber}
      </h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #2c3e50;">Order Details</h3>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Order Type:</strong> ${order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}</p>
        <p><strong>Total Amount:</strong> €${order.totalAmount}</p>
        <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #2c3e50;">Customer Information</h3>
        <p><strong>Name:</strong> ${order.customerName}</p>
        <p><strong>Phone:</strong> ${order.customerPhone}</p>
        <p><strong>Email:</strong> ${order.customerEmail}</p>
        ${order.deliveryAddress ? `<p><strong>Delivery Address:</strong> ${order.deliveryAddress}</p>` : ''}
      </div>

      <div style="margin: 20px 0;">
        <h3 style="color: #2c3e50;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
          <thead>
            <tr style="background-color: #34495e; color: white;">
              <th style="padding: 12px; text-align: left;">Item</th>
              <th style="padding: 12px; text-align: center;">Qty</th>
              <th style="padding: 12px; text-align: right;">Unit Price</th>
              <th style="padding: 12px; text-align: right;">Total</th>
              ${order.items.some(item => item.specialRequests) ? '<th style="padding: 12px; text-align: left;">Special Requests</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #ecf0f1; font-weight: bold;">
              <td colspan="3" style="padding: 12px; text-align: right;">Total:</td>
              <td style="padding: 12px; text-align: right;">€${order.totalAmount}</td>
              ${order.items.some(item => item.specialRequests) ? '<td></td>' : ''}
            </tr>
          </tfoot>
        </table>
      </div>

      ${order.specialInstructions ? `
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
          <h4 style="margin-top: 0; color: #856404;">Special Instructions</h4>
          <p style="margin-bottom: 0;">${order.specialInstructions}</p>
        </div>
      ` : ''}

      <div style="margin-top: 30px; padding: 20px; background-color: #e8f5e8; border-radius: 8px;">
        <p style="margin: 0; color: #155724;">
          <strong>Next Steps:</strong> Please confirm this order and provide an estimated ready time through your restaurant portal or by replying to this email.
        </p>
      </div>

      <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
        <p>This order was placed through RestaurantVouchers platform.</p>
        <p>For support, please contact us or manage orders through your restaurant portal.</p>
      </div>
    </div>
  `;

  try {
    await mailService.send({
      to: order.restaurant.email,
      from: 'noreply@sendgrid.net', // Use SendGrid's verified sender for testing
      subject: `New Order #${order.orderNumber} - ${order.restaurant.name}`,
      html: emailHtml,
    });
    return true;
  } catch (error) {
    console.error('Failed to send order notification email:', error);
    return false;
  }
}

export async function sendOrderConfirmationToCustomer(order: OrderWithDetails): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid API key not configured, skipping customer email');
    return false;
  }

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.menuItem.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${item.totalPrice}</td>
    </tr>
  `).join('');

  const customerEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #27ae60; text-align: center;">Order Confirmation</h2>
      
      <div style="text-align: center; margin: 20px 0;">
        <p style="font-size: 18px; color: #2c3e50;">Thank you for your order!</p>
        <p style="font-size: 16px; color: #7f8c8d;">Order #${order.orderNumber}</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #2c3e50;">Restaurant Details</h3>
        <p><strong>${order.restaurant.name}</strong></p>
        <p>${order.restaurant.address}</p>
        ${order.restaurant.phone ? `<p>Phone: ${order.restaurant.phone}</p>` : ''}
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #2c3e50;">Order Summary</h3>
        <p><strong>Order Type:</strong> ${order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}</p>
        <p><strong>Total Amount:</strong> €${order.totalAmount}</p>
        <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
      </div>

      <div style="margin: 20px 0;">
        <h3 style="color: #2c3e50;">Your Items</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
          <thead>
            <tr style="background-color: #34495e; color: white;">
              <th style="padding: 12px; text-align: left;">Item</th>
              <th style="padding: 12px; text-align: center;">Quantity</th>
              <th style="padding: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #ecf0f1; font-weight: bold;">
              <td colspan="2" style="padding: 12px; text-align: right;">Total:</td>
              <td style="padding: 12px; text-align: right;">€${order.totalAmount}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-radius: 8px;">
        <h4 style="margin-top: 0; color: #0c5460;">What's Next?</h4>
        <p style="margin-bottom: 0;">
          The restaurant has been notified of your order. You will receive another email with the estimated ready time once the restaurant confirms your order.
        </p>
      </div>

      <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
        <p>Questions about your order? Contact the restaurant directly or reach out to our support team.</p>
      </div>
    </div>
  `;

  try {
    await mailService.send({
      to: order.customerEmail,
      from: 'noreply@sendgrid.net',
      subject: `Order Confirmation #${order.orderNumber} - ${order.restaurant.name}`,
      html: customerEmailHtml,
    });
    return true;
  } catch (error) {
    console.error('Failed to send customer confirmation email:', error);
    return false;
  }
}