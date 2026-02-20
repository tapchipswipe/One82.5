import { Transaction, DailyMetric, BusinessType } from '../types';

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  parameters: {
    priceChangePercent?: number;
    customerChurnPercent?: number;
    newFixedCost?: number;
    marketingSpendIncrease?: number;
  };
}

export interface SimulationResult {
  scenarioId: string;
  projectedRevenue: number;
  projectedProfit: number;
  riskScore: number; // 0-100
  insights: string[];
}

export interface PortfolioMerchant {
  id: string;
  name: string;
  businessType: BusinessType;
  monthlyVolume: number;
  churnRisk: 'Low' | 'Medium' | 'High';
  trend: 'up' | 'down' | 'flat';
  lastTransaction: number;
  bps: number;         // Basis points (e.g., 40 = 0.40%)
  perTxFee: number;    // Per transaction fee (e.g., 0.10)
  status: 'Active' | 'Inactive' | 'Pending';
  mccCode: string;
  mccDescription: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  // Last 6 months of volume for fluctuation chart
  volumeHistory: number[];
}

export const SimulationService = {
  runSimulation: async (scenario: SimulationScenario, historicalData: DailyMetric[]): Promise<SimulationResult> => {
    console.log('Running simulation for:', scenario.name);
    return {
      scenarioId: scenario.id,
      projectedRevenue: 0,
      projectedProfit: 0,
      riskScore: 50,
      insights: ["Simulation engine not yet connected to Gemini API."]
    };
  },

  generatePortfolio: (): PortfolioMerchant[] => {
    return [
      {
        id: 'm1', name: "Joe's Pizza", businessType: 'Restaurant',
        monthlyVolume: 45000, churnRisk: 'High', trend: 'down',
        lastTransaction: Date.now() - 3600000, bps: 45, perTxFee: 0.10, status: 'Active',
        mccCode: '5812', mccDescription: 'Eating Places & Restaurants', riskLevel: 'Medium',
        volumeHistory: [52000, 50000, 48000, 47000, 46000, 45000],
      },
      {
        id: 'm2', name: "Apex Gym", businessType: 'Service',
        monthlyVolume: 12000, churnRisk: 'Low', trend: 'up',
        lastTransaction: Date.now() - 300000, bps: 35, perTxFee: 0.15, status: 'Active',
        mccCode: '7941', mccDescription: 'Sports Clubs & Physical Fitness', riskLevel: 'Low',
        volumeHistory: [9000, 10000, 10500, 11000, 11500, 12000],
      },
      {
        id: 'm3', name: "Boutique 82", businessType: 'Retail',
        monthlyVolume: 28000, churnRisk: 'Medium', trend: 'flat',
        lastTransaction: Date.now() - 86400000, bps: 42, perTxFee: 0.08, status: 'Active',
        mccCode: '5621', mccDescription: "Women's Clothing Stores", riskLevel: 'Low',
        volumeHistory: [27000, 28500, 27500, 29000, 27000, 28000],
      },
      {
        id: 'm4', name: "Tech Gadgets", businessType: 'E-Commerce',
        monthlyVolume: 150000, churnRisk: 'Low', trend: 'up',
        lastTransaction: Date.now() - 60000, bps: 28, perTxFee: 0.25, status: 'Active',
        mccCode: '5734', mccDescription: 'Computer & Software Stores', riskLevel: 'Low',
        volumeHistory: [110000, 120000, 130000, 138000, 145000, 150000],
      },
      {
        id: 'm5', name: "Corner Market", businessType: 'Convenience Store',
        monthlyVolume: 8000, churnRisk: 'High', trend: 'down',
        lastTransaction: Date.now() - 172800000, bps: 55, perTxFee: 0.05, status: 'Active',
        mccCode: '5411', mccDescription: 'Grocery Stores & Supermarkets', riskLevel: 'High',
        volumeHistory: [12000, 11000, 10500, 9500, 8800, 8000],
      },
    ];
  }
};

// ─────────────────────────────────────────────
// SALES REP PROFITABILITY
// ─────────────────────────────────────────────

export interface SalesRep {
  id: string;
  name: string;
  merchantCount: number;
  totalPortfolioVolume: number;  // Total monthly volume across their merchants
  grossResidual: number;         // Total monthly residual earned from their portfolio
  supportCost: number;           // Monthly cost of support/overhead allocated to this rep
  netProfit: number;             // grossResidual - supportCost
  subscriptionFee: number;       // What the ISO charges this rep per month
  trend: 'up' | 'down' | 'flat';
  volumeHistory: number[];       // 6-month residual history
  topMerchant: string;
}

export const generateSalesReps = (): SalesRep[] => [
  {
    id: 'rep1', name: 'Marcus T.', merchantCount: 8,
    totalPortfolioVolume: 320000, grossResidual: 1440, supportCost: 180,
    netProfit: 1260, subscriptionFee: 100, trend: 'up',
    volumeHistory: [1100, 1180, 1240, 1300, 1380, 1440],
    topMerchant: 'Tech Gadgets',
  },
  {
    id: 'rep2', name: 'Sophia R.', merchantCount: 5,
    totalPortfolioVolume: 143000, grossResidual: 644, supportCost: 120,
    netProfit: 524, subscriptionFee: 100, trend: 'up',
    volumeHistory: [490, 510, 555, 580, 620, 644],
    topMerchant: "Joe's Pizza",
  },
  {
    id: 'rep3', name: 'James W.', merchantCount: 3,
    totalPortfolioVolume: 68000, grossResidual: 306, supportCost: 120,
    netProfit: 186, subscriptionFee: 100, trend: 'flat',
    volumeHistory: [310, 295, 305, 298, 310, 306],
    topMerchant: 'Boutique 82',
  },
  {
    id: 'rep4', name: 'Elena K.', merchantCount: 12,
    totalPortfolioVolume: 580000, grossResidual: 2610, supportCost: 250,
    netProfit: 2360, subscriptionFee: 100, trend: 'up',
    volumeHistory: [1900, 2050, 2200, 2350, 2480, 2610],
    topMerchant: 'Corner Market',
  },
  {
    id: 'rep5', name: 'David N.', merchantCount: 2,
    totalPortfolioVolume: 28000, grossResidual: 126, supportCost: 120,
    netProfit: 6, subscriptionFee: 100, trend: 'down',
    volumeHistory: [220, 200, 180, 160, 140, 126],
    topMerchant: 'Apex Gym',
  },
];
