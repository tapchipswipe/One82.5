import { InventoryItem, Order, Supplier, Transaction } from '../types';

// Mock Suppliers
const SUPPLIERS: Supplier[] = [
    { id: 's1', name: 'Global Foods Dist', email: 'orders@globalfoods.com', reorderMethod: 'Email' },
    { id: 's2', name: 'TechWholesale', email: 'api@techwholesale.com', reorderMethod: 'API' }
];

// Mock Inventory
let INVENTORY: InventoryItem[] = [
    { id: 'i1', name: 'Arabica Coffee Beans (5lb)', sku: 'COF-001', currentStock: 12, reorderPoint: 5, unitCost: 45.00, supplierId: 's1', dailyBurnRate: 1.2, daysRemaining: 10, status: 'Good' },
    { id: 'i2', name: 'Espresso Cups', sku: 'CUP-500', currentStock: 400, reorderPoint: 100, unitCost: 0.50, supplierId: 's1', dailyBurnRate: 5, daysRemaining: 80, status: 'Good' },
    { id: 'i3', name: 'Oat Milk (Case)', sku: 'MLK-OAT', currentStock: 3, reorderPoint: 4, unitCost: 22.00, supplierId: 's1', dailyBurnRate: 0.8, daysRemaining: 3.75, status: 'Critical' }
];

let ORDERS: Order[] = [];

export const InventoryService = {
    getInventory: (): InventoryItem[] => {
        // In a real app, we would recalculate daysRemaining based on live transaction volume here
        return INVENTORY;
    },

    getSuppliers: (): Supplier[] => SUPPLIERS,

    placeOrder: async (itemId: string, quantity: number): Promise<boolean> => {
        console.log(`Placing order for item ${itemId}, qty: ${quantity}`);
        const order: Order = {
            id: `ord_${Date.now()}`,
            itemId,
            quantity,
            status: 'Sent',
            date: Date.now()
        };
        ORDERS.push(order);

        // Simulate stock update after "delivery" (instant for demo)
        const itemIndex = INVENTORY.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            INVENTORY[itemIndex].currentStock += quantity;
            // Recalculate status
            const item = INVENTORY[itemIndex];
            item.daysRemaining = item.currentStock / item.dailyBurnRate;
            if (item.currentStock <= item.reorderPoint / 2) item.status = 'Critical';
            else if (item.currentStock <= item.reorderPoint) item.status = 'Low';
            else item.status = 'Good';
        }

        return true;
    },

    getOrders: (): Order[] => ORDERS
};
