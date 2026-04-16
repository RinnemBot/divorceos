import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  county?: string;
  marriageDate?: string;
  separationDate?: string;
  hasChildren?: boolean;
  childrenCount?: number;
  childrenAges?: number[];
  caseStage?: string;
  caseNumber?: string;
  filingDate?: string;
  serviceDate?: string;
  nextHearingDate?: string;
  representationStatus?: string;
  primaryGoals?: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  subscription: 'free' | 'basic' | 'essential' | 'plus' | 'done-for-you';
  chatCount: number;
  chatCountResetDate: string;
  profile?: UserProfile;
  emailVerified: boolean;
}

interface SiteUserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  subscription: AuthUser['subscription'];
  chat_count: number;
  chat_count_reset_date: string;
  profile: UserProfile | null;
  email_verified: boolean;
  email_verification_token_hash: string | null;
  email_verification_expires_at: string | null;
}

interface SiteChatSessionRow {
  id: string;
  user_id: string;
  title: string;
  messages: unknown;
  created_at: string;
  updated_at: string;
}

export interface StoredChatSession {
  id: string;
  userId: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    attachments?: Array<{ id: string; name: string; type: 'image' | 'document'; sizeLabel?: string }>;
    suggestedActions?: Array<{ label: string; href: string }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USERS_TABLE = 'site_users';
const SESSIONS_TABLE = 'site_sessions';
const CHAT_SESSIONS_TABLE = 'site_chat_sessions';
const SESSION_COOKIE = 'divorceos_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const ADMIN_EMAILS = ['rmalaspina19@icloud.com'];
const PREMIUM_EMAILS = ['huezostan@gmail.com', 'marialeon1@aol.com'];

const supabaseServerClient: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

export function requireSupabase(): SupabaseClient {
  if (!supabaseServerClient) {
    throw new Error('Supabase environment variables are not configured');
  }
  return supabaseServerClient;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function todayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shouldResetChatCount(iso: string | null | undefined) {
  if (!iso) return true;
  return todayKey(new Date(iso)) !== todayKey(new Date());
}

export function isAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(normalizeEmail(email));
}

export function isPremiumEmail(email: string) {
  return PREMIUM_EMAILS.includes(normalizeEmail(email));
}

function sanitizeStoredMessages(input: unknown): StoredChatSession['messages'] {
  if (!Array.isArray(input)) return [];

  return input
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const source = entry as Record<string, unknown>;
      const role = source.role === 'assistant' ? 'assistant' : source.role === 'user' ? 'user' : null;
      const content = typeof source.content === 'string' ? source.content : '';
      const id = typeof source.id === 'string' ? source.id : randomBytes(8).toString('hex');
      const timestamp = typeof source.timestamp === 'string' ? source.timestamp : new Date().toISOString();

      if (!role || !content.trim()) {
        return null;
      }

      const attachments = Array.isArray(source.attachments)
        ? source.attachments
            .map((attachment) => {
              if (!attachment || typeof attachment !== 'object') return null;
              const file = attachment as Record<string, unknown>;
              const type = file.type === 'image' ? 'image' : file.type === 'document' ? 'document' : null;
              if (!type || typeof file.id !== 'string' || typeof file.name !== 'string') {
                return null;
              }
              return {
                id: file.id,
                name: file.name,
                type,
                sizeLabel: typeof file.sizeLabel === 'string' ? file.sizeLabel : undefined,
              };
            })
            .filter((attachment): attachment is NonNullable<typeof attachment> => Boolean(attachment))
        : undefined;

      const suggestedActions = Array.isArray(source.suggestedActions)
        ? source.suggestedActions
            .map((action) => {
              if (!action || typeof action !== 'object') return null;
              const item = action as Record<string, unknown>;
              if (typeof item.label !== 'string' || typeof item.href !== 'string') {
                return null;
              }
              return { label: item.label, href: item.href };
            })
            .filter((action): action is NonNullable<typeof action> => Boolean(action))
        : undefined;

      return {
        id,
        role,
        content: content.slice(0, 4000),
        timestamp,
        attachments: attachments?.length ? attachments : undefined,
        suggestedActions: suggestedActions?.length ? suggestedActions : undefined,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function toStoredChatSession(row: SiteChatSessionRow): StoredChatSession {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    messages: sanitizeStoredMessages(row.messages),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeProfile(profile: unknown): UserProfile | undefined {
  if (!profile || typeof profile !== 'object') return undefined;
  const source = profile as Record<string, unknown>;
  const next: UserProfile = {};

  if (typeof source.firstName === 'string') next.firstName = source.firstName;
  if (typeof source.lastName === 'string') next.lastName = source.lastName;
  if (typeof source.county === 'string') next.county = source.county;
  if (typeof source.marriageDate === 'string') next.marriageDate = source.marriageDate;
  if (typeof source.separationDate === 'string') next.separationDate = source.separationDate;
  if (typeof source.hasChildren === 'boolean') next.hasChildren = source.hasChildren;
  if (typeof source.childrenCount === 'number') next.childrenCount = source.childrenCount;
  if (Array.isArray(source.childrenAges)) {
    next.childrenAges = source.childrenAges.filter((value): value is number => typeof value === 'number');
  }
  if (typeof source.caseStage === 'string') next.caseStage = source.caseStage;
  if (typeof source.caseNumber === 'string') next.caseNumber = source.caseNumber;
  if (typeof source.filingDate === 'string') next.filingDate = source.filingDate;
  if (typeof source.serviceDate === 'string') next.serviceDate = source.serviceDate;
  if (typeof source.nextHearingDate === 'string') next.nextHearingDate = source.nextHearingDate;
  if (typeof source.representationStatus === 'string') next.representationStatus = source.representationStatus;
  if (Array.isArray(source.primaryGoals)) {
    next.primaryGoals = source.primaryGoals.filter((value): value is string => typeof value === 'string');
  }

  return Object.keys(next).length ? next : undefined;
}

export function toAuthUser(row: SiteUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? undefined,
    subscription: row.subscription,
    chatCount: row.chat_count ?? 0,
    chatCountResetDate: row.chat_count_reset_date,
    profile: sanitizeProfile(row.profile),
    emailVerified: Boolean(row.email_verified),
  };
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHash] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !expectedHash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');

  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createEmailVerificationToken() {
  const token = randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS).toISOString(),
  };
}

function parseCookies(req: VercelRequest) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {} as Record<string, string>;

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, chunk) => {
    const [rawKey, ...rest] = chunk.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function cookieBaseAttributes(maxAgeSeconds: number) {
  const parts = ['Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSeconds}`];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function setSessionCookie(res: VercelResponse, token: string, expiresAt: string) {
  const maxAgeSeconds = Math.max(1, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieBaseAttributes(maxAgeSeconds)}`);
}

export function clearSessionCookie(res: VercelResponse) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

export async function createSessionForUser(userId: string, res: VercelResponse) {
  const supabase = requireSupabase();
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { error } = await supabase.from(SESSIONS_TABLE).insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    last_seen_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Unable to create session: ${error.message}`);
  }

  setSessionCookie(res, token, expiresAt);
}

