export interface Transaction {
  statementMonth: string;
  mid: string;
  dba: string;
  salesVolume: number;
  salesTxn: number;
  commission: number;
  responsible: string;
  earnings: number;
}

export interface CommissionResult {
  identifier: string;
  type: 'mid' | 'dba';
  totalCommission: number;
  transactionCount: number;
}

export interface FilterState {
  mid: string;
  dba: string;
  month: string;
  year: string;
  filterType?: 'mid' | 'dba';
}
