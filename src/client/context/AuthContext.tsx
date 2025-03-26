import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FrappeUserInfo } from '../../types';

export interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: FrappeUserInfo | null;
    login: () => void;
    logout: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
}

const defaultContext: AuthContextType = {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    login: () => { },
    logout: async () => { },
    refreshToken: async () => false
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
    serverUrl?: string;
}

export function AuthProvider({ children, serverUrl = '/api/auth' }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<FrappeUserInfo | null>(null);

    // Check authentication status on mount
    useEffect(() => {
        checkAuth();
    }, []);

    // Check if the user is authenticated
    async function checkAuth() {
        try {
            setIsLoading(true);
            const response = await fetch(`${serverUrl}/check`);

            if (response.ok) {
                const data = await response.json();
                setIsAuthenticated(data.authenticated);

                if (data.user) {
                    setUser(data.user);
                }
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }

    // Redirect to login page
    function login() {
        window.location.href = `${serverUrl}/login`;
    }

    // Logout the user
    async function logout() {
        try {
            await fetch(`${serverUrl}/logout`, { method: 'POST' });
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Refresh the token
    async function refreshToken(): Promise<boolean> {
        try {
            const response = await fetch(`${serverUrl}/refresh`, { method: 'POST' });

            if (response.ok) {
                return true;
            }

            // If refresh failed, mark as not authenticated
            setIsAuthenticated(false);
            setUser(null);
            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            setIsAuthenticated(false);
            setUser(null);
            return false;
        }
    }

    const value: AuthContextType = {
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        refreshToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
} 