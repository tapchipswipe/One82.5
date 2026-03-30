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

const readEnv = (key: string): string | undefined => {
    const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env)
        ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
        : undefined;
    return viteEnv?.[key] ?? process.env[key];
};

export const LIVE_INTEGRATIONS_ENABLED = readEnv('VITE_ENABLE_LIVE_INTEGRATIONS') !== 'false';

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

export interface IntegrationSetupGuide {
    portalLabel: string;
    portalUrl: string;
    credentialLabel: string;
    keyPlaceholder: string;
    keyHint: string;
    setupSteps: string[];
    recommendedStarter?: boolean;
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
        description: 'Enable real AI-powered insights and statement extraction via Google Gemini.',
        category: 'AI',
        keyStorageKey: 'GEMINI_API_KEY',
        docsUrl: 'https://ai.google.dev/',
        logoColor: 'bg-gradient-to-br from-blue-500 to-purple-600',
        logoLetter: 'G',
        sandboxAvailable: false,
    },
];

const DEFAULT_SETUP_GUIDE = (integration: Integration): IntegrationSetupGuide => ({
    portalLabel: `${integration.name} Developer Portal`,
    portalUrl: integration.docsUrl,
    credentialLabel: 'API Key / Access Token',
    keyPlaceholder: `Paste your ${integration.name} API key`,
    keyHint: 'Use a key with read access to transactions/reporting. You can rotate it anytime.',
    setupSteps: [
        `Open ${integration.name} developer settings`,
        'Create or copy a read-enabled API credential',
        'Paste it below and click Save & Connect'
    ]
});

