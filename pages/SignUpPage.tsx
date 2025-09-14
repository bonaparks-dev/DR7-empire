
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { GoogleIcon, WalletIcon, EyeIcon, EyeSlashIcon } from '../components/icons/Icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GOOGLE_CLIENT_ID } from '../constants';

const strengthLevels = [
  { labelKey: 'Password_Strength_Weak', color: 'bg-red-500', textColor: 'text-red-400' },
  { labelKey: 'Password_Strength_Medium', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { labelKey: 'Password_Strength_Good', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { labelKey: 'Password_Strength_Strong', color: 'bg-green-500', textColor: 'text-green-400' },
];

const calculatePasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(Math.max(score - 1, 0), 3);
};

const SignUpPage: React.FC = () => {
  const { t } = useTranslation();
  const { signup, signInWithGoogleToken } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const passwordStrength = useMemo(() => calculatePasswordStrength(formData.password), [formData.password]);
  const strengthInfo = formData.password ? strengthLevels[passwordStrength] : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setGeneralError('');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = t('Full_name_is_required');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = t('Email_is_required');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('Please_enter_a_valid_email_address');
    }
    if (!formData.password) {
      newErrors.password = t('Password_is_required');
    } else if (passwordStrength < 1) {
      newErrors.password = t('Password_is_too_weak');
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('Passwords_do_not_match');
    }
    if (!formData.terms) {
      newErrors.terms = t('You_must_agree_to_the_terms');
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      const { error } = await signup(formData.email, formData.password, {
        data: { full_name: formData.fullName }
      });

      if (error) {
          throw new Error(error.message);
      }

      // Since signup now logs the user in, we can proceed with welcome email and navigation
      fetch('/.netlify/functions/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              email: formData.email,
              name: formData.fullName 
          }),
      }).catch(err => {
          console.error("Failed to trigger welcome email:", err);
      });
      navigate('/');

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
      navigate('/');
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
          { theme: 'outline', size: 'large', type: 'standard', text: 'signup_with', shape: 'pill' }
        );
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const timeoutId = setTimeout(initGsi, 500);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  const getInputClassName = (field: string) =>
    `appearance-none rounded-md relative block w-full px-3 py-3 border bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-white focus:border-white focus:z-10 sm:text-sm ${
      errors[field] ? 'border-red-500' : 'border-gray-700'
    }`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-2xl shadow-black/50 p-8 space-y-6"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">{t('Create_Your_Account')}</h2>
              <p className="mt-2 text-sm text-gray-400">{t('Join_the_exclusive_world_of_DR7')}</p>
            </div>

            {generalError && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-2">{generalError}</p>}

            <div className="space-y-4">
              <div className="flex justify-center" ref={googleButtonRef}>
                <button
                  type="button"
                  disabled={true}
                  className="w-full flex items-center justify-center py-3 px-4 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-sm font-medium text-white opacity-60"
                >
                  <GoogleIcon className="w-5 h-5 mr-2" />
                  {t('Sign_up_with_Google')}
                </button>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center py-3 px-4 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                <WalletIcon className="w-5 h-5 mr-2" />
                {t('Sign_up_with_Wallet')}
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
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  className={getInputClassName('fullName')}
                  placeholder={t('Full_Name')}
                  value={formData.fullName}
                  onChange={handleChange}
                />
                {errors.fullName && <p className="mt-2 text-xs text-red-400">{errors.fullName}</p>}
              </div>
              <div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={getInputClassName('email')}
                  placeholder={t('Email_Address')}
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
              </div>
              <div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={getInputClassName('password')}
                    placeholder={t('Password')}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white focus:outline-none"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                {formData.password.length > 0 && strengthInfo && (
                  <div className="flex items-center mt-2 space-x-1">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-1.5 flex-1 rounded-full bg-gray-800">
                        <div className={`h-full rounded-full transition-all duration-300 ${index <= passwordStrength ? strengthInfo.color : ''}`} />
                      </div>
                    ))}
                    <span className={`ml-3 text-xs font-medium ${strengthInfo.textColor}`}>
                      {t(strengthInfo.labelKey as any)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={getInputClassName('confirmPassword')}
                    placeholder={t('Confirm_Password')}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-2 text-xs text-red-400">{errors.confirmPassword}</p>}
              </div>
              <div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      required
                      className="h-4 w-4 text-white bg-gray-700 border-gray-600 rounded focus:ring-white"
                      checked={formData.terms}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="font-medium text-gray-400">
                      {t('I_agree_to_the')}{' '}
                      <Link to="/terms" className="text-white hover:text-gray-300">
                        {t('Terms_and_Privacy_Policy')}
                      </Link>
                    </label>
                  </div>
                </div>
                {errors.terms && <p className="mt-2 text-xs text-red-400">{errors.terms}</p>}
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-gray-900 transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? t('Please_wait') : t('Create_Account')}
                </button>
              </div>
            </form>
            <div className="text-sm text-center">
              <p className="text-gray-400">
                {t('Already_have_an_account')}{' '}
                <Link to="/signin" className="font-medium text-white hover:text-gray-300">
                  {t('Sign_In')}
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignUpPage;
