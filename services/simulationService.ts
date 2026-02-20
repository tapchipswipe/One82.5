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

export interface MerchantNote {
  id: string;
  date: string;
  author: string;
  text: string;
}

export interface PortfolioMerchant {
  id: string;
  name: string;
  businessType: BusinessType;
  monthlyVolume: number;
  churnRisk: 'Low' | 'Medium' | 'High';
  trend: 'up' | 'down' | 'flat';
  lastTransaction: number;
  bps: number;
  perTxFee: number;
  status: 'Active' | 'Inactive' | 'Pending';
  mccCode: string;
  mccDescription: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  volumeHistory: number[];
  // Contact info
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  since: string; // ISO date, when they joined the portfolio
  // Notes / CRM
  notes: MerchantNote[];
  // Health score 0-100
  healthScore: number;
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
        ownerName: 'Joe Marchetti', email: 'joe@joespizza.com', phone: '(718) 555-0182',
        address: '122 Flatbush Ave, Brooklyn, NY 11201', since: '2022-03-15', healthScore: 42,
        notes: [
          { id: 'n1', date: '2025-01-10', author: 'Marcus T.', text: 'Called owner — volume drop due to new competitor nearby. Monitoring.' },
          { id: 'n2', date: '2024-11-05', author: 'Marcus T.', text: 'Renegotiated rate to 45 BPS to retain account.' },
        ],
      },
      {
        id: 'm2', name: "Apex Gym", businessType: 'Service',
        monthlyVolume: 12000, churnRisk: 'Low', trend: 'up',
        lastTransaction: Date.now() - 300000, bps: 35, perTxFee: 0.15, status: 'Active',
        mccCode: '7941', mccDescription: 'Sports Clubs & Physical Fitness', riskLevel: 'Low',
        volumeHistory: [9000, 10000, 10500, 11000, 11500, 12000],
        ownerName: 'Sarah Chen', email: 'sarah@apexgym.io', phone: '(212) 555-0334',
        address: '800 6th Ave, New York, NY 10001', since: '2023-07-01', healthScore: 88,
        notes: [
          { id: 'n3', date: '2025-01-20', author: 'Sophia R.', text: 'Growing MoM — potential to upsell additional terminal.' },
        ],
      },
      {
        id: 'm3', name: "Boutique 82", businessType: 'Retail',
        monthlyVolume: 28000, churnRisk: 'Medium', trend: 'flat',
        lastTransaction: Date.now() - 86400000, bps: 42, perTxFee: 0.08, status: 'Active',
        mccCode: '5621', mccDescription: "Women's Clothing Stores", riskLevel: 'Low',
        volumeHistory: [27000, 28500, 27500, 29000, 27000, 28000],
        ownerName: 'Maya Torres', email: 'maya@boutique82.com', phone: '(347) 555-0910',
        address: '45 W Broadway, New York, NY 10013', since: '2021-11-20', healthScore: 65,
        notes: [
          { id: 'n4', date: '2024-12-15', author: 'James W.', text: 'Volume stable. Owner asking about online payment integration.' },
        ],
      },
      {
        id: 'm4', name: "Tech Gadgets", businessType: 'E-Commerce',
        monthlyVolume: 150000, churnRisk: 'Low', trend: 'up',
        lastTransaction: Date.now() - 60000, bps: 28, perTxFee: 0.25, status: 'Active',
        mccCode: '5734', mccDescription: 'Computer & Software Stores', riskLevel: 'Low',
        volumeHistory: [110000, 120000, 130000, 138000, 145000, 150000],
        ownerName: 'Alex Kim', email: 'alex@techgadgets.co', phone: '(646) 555-0277',
        address: '350 5th Ave, New York, NY 10118', since: '2020-06-10', healthScore: 95,
        notes: [
          { id: 'n5', date: '2025-01-25', author: 'Elena K.', text: 'Top performer. Exploring enterprise tier pricing.' },
          { id: 'n6', date: '2024-10-01', author: 'Elena K.', text: 'Renewed contract for 2 years. Rate locked at 28 BPS.' },
        ],
      },
      {
        id: 'm5', name: "Corner Market", businessType: 'Convenience Store',
        monthlyVolume: 8000, churnRisk: 'High', trend: 'down',
        lastTransaction: Date.now() - 172800000, bps: 55, perTxFee: 0.05, status: 'Active',
        mccCode: '5411', mccDescription: 'Grocery Stores & Supermarkets', riskLevel: 'High',
        volumeHistory: [12000, 11000, 10500, 9500, 8800, 8000],
        ownerName: 'Ray Okonkwo', email: 'ray@cornermarket.net', phone: '(929) 555-0651',
        address: '990 Atlantic Ave, Brooklyn, NY 11238', since: '2023-01-14', healthScore: 28,
        notes: [
          { id: 'n7', date: '2025-01-08', author: 'David N.', text: 'At risk of leaving. Owner frustrated with chargebacks. Needs intervention.' },
        ],
      },
    ];
  }
};

// ─────────────────────────────────────────────
// CUSTOMER PROFILES (Merchant-side)
// ─────────────────────────────────────────────

