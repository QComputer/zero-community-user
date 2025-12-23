import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar, Filter, X, Search, RefreshCw } from 'lucide-react';
import PersianDatePicker from './PersianDatePicker';

interface OrderFiltersProps {
  user: any;
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onReset: () => void;
}

export interface OrderFilters {
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  timeFrom?: string;
  timeTo?: string;
  orderType?: string;
  customerName?: string;
  hasDriver?: string;
  searchTerm?: string;
  priceMin?: string;
  priceMax?: string;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  user,
  filters,
  onFiltersChange,
  onReset
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = [
    { value: 'placed', label: 'Placed', color: 'bg-yellow-500' },
    { value: 'accepted', label: 'Accepted', color: 'bg-blue-500' },
    { value: 'prepared', label: 'Prepared', color: 'bg-green-500' },
    { value: 'pickedup', label: 'Picked Up', color: 'bg-purple-500' },
    { value: 'delivered', label: 'Delivered', color: 'bg-emerald-500' },
    { value: 'received', label: 'Received', color: 'bg-teal-500' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
    { value: 'canceled', label: 'Canceled', color: 'bg-gray-500' },
  ];

  const orderTypeOptions = [
    { value: 'delivery', label: 'Delivery' },
    { value: 'in-store', label: 'In-store' },
  ];

  const driverOptions = [
    { value: 'assigned', label: 'Has Driver' },
    { value: 'unassigned', label: 'No Driver' },
  ];

  const updateFilter = (key: keyof OrderFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value || undefined,
    });
  };

  const handleStatusChange = (statusValue: string, checked: boolean) => {
    const currentStatuses = filters.status || [];
    let newStatuses: string[];
    if (checked) {
      newStatuses = [...currentStatuses, statusValue];
    } else {
      newStatuses = currentStatuses.filter(s => s !== statusValue);
    }
    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const clearFilter = (key: keyof OrderFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && typeof value === 'string' && value.trim() !== '';
    }).length;
  };

  const renderStatusFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-primary flex items-center">
        <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
        وضعیت سفارش
      </Label>
      <div className="space-y-2">
        {statusOptions.map((status) => (
          <div key={status.value} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`status-${status.value}`}
              checked={(filters.status || []).includes(status.value)}
              onChange={(e) => handleStatusChange(status.value, e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor={`status-${status.value}`} className="flex items-center text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${status.color}`} />
              {status.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDateTimeFilters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            از تاریخ
          </Label>
          <PersianDatePicker
            value={filters.dateFrom || ''}
            onChange={(value) => updateFilter('dateFrom', value)}
            placeholder="انتخاب تاریخ شروع"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            تا تاریخ
          </Label>
          <PersianDatePicker
            value={filters.dateTo || ''}
            onChange={(value) => updateFilter('dateTo', value)}
            placeholder="انتخاب تاریخ پایان"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">از ساعت</Label>
          <Input
            type="time"
            value={filters.timeFrom || ''}
            onChange={(e) => updateFilter('timeFrom', e.target.value)}
            className="h-10 rounded-lg border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">تا ساعت</Label>
          <Input
            type="time"
            value={filters.timeTo || ''}
            onChange={(e) => updateFilter('timeTo', e.target.value)}
            className="h-10 rounded-lg border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );

  const renderPriceFilters = () => (
    <div className="space-y-4">
      <Label className="text-sm font-semibold text-green-600 flex items-center">
        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
        محدوده قیمت (تومان)
      </Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">حداقل قیمت</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={filters.priceMin || ''}
            onChange={(e) => updateFilter('priceMin', e.target.value)}
            placeholder="0.00"
            className="h-10 rounded-lg border-input hover:border-green-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">حداکثر قیمت</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={filters.priceMax || ''}
            onChange={(e) => updateFilter('priceMax', e.target.value)}
            placeholder="۱۰۰۰۰۰۰.۰۰"
            className="h-10 rounded-lg border-input hover:border-green-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );

  const renderOrderTypeFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-primary flex items-center">
        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
        نوع سفارش
      </Label>
      <Select value={filters.orderType || 'all'} onValueChange={(value) => updateFilter('orderType', value)}>
        <SelectTrigger className="h-10 rounded-lg border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200">
          <SelectValue placeholder="همه انواع" />
        </SelectTrigger>
        <SelectContent className="rounded-lg">
          <SelectItem value="all" className="rounded-md">همه انواع</SelectItem>
          {orderTypeOptions.map((type) => (
            <SelectItem key={type.value} value={type.value} className="rounded-md">
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderDriverFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-primary flex items-center">
        <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
        تخصیص راننده
      </Label>
      <Select value={filters.hasDriver || 'all'} onValueChange={(value) => updateFilter('hasDriver', value)}>
        <SelectTrigger className="h-10 rounded-lg border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200">
          <SelectValue placeholder="همه سفارشات" />
        </SelectTrigger>
        <SelectContent className="rounded-lg">
          <SelectItem value="all" className="rounded-md">همه سفارشات</SelectItem>
          {driverOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="rounded-md">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderSearchFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-primary flex items-center">
        <Search className="w-4 h-4 mr-1" />
        جستجو
      </Label>
      <Input
        placeholder={user?.role === 'customer' ? 'جستجو در سفارشات...' : 'جستجو بر اساس نام مشتری یا شماره سفارش...'}
        value={filters.searchTerm || ''}
        onChange={(e) => updateFilter('searchTerm', e.target.value)}
        className="h-10 rounded-lg border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
      />
    </div>
  );

  const renderActiveFilters = () => {
    const activeFilters = [];

    if (filters.status && filters.status.length > 0) {
      const statusLabels = filters.status.map(s => statusOptions.find(opt => opt.value === s)?.label).filter(Boolean).join(', ');
      activeFilters.push(
        <Badge key="status" variant="secondary" className="flex items-center gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">
          📋 وضعیت: {statusLabels}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => clearFilter('status')} />
        </Badge>
      );
    }

    if (filters.dateFrom || filters.dateTo || filters.timeFrom || filters.timeTo) {
      activeFilters.push(
        <Badge key="datetime" variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
          📅 تاریخ/ساعت: {filters.dateFrom || '...'} تا {filters.dateTo || '...'}
          {filters.timeFrom && ` ${filters.timeFrom}`}
          {filters.timeTo && ` - ${filters.timeTo}`}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => {
            clearFilter('dateFrom');
            clearFilter('dateTo');
            clearFilter('timeFrom');
            clearFilter('timeTo');
          }} />
        </Badge>
      );
    }

    if (filters.priceMin || filters.priceMax) {
      activeFilters.push(
        <Badge key="price" variant="secondary" className="flex items-center gap-1 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
          💰 قیمت: {filters.priceMin || '۰'} - {filters.priceMax || '∞'} تومان
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => {
            clearFilter('priceMin');
            clearFilter('priceMax');
          }} />
        </Badge>
      );
    }

    if (filters.orderType) {
      activeFilters.push(
        <Badge key="type" variant="secondary" className="flex items-center gap-1 bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20">
          🍽️ نوع: {filters.orderType === 'delivery' ? 'تحویل' : 'در فروشگاه'}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => clearFilter('orderType')} />
        </Badge>
      );
    }

    if (filters.hasDriver) {
      activeFilters.push(
        <Badge key="driver" variant="secondary" className="flex items-center gap-1 bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20">
          🚗 راننده: {filters.hasDriver === 'assigned' ? 'تخصیص یافته' : 'تخصیص نیافته'}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => clearFilter('hasDriver')} />
        </Badge>
      );
    }

    if (filters.searchTerm) {
      activeFilters.push(
        <Badge key="search" variant="secondary" className="flex items-center gap-1 bg-gray-500/10 text-gray-600 border-gray-500/20 hover:bg-gray-500/20">
          🔍 جستجو: {filters.searchTerm}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => clearFilter('searchTerm')} />
        </Badge>
      );
    }

    return activeFilters;
  };

  return (
    <Card className="mb-6 shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center text-primary">
            <Filter className="w-5 h-5 mr-2" />
            فیلترها
            {getActiveFiltersCount() > 0 && (
              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Button variant="outline" size="sm" onClick={onReset} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20">
                <RefreshCw className="w-4 h-4 mr-1" />
                پاک کردن
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-primary/10 hover:text-primary hover:border-primary/20"
            >
              {isExpanded ? 'بستن' : 'باز کردن'}
            </Button>
          </div>
        </div>

        {renderActiveFilters().length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {renderActiveFilters()}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
              {renderStatusFilter()}
            </div>
            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
              {renderOrderTypeFilter()}
            </div>
            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
              {renderSearchFilter()}
            </div>

            {(user?.role === 'store' || user?.role === 'driver') && (
              <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
                {renderDriverFilter()}
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
            {renderDateTimeFilters()}
          </div>

          <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20">
            {renderPriceFilters()}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default OrderFilters;