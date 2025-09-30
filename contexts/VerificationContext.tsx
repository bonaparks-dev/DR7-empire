
import React, { createContext, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

type ModalType = 'login' | 'verify';

interface VerificationContextType {
  isModalOpen: boolean;
  modalType: ModalType | null;
  checkVerificationAndProceed: (onSuccess: () => void) => void;
  checkLoginAndProceed: (onSuccess: () => void) => void;
  closeModal: () => void;
}

export const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export const VerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const { user } = useAuth();

  const openModal = (type: ModalType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Delay clearing type for exit animation
    setTimeout(() => setModalType(null), 300);
  };
  
  const checkVerificationAndProceed = (onSuccess: () => void) => {
    if (!user) {
      openModal('login');
      return;
    }
    
    if (user.verification.idStatus !== 'verified') {
      openModal('verify');
      return;
    }

    // All checks passed, proceed with the original action
    onSuccess();
  };

  const checkLoginAndProceed = (onSuccess: () => void) => {
    if (!user) {
      openModal('login');
      return;
    }
    // Login check passed, proceed with the original action
    onSuccess();
  };
  
  const value = useMemo(() => ({
    isModalOpen,
    modalType,
    checkVerificationAndProceed,
    checkLoginAndProceed,
    closeModal,
  }), [isModalOpen, modalType, user]);

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
};
