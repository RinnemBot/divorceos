import { sendAgentMessage } from './agentmail';

const AGENT_EMAIL = 'divorceos@agentmail.to';

export interface EmailConfirmation {
  userId: string;
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

const CONFIRMATIONS_KEY = 'divorceos_confirmations';

// Generate a random confirmation token
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Store confirmation in localStorage
function storeConfirmation(confirmation: EmailConfirmation): void {
  const data = localStorage.getItem(CONFIRMATIONS_KEY);
  const confirmations: EmailConfirmation[] = data ? JSON.parse(data) : [];
  
  // Remove any existing confirmation for this email
  const filtered = confirmations.filter(c => c.email !== confirmation.email);
  filtered.push(confirmation);
  
  localStorage.setItem(CONFIRMATIONS_KEY, JSON.stringify(filtered));
}

// Get confirmation by token
export function getConfirmationByToken(token: string): EmailConfirmation | null {
  const data = localStorage.getItem(CONFIRMATIONS_KEY);
  const confirmations: EmailConfirmation[] = data ? JSON.parse(data) : [];
  return confirmations.find(c => c.token === token) || null;
}

// Remove confirmation after verification
export function removeConfirmation(token: string): void {
  const data = localStorage.getItem(CONFIRMATIONS_KEY);
  const confirmations: EmailConfirmation[] = data ? JSON.parse(data) : [];
  const filtered = confirmations.filter(c => c.token !== token);
  localStorage.setItem(CONFIRMATIONS_KEY, JSON.stringify(filtered));
}

// Send confirmation email to user
export async function sendConfirmationEmail(
  email: string, 
  userId: string, 
  name?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  
  const confirmation: EmailConfirmation = {
    userId,
    email: email.toLowerCase(),
    token,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  
  storeConfirmation(confirmation);
  
  const confirmationUrl = `${window.location.origin}/confirm-email?token=${token}`;
  
  const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email - DivorceOS</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: #e0e7ff; margin: 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #1d4ed8; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
    .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏛️ DivorceOS</h1>
      <p>California Divorce Law Assistance</p>
    </div>
    
    <div class="content">
      <h2>Welcome to DivorceOS, ${name || 'there'}!</h2>
      
      <p>Thank you for creating an account. To complete your registration and start using our AI-powered divorce assistance, please confirm your email address.</p>
      
      <div style="text-align: center;">
        <a href="${confirmationUrl}" class="button">Confirm My Email Address</a>
      </div>
      
      <div class="info-box">
        <strong>What's included with your free account:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>3 AI chats per day with Maria, your divorce specialist</li>
          <li>Access to 50+ California court forms</li>
          <li>California Family Code information</li>
          <li>Private, secure conversation history</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #6b7280;">
        This confirmation link will expire in 24 hours. If you didn't create an account with DivorceOS, you can safely ignore this email.
      </p>
      
      <p style="font-size: 14px; color: #6b7280; word-break: break-all;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        ${confirmationUrl}
      </p>
    </div>
    
    <div class="footer">
      <p><strong>DivorceOS</strong> - AI-Powered California Divorce Guidance</p>
      <p>📧 divorceos@agentmail.to | 🌐 https://divorceos.com</p>
      <p style="margin-top: 15px; font-size: 11px;">
        This is an automated message. Please do not reply directly to this email.<br>
        For support, contact us at divorceos@agentmail.to
      </p>
      <p style="margin-top: 10px; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} DivorceOS. All rights reserved.<br>
        <em>Important: DivorceOS provides general information, not legal advice. 
        Consult a qualified California family law attorney for your specific situation.</em>
      </p>
    </div>
  </div>
</body>
</html>
  `;
  
  try {
    const result = await sendAgentMessage({
      from: AGENT_EMAIL,
      subject: 'Welcome to DivorceOS - Please Confirm Your Email',
      body: emailBody,
      name: 'DivorceOS Team',
    });
    
    if (result.success) {
      return { success: true, token };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Send signup notification to admin
export async function sendAdminSignupNotification(
  email: string, 
  name?: string,
  isConfirmed: boolean = false
): Promise<void> {
  const body = `
🎉 NEW USER SIGNUP - DivorceOS

User Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: ${email}
👤 Name: ${name || 'Not provided'}
✅ Email Status: ${isConfirmed ? 'Confirmed' : 'Pending Confirmation'}
📅 Signup Date: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated notification from the DivorceOS system.
  `;
  
  try {
    await sendAgentMessage({
      from: 'system@divorceos.com',
      subject: `[DivorceOS] New User Signup - ${email}`,
      body,
      name: 'DivorceOS System',
    });
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}

// Verify if token is valid and not expired
export function isTokenValid(token: string): boolean {
  const confirmation = getConfirmationByToken(token);
  if (!confirmation) return false;
  
  const now = new Date();
  const expiresAt = new Date(confirmation.expiresAt);
  
  return now <= expiresAt;
}