export async function destroySession(req: VercelRequest, res: VercelResponse) {
  const supabase = requireSupabase();
  const token = parseCookies(req)[SESSION_COOKIE];
  clearSessionCookie(res);

  if (!token) return;

  const { error } = await supabase.from(SESSIONS_TABLE).delete().eq('token_hash', hashToken(token));
  if (error) {
    console.error('Failed to destroy session', error);
  }
}

async function loadUserById(userId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(USERS_TABLE).select('*').eq('id', userId).maybeSingle<SiteUserRow>();
  if (error) {
    throw new Error(`Unable to load user: ${error.message}`);
  }
  return data;
}

export async function loadUserByEmail(email: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('*')
    .eq('email', normalizeEmail(email))
    .maybeSingle<SiteUserRow>();

  if (error) {
    throw new Error(`Unable to load user: ${error.message}`);
  }

  return data;
}

async function resetDailyChatCountIfNeeded(row: SiteUserRow) {
  if (!shouldResetChatCount(row.chat_count_reset_date)) {
    return row;
  }

  const supabase = requireSupabase();
  const nextResetDate = new Date().toISOString();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .update({ chat_count: 0, chat_count_reset_date: nextResetDate, updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .select('*')
    .single<SiteUserRow>();

  if (error) {
    console.error('Failed to reset chat count', error);
    return { ...row, chat_count: 0, chat_count_reset_date: nextResetDate };
  }

  return data;
}

export async function getAuthenticatedUser(req: VercelRequest): Promise<AuthUser | null> {
  const supabase = requireSupabase();
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const { data: session, error: sessionError } = await supabase
    .from(SESSIONS_TABLE)
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle<{ user_id: string; expires_at: string }>();

  if (sessionError) {
    throw new Error(`Unable to load session: ${sessionError.message}`);
  }

  if (!session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await supabase.from(SESSIONS_TABLE).delete().eq('token_hash', tokenHash);
    return null;
  }

  const user = await loadUserById(session.user_id);
  if (!user) {
    return null;
  }

  const refreshedUser = await resetDailyChatCountIfNeeded(user);
  await supabase.from(SESSIONS_TABLE).update({ last_seen_at: new Date().toISOString() }).eq('token_hash', tokenHash);
  return toAuthUser(refreshedUser);
}

export async function requireAuthenticatedUser(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return null;
    }
    return user;
  } catch (error) {
    console.error('Authentication error', error);
    res.status(500).json({ error: 'Unable to validate session' });
    return null;
  }
}

