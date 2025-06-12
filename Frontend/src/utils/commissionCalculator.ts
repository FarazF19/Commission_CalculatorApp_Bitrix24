
import { Transaction, CommissionResult, FilterState } from '@/types/financial';

export const calculateCommissions = (
  transactions: Transaction[],
  filters: FilterState
): CommissionResult[] => {
  // Filter transactions based on criteria
  const filteredTransactions = transactions.filter(transaction => {
    const matchesMid = !filters.mid || transaction.mid.includes(filters.mid);
    const matchesDba = !filters.dba || transaction.dba.toLowerCase().includes(filters.dba.toLowerCase());
    
    let matchesDate = true;
    if (filters.month || filters.year) {
      const statementDate = transaction.statementMonth;
      if (filters.year) {
        matchesDate = matchesDate && statementDate.includes(filters.year);
      }
      if (filters.month) {
        // Extract month from statement (e.g., "202502 Feb" -> "02")
        const monthMatch = statementDate.match(/\d{4}(\d{2})/);
        if (monthMatch) {
          matchesDate = matchesDate && monthMatch[1] === filters.month;
        }
      }
    }
    
    return matchesMid && matchesDba && matchesDate;
  });

  // Group by MID and DBA to calculate commissions
  const results: CommissionResult[] = [];
  
  // Group by MID
  if (filters.mid || (!filters.mid && !filters.dba)) {
    const midGroups = groupBy(filteredTransactions, 'mid');
    Object.entries(midGroups).forEach(([mid, transactionGroup]) => {
      const totalCommission = transactionGroup.reduce((sum, t) => sum + t.earnings, 0);
      results.push({
        identifier: mid,
        type: 'mid',
        totalCommission,
        transactionCount: transactionGroup.length
      });
    });
  }
  
  // Group by DBA
  if (filters.dba || (!filters.mid && !filters.dba)) {
    const dbaGroups = groupBy(filteredTransactions, 'dba');
    Object.entries(dbaGroups).forEach(([dba, transactionGroup]) => {
      const totalCommission = transactionGroup.reduce((sum, t) => sum + t.earnings, 0);
      results.push({
        identifier: dba,
        type: 'dba',
        totalCommission,
        transactionCount: transactionGroup.length
      });
    });
  }

  return results.sort((a, b) => b.totalCommission - a.totalCommission);
};

const groupBy = (array: Transaction[], key: keyof Transaction): Record<string, Transaction[]> => {
  return array.reduce((groups, item) => {
    const value = String(item[key]);
    groups[value] = groups[value] || [];
    groups[value].push(item);
    return groups;
  }, {} as Record<string, Transaction[]>);
};
