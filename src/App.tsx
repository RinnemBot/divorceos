import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { HomePage } from '@/pages/HomePage';
import { PricingPage } from '@/pages/PricingPage';
import { FormsPage } from '@/pages/FormsPage';
import { SupportToolsPage } from '@/pages/SupportToolsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ConfirmEmailPage } from '@/pages/ConfirmEmailPage';
import { AuthModal } from '@/components/AuthModal';
import { authService, type User } from '@/services/auth';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Check for existing session
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setIsLoading(false);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation 
          currentUser={currentUser}
          onAuthClick={handleAuthClick}
          onLogout={handleLogout}
        />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/forms" element={<FormsPage />} />
            <Route path="/support-tools" element={<SupportToolsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/confirm-email" element={<ConfirmEmailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
