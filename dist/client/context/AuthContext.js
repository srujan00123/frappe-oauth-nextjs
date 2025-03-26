"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.AuthContext = void 0;
exports.AuthProvider = AuthProvider;
const react_1 = __importStar(require("react"));
const defaultContext = {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    login: () => { },
    logout: () => __awaiter(void 0, void 0, void 0, function* () { }),
    refreshToken: () => __awaiter(void 0, void 0, void 0, function* () { return false; })
};
exports.AuthContext = (0, react_1.createContext)(defaultContext);
const useAuth = () => (0, react_1.useContext)(exports.AuthContext);
exports.useAuth = useAuth;
function AuthProvider({ children, serverUrl = '/api/auth' }) {
    const [isAuthenticated, setIsAuthenticated] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [user, setUser] = (0, react_1.useState)(null);
    // Check authentication status on mount
    (0, react_1.useEffect)(() => {
        checkAuth();
    }, []);
    // Check if the user is authenticated
    function checkAuth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                setIsLoading(true);
                const response = yield fetch(`${serverUrl}/check`);
                if (response.ok) {
                    const data = yield response.json();
                    setIsAuthenticated(data.authenticated);
                    if (data.user) {
                        setUser(data.user);
                    }
                }
                else {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            }
            catch (error) {
                console.error('Auth check error:', error);
                setIsAuthenticated(false);
                setUser(null);
            }
            finally {
                setIsLoading(false);
            }
        });
    }
    // Redirect to login page
    function login() {
        window.location.href = `${serverUrl}/login`;
    }
    // Logout the user
    function logout() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fetch(`${serverUrl}/logout`, { method: 'POST' });
                setIsAuthenticated(false);
                setUser(null);
            }
            catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
    // Refresh the token
    function refreshToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${serverUrl}/refresh`, { method: 'POST' });
                if (response.ok) {
                    return true;
                }
                // If refresh failed, mark as not authenticated
                setIsAuthenticated(false);
                setUser(null);
                return false;
            }
            catch (error) {
                console.error('Token refresh error:', error);
                setIsAuthenticated(false);
                setUser(null);
                return false;
            }
        });
    }
    const value = {
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        refreshToken
    };
    return (react_1.default.createElement(exports.AuthContext.Provider, { value: value }, children));
}
