import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  FileText, 
  Scale, 
  Shield, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Users,
  Heart,
  Home,
  DollarSign,
  Handshake
} from 'lucide-react';
import { ChatInterface } from '@/components/ChatInterface';
import { AuthModal } from '@/components/AuthModal';
import { authService, type User } from '@/services/auth';
import { CALIFORNIA_DIVORCE_TOPICS } from '@/services/personality';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: MessageSquare,
    title: 'AI-Powered Guidance',
    description: 'Chat with Alex, our empathetic AI divorce specialist available 24/7.',
  },
  {
    icon: FileText,
    title: 'Court Forms Access',
    description: 'Download all California divorce forms directly from the courts.',
  },
  {
    icon: Scale,
    title: 'California Law Focused',
    description: 'Specialized knowledge of California Family Code and case law.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your conversations and data are kept private and confidential.',
  },
];

const topicIcons: Record<string, React.ElementType> = {
  starting: FileText,
  property: Home,
  support: DollarSign,
  custody: Users,
  'domestic-violence': Shield,
  mediation: Handshake,
};

export function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-emerald-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-emerald-600 text-white border-0 mb-4">
                AI-Powered California Divorce Help
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Navigate Your Divorce With{' '}
                <span className="text-emerald-200">Confidence</span>
              </h1>
              <p className="text-lg md:text-xl text-emerald-100 mb-8 max-w-lg">
                Chat with Alex, your AI California divorce specialist. Get instant answers, 
                access court forms, and understand your rights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {currentUser ? (
                  <a 
                    href="#chat"
                    className="inline-flex items-center justify-center px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    Start Chatting
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                ) : (
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    size="lg"
                    className="bg-white text-emerald-700 hover:bg-emerald-50"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
                <Link 
                  to="/pricing"
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  View Pricing
                </Link>
              </div>
              
              <div className="mt-8 flex items-center gap-6 text-sm text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>3 Free Chats</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>50+ Court Forms</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>24/7 AI Support</span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-white/10 rounded-2xl blur-xl"></div>
                <Card className="relative bg-white/95 backdrop-blur text-gray-800">
                  <CardHeader className="border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">Alex</CardTitle>
                        <p className="text-xs text-gray-500">AI Divorce Specialist</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="bg-emerald-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-700">
                        &quot;Hey there! I&apos;m Alex. I know this divorce stuff can feel overwhelming, 
                        but I&apos;m here to help you figure it out. What&apos;s on your mind?&quot;
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600">
                        How do I file for divorce?
                      </div>
                      <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600">
                        Child custody help
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Your California Divorce
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From initial questions to final paperwork, DivorceOS provides the guidance 
              and resources you need.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-emerald-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Topics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              California Divorce Topics
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ask Alex about any of these topics and get accurate, empathetic guidance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CALIFORNIA_DIVORCE_TOPICS.map((topic) => {
              const Icon = topicIcons[topic.id] || Scale;
              return (
                <Card key={topic.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                        <Icon className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{topic.title}</h3>
                        <p className="text-sm text-gray-600">{topic.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Chat Section */}
      <section id="chat" className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ChatInterface 
                currentUser={currentUser}
                onRequireAuth={() => setShowAuthModal(true)}
              />
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    24/7 AI Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p className="mb-4">
                    Alex is available anytime to answer your questions about California divorce law.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Instant responses
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      California law focused
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Empathetic guidance
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Not a Replacement for an Attorney
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>
                    While Alex provides helpful information, this is not legal advice. 
                    For complex situations, please consult with a qualified California 
                    family law attorney.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-emerald-700 text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Upgrade for More</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-100 mb-4">
                    Get unlimited AI chats, priority responses, and more with our paid plans.
                  </p>
                  <Link to="/pricing">
                    <Button variant="secondary" className="w-full">
                      View Pricing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-800 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-emerald-200 mb-8 max-w-2xl mx-auto">
              Create your free account and start chatting with Alex today. 
              No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!currentUser && (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  size="lg"
                  className="bg-white text-emerald-800 hover:bg-emerald-50"
                >
                  Create Free Account
                </Button>
              )}
              <Link to="/forms">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Browse Forms
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
