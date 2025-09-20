import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import BookingPage from './pages/BookingPage';
import LotteryPage from './pages/LotteryPage';
import AboutPage from './pages/AboutPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RentalAgreementPage from './pages/RentalAgreementPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import CareersPage from './pages/CareersPage';
import PressPage from './pages/PressPage';
import FAQPage from './pages/FAQPage';
import AuthPage from './pages/AuthPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ScrollToTop from './components/routing/ScrollToTop';
import PostPage from './pages/PostPage';
import EnvGuard from './components/system/EnvGuard';
import VillaDetailsPage from './pages/VillaDetailsPage';
import VillaListingsPage from './pages/VillaListingsPage';
import JetSearchResultsPage from './pages/JetSearchResultsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AccountPage from './pages/AccountPage';
import ProfileSettings from './pages/account/ProfileSettings';
import SecuritySettings from './pages/account/SecuritySettings';
import DocumentsVerification from './pages/account/DocumentsVerification';
import MembershipStatus from './pages/account/MembershipStatus';
import NotificationSettings from './pages/account/NotificationSettings';
import PaymentMethods from './pages/account/PaymentMethods';
import MembershipEnrollmentPage from './pages/MembershipEnrollmentPage';
import { VerificationProvider } from './contexts/VerificationContext';
import VerificationModal from './components/ui/VerificationModal';
import PartnerDashboardLayout from './layouts/PartnerDashboardLayout';
import PartnerDashboardPage from './pages/partner/PartnerDashboardPage';
import CreateListingPage from './pages/partner/CreateListingPage';
import PartnerVerificationPage from './pages/partner/PartnerVerificationPage';
import PartnerProfileSettings from './pages/partner/settings/PartnerProfileSettings';
import PartnerSecuritySettings from './pages/partner/settings/PartnerSecuritySettings';
import PartnerNotificationSettings from './pages/partner/settings/PartnerNotificationSettings';
import PartnerPayoutSettings from './pages/partner/settings/PartnerPayoutSettings';
import CheckEmailPage from './pages/CheckEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CookieBanner from './components/ui/CookieBanner';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/villas" element={<VillaListingsPage />} />
        <Route path="/villas/:villaId" element={<VillaDetailsPage />} />
        <Route path="/jets/search" element={<JetSearchResultsPage />} />
        {RENTAL_CATEGORIES.filter(c => c.id !== 'villas').map(category => (
            <Route 
                key={category.id} 
                path={`/${category.id}`} 
                element={<RentalPage categoryId={category.id} />} 
            />
        ))}
        <Route 
            path="/book/:category/:itemId"
            element={<BookingPage />}
        />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/membership/enroll/:tierId" element={
          <ProtectedRoute>
            <MembershipEnrollmentPage />
          </ProtectedRoute>
        } />
        <Route 
            path="/lottery"
            element={<LotteryPage />}
        />
        <Route path="/account" element={
          <ProtectedRoute role="personal">
            <AccountPage />
          </ProtectedRoute>
        }>
          <Route index element={<ProfileSettings />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="security" element={<SecuritySettings />} />
          <Route path="documents" element={<DocumentsVerification />} />
          <Route path="membership" element={<MembershipStatus />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
        </Route>

        <Route path="/partner" element={
          <ProtectedRoute role="business">
            <PartnerDashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/partner/dashboard" replace />} />
          <Route path="dashboard" element={<PartnerDashboardPage />} />
          <Route path="listings/new" element={<CreateListingPage />} />
          <Route path="verification" element={<PartnerVerificationPage />} />
          <Route path="settings" element={<Navigate to="/partner/settings/profile" replace />} />
          <Route path="settings/profile" element={<PartnerProfileSettings />} />
          <Route path="settings/security" element={<PartnerSecuritySettings />} />
          <Route path="settings/notifications" element={<PartnerNotificationSettings />} />
          <Route path="settings/payouts" element={<PartnerPayoutSettings />} />
        </Route>

        <Route path="/about" element={<AboutPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/rental-agreement" element={<RentalAgreementPage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/signin" element={<AuthPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/check-email" element={<CheckEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/post/:id" element={<PostPage />} />
      </Routes>
    </AnimatePresence>
  );
};

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
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
};

const App = () => {
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      setNotification({ message: 'Account verified successfully! You are now logged in.', type: 'success' });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <EnvGuard>
      <LanguageProvider>
        <CurrencyProvider>
          <BookingProvider>
            <AuthProvider>
              <VerificationProvider>
                <HashRouter>
                  <ScrollToTop />
                  <div className="bg-black min-h-screen font-sans antialiased relative overflow-x-hidden">
                    <AnimatePresence>
                      {notification && (
                        <motion.div
                          initial={{ opacity: 0, y: -50, top: 0 }}
                          animate={{ opacity: 1, y: 0, top: '6rem' }} // top-24
                          exit={{ opacity: 0, y: -50 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          className="fixed left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
                        >
                          <div className="p-4 rounded-lg shadow-lg text-center bg-green-600 text-white font-semibold">
                            {notification.message}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] z-0"></div>
                    <div className="relative z-10 flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-grow">
                        <AnimatedRoutes />
                      </main>
                      <Footer />
                    </div>
                    <BookingModal />
                    <VerificationModal />
                    <CookieBanner />
                  </div>
                </HashRouter>
              </VerificationProvider>
            </AuthProvider>
          </BookingProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </EnvGuard>
  );
};

export default App;