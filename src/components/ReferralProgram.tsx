import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Gift, 
  Link2, 
  Copy, 
  CheckCircle2,
  DollarSign,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService, type User } from '@/services/auth';
import { v4 as uuidv4 } from 'uuid';

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserEmail: string;
  referredUserName?: string;
  status: 'pending' | 'completed';
  rewardAmount: number;
  createdAt: string;
  completedAt?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
  availableCredit: number;
}

const REFERRALS_KEY = 'divorceos_referrals';
const REFERRAL_REWARDS_KEY = 'divorceos_referral_rewards';

// Reward configuration
const REFERRAL_REWARD_AMOUNT = 10; // $10 credit per successful referral

export function getReferralCode(userId: string): string {
  return `DIV${userId.substring(0, 6).toUpperCase()}`;
}

export function generateReferralLink(referralCode: string): string {
  // Use current domain or default to divorce-os.vercel.app
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://divorce-os.vercel.app';
  return `${baseUrl}/?ref=${referralCode}`;
}

export function getReferralsByUser(userId: string): Referral[] {
  const data = localStorage.getItem(REFERRALS_KEY);
  if (!data) return [];
  
  try {
    const allReferrals: Referral[] = JSON.parse(data);
    return allReferrals.filter(r => r.referrerId === userId);
  } catch {
    return [];
  }
}

export function getReferralStats(userId: string): ReferralStats {
  const referrals = getReferralsByUser(userId);
  
  const completed = referrals.filter(r => r.status === 'completed');
  const pending = referrals.filter(r => r.status === 'pending');
  
  // Get available credit from storage
  const rewardsData = localStorage.getItem(REFERRAL_REWARDS_KEY);
  let availableCredit = 0;
  
  if (rewardsData) {
    try {
      const rewards = JSON.parse(rewardsData);
      availableCredit = rewards[userId] || 0;
    } catch {
      availableCredit = 0;
    }
  }
  
  return {
    totalReferrals: referrals.length,
    completedReferrals: completed.length,
    pendingReferrals: pending.length,
    totalRewardsEarned: completed.length * REFERRAL_REWARD_AMOUNT,
    availableCredit
  };
}

export function trackReferralSignup(referralCode: string, newUser: User): boolean {
  // Extract userId from referral code (removing 'DIV' prefix)
  const referrerId = referralCode.substring(3).toLowerCase();
  
  // Find referrer
  const users = JSON.parse(localStorage.getItem('divorceos_users') || '[]');
  const referrer = users.find((u: User) => u.id.toLowerCase().startsWith(referrerId));
  
  if (!referrer || referrer.id === newUser.id) {
    return false; // Invalid referral or self-referral
  }
  
  const data = localStorage.getItem(REFERRALS_KEY);
  let allReferrals: Referral[] = [];
  
  if (data) {
    try {
      allReferrals = JSON.parse(data);
    } catch {
      allReferrals = [];
    }
  }
  
  // Check if this user was already referred
  const existingReferral = allReferrals.find(r => r.referredUserId === newUser.id);
  if (existingReferral) {
    return false; // Already referred
  }
  
  const newReferral: Referral = {
    id: uuidv4(),
    referrerId: referrer.id,
    referredUserId: newUser.id,
    referredUserEmail: newUser.email,
    referredUserName: newUser.name,
    status: 'pending',
    rewardAmount: REFERRAL_REWARD_AMOUNT,
    createdAt: new Date().toISOString()
  };
  
  allReferrals.push(newReferral);
  localStorage.setItem(REFERRALS_KEY, JSON.stringify(allReferrals));
  
  return true;
}

