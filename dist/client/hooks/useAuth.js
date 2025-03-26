"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = useAuth;
const react_1 = require("react");
const AuthContext_1 = require("../context/AuthContext");
/**
 * Hook to access the authentication context
 *
 * @returns Authentication context value
 */
function useAuth() {
    return (0, react_1.useContext)(AuthContext_1.AuthContext);
}
