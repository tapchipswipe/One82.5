import { Transaction, DailyMetric } from '../types';

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
  }
};
