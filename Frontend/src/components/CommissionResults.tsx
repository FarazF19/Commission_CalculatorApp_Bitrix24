import { PoundSterling } from 'lucide-react';
import { CommissionResult } from '@/types/financial';

interface CommissionResultsProps {
  results: CommissionResult[];
}

export const CommissionResults = ({ results }: CommissionResultsProps) => {
  if (results.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Results</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-medium text-gray-900 text-sm truncate flex-1 mr-2">
                  {result.identifier}
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {result.type.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <PoundSterling className="h-4 w-4 text-green-600" />
                <span className="text-xl font-bold text-green-600">
                  {result.totalCommission.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {result.transactionCount} transactions
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
