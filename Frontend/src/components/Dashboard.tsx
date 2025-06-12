import { useState, useEffect } from 'react';
import { FilterPanel } from '@/components/FilterPanel';
import { TransactionTable } from '@/components/TransactionTable';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Bitrix24Integration } from '@/components/Bitrix24Integration';
import { mockTransactions } from '@/data/mockData';
import { calculateCommissions } from '@/utils/commissionCalculator';
import { Transaction, CommissionResult, FilterState } from '@/types/financial';

export const Dashboard = () => {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [filters, setFilters] = useState<FilterState>({
    mid: '2101496360',
    dba: '',
    month: '02',
    year: '2025',
    filterType: 'mid'
  });
  const [commissionResults, setCommissionResults] = useState<CommissionResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);

  // Calculate initial commission results on mount
  useEffect(() => {
    handleCalculate();
  }, []);

  const handleCalculate = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const results = calculateCommissions(transactions, filters);
      setCommissionResults(results);
      const total = results.reduce((sum, result) => sum + result.totalCommission, 0);
      setTotalEarnings(total);
      setIsCalculating(false);
    }, 500);
  };

  const handleImport = () => {
    console.log('Import functionality to be implemented');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <DashboardHeader />

        <div className="flex">
          {/* Main Content - Table */}
          <div className="flex-1 p-6 pt-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <TransactionTable transactions={transactions} onImport={handleImport} />
            </div>
          </div>

          {/* Right Sidebar - Filters, Earnings, and Bitrix24 */}
          <div className="w-80 bg-white shadow-lg border-l border-gray-200">
            <FilterPanel 
              filters={filters}
              setFilters={setFilters}
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
              totalEarnings={totalEarnings}
              showEarnings={commissionResults.length > 0}
            />
            
            {/* Bitrix24 Integration Section */}
            <div className="p-4 border-t border-gray-200">
              <Bitrix24Integration 
                transactions={transactions}
                onSyncComplete={() => {
                  console.log('Bitrix24 sync completed successfully');
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
