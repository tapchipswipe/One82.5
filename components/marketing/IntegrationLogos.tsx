import React from 'react';

interface IntegrationLogosProps {
  className?: string;
}

const IntegrationLogos: React.FC<IntegrationLogosProps> = ({ className = '' }) => {
  const integrations = [
    { name: 'Stripe', color: 'text-purple-600' },
    { name: 'Square', color: 'text-blue-600' },
    { name: 'Clover', color: 'text-green-600' },
    { name: 'TSYS', color: 'text-red-600' },
    { name: 'Fiserv', color: 'text-orange-600' },
    { name: 'Global Payments', color: 'text-indigo-600' },
    { name: 'WorldPay', color: 'text-cyan-600' },
    { name: 'Elevon', color: 'text-pink-600' },
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 ${className}`}>
      {integrations.map((integration) => (
        <div
          key={integration.name}
          className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-900 hover:shadow-sm transition-all group"
        >
          <span
            className={`font-semibold text-sm grayscale group-hover:grayscale-0 transition-all ${integration.color}`}
          >
            {integration.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default IntegrationLogos;
