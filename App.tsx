import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { BookingProvider } from './contexts/BookingContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import RentalPage from './pages/RentalPage';
import MembershipPage from './pages/MembershipPage';
import { RENTAL_CATEGORIES } from './constants';
import { AnimatePresence, motion } from 'framer-motion';
import BookingModal from './components/ui/BookingModal';
import SignInPage from './pages/SignInPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SignUpPage from './pages/SignUpPage';
import AccountPage from './pages/AccountPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BookingPage from './pages/BookingPage';
import ClubEnrollmentPage from './pages/ClubEnrollmentPage';
import ClubDashboardPage from './pages/ClubDashboardPage';
import LotteryPage from './pages/LotteryPage';
import AboutPage from './pages/AboutPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RentalAgreementPage from './pages/RentalAgreementPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import CareersPage from './pages/CareersPage';
import PressPage from './pages/PressPage';
import FAQPage from './pages/FAQPage';
import { useEffect } from 'react';
import { useLocation as useLoc } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLoc();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
    document?.body?.focus?.();
  }, [pathname, hash]);
  return null;
};

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5, ease: 'easeInOut' }}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        {RENTAL_CATEGORIES.map(category => (
          <Route key={category.id} path={`/${category.id}`} element={<PageWrapper><RentalPage categoryId={category.id} /></PageWrapper>} />
        ))}
        <Route path="/book/:category/:itemId" element={<ProtectedRoute><PageWrapper><BookingPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/membership" element={<PageWrapper><MembershipPage /></PageWrapper>} />
        <Route path="/lottery" element={<ProtectedRoute><PageWrapper><LotteryPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/enroll/:tierId" element={<ProtectedRoute><PageWrapper><ClubEnrollmentPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/club-dashboard" element={<ProtectedRoute><PageWrapper><ClubDashboardPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/signin" element={<PageWrapper><SignInPage /></PageWrapper>} />
        <Route path="/signup" element={<PageWrapper><SignUpPage /></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
        <Route path="/account/:tab?" element={<ProtectedRoute><PageWrapper><AccountPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
        <Route path="/terms" element={<PageWrapper><TermsOfServicePage /></PageWrapper>} />
        <Route path="/privacy" element={<PageWrapper><PrivacyPolicyPage /></PageWrapper>} />
        <Route path="/rental-agreement" element={<PageWrapper><RentalAgreementPage /></PageWrapper>} />
        <Route path="/cookie-policy" element={<PageWrapper><CookiePolicyPage /></PageWrapper>} />
        <Route path="/careers" element={<PageWrapper><CareersPage /></PageWrapper>} />
        <Route path="/press" element={<PageWrapper><PressPage /></PageWrapper>} />
        <Route path="/faq" element={<PageWrapper><FAQPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <BookingProvider>
          <AuthProvider>
            <HashRouter>
              <ScrollToTop />
              <div className="bg-black text-white min-h-screen font-sans antialiased relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] z-0"></div>
                <div className="relative z-10 flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">
                    <AnimatedRoutes />
                  </main>
                  <Footer />
                </div>
                <BookingModal />
              </div>
            </HashRouter>
          </AuthProvider>
        </BookingProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
};

export default App;
