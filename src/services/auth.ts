import { v4 as uuidv4 } from 'uuid';
import { sendConfirmationEmail, sendAdminSignupNotification, isTokenValid, getConfirmationByToken, removeConfirmation } from './email';
import { trackReferralSignup, getPendingReferralCode, clearPendingReferralCode } from '@/components/ReferralProgram';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  county?: string;
  marriageDate?: string;
  separationDate?: string;
  hasChildren?: boolean;
  childrenCount?: number;
  childrenAges?: number[];
}

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  subscription: 'free' | 'basic' | 'essential' | 'plus' | 'done-for-you';
  chatCount: number;
  chatCountResetDate: string;
  profile?: UserProfile;
  emailVerified: boolean;
  emailVerificationToken?: string;
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

const STORAGE_KEY = 'divorceos_users';
const SESSIONS_KEY = 'divorceos_chat_sessions';
const CURRENT_USER_KEY = 'divorceos_current_user';

class AuthService {
  private getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse stored users, clearing corrupt data.', error);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  getChatSessions(userId: string): ChatSession[] {
    const data = localStorage.getItem(SESSIONS_KEY);
    let allSessions: ChatSession[] = [];

    if (data) {
      try {
        allSessions = JSON.parse(data);
      } catch (error) {
        console.error('Failed to parse stored chat sessions, clearing corrupt data.', error);
        localStorage.removeItem(SESSIONS_KEY);
      }
    }

    return allSessions.filter(s => s.userId === userId).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  saveChatSession(session: ChatSession): void {
    const data = localStorage.getItem(SESSIONS_KEY);
    let allSessions: ChatSession[] = [];

    if (data) {
      try {
        allSessions = JSON.parse(data);
      } catch (error) {
        console.error('Failed to parse stored chat sessions, resetting list.', error);
        localStorage.removeItem(SESSIONS_KEY);
      }
    }

    const existingIndex = allSessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      allSessions[existingIndex] = session;
    } else {
      allSessions.push(session);
    }
    
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions));
  }

  deleteChatSession(sessionId: string): void {
    const data = localStorage.getItem(SESSIONS_KEY);
    let allSessions: ChatSession[] = [];

    if (data) {
      try {
        allSessions = JSON.parse(data);
      } catch (error) {
        console.error('Failed to parse stored chat sessions during delete, resetting list.', error);
        localStorage.removeItem(SESSIONS_KEY);
      }
    }

    const filtered = allSessions.filter(s => s.id !== sessionId);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
  }

  async register(email: string, password: string, name?: string, referralCode?: string): Promise<User> {
    const users = this.getUsers();
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists');
    }

    // Send confirmation email first
    const confirmationResult = await sendConfirmationEmail(email, uuidv4(), name);
    
    // Admin users get premium subscription
    const isAdmin = this.isAdminEmail(email);
    const isPremium = this.isPremiumEmail(email);
    
    const newUser: User = {
      id: uuidv4(),
      email: email.toLowerCase(),
      password,
      name,
      subscription: isAdmin || isPremium ? 'done-for-you' : 'free',
      chatCount: 0,
      chatCountResetDate: new Date().toISOString(),
      emailVerified: isAdmin, // Auto-verify admin emails
      emailVerificationToken: isAdmin ? undefined : confirmationResult.token,
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);
    
    // Check for pending referral code from session storage
    const pendingReferralCode = referralCode || getPendingReferralCode();
    if (pendingReferralCode) {
      trackReferralSignup(pendingReferralCode, newUser);
      clearPendingReferralCode();
    }
    
    // Send admin notification
    await sendAdminSignupNotification(email, name, false);
    
    return newUser;
  }

  verifyEmail(token: string): boolean {
    if (!isTokenValid(token)) {
      return false;
    }
    
    const confirmation = getConfirmationByToken(token);
    if (!confirmation) return false;
    
    const users = this.getUsers();
    const user = users.find(u => u.id === confirmation.userId);
    
    if (user) {
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      this.saveUsers(users);
      
      const current = this.getCurrentUser();
      if (current?.id === user.id) {
        this.setCurrentUser(user);
      }
      
      removeConfirmation(token);
      return true;
    }
    
    return false;
  }

  resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return Promise.resolve({ success: false, error: 'User not found' });
    }
    
    if (user.emailVerified) {
      return Promise.resolve({ success: false, error: 'Email already verified' });
    }
    
    return sendConfirmationEmail(user.email, user.id, user.name);
  }

  login(email: string, password: string): User {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }

    // Auto-upgrade admin users to premium tier
    const isAdmin = this.isAdminEmail(user.email);
    const isPremium = this.isPremiumEmail(user.email);
    if ((isAdmin || isPremium) && user.subscription !== 'done-for-you') {
      user.subscription = 'done-for-you';
      this.updateUser(user);
    }

    this.resetChatCountIfNeeded(user);
    this.setCurrentUser(user);
    
    return user;
  }

  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  getCurrentUser(): User | null {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (!data) return null;
    
    try {
      const user: User = JSON.parse(data);
      return this.resetChatCountIfNeeded(user);
    } catch (error) {
      console.error('Failed to parse current user, clearing corrupt data.', error);
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
  }

  private resetChatCountIfNeeded(user: User): User {
    const resetDate = new Date(user.chatCountResetDate);
    const now = new Date();
    
    if (resetDate.getDate() !== now.getDate() || 
        resetDate.getMonth() !== now.getMonth() || 
        resetDate.getFullYear() !== now.getFullYear()) {
      user.chatCount = 0;
      user.chatCountResetDate = now.toISOString();
      this.updateUser(user);
    }
    
    return user;
  }

  updateUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    
    if (index >= 0) {
      users[index] = user;
      this.saveUsers(users);

      const currentData = localStorage.getItem(CURRENT_USER_KEY);
      if (currentData) {
        try {
          const currentUser: User = JSON.parse(currentData);
          if (currentUser.id === user.id) {
            this.setCurrentUser(user);
          }
        } catch (error) {
          console.error('Failed to parse current user while updating, clearing corrupt data.', error);
          localStorage.removeItem(CURRENT_USER_KEY);
        }
      }
    }
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  // Admin emails with unlimited access
  private isAdminEmail(email: string): boolean {
    const adminEmails = ['rmalaspina19@icloud.com'];
    return adminEmails.includes(email.toLowerCase());
  }

  private isPremiumEmail(email: string): boolean {
    const premiumEmails = ['huezostan@gmail.com', 'marialeon1@aol.com'];
    return premiumEmails.includes(email.toLowerCase());
  }

  canUserChat(user: User): { allowed: boolean; reason?: string } {
    // Admin users get unlimited chats
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

  incrementChatCount(user: User): void {
    user.chatCount++;
    this.updateUser(user);
  }

  updateProfile(userId: string, profile: UserProfile): void {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
      user.profile = { ...user.profile, ...profile };
      this.saveUsers(users);
      
      const current = this.getCurrentUser();
      if (current?.id === userId) {
        this.setCurrentUser(user);
      }
    }
  }
}

export const authService = new AuthService();
