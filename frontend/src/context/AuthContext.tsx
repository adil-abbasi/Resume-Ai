import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PlanType, SocialProvider, SubscriptionInfo, PlanFeatures } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isPro: boolean;
  isProMax: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, pass: string, confirmPass?: string) => Promise<{ success: boolean; error?: string }>;
  socialLogin: (provider: SocialProvider, email?: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; resetToken?: string; error?: string }>;
  resetPassword: (token: string, newPass: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  upgradePlan: (plan?: 'pro' | 'pro_max', billingCycle?: 'monthly' | 'yearly') => Promise<{ success: boolean; subscription?: SubscriptionInfo; error?: string }>;
  upgradeToPro: (billingCycle?: 'monthly' | 'yearly') => Promise<{ success: boolean; subscription?: SubscriptionInfo; error?: string }>;
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>;
  toggleFavoriteTemplate: (templateId: string) => Promise<void>;
  isTemplateFavorite: (templateId: string) => boolean;
  
  // UI Modal triggers
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup' | 'forgot' | 'reset';
  setAuthModalMode: (mode: 'signin' | 'signup' | 'forgot' | 'reset') => void;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  
  isPricingModalOpen: boolean;
  setIsPricingModalOpen: (open: boolean) => void;
  openPricingModal: () => void;
  
  isRewardedAdModalOpen: boolean;
  setIsRewardedAdModalOpen: (open: boolean) => void;
  openRewardedAdModal: (onComplete: () => void) => void;
  adCompleteCallback: (() => void) | null;
  completeRewardedAd: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'careerai_auth_token';
const USER_KEY = 'careerai_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    // Default demo user
    return {
      id: 'user-demo-free',
      name: 'Free Candidate',
      email: 'free@careerai.io',
      plan: 'free',
      provider: 'local',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      resumes_count: 1,
      ai_rewrites_used: 2,
      favorite_templates: ['modern', 'ats_clean']
    };
  });
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isRewardedAdModalOpen, setIsRewardedAdModalOpen] = useState(false);
  const [adCompleteCallback, setAdCompleteCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const isAuthenticated = Boolean(user && user.id !== 'unregistered');
  const isPro = user?.plan === 'pro' || user?.plan === 'pro_max';
  const isProMax = user?.plan === 'pro_max';

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiService.login(email, pass);
      setToken(res.access_token);
      setUser(res.user);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed. Please check your credentials.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, pass: string, confirmPass?: string) => {
    setIsLoading(true);
    try {
      const res = await apiService.signup(name, email, pass, confirmPass);
      setToken(res.access_token);
      setUser(res.user);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign up failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (provider: SocialProvider, email?: string, name?: string) => {
    setIsLoading(true);
    try {
      const res = await apiService.socialLogin(provider, email, name);
      setToken(res.access_token);
      setUser(res.user);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || `Social login with ${provider} failed.` };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await apiService.forgotPassword(email);
      return { success: true, message: res.message, resetToken: res.reset_token };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to request password reset.' };
    }
  };

  const resetPassword = async (tkn: string, newPass: string) => {
    try {
      const res = await apiService.resetPassword(tkn, newPass);
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset failed.' };
    }
  };

  const upgradePlan = async (targetPlan: 'pro' | 'pro_max' = 'pro', billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    try {
      const sub = await apiService.upgradePlan(targetPlan, billingCycle, token || undefined);
      if (user) {
        const updated: User = { ...user, plan: targetPlan };
        setUser(updated);
      }
      setIsPricingModalOpen(false);
      return { success: true, subscription: sub };
    } catch (err: any) {
      return { success: false, error: err.message || 'Upgrade failed.' };
    }
  };

  const upgradeToPro = async (billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    return upgradePlan('pro', billingCycle);
  };

  const cancelSubscription = async () => {
    try {
      await apiService.cancelSubscription(token || undefined);
      if (user) {
        setUser({ ...user, plan: 'free' });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Cancellation failed.' };
    }
  };

  const toggleFavoriteTemplate = async (templateId: string) => {
    if (!user) return;
    const currentFavs = user.favorite_templates || [];
    const isFav = currentFavs.includes(templateId);
    const newFavs = isFav ? currentFavs.filter(id => id !== templateId) : [...currentFavs, templateId];
    setUser({ ...user, favorite_templates: newFavs });

    try {
      await apiService.toggleFavoriteTemplate(templateId, token || undefined);
    } catch {
      // already updated optimistically
    }
  };

  const isTemplateFavorite = (templateId: string) => {
    return Boolean(user?.favorite_templates?.includes(templateId));
  };

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const openPricingModal = () => {
    setIsPricingModalOpen(true);
  };

  const openRewardedAdModal = (onComplete: () => void) => {
    setAdCompleteCallback(() => onComplete);
    setIsRewardedAdModalOpen(true);
  };

  const completeRewardedAd = () => {
    setIsRewardedAdModalOpen(false);
    if (adCompleteCallback) {
      const callback = adCompleteCallback;
      setAdCompleteCallback(null);
      // Small timeout so the modal animation finishes smoothly before trigger
      setTimeout(() => {
        callback();
      }, 250);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isPro,
        isProMax,
        isLoading,
        login,
        signup,
        socialLogin,
        logout,
        forgotPassword,
        resetPassword,
        upgradePlan,
        upgradeToPro,
        cancelSubscription,
        toggleFavoriteTemplate,
        isTemplateFavorite,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        isPricingModalOpen,
        setIsPricingModalOpen,
        openPricingModal,
        isRewardedAdModalOpen,
        setIsRewardedAdModalOpen,
        openRewardedAdModal,
        adCompleteCallback,
        completeRewardedAd,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
