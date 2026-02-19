
export type BusinessType = 'Retail' | 'Restaurant' | 'Service' | 'E-Commerce' | 'Convenience Store';

export type UserRole = 'merchant' | 'iso';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  // Specific to Merchant
  businessType?: BusinessType;
  // Specific to ISO
  organizationName?: string;
  onboardingComplete: boolean;
  credits: number;
  plan: 'Free' | 'Pro' | 'Enterprise';
}

export type ThemeColor = 'green' | 'blue' | 'purple' | 'orange';

export interface AppSettings {
  revenueGoal: number;
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  primaryColor: ThemeColor;
  aiResponseStyle: number; // 0 (Simple) to 100 (Data-Driven)
  proxyEndpoint?: string;
}

export type TransactionCategory = 'Inventory' | 'Utilities' | 'Payroll' | 'Marketing' | 'Software' | 'Rent' | 'Miscellaneous' | 'Uncategorized';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  customer: string;
  items: string[];
  // Fix: Added 'Apple Pay' and 'Wire' to the union type to support all mock transactions
  method: 'Visa' | 'MasterCard' | 'Amex' | 'Square' | 'Stripe' | 'Cash' | 'Apple Pay' | 'Wire';
  category: TransactionCategory;
}

export interface DailyMetric {
  date: string;
  revenue: number;
  transactions: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  read: boolean;
  timestamp: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface CreditLog {
  id: string;
  action: string;
  amount: number;
  timestamp: number;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  reorderMethod: 'Email' | 'API';
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  unitCost: number;
  supplierId: string;
  dailyBurnRate: number; // Avg units sold per day
  daysRemaining: number;
  status: 'Good' | 'Low' | 'Critical';
}

export interface Order {
  id: string;
  itemId: string;
  quantity: number;
  status: 'Draft' | 'Sent' | 'Delivered';
  date: number;
}
