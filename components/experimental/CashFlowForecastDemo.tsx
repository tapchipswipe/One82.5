import React, { useMemo } from 'react';
import { CalendarDays, TrendingUp } from 'lucide-react';
import { StorageService } from '../../services/storage';
import { ProvenanceBadges } from '../ProvenanceIndicators';

interface ForecastPoint {
  day: string;
  net: number;
  balance: number;
}

const buildForecast = (): ForecastPoint[] => {
  const tx = StorageService.getTransactions();
  const sample = tx.slice(0, 20);
  const avg = sample.length > 0
    ? sample.reduce((sum, item) => sum + item.amount, 0) / sample.length
    : 325;

  const points: ForecastPoint[] = [];
  let balance = 12000;

  for (let index = 1; index <= 14; index += 1) {
    const seasonality = 1 + Math.sin(index / 2.8) * 0.12;
    const net = Math.round(avg * seasonality);
    balance += net;
    points.push({
      day: `Day ${index}`,
      net,
      balance
    });
  }

  return points;
};

const CashFlowForecastDemo: React.FC = () => {
  const points = useMemo(() => buildForecast(), []);
  const ending = points[points.length - 1]?.balance || 0;
  const minimum = Math.min(...points.map(item => item.balance));

  return (
    <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-500" />
            Cash-Flow Forecast Assistant
          </h3>
          <p className="text-sm text-gray-500 mt-1">14-day deterministic forecast from transaction trend + seasonality.</p>
        </div>
        <ProvenanceBadges size="sm" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Projected Ending Balance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${ending.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Lowest Balance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${minimum.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Model</p>
          <p className="text-sm font-semibold text-gray-900 mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Deterministic + seasonal curve
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Day</th>
              <th className="px-3 py-2 text-left font-semibold">Net Change</th>
              <th className="px-3 py-2 text-left font-semibold">Projected Balance</th>
            </tr>
          </thead>
          <tbody>
            {points.map(point => (
              <tr key={point.day} className="border-t border-gray-100">
                <td className="px-3 py-2">{point.day}</td>
                <td className={`px-3 py-2 font-medium ${point.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {point.net >= 0 ? '+' : ''}${point.net.toLocaleString()}
                </td>
                <td className="px-3 py-2 font-medium text-gray-900">${point.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">Experimental demo forecast; no external data required.</p>
    </div>
  );
};

export default CashFlowForecastDemo;
