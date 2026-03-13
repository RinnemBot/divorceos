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
import { isTokenValid } from '@/services/email';

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

    // Check if token is valid and not expired
    if (!isTokenValid(token)) {
      setStatus('error');
      return;
    }

    // Verify the email
    const success = authService.verifyEmail(token);
    
    if (success) {
      setStatus('success');
    } else {
      setStatus('error');
    }
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
        setResendMessage('Confirmation email sent! Please check your inbox.');
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
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
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
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
                    className="w-full bg-blue-600 hover:bg-blue-700"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <a href="mailto:divorceos@agentmail.to" className="text-blue-600 hover:underline">
            divorceos@agentmail.to
          </a>
        </p>
      </div>
    </div>
  );
}
