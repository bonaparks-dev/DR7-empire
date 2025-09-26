import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '../icons/Icons';
import { useTranslation } from '../../hooks/useTranslation';

const BackButton: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    // Check if there's a previous page in the history stack
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Otherwise, navigate to a fallback route (e.g., the homepage)
      navigate('/');
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors font-semibold"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      <span>{t('Back')}</span>
    </button>
  );
};

export default BackButton;
