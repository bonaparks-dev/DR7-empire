import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { GoogleIcon, EyeIcon, EyeSlashIcon } from '../components/icons/Icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState((location.state as any)?.error || '');

  useEffect(() => {
    if (!loading && user) {
      const destination = from !== '/' && from !== '/signin' && from !== '/signup'
          ? from
          : (user.role === 'business' ? '/partner/dashboard' : '/account');
      navigate(destination, { replace: true });
    }
  }, [user, loading, navigate, from]);
  
  const handleEmailLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);
      try {
          const { error } = await login(email, password);
          if (error) throw error;
          // Navigation is handled by useEffect
      } catch (err: any) {
          setError(err.message || t('Something_went_wrong'));
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleGoogleSignIn = async () => {
  setError('');
  setIsSubmitting(true);

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw error;

   
  } catch (err: any) {
    setError(err?.message ?? t('Something_went_wrong'));
    setIsSubmitting(false); // only runs if redirect fails
  }
};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-2xl shadow-black/50 p-8 space-y-6"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">{t('Access_Your_Account')}</h2>
              <p className="mt-2 text-sm text-gray-400">
                {t('Welcome_back_to_the_world_of_luxury')}
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-3 text-center">
                {error}
              </p>
            )}

            <form className="space-y-4" onSubmit={handleEmailLogin} noValidate>
              <input type="email" placeholder={t('Email_Address')} value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white placeholder-gray-400"/>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder={t('Password')} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white placeholder-gray-400"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400">{showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button>
              </div>
              <div className="text-right text-sm">
                <Link to="/forgot-password" className="font-medium text-white hover:text-gray-300">{t('Forgot_Password')}</Link>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60">{isSubmitting ? t('Please_wait') : t('Sign_In')}</button>
            </form>
            
            <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-700"></div><span className="flex-shrink mx-4 text-gray-400 text-sm">{t('OR')}</span><div className="flex-grow border-t border-gray-700"></div></div>

            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-3 px-4 border border-gray-700 rounded-full bg-gray-800 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-60"
              >
                <GoogleIcon className="w-5 h-5 mr-2" />
                {t('Sign_in_with_Google')}
              </button>

            <div className="text-sm text-center pt-2">
              <p className="text-gray-400">
                {t('Dont_have_an_account')}{' '}
                <Link to="/signup" className="font-medium text-white hover:text-gray-300">
                  {t('Sign_Up')}
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthPage;
