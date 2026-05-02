import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ScrollToTop } from '@/components/ScrollToTop';
import { AuthModal } from '@/components/AuthModal';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { authService, type User } from '@/services/auth';
import { Toaster } from '@/components/ui/sonner';

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then((m) => ({ default: m.PricingPage })));
const FormsPage = lazy(() => import('@/pages/FormsPage').then((m) => ({ default: m.FormsPage })));
const PacketWizardPage = lazy(() => import('@/pages/PacketWizardPage').then((m) => ({ default: m.PacketWizardPage })));
const SupportToolsPage = lazy(() => import('@/pages/SupportToolsPage').then((m) => ({ default: m.SupportToolsPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ConfirmEmailPage = lazy(() => import('@/pages/ConfirmEmailPage').then((m) => ({ default: m.ConfirmEmailPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const BookkeepingPage = lazy(() => import('@/pages/BookkeepingPage').then((m) => ({ default: m.BookkeepingPage })));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const CountyConciergePage = lazy(() => import('@/pages/CountyConciergePage').then((m) => ({ default: m.CountyConciergePage })));
const EfileAssistantPage = lazy(() => import('@/pages/EfileAssistantPage').then((m) => ({ default: m.EfileAssistantPage })));
const DraftFormsPage = lazy(() => import('@/pages/DraftFormsPage').then((m) => ({ default: m.DraftFormsPage })));
const TermsPage = lazy(() => import('@/pages/LegalPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('@/pages/LegalPage').then((m) => ({ default: m.PrivacyPage })));
const DisclaimerPage = lazy(() => import('@/pages/LegalPage').then((m) => ({ default: m.DisclaimerPage })));

function RouteLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-background text-foreground transition-colors">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const cachedUser = authService.getCurrentUser();
    setCurrentUser(cachedUser);

    const handleAuthRequired = () => {
      authService.logout();
      setCurrentUser(null);
      setShowAuthModal(true);
    };

    window.addEventListener('divorceos:auth-required', handleAuthRequired);

    void authService.refreshCurrentUser().then((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => {
      window.removeEventListener('divorceos:auth-required', handleAuthRequired);
    };
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <AnalyticsTracker />
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
        <Navigation 
          currentUser={currentUser}
          onAuthClick={handleAuthClick}
          onLogout={handleLogout}
        />
        <main className="flex-1">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/forms" element={<FormsPage />} />
              <Route path="/what-do-i-need" element={<PacketWizardPage />} />
              <Route path="/support-tools" element={<SupportToolsPage />} />
              <Route path="/concierge" element={<CountyConciergePage />} />
              <Route path="/concierge/:countyId" element={<CountyConciergePage />} />
              <Route path="/efile-assistant" element={<EfileAssistantPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/bookkeeping" element={<BookkeepingPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/draft-forms" element={<DraftFormsPage />} />
              <Route path="/draft-forms/:workspaceId" element={<DraftFormsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/confirm-email" element={<ConfirmEmailPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <Toaster />
        
        {/* Global Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </Router>
  );
}

export default App;