export function completeReferralReward(referredUserId: string): void {
  const data = localStorage.getItem(REFERRALS_KEY);
  if (!data) return;
  
  try {
    const allReferrals: Referral[] = JSON.parse(data);
    const referral = allReferrals.find(r => r.referredUserId === referredUserId && r.status === 'pending');
    
    if (!referral) return;
    
    referral.status = 'completed';
    referral.completedAt = new Date().toISOString();
    localStorage.setItem(REFERRALS_KEY, JSON.stringify(allReferrals));
    
    // Add credit to referrer's account
    const rewardsData = localStorage.getItem(REFERRAL_REWARDS_KEY);
    let rewards: Record<string, number> = {};
    
    if (rewardsData) {
      try {
        rewards = JSON.parse(rewardsData);
      } catch {
        rewards = {};
      }
    }
    
    rewards[referral.referrerId] = (rewards[referral.referrerId] || 0) + REFERRAL_REWARD_AMOUNT;
    localStorage.setItem(REFERRAL_REWARDS_KEY, JSON.stringify(rewards));
  } catch {
    // Silent fail
  }
}

export function useReferralCode(): string | null {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setReferralCode(ref);
        // Store in session for later use during signup
        sessionStorage.setItem('pending_referral_code', ref);
      }
    }
  }, []);
  
  return referralCode;
}

export function getPendingReferralCode(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('pending_referral_code');
  }
  return null;
}

export function clearPendingReferralCode(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('pending_referral_code');
  }
}

interface ReferralProgramProps {
  user: User;
}

export function ReferralProgram({ user }: ReferralProgramProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalRewardsEarned: 0,
    availableCredit: 0
  });
  
  const referralCode = getReferralCode(user.id);
  const referralLink = generateReferralLink(referralCode);
  
  useEffect(() => {
    setReferrals(getReferralsByUser(user.id));
    setStats(getReferralStats(user.id));
  }, [user.id]);
  
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please try copying manually',
        variant: 'destructive'
      });
    }
  };
  
  const shareOptions = [
    {
      name: 'Email',
      url: `mailto:?subject=Try DivorceOS - Get $10 Credit&body=Sign up for DivorceOS using my referral link: ${encodeURIComponent(referralLink)}%0A%0AGet $10 credit when you sign up!`,
      icon: '✉️'
    },
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get expert California divorce guidance with DivorceOS. Sign up with my link and get $10 credit! ${referralLink}`)}`,
      icon: '🐦'
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      icon: '📘'
    },
    {
      name: 'LinkedIn',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      icon: '💼'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Referrals</p>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedReferrals}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingReferrals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Credit Earned</p>
                <p className="text-2xl font-bold text-emerald-600">${stats.totalRewardsEarned}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Referral Link Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with friends. You'll both get $10 credit when they sign up and upgrade!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={referralLink}
              readOnly
              className="font-mono text-sm bg-white"
            />
            <Button
              onClick={() => copyToClipboard(referralLink, 'Referral link')}
              variant="outline"
              className="shrink-0"
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {shareOptions.map((option) => (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded-md hover:bg-slate-50 transition-colors"
              >
                <span>{option.icon}</span>
                <span>Share on {option.name}</span>
              </a>
            ))}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Your referral code:</span>
            <Badge variant="secondary" className="font-mono">{referralCode}</Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => copyToClipboard(referralCode, 'Referral code')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>Track your referrals and rewards</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <UserPlus className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No referrals yet</p>
              <p className="text-sm">Share your link to start earning rewards!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {referral.referredUserName?.charAt(0) || referral.referredUserEmail.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {referral.referredUserName || referral.referredUserEmail}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={referral.status === 'completed' ? 'default' : 'secondary'}
                      className={referral.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                    >
                      {referral.status === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                    {referral.status === 'completed' && (
                      <p className="text-sm text-emerald-600 font-medium mt-1">
                        +${referral.rewardAmount}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <Link2 className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-1">1. Share Your Link</h4>
              <p className="text-sm text-slate-500">Send your unique referral link to friends and family</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium mb-1">2. They Sign Up</h4>
              <p className="text-sm text-slate-500">Your friend creates an account using your link</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="font-medium mb-1">3. You Both Earn</h4>
              <p className="text-sm text-slate-500">Get $10 credit when they upgrade to any paid plan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}