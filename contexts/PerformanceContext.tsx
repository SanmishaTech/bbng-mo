import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { performanceDashboardService, type RoleInfo } from '@/services/performanceDashboardService';

interface PerformanceContextType {
  roleInfo: RoleInfo | null;
  loading: boolean;
  error: string | null;
  refreshRoleInfo: () => Promise<void>;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [roleInfo, setRoleInfo] = useState<RoleInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoleInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await performanceDashboardService.getUserRoleInfo();
      setRoleInfo(data);
    } catch (err: any) {
      console.error('Error loading role info:', err);
      
      // Handle different error types
      if (err?.status === 401) {
        console.warn('PerformanceContext: Authentication required - user needs to log in');
        setError('Authentication required. Please log in again.');
      } else if (err?.status === 404) {
        // Don't set error for 404 - just means feature is not available yet
        console.log('PerformanceContext: Performance dashboard API not available (404)');
      } else {
        setError(err?.message || 'Failed to load role information');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshRoleInfo = async () => {
    await loadRoleInfo();
  };

  useEffect(() => {
    loadRoleInfo();
  }, []);

  return (
    <PerformanceContext.Provider value={{ roleInfo, loading, error, refreshRoleInfo }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}
