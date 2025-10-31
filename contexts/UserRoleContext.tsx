import React, { createContext, useContext, useEffect, useState } from 'react';
import { performanceDashboardService, RoleInfo } from '@/services/performanceDashboardService';
import { useAuth } from './AuthContext';

interface UserRoleContextType {
  roleInfo: RoleInfo | null;
  isLoading: boolean;
  hasChapterAccess: boolean;
  refetchRoleInfo: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};

export const UserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [roleInfo, setRoleInfo] = useState<RoleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoleInfo = async () => {
    if (!isAuthenticated || user?.role === 'admin') {
      // Admins don't need role info, or user is not authenticated
      setRoleInfo(null);
      return;
    }

    try {
      setIsLoading(true);
      const data = await performanceDashboardService.getUserRoleInfo();
      setRoleInfo(data);
    } catch (error) {
      console.error('Error fetching user role info:', error);
      setRoleInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRoleInfo();
    } else {
      setRoleInfo(null);
    }
  }, [isAuthenticated, user?.id]);

  // Determine if user has chapter access
  const hasChapterAccess = Boolean(
    user?.role === 'admin' || // Admin always has access
    user?.member?.chapterId || // User has direct chapter association
    user?.member?.chapter || // User has chapter object
    (roleInfo?.accessScope && roleInfo.accessScope.length > 0) // User has access scope from role info
  );

  const value: UserRoleContextType = {
    roleInfo,
    isLoading,
    hasChapterAccess,
    refetchRoleInfo: fetchRoleInfo,
  };

  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
};
