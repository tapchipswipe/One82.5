import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, AlertTriangle, Package, Sparkles } from 'lucide-react';
import { StorageService } from '../services/storage';
import { InventoryIntelligenceService, InventoryItem } from '../services/inventoryIntelligenceService';

const InventoryIntelligence: React.FC = () => {
  const transactions = useMemo(() => StorageService.getTransactions(), []);
  const insight = useMemo(() => InventoryIntelligenceService.analyzeInventory(transactions), [transactions]);

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const StockBadge = ({ days }: { days: number }) => {
    if (days < 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-md">
          <AlertTriangle className="w-3 h-3" />
          Critical
        </span>
      );
    } else if (days < 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-md">
          <AlertTriangle className="w-3 h-3" />
          Low
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-md">
          <Package className="w-3 h-3" />
          Good
        </span>
      );
    }
  };

  const ItemRow = ({ item }: { item: InventoryItem; key?: string | number }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{item.name}</h3>
          <TrendIcon trend={item.trend} />
        </div>
        <StockBadge days={item.daysOfStockLeft} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Total Sold</p>
          <p className="font-semibold text-gray-900">{item.totalSold}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Daily Rate</p>
          <p className="font-semibold text-gray-900">{item.avgDailyRate}/day</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Stock Left</p>
          <p className="font-semibold text-gray-900">{item.daysOfStockLeft.toFixed(1)} days</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Confidence</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-900 h-2 rounded-full transition-all"
                style={{ width: `${item.confidence}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600">{item.confidence}%</span>
          </div>
        </div>
      </div>

      {item.peakHours.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
          <Clock className="w-4 h-4" />
          <span>Peak hours: {item.peakHours.map(h => `${h}:00`).join(', ')}</span>
        </div>
      )}

      <p className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2 border border-gray-100">
        {item.reorderRecommendation}
      </p>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-gray-900" />
          <h1 className="text-2xl font-bold text-gray-900">AI Inventory Intelligence</h1>
        </div>
        <p className="text-gray-600">
          Transaction-derived stock insights powered by AI pattern analysis
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-2">Summary</h2>
        <p className="text-gray-100">{insight.summary}</p>
        {insight.lowStock.length > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-white/10 rounded px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>{insight.lowStock.length} item(s) need immediate attention</span>
          </div>
        )}
      </div>

      {/* Low Stock Alert Section */}
      {insight.lowStock.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Low Stock Alerts
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {insight.lowStock.map(item => (
              <ItemRow key={item.name} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Top Movers */}
      {insight.topMovers.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Movers
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {insight.topMovers.map(item => (
              <ItemRow key={item.name} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* All Items */}
      {insight.items.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" />
            All Items
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insight.items.map(item => (
              <ItemRow key={item.name} item={item} />
            ))}
          </div>
        </div>
      )}

      {insight.items.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Inventory Data</h3>
          <p className="text-gray-600">
            Start processing transactions with item-level data to see AI-powered inventory insights.
          </p>
        </div>
      )}
    </div>
  );
};

export default InventoryIntelligence;
