
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
          <ProtectedRoute>
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
  return (
    <EnvGuard>
      <LanguageProvider>
        <CurrencyProvider>
          <BookingProvider>
            <AuthProvider>
              <HashRouter>
                <ScrollToTop />
                <div className="bg-black min-h-screen font-sans antialiased relative overflow-hidden">
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
    </EnvGuard>
  );
};

export default App;