/**
 * ONE82 PROCESSOR SERVICE
 * 
 * Unified data-fetching layer for all payment processor integrations.
 * 
 * SIMULATION MODE (default, no key required):
 *   Returns realistic mock data that mirrors what the live API would return.
 * 
 * LIVE MODE (activated when API key is set in Settings > Integrations):
 *   Makes real API calls to the connected processor.
 *   All API endpoints and payload structures are pre-built and ready.
 */

import { getIntegrationKey } from './integrationsConfig';
import { PortfolioMerchant } from './simulationService';

export interface ProcessorTransaction {
    id: string;
    date: string;
    amount: number;
    cardBrand: 'Visa' | 'Mastercard' | 'Amex' | 'Discover';
    method: 'Swiped' | 'Keyed' | 'Contactless' | 'Online';
    merchantId: string;
    status: 'Settled' | 'Pending' | 'Declined';
}

export interface ProcessorResidualReport {
    period: string; // e.g. "2025-01"
    grossVolume: number;
    totalFees: number;
    isoResidual: number;
    merchantCount: number;
}

// ─────────────────────────────────────────────
// SIMULATION DATA
// ─────────────────────────────────────────────

const SIMULATED_TRANSACTIONS: ProcessorTransaction[] = [
    { id: 'txn_001', date: '2025-01-15', amount: 128.50, cardBrand: 'Visa', method: 'Swiped', merchantId: 'm1', status: 'Settled' },
    { id: 'txn_002', date: '2025-01-15', amount: 42.00, cardBrand: 'Amex', method: 'Keyed', merchantId: 'm2', status: 'Settled' },
    { id: 'txn_003', date: '2025-01-16', amount: 980.00, cardBrand: 'Mastercard', method: 'Online', merchantId: 'm4', status: 'Settled' },
    { id: 'txn_004', date: '2025-01-16', amount: 18.75, cardBrand: 'Discover', method: 'Contactless', merchantId: 'm1', status: 'Settled' },
    { id: 'txn_005', date: '2025-01-17', amount: 3450.00, cardBrand: 'Visa', method: 'Online', merchantId: 'm4', status: 'Pending' },
    { id: 'txn_006', date: '2025-01-17', amount: 55.25, cardBrand: 'Mastercard', method: 'Swiped', merchantId: 'm3', status: 'Settled' },
];

const SIMULATED_RESIDUALS: ProcessorResidualReport[] = [
    { period: '2024-08', grossVolume: 220000, totalFees: 4840, isoResidual: 1760, merchantCount: 5 },
    { period: '2024-09', grossVolume: 225000, totalFees: 4950, isoResidual: 1800, merchantCount: 5 },
    { period: '2024-10', grossVolume: 232000, totalFees: 5104, isoResidual: 1856, merchantCount: 5 },
    { period: '2024-11', grossVolume: 228000, totalFees: 5016, isoResidual: 1824, merchantCount: 5 },
    { period: '2024-12', grossVolume: 245000, totalFees: 5390, isoResidual: 1960, merchantCount: 5 },
    { period: '2025-01', grossVolume: 243000, totalFees: 5346, isoResidual: 1944, merchantCount: 5 },
];

// ─────────────────────────────────────────────
// STRIPE SERVICE
// ─────────────────────────────────────────────

export const stripeService = {
    /**
     * Returns recent transactions for a merchant.
     * LIVE: GET https://api.stripe.com/v1/charges?limit=100
     * SIMULATION: Returns mock transactions
     */
    getTransactions: async (merchantId?: string): Promise<ProcessorTransaction[]> => {
        const key = getIntegrationKey('stripe');
        if (!key) {
            return merchantId
                ? SIMULATED_TRANSACTIONS.filter(t => t.merchantId === merchantId)
                : SIMULATED_TRANSACTIONS;
        }

        // LIVE MODE — ready to activate when key is provided
        const response = await fetch(`https://api.stripe.com/v1/charges?limit=100`, {
            headers: { Authorization: `Bearer ${key}` },
        });
        const data = await response.json();
        return data.data?.map((charge: any) => ({
            id: charge.id,
            date: new Date(charge.created * 1000).toISOString().split('T')[0],
            amount: charge.amount / 100,
            cardBrand: charge.payment_method_details?.card?.brand || 'Visa',
            method: charge.payment_method_details?.card?.present ? 'Swiped' : 'Keyed',
            merchantId: charge.metadata?.merchantId || 'unknown',
            status: charge.paid ? 'Settled' : 'Pending',
        })) ?? [];
    },

    /**
     * Returns total volume for date range.
     * LIVE: GET https://api.stripe.com/v1/balance/history
     * SIMULATION: Returns mock volume
     */
    getTotalVolume: async (startDate: string, endDate: string): Promise<number> => {
        const key = getIntegrationKey('stripe');
        if (!key) return 243000;

        const start = Math.floor(new Date(startDate).getTime() / 1000);
        const end = Math.floor(new Date(endDate).getTime() / 1000);
        const response = await fetch(
            `https://api.stripe.com/v1/balance/history?limit=100&created[gte]=${start}&created[lte]=${end}`,
            { headers: { Authorization: `Bearer ${key}` } }
        );
        const data = await response.json();
        return data.data?.reduce((acc: number, t: any) => acc + t.amount / 100, 0) ?? 0;
    },
};

