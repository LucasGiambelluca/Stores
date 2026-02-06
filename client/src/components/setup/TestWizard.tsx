import React from 'react';

export const SetupWizard = ({ onComplete }: { onComplete: (data: any) => void }) => {
  return (
    <div className="p-10 bg-white min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Test Wizard</h1>
      <p className="mb-4">Si ves esto, React está funcionando correctamente.</p>
      <button 
        onClick={() => onComplete({ name: 'Test Store' })}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Completar Setup
      </button>
    </div>
  );
};

export default SetupWizard;
