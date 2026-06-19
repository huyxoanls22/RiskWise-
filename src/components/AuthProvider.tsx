import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  licenseKey?: string;
}

interface AuthContextType {
  user: User | null;
  isPremium: boolean;
  login: (email: string, name: string, licenseKey?: string) => void;
  logout: () => void;
  togglePremium: (status: boolean) => void;
  premiumExpiry: string;
  setPremiumExpiryDate: (expiry: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const email = localStorage.getItem('trading_license_email');
      const name = localStorage.getItem('trading_license_name') || 'Pro Trader';
      const licenseKey = localStorage.getItem('trading_license_key') || undefined;
      if (email) {
        return { name, email, licenseKey };
      }
    } catch (e) {
      console.error('Error loading default auth user', e);
    }
    return null;
  });

  const [isPremium, setIsPremium] = useState<boolean>(() => {
    try {
      const persisted = localStorage.getItem('trading_is_premium');
      return persisted === 'true';
    } catch {
      return false;
    }
  });

  const [premiumExpiry, setPremiumExpiry] = useState<string>(() => {
    try {
      const cachedExpiry = localStorage.getItem('trading_license_expiry_str');
      if (cachedExpiry) {
        return new Date(cachedExpiry).toLocaleDateString('vi-VN');
      }
    } catch {}
    return "Hạn dùng: Vô hạn (Trọn đời)";
  });

  // Keep isPremium synced to localStorage
  useEffect(() => {
    localStorage.setItem('trading_is_premium', String(isPremium));
  }, [isPremium]);

  const login = (email: string, name: string, licenseKey?: string) => {
    const newUser = { email, name, licenseKey };
    setUser(newUser);
    localStorage.setItem('trading_license_email', email);
    localStorage.setItem('trading_license_name', name);
    if (licenseKey) {
      localStorage.setItem('trading_license_key', licenseKey);
    }
    setIsPremium(true);
  };

  const logout = () => {
    setUser(null);
    setIsPremium(false);
    localStorage.removeItem('trading_license_email');
    localStorage.removeItem('trading_license_name');
    localStorage.removeItem('trading_license_key');
    localStorage.removeItem('trading_license_expiry_str');
  };

  const togglePremium = (status: boolean) => {
    setIsPremium(status);
  };

  const setPremiumExpiryDate = (expiry: string) => {
    setPremiumExpiry(expiry);
    localStorage.setItem('trading_license_expiry_str', expiry);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isPremium,
      login,
      logout,
      togglePremium,
      premiumExpiry,
      setPremiumExpiryDate
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
