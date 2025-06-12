import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Upload } from 'lucide-react';
import { FilterState } from '@/types/financial';

interface FilterPanelProps {
  filters: FilterState;
  setFilters: (filters: FilterState | ((prev: FilterState) => FilterState)) => void;
  onCalculate: () => void;
  isCalculating: boolean;
  totalEarnings: number;
  showEarnings: boolean;
}

export const FilterPanel = ({ filters, setFilters, onCalculate, isCalculating, totalEarnings, showEarnings }: FilterPanelProps) => {
  // Get the selected filter type - prioritize which field has a value, fallback to filterType
  const getSelectedFilterType = () => {
    if (filters.mid !== '') return 'mid';
    if (filters.dba !== '') return 'dba';
    return filters.filterType || '';
  };

  const handleFilterTypeChange = (value: string) => {
    if (value === 'mid') {
      setFilters(prev => ({ 
        ...prev, 
        dba: '', 
        filterType: 'mid' as 'mid' | 'dba'
      }));
    } else if (value === 'dba') {
      setFilters(prev => ({ 
        ...prev, 
        mid: '', 
        filterType: 'dba' as 'mid' | 'dba'
      }));
    }
  };

  const handleFilterValueChange = (value: string) => {
    const filterType = getSelectedFilterType();
    if (filterType === 'mid') {
      setFilters(prev => ({ ...prev, mid: value }));
    } else if (filterType === 'dba') {
      setFilters(prev => ({ ...prev, dba: value }));
    }
  };

  const getCurrentFilterValue = () => {
    const filterType = getSelectedFilterType();
    if (filterType === 'mid') return filters.mid;
    if (filterType === 'dba') return filters.dba;
    return '';
  };

  const getPlaceholderText = () => {
    const filterType = getSelectedFilterType();
    if (filterType === 'mid') return "Enter MID (e.g., 2101496360)";
    if (filterType === 'dba') return "Enter DBA (e.g., J C Wise Limited)";
    return "Enter value";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Filter by Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Filter by</h3>
        <div className="space-y-3">
          <Select value={getSelectedFilterType()} onValueChange={handleFilterTypeChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mid">MID</SelectItem>
              <SelectItem value="dba">DBA</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder={getPlaceholderText()}
            value={getCurrentFilterValue()}
            onChange={(e) => handleFilterValueChange(e.target.value)}
            className="text-sm"
            disabled={!getSelectedFilterType()}
          />
        </div>
      </div>

      {/* Statement Date Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Statement Date</h3>
        <div className="grid grid-cols-2 gap-3">
          <Select value={filters.month} onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="01">Jan</SelectItem>
              <SelectItem value="02">Feb</SelectItem>
              <SelectItem value="03">Mar</SelectItem>
              <SelectItem value="04">Apr</SelectItem>
              <SelectItem value="05">May</SelectItem>
              <SelectItem value="06">Jun</SelectItem>
              <SelectItem value="07">Jul</SelectItem>
              <SelectItem value="08">Aug</SelectItem>
              <SelectItem value="09">Sep</SelectItem>
              <SelectItem value="10">Oct</SelectItem>
              <SelectItem value="11">Nov</SelectItem>
              <SelectItem value="12">Dec</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={onCalculate} 
          className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 text-sm font-medium"
          disabled={isCalculating}
        >
          {isCalculating ? 'Applying...' : 'Apply'}
        </Button>
      </div>

      {/* Earnings Section */}
      {showEarnings && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <h3 className="text-sm font-medium text-gray-900">Earnings</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            £{totalEarnings.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      )}
    </div>
  );
};
