/**
 * ONE82 INTEGRATION CONFIG
 * 
 * Central registry of all supported payment processor + POS integrations.
 * 
 * HOW IT WORKS:
 * - Each integration has a `keyStorageKey` — the localStorage key where the API key is stored.
 * - When a key is present, the corresponding service will switch from SIMULATION → LIVE mode.
 * - When no key is present, all data is simulated — the app works perfectly out of the box.
 * 
 * TO ACTIVATE AN INTEGRATION:
 * - Go to the Integrations page and paste your API key.
 * - The service layer will automatically detect the key and use live data.
 */

export type IntegrationCategory = 'POS & Payment' | 'ISO Processor' | 'AI';

export interface Integration {
    id: string;
    name: string;
    description: string;
    category: IntegrationCategory;
    keyStorageKey: string;
    docsUrl: string;
    logoColor: string; // Tailwind bg color class
    logoLetter: string;
    sandboxAvailable: boolean;
}

export const INTEGRATIONS: Integration[] = [
    // === POS & Payment ===
    {
        id: 'stripe',
        name: 'Stripe',
        description: 'Pull live transaction data, customer spend patterns, and payment volume from Stripe accounts.',
        category: 'POS & Payment',
        keyStorageKey: 'ONE82_STRIPE_KEY',
        docsUrl: 'https://stripe.com/docs/api',
        logoColor: 'bg-violet-600',
        logoLetter: 'S',
        sandboxAvailable: true,
    },
    {
        id: 'square',
        name: 'Square',
        description: 'Connect to Square merchant accounts to import transaction history and inventory data.',
        category: 'POS & Payment',
        keyStorageKey: 'ONE82_SQUARE_KEY',
        docsUrl: 'https://developer.squareup.com/docs',
        logoColor: 'bg-black',
        logoLetter: 'Sq',
        sandboxAvailable: true,
    },
    {
        id: 'clover',
        name: 'Clover',
        description: 'Integrate with Clover POS systems to receive real-time sales and inventory feeds.',
        category: 'POS & Payment',
        keyStorageKey: 'ONE82_CLOVER_KEY',
        docsUrl: 'https://docs.clover.com/docs',
        logoColor: 'bg-green-600',
        logoLetter: 'C',
        sandboxAvailable: true,
    },

    // === ISO Processors ===
    {
        id: 'tsys',
        name: 'TSYS',
        description: 'Connect to TSYS TransAct for full merchant portfolio data, residuals, and interchange reporting.',
        category: 'ISO Processor',
        keyStorageKey: 'ONE82_TSYS_KEY',
        docsUrl: 'https://developers.tsys.com/',
        logoColor: 'bg-blue-700',
        logoLetter: 'T',
        sandboxAvailable: false,
    },
    {
        id: 'fiserv',
        name: 'Fiserv',
        description: 'Access Fiserv merchant processing data, portfolio analytics, and residual reports via API.',
        category: 'ISO Processor',
        keyStorageKey: 'ONE82_FISERV_KEY',
        docsUrl: 'https://developer.fiserv.com/',
        logoColor: 'bg-orange-600',
        logoLetter: 'F',
        sandboxAvailable: true,
    },
    {
        id: 'worldpay',
        name: 'Worldpay',
        description: 'Pull transaction volume, chargeback alerts, and merchant health data from Worldpay.',
        category: 'ISO Processor',
        keyStorageKey: 'ONE82_WORLDPAY_KEY',
        docsUrl: 'https://developer.worldpay.com/',
        logoColor: 'bg-red-600',
        logoLetter: 'W',
        sandboxAvailable: true,
    },
    {
        id: 'global',
        name: 'Global Payments',
        description: 'Connect to Global Payments for multi-merchant portfolio management and live volume data.',
        category: 'ISO Processor',
        keyStorageKey: 'ONE82_GLOBAL_KEY',
        docsUrl: 'https://developer.globalpayments.com/',
        logoColor: 'bg-sky-700',
        logoLetter: 'G',
        sandboxAvailable: false,
    },
    {
        id: 'payrock',
        name: 'Paymentech / Payrock',
        description: 'Import merchant processing statements and residual data from Payrock portfolio management.',
        category: 'ISO Processor',
        keyStorageKey: 'ONE82_PAYROCK_KEY',
        docsUrl: 'https://www.jpmorgan.com/merchant-services',
        logoColor: 'bg-indigo-800',
        logoLetter: 'P',
        sandboxAvailable: false,
    },
    {
        id: 'elevon',
        name: 'Elevon',
        description: 'Sync Elevon merchant accounts, processing volumes, and portfolio residual reports.',
        category: 'ISO Processor',
        keyStorageKey: 'ONE82_ELEVON_KEY',
        docsUrl: 'https://www.elevon.com/',
        logoColor: 'bg-teal-600',
        logoLetter: 'E',
        sandboxAvailable: false,
    },

    // === AI ===
    {
        id: 'gemini',
        name: 'Gemini AI',
        description: 'Enable real AI-powered insights, statement extraction, and voice assistant via Google Gemini.',
        category: 'AI',
        keyStorageKey: 'GEMINI_API_KEY',
        docsUrl: 'https://ai.google.dev/',
        logoColor: 'bg-gradient-to-br from-blue-500 to-purple-600',
        logoLetter: 'G',
        sandboxAvailable: false,
    },
];

/** Returns the stored API key for an integration, or empty string if not set */
export const getIntegrationKey = (id: string): string => {
    const integration = INTEGRATIONS.find(i => i.id === id);
    if (!integration) return '';
    return localStorage.getItem(integration.keyStorageKey) || '';
};

/** Returns true if an integration has a key configured */
export const isIntegrationConnected = (id: string): boolean => {
    return getIntegrationKey(id).length > 0;
};

/** Save a key for an integration */
export const saveIntegrationKey = (id: string, key: string): void => {
    const integration = INTEGRATIONS.find(i => i.id === id);
    if (!integration) return;
    if (key) {
        localStorage.setItem(integration.keyStorageKey, key);
    } else {
        localStorage.removeItem(integration.keyStorageKey);
    }
};
