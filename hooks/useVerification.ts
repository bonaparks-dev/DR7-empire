
import { useContext } from 'react';
import { VerificationContext } from '../contexts/VerificationContext';

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};
