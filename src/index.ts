// Export the Frappe provider for NextAuth.js
import { FrappeProvider } from './providers/frappe';
import type { FrappeProfile, FrappeProviderConfig } from './types';

// Re-export types for consumers
export * from './types';

// Export the Frappe provider
export { FrappeProvider };

// Export default as a function that returns the Frappe provider
export default function Frappe(options: FrappeProviderConfig) {
    return FrappeProvider(options);
} 