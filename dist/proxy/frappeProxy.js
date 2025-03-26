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
exports.proxyToFrappeApi = proxyToFrappeApi;
exports.createFrappeApiProxy = createFrappeApiProxy;
const session_1 = require("../session");
/**
 * Proxy a request to the Frappe API
 *
 * @param req Next.js API request
 * @param res Next.js API response
 * @param config Frappe OAuth configuration
 * @param path API path to proxy to
 * @param options Proxy options
 */
function proxyToFrappeApi(req_1, res_1, config_1, path_1) {
    return __awaiter(this, arguments, void 0, function* (req, res, config, path, options = {}) {
        const { baseUrl = config.baseUrl, headers = {}, requireAuth = true } = options;
        try {
            // Check authentication if required
            if (requireAuth) {
                const session = yield (0, session_1.checkSession)({ req, res }, config);
                if (!session) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                // Add authorization header with the access token
                headers['Authorization'] = `Bearer ${session.tokenSet.access_token}`;
            }
            // Construct the full URL
            const url = `${baseUrl}${path}`;
            // Get the request method
            const method = req.method || 'GET';
            // Create fetch options
            const fetchOptions = {
                method,
                headers: Object.assign(Object.assign({}, headers), { 'Content-Type': req.headers['content-type'] || 'application/json' })
            };
            // Add body for non-GET requests
            if (method !== 'GET' && method !== 'HEAD') {
                // Parse the body based on content type
                const contentType = req.headers['content-type'];
                if (contentType === null || contentType === void 0 ? void 0 : contentType.includes('application/json')) {
                    fetchOptions.body = JSON.stringify(req.body);
                }
                else if (contentType === null || contentType === void 0 ? void 0 : contentType.includes('application/x-www-form-urlencoded')) {
                    const formBody = new URLSearchParams();
                    Object.entries(req.body).forEach(([key, value]) => {
                        formBody.append(key, value);
                    });
                    fetchOptions.body = formBody;
                }
                else {
                    fetchOptions.body = JSON.stringify(req.body);
                }
            }
            // Make the request to the Frappe API
            const response = yield fetch(url, fetchOptions);
            // Get the response data
            const data = yield response.json().catch(() => ({}));
            // Set the response status code
            res.status(response.status);
            // Forward the response headers
            Object.entries(response.headers).forEach(([key, value]) => {
                if (value) {
                    res.setHeader(key, value);
                }
            });
            // Send the response data
            return res.json(data);
        }
        catch (error) {
            console.error('API proxy error:', error);
            return res.status(500).json({ error: 'Failed to proxy request to Frappe API' });
        }
    });
}
/**
 * Create a proxy handler with pre-configured options
 *
 * @param config Frappe OAuth configuration
 * @param defaultOptions Default proxy options
 * @returns Proxy handler function
 */
function createFrappeApiProxy(config, defaultOptions = {}) {
    return (req_1, res_1, path_1, ...args_1) => __awaiter(this, [req_1, res_1, path_1, ...args_1], void 0, function* (req, res, path, options = {}) {
        return proxyToFrappeApi(req, res, config, path, Object.assign(Object.assign({}, defaultOptions), options));
    });
}
