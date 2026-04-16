import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceRateLimit } from './_security.js';
import { AGENTMAIL_INBOX_ID, sendAgentMail } from './_agentmail.js';
import {
  buildNewUserRecord,
  createEmailVerificationToken,
  createSessionForUser,
  deleteChatSessionRecord,
  destroySession,
  getAuthenticatedUser,
  isAdminEmail,
  listChatSessions,
  loadUserByEmail,
  requireAuthenticatedUser,
  requireSupabase,
  toAuthUser,
  updateUserProfile,
  updateUserRecord,
  upsertChatSession,
  verifyPassword,
  hashToken,
  type UserProfile,
} from './_auth.js';

const USERS_TABLE = 'site_users';
const REFERRALS_TABLE = 'site_referrals';
const SUPPORT_SCENARIOS_TABLE = 'site_support_scenarios';

interface AuthActionBody {
  action?: string;
  email?: string;
  password?: string;
  name?: string;
  token?: string;
  referralCode?: string;
  subscription?: 'free' | 'basic' | 'essential' | 'plus' | 'done-for-you';
  chatCount?: number;
  chatCountResetDate?: string;
  emailVerified?: boolean;
  profile?: UserProfile;
  id?: string;
  title?: string;
  childSupport?: number;
  spousalSupport?: number;
  combinedSupport?: number;
  estimatePayer?: string;
  snapshot?: {
    parentAIncome: number;
    parentBIncome: number;
    parentATimeShare: number;
    childrenCount: number;
    childcare: number;
    medical: number;
    countyId?: string;
    countyName?: string;
    mode: 'quick' | 'advanced';
  };
  sessionId?: string;
  messages?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

function parseJsonBody<T>(req: VercelRequest): T {
  if (!req.body) return {} as T;
  if (typeof req.body === 'object') return req.body as T;
  try {
    return JSON.parse(req.body) as T;
  } catch {
    return {} as T;
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getReferralOwnerKey(value: string) {
  return value.replace(/^DIV/i, '').trim().toLowerCase().slice(0, 6);
}

function isMissingTableError(message: string | undefined, tableName: string) {
  return typeof message === 'string' && message.toLowerCase().includes(`relation \"${tableName}\" does not exist`);
}

function normalizeSupportScenario(row: Record<string, any>) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    childSupport: Number(row.child_support ?? 0),
    spousalSupport: Number(row.spousal_support ?? 0),
    combinedSupport: Number(row.combined_support ?? 0),
    estimatePayer: row.estimate_payer,
    snapshot: row.snapshot,
  };
}

async function sendVerificationEmail(email: string, name: string | null | undefined, token: string) {
  const confirmationUrl = `${process.env.APP_URL || process.env.VITE_APP_URL || 'https://www.divorce-os.com'}/confirm-email?token=${token}`;
  const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email - DivorceOS</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🏛️ DivorceOS</h1>
      <p style="color: #e0e7ff; margin: 10px 0 0;">California Divorce Law Assistance</p>
    </div>
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
      <h2>Welcome to DivorceOS, ${name || 'there'}!</h2>
      <p>Thank you for creating an account. To complete your registration, confirm your email address.</p>
      <p style="margin: 24px 0; text-align: center;">
        <a href="${confirmationUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirm My Email Address</a>
      </p>
      <p>This confirmation link expires in 24 hours.</p>
      <p style="font-size: 14px; color: #6b7280; word-break: break-all;">If the button doesn’t work, paste this into your browser:<br>${confirmationUrl}</p>
    </div>
  </div>
</body>
</html>`;

  await sendAgentMail({
    to: email,
    from: AGENTMAIL_INBOX_ID,
    subject: 'Welcome to DivorceOS - Please Confirm Your Email',
    body: emailBody,
    name: 'DivorceOS Team',
    metadata: { source: 'DivorceOS Auth' },
  });
}

async function sendAdminSignupNotification(email: string, name?: string | null, isConfirmed = false) {
  const body = `
🎉 NEW USER SIGNUP - DivorceOS

User Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: ${email}
👤 Name: ${name || 'Not provided'}
✅ Email Status: ${isConfirmed ? 'Confirmed' : 'Pending Confirmation'}
📅 Signup Date: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  await sendAgentMail({
    to: AGENTMAIL_INBOX_ID,
    from: 'system@divorceos.com',
    subject: `[DivorceOS] New User Signup - ${email}`,
    body,
    name: 'DivorceOS System',
    metadata: { source: 'DivorceOS Auth' },
  });
}

async function handleRegister(req: VercelRequest, res: VercelResponse, body: AuthActionBody) {
  if (!enforceRateLimit(req, res, 'auth-register', 5, 60_000)) return;

  const email = String(body.email || '').trim();
  const password = String(body.password || '');
  const name = typeof body.name === 'string' ? body.name : undefined;

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await loadUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const supabase = requireSupabase();
  const newUserRecord = buildNewUserRecord(email, password, name);
  const verification = newUserRecord.email_verified
    ? null
    : createEmailVerificationToken();

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .insert({
      ...newUserRecord,
      email_verification_token_hash: verification?.tokenHash ?? null,
      email_verification_expires_at: verification?.expiresAt ?? null,
    })
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ error: `Unable to create user: ${error.message}` });
  }

  try {
    const referralKey = getReferralOwnerKey(String(body.referralCode || ''));
    if (referralKey && referralKey !== getReferralOwnerKey(data.id)) {
      const { error: referralError } = await supabase
        .from(REFERRALS_TABLE)
        .insert({
          referrer_key: referralKey,
          referred_user_id: data.id,
          referred_user_email: data.email,
          referred_user_name: data.name ?? null,
        });

      if (referralError) {
        console.error('Referral signup tracking error', referralError);
      }
    }

    if (verification) {
      await sendVerificationEmail(data.email, data.name, verification.token);
    }
    await sendAdminSignupNotification(data.email, data.name, data.email_verified);
  } catch (mailError) {
    console.error('Signup email error', mailError);
  }

  await createSessionForUser(data.id, res);
  return res.status(201).json({ user: toAuthUser(data) });
}

