import { Transaction } from '../types';

export interface InventoryItem {
  name: string;
  totalSold: number;
  avgDailyRate: number;
  daysOfStockLeft: number;
  trend: 'up' | 'down' | 'stable';
  peakHours: number[];
  reorderRecommendation: string;
  confidence: number;
}

export interface InventoryInsight {
  items: InventoryItem[];
  topMovers: InventoryItem[];
  lowStock: InventoryItem[];
  summary: string;
}

export class InventoryIntelligenceService {
  /**
   * Analyzes transactions to extract inventory intelligence
   */
  static analyzeInventory(transactions: Transaction[]): InventoryInsight {
    const itemMap = new Map<string, { dates: Date[], hours: number[] }>();
    
    // Extract items from transactions
    transactions.forEach(txn => {
      const txnDate = new Date(txn.date);
      txn.items.forEach(itemName => {
        if (!itemMap.has(itemName)) {
          itemMap.set(itemName, { dates: [], hours: [] });
        }
        const item = itemMap.get(itemName)!;
        item.dates.push(txnDate);
        item.hours.push(txnDate.getHours());
      });
    });

    // Analyze each item
    const items: InventoryItem[] = Array.from(itemMap.entries()).map(([name, data]) => {
      const totalSold = data.dates.length;
      const dayRange = this.getDayRange(data.dates);
      const avgDailyRate = dayRange > 0 ? totalSold / dayRange : totalSold;
      
      // Estimate stock (assume 2-3x current daily rate as typical stock level)
      const estimatedStock = Math.max(0, Math.floor(avgDailyRate * 3 - (avgDailyRate * 0.5)));
      const daysOfStockLeft = avgDailyRate > 0 ? estimatedStock / avgDailyRate : 0;
      
      // Determine trend
      const trend = this.calculateTrend(data.dates);
      
      // Find peak hours
      const peakHours = this.findPeakHours(data.hours);
      
      // Generate recommendation
      const reorderRecommendation = this.generateRecommendation(
        name,
        totalSold,
        avgDailyRate,
        daysOfStockLeft,
        trend
      );
      
      // Confidence based on data points
      const confidence = Math.min(100, Math.floor((totalSold / 10) * 100));

      return {
        name,
        totalSold,
        avgDailyRate: Math.round(avgDailyRate * 10) / 10,
        daysOfStockLeft: Math.round(daysOfStockLeft * 10) / 10,
        trend,
        peakHours,
        reorderRecommendation,
        confidence
      };
    });

    // Sort by total sold
    items.sort((a, b) => b.totalSold - a.totalSold);

    // Identify top movers (top 5)
    const topMovers = items.slice(0, 5);

    // Identify low stock (less than 3 days)
    const lowStock = items.filter(item => item.daysOfStockLeft < 3 && item.daysOfStockLeft > 0);

    // Generate summary
    const summary = this.generateSummary(items, lowStock);

    return {
      items,
      topMovers,
      lowStock,
      summary
    };
  }

  private static getDayRange(dates: Date[]): number {
    if (dates.length === 0) return 0;
    const sorted = dates.map(d => d.getTime()).sort((a, b) => a - b);
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.ceil((sorted[sorted.length - 1] - sorted[0]) / dayMs) || 1;
  }

  private static calculateTrend(dates: Date[]): 'up' | 'down' | 'stable' {
    if (dates.length < 7) return 'stable';
    
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const lastWeek = dates.filter(d => now - d.getTime() < 7 * dayMs).length;
    const prevWeek = dates.filter(d => {
      const diff = now - d.getTime();
      return diff >= 7 * dayMs && diff < 14 * dayMs;
    }).length;

    if (lastWeek > prevWeek * 1.2) return 'up';
    if (lastWeek < prevWeek * 0.8) return 'down';
    return 'stable';
  }

  private static findPeakHours(hours: number[]): number[] {
    const hourCounts = new Map<number, number>();
    hours.forEach(h => hourCounts.set(h, (hourCounts.get(h) || 0) + 1));
    
    const sorted = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);
    
    return sorted;
  }

  private static generateRecommendation(
    name: string,
    totalSold: number,
    avgDailyRate: number,
    daysLeft: number,
    trend: 'up' | 'down' | 'stable'
  ): string {
    if (daysLeft < 2) {
      return `Critical: Reorder ${name} immediately. Only ${daysLeft.toFixed(1)} days left at current rate.`;
    } else if (daysLeft < 3) {
      return `Low stock: Consider reordering ${name} soon. Approximately ${daysLeft.toFixed(1)} days remaining.`;
    } else if (trend === 'up') {
      return `Trending up: ${name} sales increasing. Monitor stock closely.`;
    } else if (trend === 'down') {
      return `Trending down: ${name} sales declining. Current stock should last ${daysLeft.toFixed(1)} days.`;
    } else {
      return `Stable: ${name} selling at ${avgDailyRate.toFixed(1)} per day. Stock estimated at ${daysLeft.toFixed(1)} days.`;
    }
  }

  private static generateSummary(items: InventoryItem[], lowStock: InventoryItem[]): string {
    if (lowStock.length > 0) {
      return `${lowStock.length} item${lowStock.length > 1 ? 's' : ''} running low on stock. Immediate attention needed for: ${lowStock.map(i => i.name).join(', ')}.`;
    } else if (items.length > 0) {
      const topItem = items[0];
      return `All items well-stocked. Top seller: ${topItem.name} (${topItem.totalSold} sold, ${topItem.avgDailyRate.toFixed(1)}/day).`;
    } else {
      return 'No inventory data available. Start processing transactions to get insights.';
    }
  }
}
