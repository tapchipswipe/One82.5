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
