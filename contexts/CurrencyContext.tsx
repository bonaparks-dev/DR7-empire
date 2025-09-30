import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import type { Currency } from '../types';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>('usd');

  useEffect(() => {
    const storedCurrency = localStorage.getItem('dr7-currency') as Currency;
    if (storedCurrency && ['usd', 'eur'].includes(storedCurrency)) {
      setCurrencyState(storedCurrency);
    }
  }, []);
  
  const setCurrency = useCallback((newCurrency: Currency) => {
      localStorage.setItem('dr7-currency', newCurrency);
      setCurrencyState(newCurrency);
  }, []);

  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};