export async function requireStaffUser(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return null;
  if (!isAdminEmail(user.email)) {
    res.status(403).json({ error: 'Staff access required' });
    return null;
  }
  return user;
}

export async function listChatSessions(userId: string): Promise<StoredChatSession[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(CHAT_SESSIONS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .returns<SiteChatSessionRow[]>();

  if (error) {
    throw new Error(`Unable to list chat sessions: ${error.message}`);
  }

  return (data || []).map(toStoredChatSession);
}

export async function upsertChatSession(
  userId: string,
  session: Pick<StoredChatSession, 'id' | 'title' | 'messages'> & Partial<Pick<StoredChatSession, 'createdAt' | 'updatedAt'>>
): Promise<StoredChatSession> {
  const supabase = requireSupabase();
  const createdAt = session.createdAt || new Date().toISOString();
  const updatedAt = session.updatedAt || new Date().toISOString();
  const title = (session.title || 'New Chat').slice(0, 120);
  const messages = sanitizeStoredMessages(session.messages);

  const { data, error } = await supabase
    .from(CHAT_SESSIONS_TABLE)
    .upsert(
      {
        id: session.id,
        user_id: userId,
        title,
        messages,
        created_at: createdAt,
        updated_at: updatedAt,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single<SiteChatSessionRow>();

  if (error) {
    throw new Error(`Unable to save chat session: ${error.message}`);
  }

  return toStoredChatSession(data);
}

export async function deleteChatSessionRecord(userId: string, sessionId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from(CHAT_SESSIONS_TABLE)
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Unable to delete chat session: ${error.message}`);
  }
}

export async function listRecentChatSessions(userId: string, limit = 3): Promise<StoredChatSession[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(CHAT_SESSIONS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)
    .returns<SiteChatSessionRow[]>();

  if (error) {
    throw new Error(`Unable to load recent chat sessions: ${error.message}`);
  }

  return (data || []).map(toStoredChatSession);
}

export async function incrementChatCount(userId: string) {
  const supabase = requireSupabase();
  const row = await loadUserById(userId);
  if (!row) {
    throw new Error('User not found');
  }

  const safeRow = await resetDailyChatCountIfNeeded(row);
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .update({
      chat_count: (safeRow.chat_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .single<SiteUserRow>();

  if (error) {
    throw new Error(`Unable to update chat count: ${error.message}`);
  }

  return toAuthUser(data);
}

export async function updateUserProfile(userId: string, profile: UserProfile) {
  const supabase = requireSupabase();
  const row = await loadUserById(userId);
  if (!row) {
    throw new Error('User not found');
  }

  const mergedProfile = {
    ...(sanitizeProfile(row.profile) || {}),
    ...(sanitizeProfile(profile) || {}),
  };

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .update({ profile: mergedProfile, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single<SiteUserRow>();

  if (error) {
    throw new Error(`Unable to update profile: ${error.message}`);
  }

  return toAuthUser(data);
}

export async function updateUserRecord(userId: string, updates: Partial<Pick<AuthUser, 'subscription' | 'chatCount' | 'chatCountResetDate' | 'name' | 'emailVerified'>>) {
  const supabase = requireSupabase();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof updates.subscription === 'string') payload.subscription = updates.subscription;
  if (typeof updates.chatCount === 'number') payload.chat_count = updates.chatCount;
  if (typeof updates.chatCountResetDate === 'string') payload.chat_count_reset_date = updates.chatCountResetDate;
  if (typeof updates.name === 'string') payload.name = updates.name;
  if (typeof updates.emailVerified === 'boolean') payload.email_verified = updates.emailVerified;

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single<SiteUserRow>();

  if (error) {
    throw new Error(`Unable to update user: ${error.message}`);
  }

  return toAuthUser(data);
}

export function buildNewUserRecord(email: string, password: string, name?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  const isAdmin = isAdminEmail(normalizedEmail);
  const isPremium = isPremiumEmail(normalizedEmail);

  return {
    email: normalizedEmail,
    password_hash: hashPassword(password),
    name: name?.trim() || null,
    subscription: (isAdmin || isPremium ? 'done-for-you' : 'free') as AuthUser['subscription'],
    chat_count: 0,
    chat_count_reset_date: new Date().toISOString(),
    profile: {},
    email_verified: isAdmin,
  };
}
