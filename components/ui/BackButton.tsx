import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '../icons/Icons';
import { useTranslation } from '../../hooks/useTranslation';

interface BackButtonProps {
  to?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ to }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
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
