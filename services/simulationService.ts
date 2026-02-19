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
}

export const SimulationService = {
  // Placeholder for the "Shadow Founder" logic
  runSimulation: async (scenario: SimulationScenario, historicalData: DailyMetric[]): Promise<SimulationResult> => {
    // TODO: Connect to Gemini to run advanced monte-carlo style simulations based on historical data
    console.log('Running simulation for:', scenario.name);

    // Mock result for now
    return {
      scenarioId: scenario.id,
      projectedRevenue: 0,
      projectedProfit: 0,
      riskScore: 50,
      insights: ["Simulation engine not yet connected to Gemini API."]
    };
  },

  // Mock ISO Portfolio Data Generator
  generatePortfolio: (): PortfolioMerchant[] => {
    const merchants: PortfolioMerchant[] = [
      { id: 'm1', name: "Joe's Pizza", businessType: 'Restaurant', monthlyVolume: 45000, churnRisk: 'High', trend: 'down', lastTransaction: Date.now() - 3600000 },
      { id: 'm2', name: "Apex Gym", businessType: 'Service', monthlyVolume: 12000, churnRisk: 'Low', trend: 'up', lastTransaction: Date.now() - 300000 },
      { id: 'm3', name: "Boutique 82", businessType: 'Retail', monthlyVolume: 28000, churnRisk: 'Medium', trend: 'flat', lastTransaction: Date.now() - 86400000 },
      { id: 'm4', name: "Tech Gadgets", businessType: 'E-Commerce', monthlyVolume: 150000, churnRisk: 'Low', trend: 'up', lastTransaction: Date.now() - 60000 },
      { id: 'm5', name: "Corner Market", businessType: 'Convenience Store', monthlyVolume: 8000, churnRisk: 'High', trend: 'down', lastTransaction: Date.now() - 172800000 } // 2 days ago
    ];
    return merchants;
  }
};
