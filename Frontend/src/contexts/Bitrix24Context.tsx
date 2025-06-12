import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { B24Frame } from '@bitrix24/b24jssdk';
import bitrix24Service from '@/services/bitrix24Service';
import { Transaction, FilterState } from '@/types/financial';

interface Bitrix24ContextType {
  isAvailable: boolean;
  isInitialized: boolean;
  isInBitrix24: boolean;
  currentUser: any | null;
  error: string | null;
  
  // Methods
  initialize: () => Promise<void>;
  syncTransactionsToCRM: (transactions: Transaction[]) => Promise<boolean>;
  getDealsFromCRM: (filters: FilterState) => Promise<any[]>;
  calculateCommissionFromCRM: (filters: FilterState) => Promise<number>;
  showNotification: (message: string, type?: 'success' | 'error') => Promise<void>;
  closeApp: () => void;
  installFinish: () => Promise<void>;
  getInstance: () => B24Frame | null;
}

const Bitrix24Context = createContext<Bitrix24ContextType | null>(null);

interface Bitrix24ProviderProps {
  children: ReactNode;
  autoInitialize?: boolean;
}

export const Bitrix24Provider: React.FC<Bitrix24ProviderProps> = ({ 
  children, 
  autoInitialize = true 
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInBitrix24, setIsInBitrix24] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialize = async () => {
    try {
      setError(null);
      
      // Check if we're in Bitrix24 environment
      const inBitrix24 = bitrix24Service.isInBitrix24();
      setIsInBitrix24(inBitrix24);

      if (inBitrix24) {
        const b24Instance = await bitrix24Service.initialize();
        if (b24Instance) {
          setIsAvailable(true);
          setIsInitialized(true);

          // Try to get current user
          try {
            const user = await bitrix24Service.getCurrentUser();
            setCurrentUser(user);
          } catch (userError) {
            console.warn('Could not get current user:', userError);
          }
        }
      } else {
        // Not in Bitrix24 environment, but app can still work
        setIsAvailable(false);
        setIsInitialized(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Bitrix24';
      setError(errorMessage);
      console.error('Bitrix24 initialization failed:', err);
    }
  };

  const syncTransactionsToCRM = async (transactions: Transaction[]): Promise<boolean> => {
    if (!isAvailable) {
      throw new Error('Bitrix24 not available');
    }
    return await bitrix24Service.syncTransactionsToCRM(transactions);
  };

  const getDealsFromCRM = async (filters: FilterState): Promise<any[]> => {
    if (!isAvailable) {
      throw new Error('Bitrix24 not available');
    }
    return await bitrix24Service.getDealsFromCRM(filters);
  };

  const calculateCommissionFromCRM = async (filters: FilterState): Promise<number> => {
    if (!isAvailable) {
      return 0;
    }
    return await bitrix24Service.calculateCommissionFromCRM(filters);
  };

  const showNotification = async (message: string, type: 'success' | 'error' = 'success'): Promise<void> => {
    await bitrix24Service.showNotification(message, type);
  };

  const closeApp = () => {
    bitrix24Service.closeApp();
  };

  const installFinish = async (): Promise<void> => {
    if (!isAvailable) {
      return;
    }
    await bitrix24Service.installFinish();
  };

  const getInstance = (): B24Frame | null => {
    return bitrix24Service.getInstance();
  };

  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }

    // Cleanup on unmount
    return () => {
      bitrix24Service.destroy();
    };
  }, [autoInitialize]);

  // Handle installation mode
  useEffect(() => {
    if (isAvailable && bitrix24Service.getInstance()?.isInstallMode) {
      // App is in installation mode - you might want to show installation UI
      console.log('App is in installation mode');
    }
  }, [isAvailable]);

  const contextValue: Bitrix24ContextType = {
    isAvailable,
    isInitialized,
    isInBitrix24,
    currentUser,
    error,
    initialize,
    syncTransactionsToCRM,
    getDealsFromCRM,
    calculateCommissionFromCRM,
    showNotification,
    closeApp,
    installFinish,
    getInstance
  };

  return (
    <Bitrix24Context.Provider value={contextValue}>
      {children}
    </Bitrix24Context.Provider>
  );
};

export const useBitrix24 = (): Bitrix24ContextType => {
  const context = useContext(Bitrix24Context);
  if (!context) {
    throw new Error('useBitrix24 must be used within a Bitrix24Provider');
  }
  return context;
};

export default Bitrix24Context; 