import { v4 as uuidv4 } from 'uuid';
import { getPendingReferralCode, clearPendingReferralCode } from '@/components/ReferralProgram';

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
}

export interface User {
  id: string;
  email: string;
  name?: string;
  subscription: 'free' | 'basic' | 'essential' | 'plus' | 'done-for-you';
  chatCount: number;
  chatCountResetDate: string;
  profile?: UserProfile;
  emailVerified: boolean;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'document';
  sizeLabel?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  suggestedActions?: { label: string; href: string }[];
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export const SUBSCRIPTION_LIMITS = {
  free: { maxChats: 3, aiResponses: true, price: 0, name: 'Free' },
  basic: { maxChats: 20, aiResponses: true, price: 20, name: 'Basic' },
  essential: { maxChats: Infinity, aiResponses: true, price: 49, name: 'Essential' },
  plus: { maxChats: Infinity, aiResponses: true, price: 99, name: 'Plus' },
  'done-for-you': { maxChats: Infinity, aiResponses: true, price: 299, name: 'Done-For-You' },
};

const LEGACY_USERS_KEY = 'divorceos_users';
const SESSIONS_KEY = 'divorceos_chat_sessions';
const CURRENT_USER_KEY = 'divorceos_current_user';

interface AuthResponse {
  user?: User | null;
  sessions?: ChatSession[];
  session?: ChatSession;
  error?: string;
  success?: boolean;
}

class AuthService {
  constructor() {
    this.migrateLegacyStorage();
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;

    try {
      const storage = window.sessionStorage;
      const probeKey = '__divorceos_auth_probe__';
      storage.setItem(probeKey, '1');
      storage.removeItem(probeKey);
      return storage;
    } catch {
      try {
        return window.localStorage;
      } catch {
        return null;
      }
    }
  }

  private readStorage(key: string): string | null {
    return this.getStorage()?.getItem(key) ?? null;
  }

  private writeStorage(key: string, value: string) {
    this.getStorage()?.setItem(key, value);
  }

  private removeStorage(key: string) {
    this.getStorage()?.removeItem(key);
  }

  private migrateLegacyStorage() {
    if (typeof window === 'undefined') return;

    try {
      const storage = this.getStorage();
      const legacyCurrentUser = window.localStorage.getItem(CURRENT_USER_KEY);
      const legacyChatSessions = window.localStorage.getItem(SESSIONS_KEY);

      if (storage && storage !== window.localStorage) {
        if (legacyCurrentUser && !storage.getItem(CURRENT_USER_KEY)) {
          storage.setItem(CURRENT_USER_KEY, legacyCurrentUser);
        }

        if (legacyChatSessions && !storage.getItem(SESSIONS_KEY)) {
          storage.setItem(SESSIONS_KEY, legacyChatSessions);
        }

        window.localStorage.removeItem(CURRENT_USER_KEY);
        window.localStorage.removeItem(SESSIONS_KEY);
      }

      window.localStorage.removeItem(LEGACY_USERS_KEY);
    } catch (error) {
      console.error('Failed to migrate legacy auth storage.', error);
      try {
        window.localStorage.removeItem(LEGACY_USERS_KEY);
      } catch {
        // Ignore cleanup failures.
      }
    }
  }

  private sanitizeUser(user: unknown): User | null {
    if (!user || typeof user !== 'object') return null;

    const candidate = user as Partial<User>;

    return {
      id: String(candidate.id || ''),
      email: String(candidate.email || ''),
      name: typeof candidate.name === 'string' ? candidate.name : undefined,
      subscription: candidate.subscription || 'free',
      chatCount: typeof candidate.chatCount === 'number' ? candidate.chatCount : 0,
      chatCountResetDate: typeof candidate.chatCountResetDate === 'string' ? candidate.chatCountResetDate : new Date().toISOString(),
      profile: typeof candidate.profile === 'object' && candidate.profile ? candidate.profile : undefined,
      emailVerified: Boolean(candidate.emailVerified),
    };
  }