async function handleLogin(req: VercelRequest, res: VercelResponse, body: AuthActionBody) {
  if (!enforceRateLimit(req, res, 'auth-login', 8, 60_000)) return;

  const email = String(body.email || '').trim();
  const password = String(body.password || '');

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await loadUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const needsPremium = (isAdminEmail(user.email) || user.subscription === 'done-for-you') && user.subscription !== 'done-for-you';
  const nextUser = needsPremium
    ? await updateUserRecord(user.id, { subscription: 'done-for-you' })
    : toAuthUser(user);

  await createSessionForUser(user.id, res);
  return res.status(200).json({ user: nextUser });
}

async function handleVerifyEmail(res: VercelResponse, body: AuthActionBody) {
  const token = String(body.token || '').trim();
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required' });
  }

  const tokenHash = hashToken(token);
  const supabase = requireSupabase();
  const { data: user, error } = await supabase
    .from(USERS_TABLE)
    .select('*')
    .eq('email_verification_token_hash', tokenHash)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: `Unable to verify token: ${error.message}` });
  }

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired confirmation link' });
  }

  if (!user.email_verification_expires_at || new Date(user.email_verification_expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired confirmation link' });
  }

  const { data: updatedUser, error: updateError } = await supabase
    .from(USERS_TABLE)
    .update({
      email_verified: true,
      email_verification_token_hash: null,
      email_verification_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return res.status(500).json({ error: `Unable to verify email: ${updateError.message}` });
  }

  return res.status(200).json({ user: toAuthUser(updatedUser) });
}

async function handleResendConfirmation(req: VercelRequest, res: VercelResponse, body: AuthActionBody) {
  if (!enforceRateLimit(req, res, 'auth-resend', 4, 60_000)) return;

  const email = String(body.email || '').trim();
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const user = await loadUserByEmail(email);
  if (!user || user.email_verified) {
    return res.status(200).json({ success: true });
  }

  const verification = createEmailVerificationToken();
  const supabase = requireSupabase();
  const { error } = await supabase
    .from(USERS_TABLE)
    .update({
      email_verification_token_hash: verification.tokenHash,
      email_verification_expires_at: verification.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Refresh confirmation token error', error);
    return res.status(200).json({ success: true });
  }

  try {
    await sendVerificationEmail(user.email, user.name, verification.token);
  } catch (mailError) {
    console.error('Resend confirmation email error', mailError);
  }

  return res.status(200).json({ success: true });
}

async function handleListSupportScenarios(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(SUPPORT_SCENARIOS_TABLE)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error.message, SUPPORT_SCENARIOS_TABLE)) {
      return res.status(200).json({ scenarios: [] });
    }
    return res.status(500).json({ error: `Unable to load saved scenarios: ${error.message}` });
  }

  return res.status(200).json({ scenarios: (data ?? []).map((row) => normalizeSupportScenario(row)) });
}

