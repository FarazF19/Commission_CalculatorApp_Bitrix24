import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Transaction } from '@/types/financial';

interface TransactionTableProps {
  transactions: Transaction[];
  onImport: () => void;
}

export const TransactionTable = ({ transactions, onImport }: TransactionTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpToPage, setJumpToPage] = useState('');
  const itemsPerPage = 10;
  
  const totalItems = transactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const handleJumpToPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(jumpToPage);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        goToPage(pageNum);
        setJumpToPage('');
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems}
          </div>
          <Button 
            onClick={onImport} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>
      
      {/* Table View */}
      <div className="overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Statement Month</th>
              <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">MID</th>
              <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">DBA</th>
              <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Volume</th>
              <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Txn</th>
              <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentTransactions.map((transaction, index) => (
              <tr key={startIndex + index} className="hover:bg-gray-50">
                <td className="py-3 px-3 text-sm font-medium text-gray-900">{startIndex + index + 1}</td>
                <td className="py-3 px-3 text-sm text-gray-700">{transaction.statementMonth}</td>
                <td className="py-3 px-3 text-sm text-gray-700 font-mono">{transaction.mid}</td>
                <td className="py-3 px-3 text-sm text-gray-700">
                  {transaction.dba}
                </td>
                <td className="py-3 px-3 text-sm text-gray-700">£{transaction.salesVolume.toFixed(2)}</td>
                <td className="py-3 px-3 text-sm text-gray-700">{transaction.salesTxn.toFixed(0)}</td>
                <td className="py-3 px-3 text-sm text-blue-600 font-medium">£{transaction.commission.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* Left side - Previous button */}
                <Button
                  variant="outline"
                  size="sm"
              onClick={handlePrevPage}
                  disabled={currentPage === 1}
              className="h-8 px-3 text-xs"
                >
              <ChevronLeft className="h-3 w-3 mr-1" />
                  Previous
                </Button>
                
            {/* Center - Page info and jump to page */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {currentPage}/{totalPages}
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Go to:</span>
                <Input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onKeyPress={handleJumpToPage}
                  placeholder={currentPage.toString()}
                  className="w-16 h-8 text-xs text-center"
                />
              </div>
                </div>
                
            {/* Right side - Next button */}
                <Button
                  variant="outline"
                  size="sm"
              onClick={handleNextPage}
                  disabled={currentPage === totalPages}
              className="h-8 px-3 text-xs"
                >
                  Next
              <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
      )}
          </div>
  );
};
