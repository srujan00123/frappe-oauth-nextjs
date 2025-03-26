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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrappeProvider = void 0;
exports.default = Frappe;
// Export the Frappe provider for NextAuth.js
const frappe_1 = require("./providers/frappe");
Object.defineProperty(exports, "FrappeProvider", { enumerable: true, get: function () { return frappe_1.FrappeProvider; } });
// Re-export types for consumers
__exportStar(require("./types"), exports);
// Export default as a function that returns the Frappe provider
function Frappe(options) {
    return (0, frappe_1.FrappeProvider)(options);
}
