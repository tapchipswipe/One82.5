import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, ShoppingCart, Truck } from 'lucide-react';
import { InventoryService } from '../services/inventoryService';
import { InventoryItem } from '../types';

const InventoryManager: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    useEffect(() => {
        setItems(InventoryService.getInventory());
    }, []);

    const handleOrder = async (quantity: number) => {
        if (!selectedItem) return;
        await InventoryService.placeOrder(selectedItem.id, quantity);
        setItems([...InventoryService.getInventory()]); // Refresh list
        setSelectedItem(null); // Close modal
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Intelligence</h1>
                <p className="text-gray-500 dark:text-gray-400">Automated stock tracking based on sales velocity.</p>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Item / SKU</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">In Stock</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Burn Rate</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Days Left</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                                    <div className="text-xs text-gray-500 font-mono">{item.sku}</div>
                                </td>
                                <td className="p-4 font-mono">{item.currentStock} units</td>
                                <td className="p-4 text-sm">{item.dailyBurnRate} / day</td>
                                <td className="p-4">
                                    <span className={`font-bold ${item.daysRemaining < 5 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {item.daysRemaining.toFixed(1)} days
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center w-fit gap-1 ${item.status === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            item.status === 'Low' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                        {item.status === 'Critical' && <AlertTriangle className="w-3 h-3" />}
                                        {item.status === 'Good' && <CheckCircle className="w-3 h-3" />}
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => setSelectedItem(item)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center"
                                    >
                                        <Truck className="w-3 h-3 mr-2" /> Reorder
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Reorder Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Reorder {selectedItem.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Est. Delivery: 2 Days via Global Foods Dist.
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-6 flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Reorder Quantity</span>
                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {selectedItem.reorderPoint * 3}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="flex-1 py-3 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleOrder(selectedItem.reorderPoint * 3)}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30"
                            >
                                Confirm Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManager;
