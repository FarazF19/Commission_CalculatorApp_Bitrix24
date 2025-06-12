import { PoundSterling } from 'lucide-react';

interface EarningsDisplayProps {
  totalEarnings: number;
  showResults: boolean;
}

export const EarningsDisplay = ({ totalEarnings, showResults }: EarningsDisplayProps) => {
  if (!showResults) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-center space-x-3">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
          <PoundSterling className="h-6 w-6 text-green-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-gray-900">£{totalEarnings.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};
