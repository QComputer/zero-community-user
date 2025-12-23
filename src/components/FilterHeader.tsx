import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ChevronUp, ChevronDown, Grid, List } from 'lucide-react';

interface FilterHeaderProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  onClear: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  children: React.ReactNode;
}

const FilterHeader: React.FC<FilterHeaderProps> = ({
  title,
  isExpanded,
  onToggle,
  onClear,
  viewMode,
  onViewModeChange,
  children
}) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>{title}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {viewMode && onViewModeChange && (
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onViewModeChange('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="text-xs"
            >
              {t('components.filterHeader.clearFilters')}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export default FilterHeader;