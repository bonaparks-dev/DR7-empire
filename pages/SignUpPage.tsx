import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { GoogleIcon, EyeIcon, EyeSlashIcon } from '../components/icons/Icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PasswordStrengthMeter: React.FC<{ password?: string }> = ({ password = '' }) => {
    const { t } = useTranslation();
    const getStrength = () => {
        let score = 0;
        if (password.length > 7) score++;
        if (password.match(/[a-z]/)) score++;
        if (password.match(/[A-Z]/)) score++;
        if (password.match(/[0-9]/)) score++;
        if (password.match(/[^a-zA-Z0-9]/)) score++;
        return score;
    };

    const strength = getStrength();
    const strengthText = [t('Password_is_too_weak'), t('Password_Strength_Weak'), t('Password_Strength_Medium'), t('Password_Strength_Good'), t('Password_Strength_Strong')];
    const strengthColor = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    return (
        <div className="flex items-center mt-2">
            <div className="w-full bg-gray-700 rounded-full h-2 mr-3">
                <div className={`h-2 rounded-full ${strengthColor[strength]}`} style={{ width: `${(strength / 5) * 100}%` }}></div>
            </div>
            <span className="text-xs text-gray-400">{strengthText[strength]}</span>
        </div>
    );
};

const SignUpPage: React.FC = () => {
  const { t } = useTranslation();
  const { signup, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const [formData, setFormData] = useState({ fullName: '', companyName: '', email: '', password: '', confirmPassword: '' });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (user) {
      navigate(user.role === 'business' ? '/partner/dashboard' : '/account');
    }
  }, [user, navigate]);
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = t('Full_name_is_required');
    if (accountType === 'business' && !formData.companyName) newErrors.companyName = t('Company_name_is_required');
    if (!formData.email) newErrors.email = t('Email_is_required');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('Please_enter_a_valid_email_address');
    if (!formData.password) newErrors.password = t('Password_is_required');
    else if (formData.password.length < 8) newErrors.password = t('Password_is_too_weak');
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('Passwords_do_not_match');
    if (!agreedToTerms) newErrors.terms = t('You_must_agree_to_the_terms');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    if (!validate()) return;
    setIsSubmitting(true);
    try {
        const { error } = await signup(formData.email, formData.password, {
            full_name: formData.fullName,
            company_name: accountType === 'business' ? formData.companyName : undefined,
            role: accountType,
        });
        if (error) throw error;
        navigate('/check-email');
    } catch (err: any) {
        setGeneralError(err.message || t('Something_went_wrong'));
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGeneralError('');
    setIsSubmitting(true);
    try {
        const { error } = await signInWithGoogle();
        if (error) throw error;
    } catch(err: any) {
        setGeneralError(err.message || t('Something_went_wrong'));
    } finally {
        setIsSubmitting(false);
    }
  }

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
            {generalError && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-3">{generalError}</p>}
            <div className="flex bg-gray-800 border border-gray-700 rounded-full p-1">
                <button onClick={() => setAccountType('personal')} className={`w-1/2 py-2 text-sm font-semibold rounded-full transition-colors ${accountType === 'personal' ? 'bg-white text-black' : 'text-gray-300'}`}>{t('Personal')}</button>
                <button onClick={() => setAccountType('business')} className={`w-1/2 py-2 text-sm font-semibold rounded-full transition-colors ${accountType === 'business' ? 'bg-white text-black' : 'text-gray-300'}`}>{t('Business')}</button>
            </div>
            {accountType === 'business' && <p className="text-xs text-gray-400 text-center">{t('Create_a_business_account')}</p>}

            <form className="space-y-4" onSubmit={handleSignUp} noValidate>
                <input type="text" name="fullName" placeholder={t('Full_Name')} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"/>
                {errors.fullName && <p className="text-xs text-red-400">{errors.fullName}</p>}
                {accountType === 'business' && (<>
                    <input type="text" name="companyName" placeholder={t('Company_Name')} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"/>
                    {errors.companyName && <p className="text-xs text-red-400">{errors.companyName}</p>}
                </>)}
                <input type="email" name="email" placeholder={t('Email_Address')} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"/>
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                <div className="relative"><input type={showPassword ? 'text' : 'password'} name="password" placeholder={t('Password')} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400">{showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}</button></div>
                {errors.password ? <p className="text-xs text-red-400">{errors.password}</p> : <PasswordStrengthMeter password={formData.password} />}
                <input type="password" name="confirmPassword" placeholder={t('Confirm_Password')} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full bg-gray-800 border-gray-700 rounded-md p-3 text-white"/>
                {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
                <div className="flex items-center"><input id="terms" name="terms" type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="h-4 w-4 text-white bg-gray-700 border-gray-600 rounded focus:ring-white"/><label htmlFor="terms" className="ml-2 block text-sm text-gray-400">{t('I_agree_to_the')}{' '}<Link to="/terms" className="font-medium text-white hover:underline">{t('Terms_and_Privacy_Policy')}</Link></label></div>
                {errors.terms && <p className="text-xs text-red-400">{errors.terms}</p>}
                <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60">{isSubmitting ? t('Please_wait') : t('Create_Account')}</button>
            </form>
            <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-700"></div><span className="flex-shrink mx-4 text-gray-400 text-sm">{t('OR')}</span><div className="flex-grow border-t border-gray-700"></div></div>
            <button type="button" onClick={handleGoogleSignIn} disabled={isSubmitting} className="w-full flex items-center justify-center py-3 px-4 border border-gray-700 rounded-full bg-gray-800 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-60"><GoogleIcon className="w-5 h-5 mr-2" />{t('Sign_up_with_Google')}</button>
            <div className="text-sm text-center"><p className="text-gray-400">{t('Already_have_an_account')}{' '}<Link to="/signin" className="font-medium text-white hover:text-gray-300">{t('Sign_In')}</Link></p></div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignUpPage;