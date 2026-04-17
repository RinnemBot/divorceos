import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { type User } from '@/services/auth';
import { toast } from 'sonner';

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

function getReferralOwnerKey(value: string): string {
  return value.replace(/^DIV/i, '').trim().toLowerCase().slice(0, 6);
}

export function getReferralCode(userId: string): string {
  return `DIV${getReferralOwnerKey(userId).toUpperCase()}`;
}

export function generateReferralLink(referralCode: string): string {
  // Use current domain or default to divorce-os.vercel.app
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://divorce-os.vercel.app';
  return `${baseUrl}/?ref=${referralCode}`;
}

export async function fetchReferralSnapshot(): Promise<{ referrals: Referral[]; stats: ReferralStats }> {
  const response = await fetch('/api/referrals');
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load referrals');
  }

  return {
    referrals: Array.isArray(payload.referrals) ? payload.referrals : [],
    stats: payload.stats || {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalRewardsEarned: 0,
      availableCredit: 0,
    },
  };
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
    let cancelled = false;

    void fetchReferralSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        setReferrals(snapshot.referrals);
        setStats(snapshot.stats);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load referrals', error);
        setReferrals([]);
        setStats({
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          totalRewardsEarned: 0,
          availableCredit: 0,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [user.id]);
  
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied!', {
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy', {
        description: 'Please try copying manually',
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
      name: 'Text Message',
      url: `sms:&body=${encodeURIComponent(`Get expert California divorce guidance with DivorceOS. Use my link for $10 credit: ${referralLink}`)}`,
      icon: '💬'
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