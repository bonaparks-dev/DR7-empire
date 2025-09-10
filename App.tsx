import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import RentalPage from './pages/RentalPage';
import MembershipPage from './pages/MembershipPage';
import { RENTAL_CATEGORIES } from './constants';
import { AnimatePresence, motion } from 'framer-motion';
import SignInPage from './pages/SignInPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SignUpPage from './pages/SignUpPage';
import AccountPage from './pages/AccountPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BookingPage from './pages/BookingPage';
import ClubEnrollmentPage from './pages/ClubEnrollmentPage';
import ClubDashboardPage from './pages/ClubDashboardPage';
import LotteryPage from './pages/LotteryPage';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        {RENTAL_CATEGORIES.map(category => (
            <Route 
                key={category.id} 
                path={`/${category.id}`} 
                element={<RentalPage categoryId={category.id} />} 
            />
        ))}
        <Route 
            path="/book/:category/:itemId"
            element={
                <ProtectedRoute>
                    <BookingPage />
                </ProtectedRoute>
            }
        />
        <Route path="/membership" element={<MembershipPage />} />
        <Route 
            path="/lottery"
            element={
                <ProtectedRoute>
                    <LotteryPage />
                </ProtectedRoute>
            }
        />
        <Route 
            path="/enroll/:tierId"
            element={
                <ProtectedRoute>
                    <ClubEnrollmentPage />
                </ProtectedRoute>
            }
        />
         <Route 
            path="/club-dashboard"
            element={
                <ProtectedRoute>
                    <ClubDashboardPage />
                </ProtectedRoute>
            }
        />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route 
            path="/account/:tab?" 
            element={
                <ProtectedRoute>
                    <AccountPage />
                </ProtectedRoute>
            } 
        />
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

// We need to wrap the AnimatedRoutes with PageWrapper for transitions to work on each page.
// Let's modify the component structure slightly.
const App = () => {
  return (
    <LanguageProvider>
      <CurrencyProvider>
          <AuthProvider>
            <HashRouter>
              <div className="bg-black min-h-screen font-sans antialiased relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] z-0"></div>
                <div className="relative z-10">
                  <Header />
                  <main>
                    <AnimatedRoutes />
                  </main>
                  <Footer />
                </div>
              </div>
            </HashRouter>
          </AuthProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
};

export default App;