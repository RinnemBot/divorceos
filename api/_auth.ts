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
  favoriteCountyIds?: string[];
  avatarUrl?: string;
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

interface SiteUserMemoryRow {
  user_id: string;
  summary: string | null;
  facts: UserProfile | null;
  memory_items: string[] | null;
  created_at: string;
  updated_at: string;
}

interface SiteCaseReminderRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_at: string;
  forms: string[] | null;
  action_tab: string | null;
  email_enabled: boolean | null;
  last_emailed_at: string | null;
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

export interface DurableUserMemory {
  userId: string;
  summary: string;
  facts: Partial<UserProfile>;
  memoryItems: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseReminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueAt: string;
  forms: string[];
  actionTab?: string;
  emailEnabled: boolean;
  lastEmailedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DueReminderDelivery {
  userId: string;
  userEmail: string;
  userName?: string;
  reminder: CaseReminder;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USERS_TABLE = 'site_users';
const SESSIONS_TABLE = 'site_sessions';
const CHAT_SESSIONS_TABLE = 'site_chat_sessions';
export const FORM_DRAFTS_TABLE = 'site_form_drafts';
const USER_MEMORY_TABLE = 'site_user_memory';
const CASE_REMINDERS_TABLE = 'site_case_reminders';
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

function isMissingTableError(message: string | undefined, tableName: string) {
  return typeof message === 'string' && message.toLowerCase().includes(`relation \"${tableName}\" does not exist`);
}

function sanitizeStoredMessages(input: unknown): StoredChatSession['messages'] {
  if (!Array.isArray(input)) return [];

  return input
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const source = entry as Record<string, unknown>;
      const role: 'user' | 'assistant' | null = source.role === 'assistant'
        ? 'assistant'
        : source.role === 'user'
          ? 'user'
          : null;
      const content = typeof source.content === 'string' ? source.content : '';
      const id = typeof source.id === 'string' ? source.id : randomBytes(8).toString('hex');
      const timestamp = typeof source.timestamp === 'string' ? source.timestamp : new Date().toISOString();

      if (!role || !content.trim()) {
        return null;
      }

      const attachments = Array.isArray(source.attachments)
        ? source.attachments
            .map((attachment): StoredChatSession['messages'][number]['attachments'][number] | null => {
              if (!attachment || typeof attachment !== 'object') return null;
              const file = attachment as Record<string, unknown>;
              const type: 'image' | 'document' | null = file.type === 'image'
                ? 'image'
                : file.type === 'document'
                  ? 'document'
                  : null;
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

      const normalizedMessage: StoredChatSession['messages'][number] = {
        id,
        role,
        content: content.slice(0, 4000),
        timestamp,
        attachments: attachments?.length ? attachments : undefined,
        suggestedActions: suggestedActions?.length ? suggestedActions : undefined,
      };

      return normalizedMessage;
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

function sanitizeMemoryItems(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim());
}

function sanitizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim());
}

function toDurableUserMemory(row: SiteUserMemoryRow): DurableUserMemory {
  return {
    userId: row.user_id,
    summary: typeof row.summary === 'string' ? row.summary : '',
    facts: sanitizeProfile(row.facts) || {},
    memoryItems: sanitizeMemoryItems(row.memory_items),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCaseReminder(row: SiteCaseReminderRow): CaseReminder {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    dueAt: row.due_at,
    forms: sanitizeStringArray(row.forms),
    actionTab: row.action_tab || undefined,
    emailEnabled: Boolean(row.email_enabled),
    lastEmailedAt: row.last_emailed_at || undefined,
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
  if (Array.isArray(source.favoriteCountyIds)) {
    next.favoriteCountyIds = source.favoriteCountyIds.filter((value): value is string => typeof value === 'string');
  }
  if (typeof source.avatarUrl === 'string' && (source.avatarUrl.startsWith('/') || source.avatarUrl.startsWith('data:image/'))) {
    next.avatarUrl = source.avatarUrl.slice(0, 750_000);
  }

  return Object.keys(next).length ? next : undefined;
}

function normalizeMemoryText(content: string) {
  return content.replace(/\[attachments\][\s\S]*$/i, '').replace(/\s+/g, ' ').trim();
}

function remember(items: string[], item: string | null | undefined) {
  const next = item?.trim();
  if (!next) return;
  if (items.some((entry) => entry.toLowerCase() === next.toLowerCase())) return;
  items.push(next);
}

function capturePhrase(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/[.,;:!?]+$/, '');
    }
  }
  return undefined;
}

function detectPrimaryGoals(text: string) {
  const goals = new Set<string>();
  const lower = text.toLowerCase();
  if (/(custody|visitation|parenting time)/.test(lower)) goals.add('custody');
  if (/child support/.test(lower)) goals.add('child support');
  if (/(spousal support|alimony)/.test(lower)) goals.add('spousal support');
  if (/(property|asset|house|home|retirement|401k|pension)/.test(lower)) goals.add('property division');
  if (/(file for divorce|start divorce|respond to divorce|petition)/.test(lower)) goals.add('divorce process');
  if (/(domestic violence|restraining order|dvro|protective order)/.test(lower)) goals.add('protection orders');
  if (/(settlement|mediate|mediation|agreement)/.test(lower)) goals.add('settlement');
  return [...goals];
}

function inferCaseStage(text: string) {
  const lower = text.toLowerCase();
  if (/(judgment|finalized|final order|post-judgment)/.test(lower)) return 'post-judgment';
  if (/(hearing|trial|court date|appearance|mediation next week)/.test(lower)) return 'hearing pending';
  if (/(served me|was served|service completed|served on)/.test(lower)) return 'served';
  if (/(i filed|filed on|petition filed|already filed)/.test(lower)) return 'filed';
  if (/(starting divorce|about to file|preparing to file|want to file)/.test(lower)) return 'pre-filing';
  return undefined;
}

function extractDurableFactsFromMessages(messages: StoredChatSession['messages']) {
  const facts: Partial<UserProfile> = {};
  const memoryItems: string[] = [];

  for (const message of messages) {
    if (message.role !== 'user') continue;

    const text = normalizeMemoryText(message.content);
    if (!text) continue;
    const lower = text.toLowerCase();

    const countyMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+County\b/);
    if (countyMatch) {
      facts.county = `${countyMatch[1]} County`;
      remember(memoryItems, `User's case is in ${facts.county}.`);
    }

    const caseNumberMatch = text.match(/(?:case number|case no\.?|case #)\s*[:#-]?\s*([A-Z0-9-]+)/i);
    if (caseNumberMatch) {
      facts.caseNumber = caseNumberMatch[1];
      remember(memoryItems, `Case number mentioned: ${facts.caseNumber}.`);
    }

    const marriageDate = capturePhrase(text, [/(?:married on|marriage date is|we got married on)\s+([^.,;\n]+)/i]);
    if (marriageDate) {
      facts.marriageDate = marriageDate;
      remember(memoryItems, `Marriage date mentioned: ${marriageDate}.`);
    }

    const separationDate = capturePhrase(text, [/(?:separated on|separation date is|we separated on)\s+([^.,;\n]+)/i]);
    if (separationDate) {
      facts.separationDate = separationDate;
      remember(memoryItems, `Separation date mentioned: ${separationDate}.`);
    }

    const filingDate = capturePhrase(text, [/(?:filed on|filing date is|i filed on)\s+([^.,;\n]+)/i]);
    if (filingDate) {
      facts.filingDate = filingDate;
      remember(memoryItems, `Filing date mentioned: ${filingDate}.`);
    }

    const serviceDate = capturePhrase(text, [/(?:served on|service date is|i was served on|they served me on)\s+([^.,;\n]+)/i]);
    if (serviceDate) {
      facts.serviceDate = serviceDate;
      remember(memoryItems, `Service date mentioned: ${serviceDate}.`);
    }

    const hearingDate = capturePhrase(text, [/(?:hearing on|hearing date is|next hearing is|court date is)\s+([^.,;\n]+)/i]);
    if (hearingDate) {
      facts.nextHearingDate = hearingDate;
      remember(memoryItems, `Next hearing mentioned: ${hearingDate}.`);
    }

    const childrenCountMatch = text.match(/(?:have|with)\s+(\d+)\s+(?:kids|children|child)\b/i) || text.match(/(\d+)\s+(?:kids|children|child)\b/i);
    if (childrenCountMatch) {
      const count = Number(childrenCountMatch[1]);
      if (Number.isFinite(count)) {
        facts.hasChildren = count > 0;
        facts.childrenCount = count;
        remember(memoryItems, `User mentioned ${count} child${count === 1 ? '' : 'ren'}.`);
      }
    } else if (/(my kids|my children|our kids|our children)/i.test(text)) {
      facts.hasChildren = true;
    }

    const childAgesMatch = text.match(/(?:ages?|aged)\s+((?:\d{1,2}\s*(?:,|and)?\s*){1,6})/i);
    if (childAgesMatch) {
      const ages = childAgesMatch[1].match(/\d{1,2}/g)?.map(Number).filter((age) => Number.isFinite(age));
      if (ages?.length) {
        facts.childrenAges = ages;
        facts.hasChildren = true;
        if (!facts.childrenCount) facts.childrenCount = ages.length;
        remember(memoryItems, `Children ages mentioned: ${ages.join(', ')}.`);
      }
    }

    if (/(self-represented|pro se|without a lawyer|don't have a lawyer|do not have a lawyer)/i.test(lower)) {
      facts.representationStatus = 'self-represented';
      remember(memoryItems, 'User said they are self-represented.');
    } else if (/(my lawyer|my attorney|i have a lawyer|i have an attorney|represented by counsel)/i.test(lower)) {
      facts.representationStatus = 'represented';
      remember(memoryItems, 'User said they have a lawyer.');
    }

    const caseStage = inferCaseStage(text);
    if (caseStage) {
      facts.caseStage = caseStage;
      remember(memoryItems, `Case stage suggests: ${caseStage}.`);
    }

    const primaryGoals = detectPrimaryGoals(text);
    if (primaryGoals.length) {
      facts.primaryGoals = [...new Set([...(facts.primaryGoals || []), ...primaryGoals])];
      remember(memoryItems, `Primary goals mentioned: ${primaryGoals.join(', ')}.`);
    }
  }

  return {
    facts,
    memoryItems: memoryItems.slice(-12),
  };
}

function mergeDurableFacts(previous: Partial<UserProfile>, next: Partial<UserProfile>): Partial<UserProfile> {
  const merged: Partial<UserProfile> = { ...previous, ...next };

  const previousGoals = previous.primaryGoals || [];
  const nextGoals = next.primaryGoals || [];
  const combinedGoals = [...new Set([...previousGoals, ...nextGoals])];
  if (combinedGoals.length) merged.primaryGoals = combinedGoals;

  const previousAges = previous.childrenAges || [];
  const nextAges = next.childrenAges || [];
  const combinedAges = [...new Set([...previousAges, ...nextAges])].sort((a, b) => a - b);
  if (combinedAges.length) merged.childrenAges = combinedAges;

  if (typeof merged.childrenCount !== 'number' && combinedAges.length) {
    merged.childrenCount = combinedAges.length;
  }

  if (typeof merged.hasChildren !== 'boolean' && (typeof merged.childrenCount === 'number' || combinedAges.length)) {
    merged.hasChildren = true;
  }

  return merged;
}

function buildDurableMemorySummary(facts: Partial<UserProfile>, memoryItems: string[]) {
  const lines: string[] = [];
  if (facts.county) lines.push(`County: ${facts.county}`);
  if (facts.caseStage) lines.push(`Case stage: ${facts.caseStage}`);
  if (facts.representationStatus) lines.push(`Representation: ${facts.representationStatus}`);
  if (typeof facts.childrenCount === 'number') lines.push(`Children count: ${facts.childrenCount}`);
  if (facts.nextHearingDate) lines.push(`Next hearing: ${facts.nextHearingDate}`);
  if (facts.primaryGoals?.length) lines.push(`Goals: ${facts.primaryGoals.join(', ')}`);

  const notes = memoryItems.slice(-4).map((item) => `- ${item}`);
  return [...lines, ...notes].join('\n').trim();
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
    if (isMissingTableError(error.message, CHAT_SESSIONS_TABLE)) {
      return [];
    }
    throw new Error(`Unable to list chat sessions: ${error.message}`);
  }

  return (data || []).map(toStoredChatSession);
}

export async function getDurableUserMemory(userId: string): Promise<DurableUserMemory | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(USER_MEMORY_TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<SiteUserMemoryRow>();

  if (error) {
    if (isMissingTableError(error.message, USER_MEMORY_TABLE)) {
      return null;
    }
    throw new Error(`Unable to load user memory: ${error.message}`);
  }

  return data ? toDurableUserMemory(data) : null;
}

export async function listCaseReminders(userId: string): Promise<CaseReminder[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(CASE_REMINDERS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('due_at', { ascending: true })
    .returns<SiteCaseReminderRow[]>();

  if (error) {
    if (isMissingTableError(error.message, CASE_REMINDERS_TABLE)) {
      return [];
    }
    throw new Error(`Unable to list reminders: ${error.message}`);
  }

  return (data || []).map(toCaseReminder);
}

export async function getCaseReminder(userId: string, reminderId: string): Promise<CaseReminder | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(CASE_REMINDERS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', reminderId)
    .maybeSingle<SiteCaseReminderRow>();

  if (error) {
    if (isMissingTableError(error.message, CASE_REMINDERS_TABLE)) {
      return null;
    }
    throw new Error(`Unable to load reminder: ${error.message}`);
  }

  return data ? toCaseReminder(data) : null;
}

export async function upsertChatSession(
  userId: string,
  session: Pick<StoredChatSession, 'id' | 'title'> & { messages: unknown } & Partial<Pick<StoredChatSession, 'createdAt' | 'updatedAt'>>
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

export async function updateUserDurableMemoryFromChatSession(userId: string, session: Pick<StoredChatSession, 'messages'>) {
  const supabase = requireSupabase();
  const existingMemory = await getDurableUserMemory(userId);
  const extracted = extractDurableFactsFromMessages(session.messages);

  if (!Object.keys(extracted.facts).length && extracted.memoryItems.length === 0) {
    return existingMemory;
  }

  const mergedFacts = mergeDurableFacts(existingMemory?.facts || {}, extracted.facts);
  const mergedItems = [...new Set([...(existingMemory?.memoryItems || []), ...extracted.memoryItems])].slice(-12);
  const summary = buildDurableMemorySummary(mergedFacts, mergedItems);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(USER_MEMORY_TABLE)
    .upsert(
      {
        user_id: userId,
        summary,
        facts: mergedFacts,
        memory_items: mergedItems,
        created_at: existingMemory?.createdAt || now,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single<SiteUserMemoryRow>();

  if (error) {
    if (isMissingTableError(error.message, USER_MEMORY_TABLE)) {
      return existingMemory;
    }
    throw new Error(`Unable to update user memory: ${error.message}`);
  }

  return toDurableUserMemory(data);
}

export async function upsertCaseReminder(
  userId: string,
  reminder: Pick<CaseReminder, 'id' | 'title' | 'dueAt'> & Partial<Pick<CaseReminder, 'description' | 'forms' | 'actionTab' | 'emailEnabled' | 'createdAt'>>
): Promise<CaseReminder> {
  const supabase = requireSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(CASE_REMINDERS_TABLE)
    .upsert(
      {
        id: reminder.id,
        user_id: userId,
        title: reminder.title.trim().slice(0, 120),
        description: reminder.description?.trim() || null,
        due_at: reminder.dueAt,
        forms: sanitizeStringArray(reminder.forms || []),
        action_tab: reminder.actionTab || null,
        email_enabled: Boolean(reminder.emailEnabled),
        updated_at: now,
        created_at: reminder.createdAt || now,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single<SiteCaseReminderRow>();

  if (error) {
    throw new Error(`Unable to save reminder: ${error.message}`);
  }

  return toCaseReminder(data);
}

export async function deleteCaseReminder(userId: string, reminderId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from(CASE_REMINDERS_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', reminderId);

  if (error) {
    throw new Error(`Unable to delete reminder: ${error.message}`);
  }
}

export async function markCaseReminderEmailed(userId: string, reminderId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from(CASE_REMINDERS_TABLE)
    .update({ last_emailed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', reminderId);

  if (error) {
    throw new Error(`Unable to update reminder email timestamp: ${error.message}`);
  }
}

export async function listDueReminderDeliveries(windowHours = 24): Promise<DueReminderDelivery[]> {
  const supabase = requireSupabase();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000).toISOString();
  const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const resendCutoff = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from(CASE_REMINDERS_TABLE)
    .select('*')
    .eq('email_enabled', true)
    .gte('due_at', windowStart)
    .lte('due_at', windowEnd)
    .order('due_at', { ascending: true })
    .returns<SiteCaseReminderRow[]>();

  if (error) {
    if (isMissingTableError(error.message, CASE_REMINDERS_TABLE)) {
      return [];
    }
    throw new Error(`Unable to load due reminder deliveries: ${error.message}`);
  }

  const dueRows = (data || []).filter((row) => !row.last_emailed_at || row.last_emailed_at < resendCutoff);
  const deliveries: DueReminderDelivery[] = [];

  for (const row of dueRows) {
    const user = await loadUserById(row.user_id);
    if (!user?.email) continue;

    deliveries.push({
      userId: row.user_id,
      userEmail: user.email,
      userName: user.name || undefined,
      reminder: toCaseReminder(row),
    });
  }

  return deliveries;
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
    if (isMissingTableError(error.message, CHAT_SESSIONS_TABLE)) {
      return [];
    }
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
