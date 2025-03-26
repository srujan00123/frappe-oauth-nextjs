import React, { ReactNode } from 'react';
import { FrappeUserInfo } from '../../types';
export interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: FrappeUserInfo | null;
    login: () => void;
    logout: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
}
export declare const AuthContext: React.Context<AuthContextType>;
export declare const useAuth: () => AuthContextType;
interface AuthProviderProps {
    children: ReactNode;
    serverUrl?: string;
}
export declare function AuthProvider({ children, serverUrl }: AuthProviderProps): React.JSX.Element;
export {};
