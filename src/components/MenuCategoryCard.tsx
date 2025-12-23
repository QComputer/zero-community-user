import React from 'react';
import { cn } from '@/lib/utils';

interface MenuCategoryCardProps {
  category: {
    _id: string;
    name: string;
    image?: string;
    color?: string;
  };
  isSelected: boolean;
  onClick: (categoryId: string) => void;
  className?: string;
}

const MenuCategoryCard: React.FC<MenuCategoryCardProps> = ({
  category,
  isSelected,
  onClick,
  className
}) => {
  

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-20 h-20 cursor-pointer transition-all duration-200 ease-in-out',
        isSelected ? 'transform scale-105' : 'transform scale-100',
        className
      )}
      onClick={() => onClick(category._id)}
    >
      {/* Category Image with colorful ring */}
      <div className="relative w-18 h-18  ">
        {/* Colorful ring */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 ',
          )}
          style={{
            borderColor: isSelected ? 'var(--primary)' : 'var(--background)',
            boxShadow: isSelected ? `0 0 20px var(--primary)` : 'none',
            background: 'transparent'
          }}
        />

        {/* Category Image */}
        <div className="relative  mx-0.5 w-17 h-17 rounded-full overflow-hidden flex items-center justify-center">
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
            >
              {category.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Category Name */}
      <div className="text-center">
        <p className={cn(
          'text-sm font-medium w-20 h-1 m-2 my-2',
          isSelected ? 'text-primary' : 'text-muted-foreground'
        )}>
          {category.name}
        </p>
      </div>
    </div>
  );
};

export default MenuCategoryCard;