export interface CustomerTransaction {
  date: string;
  amount: number;
  description: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  since: string;          // First seen date
  lastSeen: string;       // Last transaction date
  totalSpend: number;
  avgTicket: number;
  visitCount: number;
  visitFrequency: 'Daily' | 'Weekly' | 'Monthly' | 'Occasional';
  loyaltyScore: number;   // 0–100
  retentionRisk: 'Low' | 'Medium' | 'High';
  topCategory: string;
  recentTransactions: CustomerTransaction[];
  rating?: number;        // If they left a review
  notes: string;
}

export const generateCustomers = (): CustomerProfile[] => [
  {
    id: 'c1', name: 'Rachel Monroe', email: 'rachel.m@email.com', phone: '(917) 555-0121',
    since: '2022-06-10', lastSeen: '2025-01-18',
    totalSpend: 4820, avgTicket: 68.50, visitCount: 71,
    visitFrequency: 'Weekly', loyaltyScore: 92, retentionRisk: 'Low',
    topCategory: 'Dinner', rating: 5,
    recentTransactions: [
      { date: '2025-01-18', amount: 82.00, description: 'Table for 2 — Dinner' },
      { date: '2025-01-11', amount: 64.50, description: 'Takeout order' },
      { date: '2025-01-04', amount: 71.00, description: 'Table for 2 — Dinner' },
    ],
    notes: 'VIP customer. Prefers window table. Birthday in March.',
  },
  {
    id: 'c2', name: 'Derek Walsh', email: 'derek.w@email.com', phone: '(646) 555-0388',
    since: '2023-02-20', lastSeen: '2025-01-05',
    totalSpend: 1240, avgTicket: 41.30, visitCount: 30,
    visitFrequency: 'Monthly', loyaltyScore: 54, retentionRisk: 'Medium',
    topCategory: 'Lunch',
    recentTransactions: [
      { date: '2025-01-05', amount: 38.00, description: 'Lunch — solo' },
      { date: '2024-12-12', amount: 44.00, description: 'Lunch — solo' },
      { date: '2024-11-20', amount: 42.00, description: 'Lunch — solo' },
    ],
    notes: 'Comes in monthly. Has not visited since Jan. May need re-engagement.',
  },
  {
    id: 'c3', name: 'Priya Nair', email: 'priya.n@email.com', phone: '(718) 555-0505',
    since: '2021-09-14', lastSeen: '2025-01-20',
    totalSpend: 9640, avgTicket: 95.00, visitCount: 102,
    visitFrequency: 'Weekly', loyaltyScore: 98, retentionRisk: 'Low',
    topCategory: 'Group Dining', rating: 5,
    recentTransactions: [
      { date: '2025-01-20', amount: 145.00, description: 'Group dinner — 4 people' },
      { date: '2025-01-13', amount: 88.00, description: 'Table for 2 — evening' },
      { date: '2025-01-06', amount: 102.00, description: 'Group dinner — 3 people' },
    ],
    notes: 'Highest lifetime value customer. Always tips well. Know by name.',
  },
  {
    id: 'c4', name: 'Tom Breslin', email: 'tom.b@email.com', phone: '(212) 555-0770',
    since: '2024-08-01', lastSeen: '2024-12-01',
    totalSpend: 420, avgTicket: 35.00, visitCount: 12,
    visitFrequency: 'Occasional', loyaltyScore: 28, retentionRisk: 'High',
    topCategory: 'Takeout', rating: 3,
    recentTransactions: [
      { date: '2024-12-01', amount: 32.00, description: 'Takeout — pizza x2' },
      { date: '2024-11-10', amount: 38.00, description: 'Takeout — pasta' },
    ],
    notes: 'Left a 3-star review mentioning slow service. Has not returned since Dec.',
  },
  {
    id: 'c5', name: 'Jasmine Cole', email: 'jasmine.c@email.com', phone: '(347) 555-0293',
    since: '2023-04-05', lastSeen: '2025-01-19',
    totalSpend: 2980, avgTicket: 55.20, visitCount: 54,
    visitFrequency: 'Weekly', loyaltyScore: 79, retentionRisk: 'Low',
    topCategory: 'Brunch',
    recentTransactions: [
      { date: '2025-01-19', amount: 58.00, description: 'Brunch — table for 2' },
      { date: '2025-01-12', amount: 51.00, description: 'Brunch — solo' },
      { date: '2025-01-05', amount: 63.00, description: 'Brunch — table for 3' },
    ],
    notes: 'Regular brunch crowd. Brings new guests frequently.',
  },
  {
    id: 'c6', name: 'Marcus Webb', email: 'marcus.w@email.com', phone: '(929) 555-0841',
    since: '2022-12-18', lastSeen: '2024-11-28',
    totalSpend: 780, avgTicket: 32.50, visitCount: 24,
    visitFrequency: 'Occasional', loyaltyScore: 35, retentionRisk: 'High',
    topCategory: 'Takeout', rating: 2,
    recentTransactions: [
      { date: '2024-11-28', amount: 29.00, description: 'Takeout — burger combo' },
      { date: '2024-10-14', amount: 34.00, description: 'Takeout — pasta' },
    ],
    notes: 'Left negative review about cold food. Consider outreach with discount code.',
  },
];

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