const INTEGRATION_SETUP_GUIDES: Record<string, IntegrationSetupGuide> = {
    stripe: {
        portalLabel: 'Stripe Dashboard API Keys',
        portalUrl: 'https://dashboard.stripe.com/apikeys',
        credentialLabel: 'Secret API Key',
        keyPlaceholder: 'sk_live_... or sk_test_...',
        keyHint: 'Use a Secret Key (starts with sk_). Publishable keys (pk_) cannot sync transactions.',
        setupSteps: [
            'Open Stripe Dashboard -> Developers -> API keys',
            'Reveal or create a Secret key with charges read access',
            'Paste the Secret key below and Save & Connect'
        ],
        recommendedStarter: true
    },
    square: {
        portalLabel: 'Square Developer Dashboard',
        portalUrl: 'https://developer.squareup.com/apps',
        credentialLabel: 'Access Token',
        keyPlaceholder: 'sq0atp-... or EAAA...',
        keyHint: 'Use a production or sandbox access token from your Square app credentials.',
        setupSteps: [
            'Open your Square app in the Developer Dashboard',
            'Copy the access token from Credentials',
            'Paste it below and Save & Connect'
        ]
    },
    clover: {
        portalLabel: 'Clover Developer Portal',
        portalUrl: 'https://docs.clover.com/dev/docs/authentication-and-app-tokens',
        credentialLabel: 'API Token',
        keyPlaceholder: 'Clover access token',
        keyHint: 'Create an app token with order/reporting permissions for your merchant account.',
        setupSteps: [
            'Open Clover developer authentication settings',
            'Generate or copy an app access token',
            'Paste the token below and Save & Connect'
        ]
    },
    tsys: {
        portalLabel: 'TSYS Developer Portal',
        portalUrl: 'https://developers.tsys.com/',
        credentialLabel: 'API Token',
        keyPlaceholder: 'TSYS token',
        keyHint: 'Use a token provisioned for reporting/residual endpoints for your ISO account.',
        setupSteps: [
            'Sign in to TSYS developer tools',
            'Create or request reporting API credentials',
            'Paste the token below and Save & Connect'
        ]
    },
    fiserv: {
        portalLabel: 'Fiserv Developer Portal',
        portalUrl: 'https://developer.fiserv.com/',
        credentialLabel: 'API Token',
        keyPlaceholder: 'Fiserv token',
        keyHint: 'Use a credential with portfolio and residual report read access.',
        setupSteps: [
            'Open Fiserv developer credentials',
            'Generate a reporting-enabled API token',
            'Paste the token below and Save & Connect'
        ]
    },
    worldpay: {
        portalLabel: 'Worldpay Developer Portal',
        portalUrl: 'https://developer.worldpay.com/',
        credentialLabel: 'API Token',
        keyPlaceholder: 'Worldpay token',
        keyHint: 'Use a token that can access reporting/residual endpoints.',
        setupSteps: [
            'Open Worldpay developer account settings',
            'Create or copy your API token',
            'Paste it below and Save & Connect'
        ]
    },
    global: {
        portalLabel: 'Global Payments Developer Portal',
        portalUrl: 'https://developer.globalpayments.com/',
        credentialLabel: 'API Token',
        keyPlaceholder: 'Global Payments token',
        keyHint: 'Use credentials scoped for portfolio reporting.',
        setupSteps: [
            'Open Global Payments API credentials',
            'Create a read-enabled key/token',
            'Paste it below and Save & Connect'
        ]
    },
    payrock: {
        portalLabel: 'Paymentech / Payrock Portal',
        portalUrl: 'https://www.jpmorgan.com/merchant-services',
        credentialLabel: 'API Token',
        keyPlaceholder: 'Payrock token',
        keyHint: 'Use portfolio-reporting credentials provided by your processor contact.',
        setupSteps: [
            'Open your Payrock/JPMorgan merchant services portal',
            'Locate API credentials for reporting access',
            'Paste the token below and Save & Connect'
        ]
    },
    elevon: {
        portalLabel: 'Elevon Portal',
        portalUrl: 'https://www.elevon.com/',
        credentialLabel: 'API Token',
        keyPlaceholder: 'Elevon token',
        keyHint: 'Use a token granted for merchant and residual reporting access.',
        setupSteps: [
            'Open your Elevon account API settings',
            'Generate or copy reporting credentials',
            'Paste the token below and Save & Connect'
        ]
    },
    gemini: {
        portalLabel: 'Google AI Studio API Keys',
        portalUrl: 'https://aistudio.google.com/app/apikey',
        credentialLabel: 'Gemini API Key',
        keyPlaceholder: 'AIza...',
        keyHint: 'Gemini keys usually start with AIza and are generated from Google AI Studio.',
        setupSteps: [
            'Open Google AI Studio API key page',
            'Create or copy an API key',
            'Paste it below and Save & Connect'
        ]
    }
};

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

export const getIntegrationSetupGuide = (id: string): IntegrationSetupGuide => {
    const integration = INTEGRATIONS.find(i => i.id === id);
    if (!integration) {
        return {
            portalLabel: 'Developer Portal',
            portalUrl: '#',
            credentialLabel: 'API Key / Access Token',
            keyPlaceholder: 'Paste API key',
            keyHint: 'Use a read-enabled API credential.',
            setupSteps: ['Create an API credential', 'Paste it below', 'Save and connect']
        };
    }
    return INTEGRATION_SETUP_GUIDES[id] || DEFAULT_SETUP_GUIDE(integration);
};

export const validateIntegrationCredential = (id: string, value: string): string | null => {
    const key = value.trim();
    if (!key) return 'Paste a credential before saving.';
    if (/\s/.test(key)) return 'Credentials cannot contain spaces. Copy and paste the full token exactly.';
    if (key.length < 8) return 'Credential looks too short. Double-check and paste the full value.';

    if (id === 'stripe' && key.startsWith('pk_')) {
        return 'This looks like a Stripe publishable key (pk_). Use a secret key that starts with sk_.';
    }

    if (id === 'square' && key.startsWith('sq0idp-')) {
        return 'This looks like a Square application ID. Use an access token (often sq0atp- or EAAA...).';
    }

    if (id === 'gemini' && !key.startsWith('AIza')) {
        return 'Gemini API keys usually start with AIza. Verify you copied the API key (not project ID).';
    }

    return null;
};
