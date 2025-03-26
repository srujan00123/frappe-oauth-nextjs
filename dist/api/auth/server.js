"use strict";
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
exports.getServerInfo = getServerInfo;
const server_1 = require("next/server");
/**
 * Get OAuth server information
 */
function getServerInfo(request, config) {
    return __awaiter(this, void 0, void 0, function* () {
        // Return basic server information
        return server_1.NextResponse.json({
            serverUrl: config.serverUrl,
            authorizationEndpoint: config.authorizationEndpoint || `${config.serverUrl}/oauth/authorize`,
            tokenEndpoint: config.tokenEndpoint || `${config.serverUrl}/oauth/token`,
            userInfoEndpoint: config.userInfoEndpoint || `${config.serverUrl}/api/method/frappe.integrations.oauth2.openid_profile`
        }, { status: 200 });
    });
}
