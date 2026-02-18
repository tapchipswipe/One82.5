
export type BusinessType = 'Retail' | 'Restaurant' | 'Service' | 'E-Commerce' | 'Convenience Store';

export interface User {
  id: string;
  email: string;
  name: string;
  businessType: BusinessType;
  onboardingComplete: boolean;
  role: 'admin' | 'user';
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