  private async request<T = AuthResponse>(method: 'GET' | 'POST' | 'PATCH', body?: Record<string, unknown>): Promise<T> {
    const response = await fetch('/api/auth', {
      method,
      headers: method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body || {}),
      credentials: 'same-origin',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Authentication request failed');
    }

    return payload as T;
  }

  private setCurrentUser(user: User | null) {
    if (!user) {
      this.removeStorage(CURRENT_USER_KEY);
      return;
    }
    this.writeStorage(CURRENT_USER_KEY, JSON.stringify(user));
  }

  private sanitizeChatSession(session: unknown): ChatSession | null {
    if (!session || typeof session !== 'object') return null;
    const candidate = session as Partial<ChatSession>;
    if (typeof candidate.id !== 'string' || typeof candidate.userId !== 'string') return null;
    if (!Array.isArray(candidate.messages)) return null;

    return {
      id: candidate.id,
      userId: candidate.userId,
      title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title : 'New Chat',
      messages: candidate.messages.filter(Boolean) as ChatMessage[],
      createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
      updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
    };
  }

  private readLocalChatSessions(): ChatSession[] {
    const data = this.readStorage(SESSIONS_KEY);
    if (!data) return [];

    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed)
        ? parsed
            .map((session) => this.sanitizeChatSession(session))
            .filter((session): session is ChatSession => Boolean(session))
        : [];
    } catch (error) {
      console.error('Failed to parse stored chat sessions, clearing corrupt data.', error);
      this.removeStorage(SESSIONS_KEY);
      return [];
    }
  }

  private writeLocalChatSessions(sessions: ChatSession[]) {
    this.writeStorage(SESSIONS_KEY, JSON.stringify(sessions));
  }

  async getChatSessions(userId: string): Promise<ChatSession[]> {
    const currentUser = this.getCurrentUser();

    if (currentUser?.id === userId) {
      try {
        const payload = await this.request<AuthResponse>('POST', { action: 'chat-sessions-list' });
        const sessions = Array.isArray(payload.sessions)
          ? payload.sessions
              .map((session) => this.sanitizeChatSession(session))
              .filter((session): session is ChatSession => Boolean(session))
          : [];

        this.writeLocalChatSessions(sessions);
        return sessions;
      } catch (error) {
        console.error('Failed to load server chat sessions, falling back to local cache.', error);
      }
    }

    return this.readLocalChatSessions()
      .filter((session) => session.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async saveChatSession(session: ChatSession): Promise<ChatSession> {
    const localSessions = this.readLocalChatSessions();
    const existingIndex = localSessions.findIndex((entry) => entry.id === session.id);
    if (existingIndex >= 0) {
      localSessions[existingIndex] = session;
    } else {
      localSessions.push(session);
    }
    this.writeLocalChatSessions(localSessions);

    const currentUser = this.getCurrentUser();
    if (currentUser?.id !== session.userId) {
      return session;
    }

    try {
      const payload = await this.request<AuthResponse>('POST', {
        action: 'chat-sessions-save',
        sessionId: session.id,
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });

      const savedSession = this.sanitizeChatSession(payload.session);
      if (savedSession) {
        const refreshed = this.readLocalChatSessions().filter((entry) => entry.id !== savedSession.id);
        refreshed.push(savedSession);
        this.writeLocalChatSessions(refreshed);
        return savedSession;
      }
    } catch (error) {
      console.error('Failed to save chat session to server, keeping local cache.', error);
    }

    return session;
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    const filtered = this.readLocalChatSessions().filter((session) => session.id !== sessionId);
    this.writeLocalChatSessions(filtered);

    try {
      await this.request<AuthResponse>('POST', { action: 'chat-sessions-delete', sessionId });
    } catch (error) {
      console.error('Failed to delete chat session on server.', error);
    }
  }

  async register(email: string, password: string, name?: string, referralCode?: string): Promise<User> {
    const payload = await this.request<AuthResponse>('POST', {
      action: 'register',
      email,
      password,
      name,
      referralCode,
    });

    const user = this.sanitizeUser(payload.user);
    if (!user) {
      throw new Error('Registration failed');
    }

    this.setCurrentUser(user);

    const pendingReferralCode = referralCode || getPendingReferralCode();
    if (pendingReferralCode) {
      clearPendingReferralCode();
    }

    return user;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const payload = await this.request<AuthResponse>('POST', {
      action: 'verify-email',
      token,
    });

    const updatedUser = this.sanitizeUser(payload.user);
    const currentUser = this.getCurrentUser();
    if (updatedUser && currentUser?.id === updatedUser.id) {
      this.setCurrentUser(updatedUser);
    }

    return Boolean(updatedUser);
  }

  async resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request<AuthResponse>('POST', {
        action: 'resend-confirmation',
        email,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send confirmation email' };
    }
  }

  async login(email: string, password: string): Promise<User> {
    const payload = await this.request<AuthResponse>('POST', {
      action: 'login',
      email,
      password,
    });

    const user = this.sanitizeUser(payload.user);
    if (!user) {
      throw new Error('Login failed');
    }

    this.setCurrentUser(user);
    return user;
  }

  logout(): void {
    this.setCurrentUser(null);
    void this.request<AuthResponse>('POST', { action: 'logout' }).catch((error) => {
      console.error('Logout request failed.', error);
    });
  }

  getCurrentUser(): User | null {
    const data = this.readStorage(CURRENT_USER_KEY);
    if (!data) return null;

    try {
      return this.sanitizeUser(JSON.parse(data));
    } catch (error) {
      console.error('Failed to parse current user, clearing corrupt data.', error);
      this.removeStorage(CURRENT_USER_KEY);
      return null;
    }
  }

  async refreshCurrentUser(): Promise<User | null> {
    try {
      const payload = await this.request<AuthResponse>('GET');
      const user = this.sanitizeUser(payload.user);
      this.setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Failed to refresh current user.', error);
      this.setCurrentUser(null);
      return null;
    }
  }

  async updateUser(user: User): Promise<void> {
    const payload = await this.request<AuthResponse>('PATCH', {
      action: 'update-user',
      name: user.name,
      subscription: user.subscription,
      chatCount: user.chatCount,
      chatCountResetDate: user.chatCountResetDate,
      emailVerified: user.emailVerified,
    });

    const nextUser = this.sanitizeUser(payload.user) || user;
    this.setCurrentUser(nextUser);
  }

  canUserChat(user: User): { allowed: boolean; reason?: string } {
    if (this.isAdminEmail(user.email)) {
      return { allowed: true };
    }

    const limits = SUBSCRIPTION_LIMITS[user.subscription];

    if (!limits.aiResponses) {
      return {
        allowed: false,
        reason: 'AI responses are not included in the Free plan. Please upgrade to Basic ($10/month) for 24/7 AI support.'
      };
    }

    if (user.chatCount >= limits.maxChats) {
      return {
        allowed: false,
        reason: `You've reached your daily limit of ${limits.maxChats} chats. Upgrade for unlimited access.`
      };
    }

    return { allowed: true };
  }

  async updateProfile(userId: string, profile: UserProfile): Promise<void> {
    const payload = await this.request<AuthResponse>('PATCH', {
      action: 'profile',
      userId,
      profile,
    });

    const updatedUser = this.sanitizeUser(payload.user);
    if (updatedUser) {
      this.setCurrentUser(updatedUser);
    }
  }

  private isAdminEmail(email: string): boolean {
    const adminEmails = ['rmalaspina19@icloud.com'];
    return adminEmails.includes(email.toLowerCase());
  }

  isConciergeStaff(user: Pick<User, 'email'> | null | undefined): boolean {
    if (!user) {
      return false;
    }
    return this.isAdminEmail(user.email);
  }
}

export const authService = new AuthService();
export { uuidv4 };
