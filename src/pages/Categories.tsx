import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { categoryAPI, standardizeError, Category, User } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Eye } from 'lucide-react';
import { formatPersianDate } from '@/lib/utils';
import FilterHeader from '../components/FilterHeader';
import AddCategoryCard from '@/components/AddCategoryCard';
import EditCategoryCard from '@/components/EditCategoryCard';

interface CategoriesProps {
  user: User;
}

const Categories: React.FC<CategoriesProps> = ({ user }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('Loading categories for user role:', user.role);
      const response = await categoryAPI.list();
      if (response.success && response.data) {
        console.log('All categories loaded:', response.data.length);
        // Categories are already filtered by the backend based on user role
        // Stores get their own + global categories, admins get all categories
        console.log('Categories loaded for user role:', user.role, 'count:', response.data.length);
        setCategories(response.data as any[]);
      }
    } catch (error: any) {
      const standardized = standardizeError(error);
      console.error('Failed to load categories:', standardized.message);
      toast.error(standardized.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories
    .filter(category => {
      if (!category.name) {
        console.warn('Category missing name:', category);
        return false;
      }
      return category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'createdAt') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'updatedAt') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return 0;
    });

  // Role-based configurations
  const isStore = user.role === 'store';
  const isAdmin = user.role === 'admin';
  const canAddCategories = isStore || isAdmin;
  const canEditCategories = isStore || isAdmin;

  // Check if a specific category can be edited by the current user
  const canEditCategory = (category: any) => {
    if (isAdmin) return true;
    if (isStore) {
      // Stores can only edit their own non-global categories
      return !category.isGlobal && category.store?._id === user._id;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm font-medium text-foreground animate-pulse">{t('page.categories.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-foreground text-2xl font-bold">
          {t('page.categories.title')}
        </h1>
        <div className="flex items-center space-x-4">
          {canAddCategories && (
            <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('page.categories.addCategory')}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <FilterHeader
        title={t('page.categories.filterCategories')}
        isExpanded={filtersExpanded}
        onToggle={() => setFiltersExpanded(!filtersExpanded)}
        onClear={() => {
          setSearchTerm('');
          setSortBy('name');
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      >
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('common.search')}</label>
            <Input
              placeholder={t('page.categories.searchCategories')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="sm:w-48">
            <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('common.sortBy')}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="name">{t('common.name')}</option>
              <option value="createdAt">{t('page.categories.dateCreated')}</option>
              <option value="updatedAt">{t('page.categories.dateUpdated')}</option>
            </select>
          </div>
        </div>
      </FilterHeader>

      {/* Categories Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('page.categories.categoriesCount')} ({filteredCategories.length})</span>
            <div className="text-sm text-muted-foreground">
              {filteredCategories.length !== categories.length && (
                <span>{t('page.categories.filteredFromTotal', { total: categories.length })}</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCategories.map((category) => (
                <Card key={category._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Category Image */}
                      <div className="relative">
                        <div
                          className="w-full h-32 bg-muted rounded-md flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            if (canEditCategories) {
                              setSelectedCategory(category);
                              setShowEditModal(true);
                            }
                          }}
                        >
                          {category.image ? (
                            <img
                              src={`${category.image}?t=${category.updatedAt || Date.now()}`}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-muted-foreground">{t('page.categories.noImage')}</div>
                          )}
                        </div>

                        {/* Action Icons */}
                        {canEditCategory(category) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategory(category);
                              setShowEditModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Category Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg line-clamp-1">{category.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>

                        <div className="text-xs text-muted-foreground">
                          {t('page.categories.dateCreated')}: {category.createdAt ? formatPersianDate(category.createdAt, 'short') : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">{t('common.image')}</TableHead>
                    <TableHead className="min-w-48">{t('common.name')}</TableHead>
                    <TableHead className="min-w-64">{t('common.description')}</TableHead>
                    <TableHead className="w-32">{t('common.created')}</TableHead>
                    <TableHead className="w-32">{t('common.updated')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="relative">
                          <div
                            className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 hover:shadow-md transition-all duration-200"
                            onClick={() => {
                              if (canEditCategory(category)) {
                                setSelectedCategory(category);
                                setShowEditModal(true);
                              }
                            }}
                          >
                            {category.image ? (
                              <img
                                src={`${category.image}?t=${category.updatedAt || Date.now()}`}
                                alt={category.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="text-muted-foreground text-xs">{t('page.categories.noImage')}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{category.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground line-clamp-2 max-w-96">{category.description}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {category.createdAt ? formatPersianDate(category.createdAt, 'short') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {category.updatedAt ? formatPersianDate(category.updatedAt, 'short') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">{t('page.categories.noCategoriesFound')}</div>
              <div className="text-sm text-muted-foreground/70">
                {t('page.categories.tryAdjustingFilters')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Modal */}
      {showAddModal && (
        <AddCategoryCard
          user={user}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadCategories();
            setShowAddModal(false);
          }}
        />
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <EditCategoryCard
          user={user}
          category={selectedCategory}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
          onSuccess={() => {
            loadCategories();
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
        />
      )}
    </div>
  );
};

export default Categories;