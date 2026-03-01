import React from 'react';
import ReactDOM from 'react-dom/client';
import OverseerControlTower from './OverseerControlTower';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <div className="min-h-screen bg-gray-50">
      <OverseerControlTower />
    </div>
  </React.StrictMode>
);
