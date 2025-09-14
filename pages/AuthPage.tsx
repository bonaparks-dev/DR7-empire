
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { GoogleIcon, WalletIcon } from '../components/icons/Icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GOOGLE_CLIENT_ID } from '../constants';

const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, signInWithGoogleToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const validateEmail = (emailToValidate: string) => {
    if (!emailToValidate) {
      return t('Email_is_required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToValidate)) {
      return t('Please_enter_a_valid_email_address');
    }
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (emailError) {
      setEmailError(validateEmail(newEmail));
    }
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setIsSubmitting(true);

    const emailValError = validateEmail(email);
    setEmailError(emailValError);

    let passValError = '';
    if (!password) {
      passValError = t('Password_is_required');
      setPasswordError(passValError);
    } else {
      setPasswordError('');
    }

    if (emailValError || passValError) {
        setIsSubmitting(false);
        return;
    }

    try {
      const { error } = await login(email, password);
      if (error) {
        throw new Error(error.message);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setGeneralError(err?.message || t('Something_went_wrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCallback = async (response: any) => {
    setGeneralError('');
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogleToken(response.credential);
      if (error) {
        throw new Error(error.message);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setGeneralError(err?.message || t('Something_went_wrong'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    const initGsi = () => {
      if ((window as any).google?.accounts?.id && googleButtonRef.current) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        (window as any).google.accounts.id.renderButton(
          googleButtonRef.current,
          { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with', shape: 'pill' }
        );
      }
    };

    if ((window as any).google?.accounts?.id) {
        initGsi();
    } else {
        const timeoutId = setTimeout(initGsi, 500);
        return () => clearTimeout(timeoutId);
    }
  }, [from]);

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

            {generalError && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-2">
                {generalError}
              </p>
            )}

            <div className="space-y-4">
              <div className="flex justify-center" ref={googleButtonRef}>
                <button
                  type="button"
                  disabled={true}
                  className="w-full flex items-center justify-center py-3 px-4 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-sm font-medium text-white opacity-60"
                >
                  <GoogleIcon className="w-5 h-5 mr-2" />
                  {t('Sign_in_with_Google')}
                </button>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center py-3 px-4 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                <WalletIcon className="w-5 h-5 mr-2" />
                {t('Sign_in_with_Wallet')}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-500">{t('OR')}</span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  {t('Email_Address')}
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-white focus:border-white focus:z-10 sm:text-sm ${
                    emailError ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder={t('Email_Address')}
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                />
                {emailError && <p className="mt-2 text-xs text-red-400">{emailError}</p>}
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  {t('Password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-white focus:border-white focus:z-10 sm:text-sm ${
                    passwordError ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder={t('Password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {passwordError && <p className="mt-2 text-xs text-red-400">{passwordError}</p>}
              </div>

              <div className="flex items-center justify-end text-sm">
                <Link to="/forgot-password" className="font-medium text-white hover:text-gray-300">
                  {t('Forgot_Password')}
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-gray-900 transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? t('Please_wait') : t('Sign_In')}
                </button>
              </div>
            </form>

            <div className="text-sm text-center">
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
