import React, { useState } from 'react';
import { SimulationService, SimulationScenario } from '../services/simulationService';
import { DailyMetric } from '../types';

interface BusinessSimulatorProps {
    currentMetrics?: DailyMetric[];
}

const BusinessSimulator: React.FC<BusinessSimulatorProps> = ({ currentMetrics = [] }) => {
    const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);
    const [result, setResult] = useState<any | null>(null);

    const handleRunSimulation = async () => {
        if (!activeScenario) return;
        const res = await SimulationService.runSimulation(activeScenario, currentMetrics);
        setResult(res);
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Shadow Founder: Business Simulator
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
                Test business decisions in a safe environment before executing them.
            </p>

            <div className="space-y-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded">
                    <h3 className="font-semibold mb-2">Create Scenario</h3>
                    {/* TODO: Add form inputs for simulation parameters */}
                    <button
                        onClick={() => setActiveScenario({
                            id: '1',
                            name: 'Price Hike 5%',
                            description: 'Increase prices by 5%',
                            parameters: { priceChangePercent: 5 }
                        })}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Load "Price Hike" Scenario
                    </button>
                </div>

                {activeScenario && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                        <h3 className="font-semibold">Selected: {activeScenario.name}</h3>
                        <button
                            onClick={handleRunSimulation}
                            className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Run Simulation
                        </button>
                    </div>
                )}

                {result && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded">
                        <h3 className="font-bold text-lg">Simulation Results</h3>
                        <pre className="mt-2 text-sm overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusinessSimulator;
