import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

const BackButton: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <button
      onClick={() => navigate(-1)}
      className="px-6 py-2 text-sm sm:text-base rounded-full border transition-colors bg-black/60 border-white/60 text-white hover:border-white hover:bg-black/80 font-medium inline-flex items-center"
    >
      <span className="mr-2">←</span>
      <span>{t('Back')}</span>
    </button>
  );
};

export default BackButton;