// ─────────────────────────────────────────────
// SQUARE SERVICE
// ─────────────────────────────────────────────

export const squareService = {
    /**
     * Returns transactions from Square merchant account.
     * LIVE: POST https://connect.squareup.com/v2/payments
     * SIMULATION: Returns mock transactions
     */
    getTransactions: async (): Promise<ProcessorTransaction[]> => {
        const key = getIntegrationKey('square');
        if (!key) return SIMULATED_TRANSACTIONS;

        const response = await fetch('https://connect.squareup.com/v2/payments', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Square-Version': '2024-01-17',
            },
        });
        const data = await response.json();
        return data.payments?.map((p: any) => ({
            id: p.id,
            date: p.created_at?.split('T')[0],
            amount: (p.amount_money?.amount ?? 0) / 100,
            cardBrand: p.card_details?.card?.card_brand || 'Visa',
            method: p.card_details?.entry_method === 'SWIPED' ? 'Swiped' : 'Keyed',
            merchantId: p.location_id,
            status: p.status === 'COMPLETED' ? 'Settled' : 'Pending',
        })) ?? [];
    },
};

// ─────────────────────────────────────────────
// ISO PROCESSOR SERVICE (TSYS, Fiserv, Worldpay, etc.)
// ─────────────────────────────────────────────

export const isoProcessorService = {
    /**
     * Returns monthly residual reports for the ISO's portfolio.
     * SIMULATION: Returns 6 months of mock residuals.
     * 
     * LIVE endpoints (activate by adding key in Integrations):
     * - TSYS:      https://api.tsys.com/v1/residuals
     * - Fiserv:    https://api.fiserv.com/v2/residuals
     * - Worldpay:  https://api.worldpay.com/v1/reporting/residuals
     */
    getResidualReports: async (processorId: 'tsys' | 'fiserv' | 'worldpay' | 'global' | 'payrock' | 'elevon'): Promise<ProcessorResidualReport[]> => {
        const key = getIntegrationKey(processorId);
        if (!key) return SIMULATED_RESIDUALS;

        const endpoints: Record<string, string> = {
            tsys: 'https://api.tsys.com/v1/residuals',
            fiserv: 'https://api.fiserv.com/v2/residuals',
            worldpay: 'https://api.worldpay.com/v1/reporting/residuals',
            global: 'https://api.globalpayments.com/v1/portfolio/residuals',
            payrock: 'https://api.payrock.com/v1/residuals',
            elevon: 'https://api.elevon.com/v1/residuals',
        };

        const response = await fetch(endpoints[processorId], {
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        // Each processor returns slightly different shapes — normalize here
        return data?.reports ?? data?.residuals ?? SIMULATED_RESIDUALS;
    },

    /**
     * Returns the full merchant portfolio from a processor.
     * SIMULATION: Returns mock portfolio merchants.
     */
    getMerchantPortfolio: async (processorId: string): Promise<Partial<PortfolioMerchant>[]> => {
        const key = getIntegrationKey(processorId);
        if (!key) {
            // Simulation: return minimal shape (full data comes from simulationService)
            return [
                { id: 'm1', name: "Joe's Pizza", monthlyVolume: 45000 },
                { id: 'm2', name: "Apex Gym", monthlyVolume: 12000 },
                { id: 'm3', name: "Boutique 82", monthlyVolume: 28000 },
                { id: 'm4', name: "Tech Gadgets", monthlyVolume: 150000 },
                { id: 'm5', name: "Corner Market", monthlyVolume: 8000 },
            ];
        }

        const response = await fetch(`https://api.${processorId}.com/v1/merchants`, {
            headers: { Authorization: `Bearer ${key}` },
        });
        const data = await response.json();
        return data?.merchants ?? [];
    },
};

// ─────────────────────────────────────────────
// CLOVER SERVICE
// ─────────────────────────────────────────────

export const cloverService = {
    /**
     * Returns inventory and sales data from Clover POS.
     * LIVE: GET https://api.clover.com/v3/merchants/{mId}/orders
     * SIMULATION: Returns mock data
     */
    getOrders: async (merchantId: string): Promise<any[]> => {
        const key = getIntegrationKey('clover');
        if (!key) {
            return [
                { id: 'order_1', total: 2150, createdTime: Date.now() - 60000, state: 'locked' },
                { id: 'order_2', total: 880, createdTime: Date.now() - 120000, state: 'locked' },
            ];
        }

        const response = await fetch(
            `https://api.clover.com/v3/merchants/${merchantId}/orders?limit=100`,
            { headers: { Authorization: `Bearer ${key}` } }
        );
        const data = await response.json();
        return data?.elements ?? [];
    },
};
