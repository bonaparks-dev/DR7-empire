import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
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
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
      <BookingProvider>
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
              <BookingModal />
            </div>
          </HashRouter>
        </AuthProvider>
      </BookingProvider>
    </LanguageProvider>
  );
};

export default App;