async function handleSaveSupportScenario(req: VercelRequest, res: VercelResponse, body: AuthActionBody) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  const title = String(body.title || '').trim();
  const estimatePayer = String(body.estimatePayer || '').trim();

  if (!title || !body.snapshot || !estimatePayer) {
    return res.status(400).json({ error: 'title, estimatePayer, and snapshot are required' });
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(SUPPORT_SCENARIOS_TABLE)
    .insert({
      user_id: user.id,
      title,
      child_support: Number(body.childSupport ?? 0),
      spousal_support: Number(body.spousalSupport ?? 0),
      combined_support: Number(body.combinedSupport ?? 0),
      estimate_payer: estimatePayer,
      snapshot: body.snapshot,
    })
    .select('*')
    .single();

  if (error) {
    if (isMissingTableError(error.message, SUPPORT_SCENARIOS_TABLE)) {
      return res.status(503).json({ error: 'Saved scenarios are not ready yet. Please run the latest Supabase SQL first.' });
    }
    return res.status(500).json({ error: `Unable to save scenario: ${error.message}` });
  }

  return res.status(201).json({ scenario: normalizeSupportScenario(data) });
}

async function handleDeleteSupportScenario(req: VercelRequest, res: VercelResponse, body: AuthActionBody) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  if (!body.id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const supabase = requireSupabase();
  const { error } = await supabase
    .from(SUPPORT_SCENARIOS_TABLE)
    .delete()
    .eq('id', body.id)
    .eq('user_id', user.id);

  if (error) {
    if (isMissingTableError(error.message, SUPPORT_SCENARIOS_TABLE)) {
      return res.status(503).json({ error: 'Saved scenarios are not ready yet. Please run the latest Supabase SQL first.' });
    }
    return res.status(500).json({ error: `Unable to delete scenario: ${error.message}` });
  }

  return res.status(200).json({ success: true });
}

async function handleListChatSessions(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  const sessions = await listChatSessions(user.id);
  return res.status(200).json({ sessions });
}

async function handleSaveChatSession(req: VercelRequest, res: VercelResponse, body: AuthActionBody) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  if (typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const saved = await upsertChatSession(user.id, {
    id: body.sessionId,
    title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'New Chat',
    messages: Array.isArray(body.messages) ? body.messages : [],
    createdAt: typeof body.createdAt === 'string' ? body.createdAt : undefined,
    updatedAt: typeof body.updatedAt === 'string' ? body.updatedAt : undefined,
  });

  return res.status(200).json({ session: saved });
}

async function handleDeleteChatSession(req: VercelRequest, res: VercelResponse, body: AuthActionBody) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  if (typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  await deleteChatSessionRecord(user.id, body.sessionId);
  return res.status(200).json({ success: true });
}

async function handleUpdateProfile(req: VercelRequest, res: VercelResponse, body: AuthActionBody) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  const updatedUser = await updateUserProfile(user.id, body.profile || {});
  return res.status(200).json({ user: updatedUser });
}

async function handleUpdateUser(req: VercelRequest, res: VercelResponse, body: AuthActionBody) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  const updatedUser = await updateUserRecord(user.id, {
    name: typeof body.name === 'string' ? body.name : undefined,
    subscription: typeof body.subscription === 'string' ? body.subscription : undefined,
    chatCount: typeof body.chatCount === 'number' ? body.chatCount : undefined,
    chatCountResetDate: typeof body.chatCountResetDate === 'string' ? body.chatCountResetDate : undefined,
    emailVerified: typeof body.emailVerified === 'boolean' ? body.emailVerified : undefined,
  });

  return res.status(200).json({ user: updatedUser });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!enforceBrowserOrigin(req, res)) return;

  try {
    if (req.method === 'GET') {
      const user = await getAuthenticatedUser(req);
      return res.status(200).json({ user });
    }

    const body = parseJsonBody<AuthActionBody>(req);
    const action = String(body.action || '').trim();

    if (req.method === 'POST') {
      if (action === 'register') return handleRegister(req, res, body);
      if (action === 'login') return handleLogin(req, res, body);
      if (action === 'logout') {
        await destroySession(req, res);
        return res.status(200).json({ success: true });
      }
      if (action === 'verify-email') return handleVerifyEmail(res, body);
      if (action === 'resend-confirmation') return handleResendConfirmation(req, res, body);
      if (action === 'support-scenarios-list') return handleListSupportScenarios(req, res);
      if (action === 'support-scenarios-save') return handleSaveSupportScenario(req, res, body);
      if (action === 'support-scenarios-delete') return handleDeleteSupportScenario(req, res, body);
      if (action === 'chat-sessions-list') return handleListChatSessions(req, res);
      if (action === 'chat-sessions-save') return handleSaveChatSession(req, res, body);
      if (action === 'chat-sessions-delete') return handleDeleteChatSession(req, res, body);
    }

    if (req.method === 'PATCH') {
      if (action === 'profile') return handleUpdateProfile(req, res, body);
      if (action === 'update-user') return handleUpdateUser(req, res, body);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Auth API error', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Auth API failed' });
  }
}
