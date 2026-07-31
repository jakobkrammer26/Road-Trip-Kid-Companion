import React from 'react';

interface IpadFrameProps {
  children: React.ReactNode;
  isOfflineMode: boolean;
}

export const IpadFrame: React.FC<IpadFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950">
        {children}
      </div>
    </div>
  );
};

