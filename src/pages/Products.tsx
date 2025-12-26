import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { productAPI, userAPI, categoryAPI } from '../services/api';
import { logUserAction } from '../services/logger';
import useCart from '../hooks/useCart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Heart, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import FilterHeader from '../components/FilterHeader';
import { formatPersianDate, formatPersianCurrency, toPersianNumbers } from '@/lib/utils';
import AddProductCard from '@/components/AddProductCard';
import EditProductCard from '@/components/EditProductCard';
import PersianDatePicker from '@/components/PersianDatePicker';

interface ProductsProps {
  user: any;
}

const Products: React.FC<ProductsProps> = ({ user }) => {
  const { t } = useTranslation();

  if (!user || user === undefined || user === null) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-destructive font-medium text-foreground">{t('common.accesDenied')}</p>
      </div>
    );
  }
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { storeCarts, handleAddToCart, getCartItemCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [stockMin, setStockMin] = useState('');
  const [stockMax, setStockMax] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [allStores] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [allCategories, setAllCategories] = useState<any[]>([]);

  useEffect(() => {
    loadProductsAndCategories();
    loadFavorites();
  }, []);

  const loadProductsAndCategories = async () => {
    try {
      console.log('Loading products and categories for user role:', user.role);

      // Use optimized endpoint that returns both products and categories
      const response: any = await productAPI.getProductsWithCategories();

      if (response.data && response.data.products) {
        const allProducts = response.data.products || [];
        console.log('Products loaded:', allProducts.length);
        setProducts(allProducts);
      }

      if (response.data && response.data.categories) {
        const categoriesData = response.data.categories || [];
        console.log('Categories loaded:', categoriesData.length, 'items');
        setAllCategories(categoriesData);
      }
    } catch (error: any) {
      console.error('Failed to load products and categories:', error);
      toast.error('Failed to load data');

      // Fallback to individual API calls if optimized endpoint fails
      try {
        await loadProductsFallback();
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProductsFallback = async () => {
    try {
      console.log('Using fallback API calls for products and categories');
      let allProducts: any[];

      if (user.role === 'store') {
        const response: any = await productAPI.getList();
        allProducts = response.data || [];
        console.log('List of store products loaded:', allProducts.length);
        setProducts(allProducts);
      } else if (user.role === 'admin') {
        const response: any = await productAPI.getAll();
        allProducts = response.data || [];
        console.log('All products for admin loaded:', allProducts.length);
        setProducts(allProducts);
      }

      // Load categories
      let categoriesResponse;
      categoriesResponse = await categoryAPI.list();

      const categoriesData = categoriesResponse?.data || [];
      console.log('Categories loaded (fallback):', categoriesData.length, 'items');
      setAllCategories(categoriesData);
    } catch (error: any) {
      console.error('Fallback API calls also failed:', error);
      // Set empty arrays as last resort
      setProducts([]);
      setAllCategories([]);
    }
  };

  // Cart is managed by the useCart hook
  
  const loadFavorites = async () => {
    try {
      const favoriteProducts: any = await userAPI.getFavorites(user._id);
      setFavorites((favoriteProducts.data || []).map((p: any) => p._id));
    } catch (error: any) {
      console.error('Failed to load favorites:', error);
    }
  };

  const handleToggleFavorite = async (productId: string) => {
    try {
      const isFavorite = favorites.includes(productId);
      if (isFavorite) {
        await userAPI.removeFromFavorites(user._id, productId);
        setFavorites(prev => prev.filter(id => id !== productId));
        toast.success('Removed from favorites');
      } else {
        await userAPI.addToFavorites(user._id, productId);
        setFavorites(prev => [...prev, productId]);
        toast.success('Added to favorites');
      }
      logUserAction(isFavorite ? 'remove_from_favorites' : 'add_to_favorites', { productId, userId: user._id });
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  // handleAddToCart is provided by the useCart hook
  const filteredProducts = products
    .filter(product => {
      if (!product.name) {
        console.warn('Product missing name:', product);
        return false;
      }
      return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .filter(product => {
      const productCategoryName = product.category?.name;
      console.log(`Filtering product ${product.name}: category=${productCategoryName}, selected=${selectedCategory}`);
      return selectedCategory === '' ||
        (productCategoryName && productCategoryName.toLowerCase() === selectedCategory.toLowerCase());
    })
    .filter(product => selectedStore === '' || product.store?.username === selectedStore)
    .filter(product => {
      if (selectedAvailability === '') return true;
      if (selectedAvailability === 'available') return product.available === true;
      if (selectedAvailability === 'unavailable') return product.available === false;
      return true;
    })
    .filter(product => {
      if (!dateFrom && !dateTo) return true;
      const productDate = new Date(product.createdAt);
      if (isNaN(productDate.getTime())) {
        console.warn('Invalid createdAt date for product:', product._id, product.createdAt);
        return false;
      }
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;

      if (fromDate && productDate < fromDate) return false;
      if (toDate && productDate > toDate) return false;
      return true;
    })
    .filter(product => {
      if (!priceMin && !priceMax) return true;
      const price = Number(product.price);
      const min = priceMin ? Number(priceMin) : null;
      const max = priceMax ? Number(priceMax) : null;

      if (min !== null && price < min) return false;
      if (max !== null && price > max) return false;
      return true;
    })
    .filter(product => {
      if (!stockMin && !stockMax) return true;
      const stock = Number(product.stock || 0);
      const min = stockMin ? Number(stockMin) : null;
      const max = stockMax ? Number(stockMax) : null;

      if (min !== null && stock < min) return false;
      if (max !== null && stock > max) return false;
      return true;
    })
    .filter(product => {
      if (selectedTags.length === 0) return true;
      return selectedTags.every(tag => product.tags?.includes(tag));
    })
    .filter(product => selectedBrand === '' || product.brand === selectedBrand)
    .filter(product => selectedCurrency === '' || product.currency === selectedCurrency)
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'price') return Number(a.price) - Number(b.price);
      if (sortBy === 'category') return (a.category?.name || '').localeCompare(b.category?.name || '');
      if (sortBy === 'brand') return (a.brand || '').localeCompare(b.brand || '');
      if (sortBy === 'stock') return (a.stock || 0) - (b.stock || 0);
      if (sortBy === 'createdAt') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'updatedAt') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return 0;
    });

  useEffect(() => {
    console.log('Filtered products count:', filteredProducts.length, 'from total:', products.length);
    console.log('Current filters:', {
      searchTerm,
      selectedCategory,
      selectedStore,
      selectedAvailability,
      dateFrom,
      dateTo,
      priceMin,
      priceMax,
      stockMin,
      stockMax,
      selectedTags,
      selectedBrand,
      selectedCurrency,
      sortBy
    });
  }, [
    filteredProducts.length,
    products.length,
    searchTerm,
    selectedCategory,
    selectedStore,
    selectedAvailability,
    dateFrom,
    dateTo,
    priceMin,
    priceMax,
    stockMin,
    stockMax,
    selectedTags,
    selectedBrand,
    selectedCurrency,
    sortBy
  ]);

  // Role-based configurations
  const isStore = user.role === 'store';
  const isAdmin = user.role === 'admin';
  const isCustomerOrDriver = user.role === 'customer' || user.role === 'driver';
  const showAddToCart = isCustomerOrDriver;
  const showAvailabilityColumn = !isCustomerOrDriver;
  const showDateColumns = !isCustomerOrDriver;
  const showDateFilters = !isCustomerOrDriver;
  const showAvailabilityFilter = !isCustomerOrDriver;


  // Use loaded categories from API, fallback to product categories if API fails
  const categories = allCategories.length > 0
    ? allCategories.map(c => c.name).filter(Boolean)
    : [...new Set(products.map(p => p.category?.name).filter(Boolean))];

  // Debug logging for category filtering
  console.log('Available categories for filtering:', categories);
  console.log('Products with categories:', products.map(p => ({ name: p.name, category: p.category?.name })));

  // Create unique stores list with both username and name
  const stores = Array.from(
    new Map(
      products
        .filter(p => p.store)
        .map(p => [p.store.username, { username: p.store.username, name: p.store.name }])
    ).values()
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm font-medium text-foreground animate-pulse">{t('page.products.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-forground text-2xl font-bold">
              {isStore ? t('page.products.myProducts') : t('page.products.title')}
            </h1>
            <div className="flex items-center space-x-4">
              {(isStore || isAdmin) && (
                <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {t('page.products.addProduct')}
                </Button>
              )}
            </div>
          </div>

      {/* Filters */}
            <FilterHeader
              title={t('page.products.title')}
              isExpanded={filtersExpanded}
              onToggle={() => setFiltersExpanded(!filtersExpanded)}
              onClear={() => {
                setSearchTerm('');
                setSelectedCategory('');
                if (!isStore) setSelectedStore('');
                if (showAvailabilityFilter) setSelectedAvailability('');
                if (showDateFilters) {
                  setDateFrom('');
                  setDateTo('');
                }
                setPriceMin('');
                setPriceMax('');
                setStockMin('');
                setStockMax('');
                setSelectedTags([]);
                setSelectedBrand('');
                setSelectedCurrency('');
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
                    placeholder={t('common.search')}
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
                    <option value="price">{t('common.price')}</option>
                    <option value="category">{t('common.category')}</option>
                    <option value="brand">{t('common.brand')}</option>
                    <option value="stock">{t('common.stock')}</option>
                    <option value="createdAt">{t('common.createdAt')}</option>
                    <option value="updatedAt">{t('common.updatedAt')}</option>
                  </select>
                </div>
              </div>
      
              {/* Filter Row 1 */}
              <div className={`grid gap-3 ${showAvailabilityFilter ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('common.category')}</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">{t('common.all')} {t('common.categories')}</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                {!isStore && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('common.store')}</label>
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="">{t('common.all')} {t('common.stores')}</option>
                      {stores.map(store => (
                        <option key={store.username} value={store.username}>{store.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {showAvailabilityFilter && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('common.availability')}</label>
                    <select
                      value={selectedAvailability}
                      onChange={(e) => setSelectedAvailability(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="">{t('common.all')} {t('common.products')}</option>
                      <option value="available">{t('common.available')} {t('common.only')}</option>
                      <option value="unavailable">{t('common.unavailable')} {t('common.only')}</option>
                    </select>
                  </div>
                )}
              </div>
      
              {/* Price Range Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('common.minPrice')}</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-9"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('common.maxPrice')}</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="1000000.00"
                    className="w-full h-9"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('common.currency')}</label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">{t('common.all')} {t('common.currencies')}</option>
                    <option value="IRT">{t('common.iranToman')}</option>
                    <option value="USD">USD ({t('common.usDollar')})</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('common.brand')}</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">{t('common.all')} {t('common.brands')}</option>
                    {Array.from(new Set(products.map(p => p.brand).filter(Boolean))).map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
              </div>
      
              {/* Stock Range Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('common.minStock')}</label>
                  <Input
                    type="number"
                    min="0"
                    value={stockMin}
                    onChange={(e) => setStockMin(e.target.value)}
                    placeholder="0"
                    className="w-full h-9"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">{t('common.maxStock')}</label>
                  <Input
                    type="number"
                    min="0"
                    value={stockMax}
                    onChange={(e) => setStockMax(e.target.value)}
                    placeholder="1000"
                    className="w-full h-9"
                  />
                </div>
              </div>
      
              {/* Tags Filter */}
              {(() => {
                const allTags = Array.from(new Set(products.flatMap(p => p.tags || [])));
                if (allTags.length === 0) return null;
      
                return (
                  <div className="border rounded-lg p-3 bg-muted/20">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setTagsExpanded(!tagsExpanded)}
                    >
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-muted-foreground">{t('common.tags')}</label>
                        {selectedTags.length > 0 && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            {selectedTags.length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedTags.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTags([]);
                            }}
                            className="text-xs h-6 px-2 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            {t('common.clear')}
                          </Button>
                        )}
                        {tagsExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
      
                    {tagsExpanded && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {allTags.map(tag => (
                            <label
                              key={tag}
                              className={`flex items-center space-x-2 space-x-reverse cursor-pointer p-2 rounded-md transition-colors ${selectedTags.includes(tag)
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-muted/50'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedTags.includes(tag)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTags(prev => [...prev, tag]);
                                  } else {
                                    setSelectedTags(prev => prev.filter(t => t !== tag));
                                  }
                                }}
                                className="rounded border-input text-primary focus:ring-primary"
                              />
                              <span className="text-sm font-medium">{tag}</span>
                            </label>
                          ))}
                        </div>
                        {selectedTags.length > 0 && (
                          <div className="mt-3 pt-2 border-t">
                            <div className="text-xs text-muted-foreground mb-1">{t('common.selectedTags')}:</div>
                            <div className="flex flex-wrap gap-1">
                              {selectedTags.map(tag => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md"
                                >
                                  {tag}
                                  <button
                                    onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                                    className="hover:text-destructive text-muted-foreground"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
      
              {/* Date Range Row - Only for admins and marketers */}
              {showDateFilters && (
                <div className="border-t pt-3">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('common.dateRange')}</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <PersianDatePicker
                        value={dateFrom}
                        onChange={setDateFrom}
                        placeholder={t('common.fromDate')}
                      />
                    </div>
                    <div className="flex-1">
                      <PersianDatePicker
                        value={dateTo}
                        onChange={setDateTo}
                        placeholder={t('common.toDate')}
                      />
                    </div>
                  </div>
                </div>
              )}
            </FilterHeader>

      {/* Products Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('common.products')} ({filteredProducts.length})</span>
            <div className="text-sm text-muted-foreground">
              {filteredProducts.length !== products.length && (
                <span>{t('common.filteredFromTotal', { total: products.length })}</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <Card key={product._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Product Image */}
                      <div className="relative">
                        <div
                          className="w-full h-48 bg-muted rounded-md flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            if (isStore || isAdmin) {
                              setSelectedProduct(product);
                              setShowEditModal(true);
                            } else {
                              setSelectedProduct(product);
                            }
                          }}
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-muted-foreground">{t('common.noImage')}</div>
                          )}
                        </div>

                        {/* Action Icons */}
                        {(isStore || isAdmin) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}

                        {isCustomerOrDriver && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                            onClick={() => handleToggleFavorite(product._id)}
                          >
                            <Heart
                              className={`h-4 w-4 ${favorites.includes(product._id)
                                ? 'fill-red-500 text-red-500'
                                : 'text-muted-foreground'
                                }`}
                            />
                          </Button>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-green-600">
                            {formatPersianCurrency(Number(product.price), product.currency)}
                          </span>
                          <Badge variant={product.available ? "default" : "destructive"} className="text-xs">
                            {product.available ? t('common.available') : t('common.outOfStock')}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {t("page.products.category")} {product.category?.name || 'N/A'}
                          {!isStore && product.store && (
                            <span className="ml-2">• {t('common.by')} {product.store.name}</span>
                          )}
                        </div>
                      </div>

                      {/* Cart Controls for customers/drivers */}
                      {showAddToCart && (
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            onClick={() => {
                              console.log('Adding to cart:', product._id, product.store?._id || 'unknown', 1);
                              handleAddToCart(product._id, product.store?._id || 'unknown', 1, '')
                            }}
                            variant="outline"
                            size="sm"
                            disabled={!product.available}
                          >
                            +
                          </Button>
                          <span className="w-12 text-center font-medium">{getCartItemCount(product._id)}</span>
                          <Button
                            onClick={() => {
                              console.log('Removing from cart:', product._id, product.store?._id || 'unknown', -1);
                              handleAddToCart(product._id, product.store?._id || 'unknown', -1, '')
                            }}
                            variant="outline"
                            size="sm"
                            disabled={!product.available || getCartItemCount(product._id) <= 0}
                          >
                            -
                          </Button>
                        </div>
                      )}
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
                    {showAddToCart && <TableHead className="w-32"></TableHead>}
                    <TableHead className="w-16">{t('common.image')}</TableHead>
                    <TableHead className="min-w-48">{t('common.name')}</TableHead>
                    <TableHead className="w-32">{t('common.category')}</TableHead>
                    {!isStore && <TableHead className="w-32">{t('common.store')}</TableHead>}
                    <TableHead className="w-20">{t('common.price')}</TableHead>
                    {showAvailabilityColumn && <TableHead className="w-24">{t('common.status')}</TableHead>}
                    {showDateColumns && <TableHead className="w-24">{t('common.created')}</TableHead>}
                    {showDateColumns && <TableHead className="w-24">{t('common.updated')}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product._id} className="hover:bg-muted/50">
                      {showAddToCart && (
                        <TableCell>
                          <div className="flex flex-col border border-input rounded-md overflow-hidden w-fit">
                            <Button
                              onClick={() => {
                                console.log('Table view - Adding to cart:', product._id, product.store?._id || 'unknown', 1);
                                handleAddToCart(product._id, product.store?._id || 'unknown', 1, '')
                              }}
                              variant="ghost"
                              size="sm"
                              disabled={!product.available}
                              className="w-6 h-6 rounded-none border-0 hover:bg-muted text-sm font-medium"
                            >
                              +
                            </Button>
                            <div className="text-xs font-medium text-center py-1 bg-muted/50 border-y border-input min-w-[1.5rem]">
                              {getCartItemCount(product._id)}
                            </div>
                            <Button
                              onClick={() => {
                                console.log('Table view - Removing from cart:', product._id, product.store?._id || 'unknown', -1);
                                handleAddToCart(product._id, product.store?._id || 'unknown', -1, '')
                              }}
                              variant="ghost"
                              size="sm"
                              disabled={!product.available || getCartItemCount(product._id) <= 0}
                              className={`w-6 h-6 rounded-none border-0 hover:bg-muted text-sm font-medium ${getCartItemCount(product._id) === 1 ? 'text-destructive hover:text-destructive' : ''
                                }`}
                            >
                              {getCartItemCount(product._id) === 1 ? '×' : '−'}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="relative">
                          <div
                            className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 hover:shadow-md transition-all duration-200 group"
                            onClick={() => {
                              if (isStore || isAdmin) {
                                setSelectedProduct(product);
                                setShowEditModal(true);
                              } else {
                                setSelectedProduct(product);
                              }
                            }}
                            title={isCustomerOrDriver ? t('components.storeMenu.clickToViewDetails') : t('components.storeMenu.clickToEditProduct')}
                          >
                            {product.image ? (
                                                           <img
                                                             src={product.image}
                                                             alt={product.name}
                                                             className="w-full h-full object-cover rounded"
                                                           />
                                                         ) : (
                                                           <div className="text-muted-foreground text-xs">{t('common.noImage')}</div>
                                                         )}
                          </div>
                          {/* Details Icon - Bottom Right (only for stores/admins) */}
                          {(isStore || isAdmin) && (
                            <div
                              className="absolute -bottom-1 -right-1 p-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-full shadow-md hover:bg-background hover:scale-110 transition-all duration-200 cursor-pointer opacity-70 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                              }}
                              title="View product details"
                            >
                              <Eye className="h-4 w-4 text-foreground" />
                            </div>
                          )}

                          {/* Favorite Icon - Top Right (only for customers) */}
                          {isCustomerOrDriver && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(product._id);
                              }}
                              className="absolute -top-1 -right-1 p-1 bg-background border border-border rounded-full shadow-sm hover:bg-muted transition-colors"
                            >
                              <Heart
                                className={`h-3 w-3 ${favorites.includes(product._id)
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-muted-foreground'
                                  }`}
                              />
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2 max-w-96">{product.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{product.category?.name || t('common.notProvided')}</span>
                      </TableCell>
                      {!isStore && (
                        <TableCell>
                          <span className="text-sm">{product.store?.name || t('common.notProvided')}</span>
                        </TableCell>
                      )}
                      <TableCell>
                        <span className="font-medium text-green-600">{formatPersianCurrency(Number(product.price), product.currency)}</span>
                      </TableCell>
                      {showAvailabilityColumn && (
                        <TableCell>
                          <Badge variant={product.available ? "default" : "destructive"} className="text-xs">
                            {product.available ? t('common.available') : t('common.outOfStock')}
                          </Badge>
                        </TableCell>
                      )}
                      {showDateColumns && (
                        <TableCell className="text-xs text-muted-foreground">
                          {product.createdAt ? formatPersianDate(product.createdAt, 'short') : 'N/A'}
                        </TableCell>
                      )}
                      {showDateColumns && (
                        <TableCell className="text-xs text-muted-foreground">
                          {product.updatedAt ? formatPersianDate(product.updatedAt, 'short') : 'N/A'}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filteredProducts.length === 0 && (
                      <div className="text-center py-12">
                        <div className="text-muted-foreground mb-2">{t('common.noProductsFound')}</div>
                        <div className="text-sm text-muted-foreground/70">
                          {t('common.tryAdjustingFilters')}
                        </div>
                      </div>
                    )}
        </CardContent>
      </Card>

      {/* Cart Summary - Only for customers and drivers */}
      {showAddToCart && (() => {
        const totalItems = storeCarts.reduce((total: number, cart: any) => {
          if (cart.items && Array.isArray(cart.items)) {
            return total + cart.items.length;
          }
          return total;
        }, 0);
        return totalItems > 0 ? (
          <Card>
            <CardHeader>
                           <CardTitle>{t('common.cartSummary')}</CardTitle>
                         </CardHeader>
            <CardContent>
              {storeCarts.flatMap((cart: any) => cart.items).map((item: any) => {
                const product = products.find(p => p._id === item.product._id);
                return product ? (
                  <div key={item.product._id} className="flex justify-between items-center py-1">
                    <span>{product.name}</span>
                    <span>{toPersianNumbers(item.quantity)} × {formatPersianCurrency(Number(product.price), product.currency)} = {formatPersianCurrency(Number(item.quantity) * Number(product.price), product.currency)}</span>
                  </div>
                ) : null;
              })}
              <div className="border-t pt-2 mt-2 font-bold">
                Total: {formatPersianCurrency(storeCarts.reduce((total: number, cart: any) => {
                  return total + cart.items.reduce((cartTotal: number, item: any) => {
                    const product = products.find(p => p._id === item.product._id);
                    return cartTotal + (product ? item.quantity * Number(product.price) : 0);
                  }, 0);
                }, 0), 'IRT')}
              </div>
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductCard
          user={user}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadProductsAndCategories();
            setShowAddModal(false);
          }}
          stores={allStores}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <EditProductCard
          user={user}
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            loadProductsAndCategories();
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

    
    </div>
  );
};

export default Products;