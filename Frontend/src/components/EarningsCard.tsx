
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface EarningsCardProps {
  totalEarnings: number;
}

export const EarningsCard = ({ totalEarnings }: EarningsCardProps) => {
  return (
    <Card className="shadow-sm border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Earnings</p>
            <p className="text-3xl font-bold text-slate-800">£{totalEarnings.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
