import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Mail, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { authService } from '@/services/auth';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    if (typeof window !== 'undefined') {
      const cleanUrl = `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    void authService.verifyEmail(token)
      .then((success) => {
        setStatus(success ? 'success' : 'error');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [token]);

  const handleResend = async () => {
    const currentUser = authService.getCurrentUser();
    const email = currentUser?.email || userEmail;
    
    if (!email) {
      setResendMessage('Please enter your email address');
      return;
    }

    setIsResending(true);
    setResendMessage('');

    try {
      const result = await authService.resendConfirmationEmail(email);
      if (result.success) {
        setResendMessage('If that address is eligible, a fresh confirmation email is on the way.');
      } else {
        setResendMessage(result.error || 'Failed to send email. Please try again.');
      }
    } catch (error) {
      setResendMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(34,211,238,0.14),transparent_20%),linear-gradient(180deg,#f3fff8_0%,#eefcf8_44%,#f8fafc_100%)] flex items-center justify-center py-12 px-4 dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,0.16),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)]">
      <div className="max-w-md w-full">
        <Card className="border-white/80 bg-white/72 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Mail className="h-8 w-8 text-emerald-700" />
            </div>
            <CardTitle className="text-2xl">Email Confirmation</CardTitle>
            <CardDescription>
              {status === 'loading' && 'Verifying your email address...'}
              {status === 'success' && 'Your email has been confirmed!'}
              {status === 'error' && 'We couldn\'t verify your email'}
              {status === 'invalid' && 'Invalid confirmation link'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {status === 'loading' && (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-emerald-700" />
                <p className="text-slate-600">Please wait while we verify your email...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Your email has been successfully verified! You can now start using DivorceOS.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/')} 
                    className="w-full bg-emerald-700 hover:bg-emerald-800"
                  >
                    Start Using DivorceOS
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Link to="/profile">
                    <Button variant="outline" className="w-full">
                      Complete Your Profile
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-6">
                <Alert variant="destructive">
                  <XCircle className="h-5 w-5" />
                  <AlertDescription>
                    This confirmation link has expired or is invalid. Please request a new one.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Enter your email address to receive a new confirmation link:
                  </p>
                  
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  
                  <Button 
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend Confirmation Email
                      </>
                    )}
                  </Button>
                  
                  {resendMessage && (
                    <p className={`text-sm text-center ${resendMessage.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                      {resendMessage}
                    </p>
                  )}
                </div>
              </div>
            )}

            {status === 'invalid' && (
              <div className="space-y-6">
                <Alert variant="destructive">
                  <XCircle className="h-5 w-5" />
                  <AlertDescription>
                    Invalid confirmation link. Please check your email for the correct link.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline" 
                  className="w-full"
                >
                  Go to Homepage
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-slate-500 mt-6">
          Need help? Contact us at{' '}
          <a href="mailto:divorceos@agentmail.to" className="text-emerald-700 hover:underline">
            divorceos@agentmail.to
          </a>
        </p>
      </div>
    </div>
  );
}
