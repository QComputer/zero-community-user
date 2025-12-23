import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MenuCategoryCard from './MenuCategoryCard';
import MenuProductCard from './MenuProductCard';
import { useCart } from '../hooks/useCart';
import { productAPI, categoryAPI } from '../services/api';

interface StoreMenuProps {
    storeId: string;
    catalogId?: string;
    className?: string;
}

const StoreMenu: React.FC<StoreMenuProps> = ({ storeId, catalogId, className }) => {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { handleAddToCart, getCartItemCount } = useCart();

    useEffect(() => {
        const fetchMenuData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch categories and products for the store in parallel
                const [productsResponse, categoriesResponse] = await Promise.all([
                    productAPI.getPublicList(storeId),
                    categoryAPI.publicList(storeId)
                ]);

                const productsData = (productsResponse.data as any[]) || [];
                const categoriesData = (categoriesResponse.data as any[]) || [];

                setCategories(categoriesData);
                setProducts(productsData);
            } catch (err) {
                console.error('Failed to fetch menu data:', err);
                setError('Failed to load menu data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchMenuData();
    }, [storeId]);

    const handleCategoryClick = (categoryId: string) => {
        if (categoryId === selectedCategory) {
            setSelectedCategory(null);
        } else {
            setSelectedCategory(categoryId);
        }
    };

    const handleAddToCartClick = (productId: string) => {
        handleAddToCart(productId, storeId, 1, catalogId || 'store-menu-' + storeId);
    };

    const handleRemoveFromCartClick = (productId: string) => {
        handleAddToCart(productId, storeId, -1, catalogId || 'store-menu-' + storeId);
    };

    const filteredProducts = selectedCategory
        ? products.filter(product => product.category?._id === selectedCategory)
        : products;

    return (
        <div className={className}>
            {/* Menu Header with Categories */}
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">{t('page.menu.menu')}</h2>

                {loading ? (
                    <div className="flex space-x-4 overflow-x-auto pb-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-20 h-24 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-destructive">{error}</div>
                ) : (
                    <div className="flex h-45 space-x-4 overflow-x-auto px-4 py-7">
                        {categories.map((category) => (
                            <MenuCategoryCard
                                key={category._id}
                                category={category}
                                isSelected={selectedCategory === category._id}
                                onClick={handleCategoryClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Products Grid */}
            <div>
                <h3 className="text-lg font-semibold mb-4 ">
                  {selectedCategory
                      ? `${t('page.menu.products')} (${filteredProducts.length})`
                      : `${t('page.menu.allProducts')} (${products.length})`}
                </h3>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-full h-48 rounded-lg bg-gray-200 animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-destructive">{error}</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {t('page.menu.noProducts')}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => (
                            <MenuProductCard
                                key={product._id}
                                product={product}
                                quantity={getCartItemCount(product._id)}
                                onAddToCart={handleAddToCartClick}
                                onRemoveFromCart={handleRemoveFromCartClick}
                            //onQuantityChange={() => {}} // Not needed for this implementation
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreMenu;