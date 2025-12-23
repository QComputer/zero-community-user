import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { toPersianNumbers } from '@/lib/utils';

interface Product {
  _id: string;
  name: string;
  price: number;
  image?: string;
  available: boolean;
  currency?: string;
}

interface ProductCardSmallProps {
  product: Product;
  onAddToCart?: (productId: string, quantity: number) => void;
  quantity: number
}

const ProductCardSmall: React.FC<ProductCardSmallProps> = ({ product, onAddToCart, quantity }) => {
  const { t } = useTranslation();
  
  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product._id, 1);
    }
    quantity += 1;
  };

  const handleRemove = () => {
    if (onAddToCart) {
      onAddToCart(product._id, -1);
    }
    quantity -= 1;
  };

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {/* Small Image */}
          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground text-xs">{t("common.noImage")}</div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{product.name}</h3>
            <p className="text-primary font-semibold text-sm">${toPersianNumbers(product.price.toString())}{product.currency === 'IRT' ? ` ${t('common.iranToman')}` : ''}</p>
            {!product.available && (
              <span className="text-xs text-muted-foreground">{t("common.outOfStock")}</span>
            )}
          </div>

          {/* Button Group */}
          {product.available && (
            <div className="flex flex-col border border-input rounded-md overflow-hidden flex-shrink-0 w-fit">
              <Button
                onClick={handleAdd}
                variant="ghost"
                size="sm"
                className="w-6 h-6 rounded-none border-0 hover:bg-muted text-sm font-medium"
              >
                +
              </Button>
              <div className="text-xs font-medium text-center py-1 bg-muted/50 border-y border-input min-w-[1.5rem]">
                {toPersianNumbers(quantity.toString())}
              </div>
              <Button
                onClick={quantity === 1 ? handleRemove : handleRemove}
                variant="ghost"
                size="sm"
                className={`w-6 h-6 rounded-none border-0 hover:bg-muted text-sm font-medium ${
                  quantity === 1 ? 'text-destructive hover:text-destructive' : ''
                }`}
              >
                {quantity === 1 ? '×' : '−'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCardSmall;