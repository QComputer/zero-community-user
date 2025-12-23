import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { cn, toPersianNumbers } from '@/lib/utils';
import { Plus, Minus, X, Heart } from 'lucide-react';
import { userAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

interface MenuProductCardProps {
  product: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    available: boolean;
    currency?: string;
    ratings?: number;
    store: string;
    reactions?: string[];
    category: string;
  };
  quantity: number;
  onAddToCart: (productId: string) => void;
  onRemoveFromCart: (productId: string) => void;
  //onQuantityChange: (productId: string, quantity: number, catalogId) => void;
  className?: string;
  user?: any; // Add user prop for favorites functionality
}

const MenuProductCard: React.FC<MenuProductCardProps> = ({
  product,
  quantity,
  onAddToCart,
  onRemoveFromCart,
  //onQuantityChange,
  className,
  user
}) => {
  // Remove unused theme variable
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const { t } = useTranslation();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product._id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveFromCart(product._id);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || user.role !== 'customer') {
      toast.error('Please log in as a customer to add favorites');
      return;
    }

    setLoadingFavorite(true);
    try {
      if (isFavorite) {
        await userAPI.removeFromFavorites(user._id, product._id);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await userAPI.addToFavorites(user._id, product._id);
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setLoadingFavorite(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Load favorites when component mounts or user/product changes
  useEffect(() => {
    const loadFavorites = async () => {
      if (user && user.role === 'customer') {
        try {
          const response = await userAPI.getFavorites(user._id);
          const favorites = response.data || [];
          setIsFavorite(favorites.some((fav: any) => fav._id === product._id));
        } catch (error) {
          console.error('Failed to load favorites:', error);
        }
      }
    };

    loadFavorites();
  }, [user, product._id]);

  return (
    <>
      <div className={cn(
        `relative rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md
        bg-background border`,
        !product.available && 'opacity-70 grayscale',
        className
      )}>
      {/* Product Image */}
      <div className="relative aspect-square bg-muted cursor-pointer" onClick={handleImageClick}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <span className="text-muted-foreground text-sm">{t("common.noImage")}</span>
          </div>
        )}

        {/* Favorite Button - Top Right */}
        <button
          onClick={handleToggleFavorite}
          disabled={loadingFavorite || !user || user.role !== 'customer'}
          className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-sm hover:bg-background transition-colors disabled:opacity-50"
          title={!user ? 'Log in to favorite' : user.role !== 'customer' ? 'Customer account required' : isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`h-4 w-4 ${
              isFavorite
                ? 'fill-destructive text-destructive'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm mb-1 line-clamp-1">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-primary">
            {product.currency === 'USD' ? '$' : ''}{toPersianNumbers(product.price.toFixed(2))}{product.currency === 'IRT' ? ` ${t('common.iranToman')}` : ''}
          </span>
          {!product.available && (
            <span className="text-xs text-destructive">{t("common.outOfStock")}</span>
          )}
        </div>

        {/* Cart Controls */}
        <div className="flex items-center justify-center space-x-2">
          <Button
            onClick={handleRemove}
            variant="outline"
            size="sm"
            disabled={!product.available || quantity <= 0}
            className="h-8 w-8 p-0"
          >
            {quantity === 1 ? <X className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          </Button>
          <span className="w-8 text-center font-medium text-sm">{toPersianNumbers(quantity.toString())}</span>
          <Button
            onClick={handleAdd}
            variant="outline"
            size="sm"
            disabled={!product.available}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Overlay for unavailable products */}
      {!product.available && (
        <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center">
          <span className="bg-background px-2 py-1 rounded text-xs font-medium text-destructive">
            {t("common.notAvailable")}
          </span>
        </div>
      )}
    </div>

   
      </>
  );
};

export default MenuProductCard;