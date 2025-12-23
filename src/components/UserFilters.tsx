import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar, Filter, X, Search, RefreshCw, MapPin, User } from 'lucide-react';
import PersianDatePicker from './PersianDatePicker';

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onReset: () => void;
}

export interface UserFilters {
  searchTerm?: string;
  role?: string;
  status?: string;
  shareLocation?: string;
  dateFrom?: string;
  dateTo?: string;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const roleOptions = [
    { value: 'admin', label: 'Admin', color: 'bg-red-500' },
    { value: 'store', label: 'Store', color: 'bg-blue-500' },
    { value: 'driver', label: 'Driver', color: 'bg-green-500' },
    { value: 'customer', label: 'Customer', color: 'bg-purple-500' },
  ];

  const statusOptions = [
    { value: 'online', label: 'Online', color: 'bg-status-online' },
    { value: 'offline', label: 'Offline', color: 'bg-status-offline' },
    { value: 'busy', label: 'Busy', color: 'bg-status-busy' },
    { value: 'soon', label: 'Soon', color: 'bg-status-soon' },
  ];

  const locationOptions = [
    { value: 'sharing', label: 'Sharing Location' },
    { value: 'not-sharing', label: 'Not Sharing Location' },
  ];

  const updateFilter = (key: keyof UserFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value || undefined,
    });
  };

  const clearFilter = (key: keyof UserFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => {
      return value && typeof value === 'string' && value.trim() !== '';
    }).length;
  };

  const renderSearchFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-primary flex items-center">
        <Search className="w-4 h-4 mr-2" />
        Search Users
      </Label>
      <Input
        placeholder="Search by name, username, or email..."
        value={filters.searchTerm || ''}
        onChange={(e) => updateFilter('searchTerm', e.target.value)}
        className="h-10 rounded-lg border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
      />
    </div>
  );

  const renderRoleFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-blue-600 flex items-center">
        <User className="w-4 h-4 mr-2" />
        User Role
      </Label>
      <Select value={filters.role || 'all'} onValueChange={(value) => updateFilter('role', value)}>
        <SelectTrigger className="h-10 rounded-lg border-input hover:border-blue-500/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent className="rounded-lg">
          <SelectItem value="all" className="rounded-md">All Roles</SelectItem>
          {roleOptions.map((role) => (
            <SelectItem key={role.value} value={role.value} className="rounded-md">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${role.color}`} />
                {role.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderStatusFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-green-600 flex items-center">
        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
        Online Status
      </Label>
      <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
        <SelectTrigger className="h-10 rounded-lg border-input hover:border-green-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent className="rounded-lg">
          <SelectItem value="all" className="rounded-md">All Statuses</SelectItem>
          {statusOptions.map((status) => (
            <SelectItem key={status.value} value={status.value} className="rounded-md">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${status.color}`} />
                {status.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderLocationFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-purple-600 flex items-center">
        <MapPin className="w-4 h-4 mr-2" />
        Location Sharing
      </Label>
      <Select value={filters.shareLocation || 'all'} onValueChange={(value) => updateFilter('shareLocation', value)}>
        <SelectTrigger className="h-10 rounded-lg border-input hover:border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200">
          <SelectValue placeholder="All Users" />
        </SelectTrigger>
        <SelectContent className="rounded-lg">
          <SelectItem value="all" className="rounded-md">All Users</SelectItem>
          {locationOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="rounded-md">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderDateFilters = () => (
    <div className="space-y-4">
      <Label className="text-sm font-semibold text-orange-600 flex items-center">
        <Calendar className="w-4 h-4 mr-2" />
        Registration Date Range
      </Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">From Date</Label>
          <PersianDatePicker
            value={filters.dateFrom || ''}
            onChange={(value) => updateFilter('dateFrom', value)}
            placeholder="Start date"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">To Date</Label>
          <PersianDatePicker
            value={filters.dateTo || ''}
            onChange={(value) => updateFilter('dateTo', value)}
            placeholder="End date"
          />
        </div>
      </div>
    </div>
  );

  const renderActiveFilters = () => {
    const activeFilters = [];

    if (filters.searchTerm) {
      activeFilters.push(
        <Badge key="search" variant="secondary" className="flex items-center gap-1 bg-gray-500/10 text-gray-600 border-gray-500/20 hover:bg-gray-500/20">
          🔍 Search: {filters.searchTerm}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => clearFilter('searchTerm')} />
        </Badge>
      );
    }

    if (filters.role) {
      const roleLabel = roleOptions.find(r => r.value === filters.role)?.label;
      activeFilters.push(
        <Badge key="role" variant="secondary" className="flex items-center gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">
          👤 Role: {roleLabel}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => clearFilter('role')} />
        </Badge>
      );
    }

    if (filters.status) {
      const statusLabel = statusOptions.find(s => s.value === filters.status)?.label;
      activeFilters.push(
        <Badge key="status" variant="secondary" className="flex items-center gap-1 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
          🟢 Status: {statusLabel}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => clearFilter('status')} />
        </Badge>
      );
    }

    if (filters.shareLocation) {
      const locationLabel = locationOptions.find(l => l.value === filters.shareLocation)?.label;
      activeFilters.push(
        <Badge key="location" variant="secondary" className="flex items-center gap-1 bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20">
          📍 {locationLabel}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => clearFilter('shareLocation')} />
        </Badge>
      );
    }

    if (filters.dateFrom || filters.dateTo) {
      activeFilters.push(
        <Badge key="date" variant="secondary" className="flex items-center gap-1 bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20">
          📅 Registration: {filters.dateFrom || '...'} to {filters.dateTo || '...'}
          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => {
            clearFilter('dateFrom');
            clearFilter('dateTo');
          }} />
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
            Advanced Filters
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
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-primary/10 hover:text-primary hover:border-primary/20"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
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
              {renderSearchFilter()}
            </div>
            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20">
              {renderRoleFilter()}
            </div>
            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20">
              {renderStatusFilter()}
            </div>
            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-purple-500/10 border border-purple-500/20">
              {renderLocationFilter()}
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-orange-500/5 to-orange-500/10 border border-orange-500/20">
            {renderDateFilters()}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default UserFilters;