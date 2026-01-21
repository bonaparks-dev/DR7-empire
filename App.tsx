import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { BookingProvider } from './contexts/BookingContext';
import { AuthProvider } from './contexts/AuthContext';
// Nexi payment - no Stripe imports needed
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import RentalPage from './pages/RentalPage';
import MembershipPage from './pages/MembershipPage';
import { RENTAL_CATEGORIES } from './constants';
import { AnimatePresence, motion } from 'framer-motion';
import BookingModal from './components/ui/BookingModal';
import CarBookingWizard from './components/ui/CarBookingWizard';
import CarBookingConfirmationPage from './components/ui/CarBookingConfirmationPage';
import { useBooking } from './hooks/useBooking';
import BookingPage from './pages/BookingPage';

import AboutPage from './pages/AboutPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RentalAgreementPage from './pages/RentalAgreementPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import CareersPage from './pages/CareersPage';
import FranchisingPage from './pages/FranchisingPage';
import PressPage from './pages/PressPage';
import FAQPage from './pages/FAQPage';
import AuthPage from './pages/AuthPage';
import SignUpPage from './pages/SignUpPage';
import ScrollToTop from './components/routing/ScrollToTop';
import PostPage from './pages/PostPage';
import JetSearchResultsPage from './pages/JetSearchResultsPage';
import AviationQuoteRequestPage from './pages/AviationQuoteRequestPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AccountPage from './pages/AccountPage';
import ProfileSettings from './pages/account/ProfileSettings';
import SecuritySettings from './pages/account/SecuritySettings';
import DocumentsVerification from './pages/account/DocumentsVerification';
import MembershipStatus from './pages/account/MembershipStatus';
import NotificationSettings from './pages/account/NotificationSettings';
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
import CookieBanner from './components/ui/CookieBanner';
import { useAuth } from './hooks/useAuth';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { DR7AIFloatingButton } from './components/ui/DR7AIChat';

import CancellationPolicyPage from './pages/CancellationPolicyPage';
// import LotteriaPopup from './components/ui/LotteriaPopup';
import MyTickets from './pages/account/MyTickets';
import MyBookings from './pages/account/MyBookings';
import ConfirmationSuccessPage from './pages/ConfirmationSuccessPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CheckEmailPage from './pages/CheckEmailPage';
import CarWashServicesPage from './pages/CarWashServicesPage';
import CarWashBookingPage from './pages/CarWashBookingPage';
import MechanicalServicesPage from './pages/MechanicalServicesPage';
import MechanicalBookingPage from './pages/MechanicalBookingPage';
import InvestitoriPage from './pages/InvestitoriPage';
import TokenPage from './pages/TokenPage';
import AdminCalendarPage from './pages/AdminCalendarPage';
import AdminDocumentsPage from './pages/AdminDocumentsPage';
import CreditWalletPage from './pages/CreditWalletPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';



const AuthRedirector: React.FC = () => {
  const { user, authEvent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Handle password recovery link
    if (authEvent === 'PASSWORD_RECOVERY' && location.pathname !== '/reset-password') {
      navigate('/reset-password', { replace: true });
      return;
    }

    // 2. Handle successful OAuth sign-in
    if (user && sessionStorage.getItem('oauth_in_progress')) {
      sessionStorage.removeItem('oauth_in_progress');
      const destination = user.role === 'business' ? '/partner/dashboard' : '/account';
      if (location.pathname !== destination) {
        navigate(destination, { replace: true });
      }
    }
  }, [user, authEvent, navigate, location.pathname]);

  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/jets/search" element={<JetSearchResultsPage />} />
        <Route path="/jets/quote" element={<AviationQuoteRequestPage />} />
        <Route path="/helicopters/quote" element={<AviationQuoteRequestPage />} />
        <Route path="/aviation-quote" element={<AviationQuoteRequestPage />} />
        <Route path="/car-wash-services" element={<CarWashServicesPage />} />
        <Route path="/car-wash-booking" element={<CarWashBookingPage />} />
        <Route path="/mechanical-services" element={<MechanicalServicesPage />} />
        <Route path="/mechanical-booking" element={<MechanicalBookingPage />} />
        <Route path="/admin/calendar" element={<AdminCalendarPage />} />
        <Route path="/admin/documents" element={<AdminDocumentsPage />} />
        {RENTAL_CATEGORIES
          .filter(category => !['car-wash-services', 'mechanical-services', 'membership', 'credit-wallet'].includes(category.id))
          .map(category => (
            <Route
              key={category.id}
              path={`/${category.id}`}
              element={<RentalPage categoryId={category.id} />}
            />
          ))}
        <Route
          path="/book/:category/:itemId"
          element={<ProtectedRoute><BookingPage /></ProtectedRoute>}
        />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/membership/enroll/:tierId" element={
          <ProtectedRoute>
            <MembershipEnrollmentPage />
          </ProtectedRoute>
        } />
        <Route path="/credit-wallet" element={<CreditWalletPage />} />
        <Route
          path="/cancellation-policy"
          element={<CancellationPolicyPage />}
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
          <Route path="bookings" element={<MyBookings />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="tickets" element={<MyTickets />} />
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
        <Route path="/investitori" element={<InvestitoriPage />} />
        <Route path="/token" element={<TokenPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/rental-agreement" element={<RentalAgreementPage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/franchising" element={<FranchisingPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/signin" element={<AuthPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/check-email" element={<CheckEmailPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/confirmation-success" element={<ConfirmationSuccessPage />} />
        <Route path="/car-booking-success" element={<CarBookingConfirmationPage />} />
        <Route path="/booking-success" element={<ConfirmationSuccessPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-cancel" element={<PaymentCancelPage />} />
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

// Nexi payment - no Stripe promise needed

const MainContent = () => {
  const { isCarWizardOpen, closeCarWizard, selectedCar, wizardCategory } = useBooking();
  const navigate = useNavigate();

  console.log('MainContent render - isCarWizardOpen:', isCarWizardOpen, 'selectedCar:', selectedCar?.name);

  const handleBookingComplete = (booking: any) => {
    closeCarWizard();
    navigate('/car-booking-success', { state: { booking } });
  };

  return (
    <>
      <div className="bg-black min-h-screen font-sans antialiased relative overflow-x-hidden">
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
        {/* <LotteriaPopup /> */}
        <DR7AIFloatingButton />
        <AnimatePresence>
          {isCarWizardOpen && selectedCar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, y: -30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: -30 }}
                className="relative w-full max-w-7xl mx-auto my-6"
              >
                <CarBookingWizard
                  item={selectedCar}
                  categoryContext={wizardCategory || undefined}
                  onClose={closeCarWizard}
                  onBookingComplete={handleBookingComplete}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};


const App = () => {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <BookingProvider>
          <AuthProvider>
            <VerificationProvider>
              <BrowserRouter>
                <ScrollToTop />
                <AuthRedirector />
                <MainContent />
              </BrowserRouter>
            </VerificationProvider>
          </AuthProvider>
        </BookingProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
};

export default App;
