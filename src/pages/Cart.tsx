import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { cartAPI, orderAPI, isAuthenticated } from '../services/api';
import { logUserAction } from '../services/logger';
import MapComponent from '../components/MapComponent';
import InteractiveMapComponent from '../components/InteractiveMapComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Navigation, Maximize2, Store, User, Mail, Phone } from 'lucide-react';
import { Cart } from '../services/api';
import { useCart, StoreCart } from '@/hooks/useCart'

interface CartProps {
  user?: any;
}

const MyCart: React.FC<CartProps> = ({ user }) => {
  const { t } = useTranslation();
  const { storeCarts, setStoreCarts, loading, handleAddToCart, loadCart } = useCart();
  const [isTakeout, setIsTakeout] = useState(false);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(35.6892); // Tehran default
  const [longitude, setLongitude] = useState(51.3890);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [placingOrder, setPlacingOrder] = useState<string | null>(null); // Track which catalog order is being placed
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const navigate = useNavigate();

  const updateQuantity = async (productId: string, quantity: number, catalogId: string) => {
    try {
      if (quantity <= 0) {
        await cartAPI.removeFromCart(productId);
      } else {
        await cartAPI.updateCart(productId, quantity, catalogId);
      }
      loadCart(); // Refresh cart
      logUserAction('update_cart', { productId, quantity, userId: user._id });
    } catch (error: any) {
      toast.error('Failed to update cart');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        toast.success('Location updated successfully');
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Failed to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        toast.error(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setShowMapDialog(false);
    toast.success('Delivery location selected');
  };

  // Calculate subtotal for a specific catalog cart
  const calculateSubtotal = (cart: Cart | StoreCart) => {
    return cart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  // Calculate driver fee (only for takeout)
  const calculateDriverFee = () => {
    return isTakeout ? 50000 : 0; // Fixed driver fee for takeout orders in IRT
  };

  const calculateStoreTotal = (storeCart: StoreCart) => {
    return calculateSubtotal(storeCart) + calculateDriverFee();
  };

  const placeOrder = async (storeCart: StoreCart) => {
    try {
      setPlacingOrder(storeCart.storeId);
      const orderData = {
        storeId: storeCart.storeId,
        userId: user?._id || localStorage.getItem('guest_session_id'),
        items: storeCart.items.map(item => ({
          productId: item.product._id,
          productName: item.product.name,
          catalogId: item.catalog._id,
          quantity: item.quantity,
        })),
        deliveryAddress: isTakeout ? address : undefined,
        phone: user?.phone || '',
        isTakeout: isTakeout,
        deliveryFee: calculateDriverFee(),
        amount: calculateStoreTotal(storeCart)
      };

      console.log('Placing order:', orderData);

      const response = await orderAPI.placeOrder(orderData);
      console.log('Order placement response:', response);

      if (user) {
        logUserAction('place_store_order', {
          userId: user._id,
          storeId: storeCart.storeId,
          storeName: storeCart.storeName,
          items: orderData.items
        });
      }

      toast.success(`Order placed successfully for ${storeCart.storeName || storeCart.storeId}!`);

      // Remove this store cart from local state
      setStoreCarts(prev => prev.filter(sc => sc.storeId !== storeCart.storeId));

      // Navigate to orders page for authenticated users
      if (user) {
        navigate('/orders');
      } else {
        // For guest users, show order tracking info
        toast.info('Your order has been placed. You can track it using the order ID provided. Please save it for reference.');
      }
    } catch (error: any) {
      console.error('Order placement error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(null);
    }
  };

  const placeGuestOrder = async (storeCart: StoreCart) => {
    try {
      setPlacingOrder(storeCart.storeId);

      const orderData = {
        storeId: storeCart.storeId,
        items: storeCart.items.map(item => ({
          productId: item.product._id,
          productName: item.product.name,
          catalogId: item.catalog._id,
          quantity: item.quantity,
        })),
        deliveryAddress: isTakeout ? address : undefined,
        phone: guestInfo.phone,
        isTakeout: isTakeout,
        deliveryFee: calculateDriverFee(),
        amount: calculateStoreTotal(storeCart)
      };

      console.log('Placing guest order:', orderData);

      const response = await orderAPI.placeOrder(orderData);
      console.log('Guest order placement response:', response);

      toast.success(`Order placed successfully for ${storeCart.storeName || storeCart.storeId}!`);

      // Remove this cart from local state
      setStoreCarts(prev => prev.filter(sc => sc.storeId !== storeCart.storeId));

      // Close guest form and reset
      setShowGuestForm(false);
      setGuestInfo({ name: '', phone: '', email: '' });

      // Show order tracking info for guest users
      toast.info('Your order has been placed. The store owner will contact you for order tracking.');

    } catch (error: any) {
      console.error('Guest order placement error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground">Loading cart...</div>
      </div>
    );
  }

  const hasItems = storeCarts.length > 0;
  const totalItems = storeCarts.reduce((sum, cart) => {
    if (cart.items && Array.isArray(cart.items)) {
      return sum + cart.items.reduce((catalogSum, item) => catalogSum + item.quantity, 0);
    }
    return sum;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('page.cart.shoppingCart')}</h1>
        <p className="text-muted-foreground mt-2">
          {hasItems ? `${totalItems} item${totalItems !== 1 ? 's' : ''} from ${storeCarts.length} catalog${storeCarts.length !== 1 ? 's' : ''}` : 'Your cart is empty'}
        </p>
      </div>

      {!hasItems ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              <div className="text-lg font-medium mb-2">{t('page.cart.yourCartIsEmpty')}</div>
              <p className="text-sm">Browse catalogs and add products to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* store-based Cart Items */}
          {storeCarts.map((storeCart) => (
            <Card key={storeCart.storeId} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-xl">{storeCart.storeName || 'Store Cart'}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        by {storeCart.storeName || 'Unknown Store'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {storeCart.items && Array.isArray(storeCart.items) ? storeCart.items.length : 0} item{(storeCart.items && storeCart.items.length !== 1) ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Cart Items for this store */}
                  <div className="lg:col-span-2 space-y-4">
                    {storeCart.items.map((item) => (
                      <Card key={item.product._id + storeCart.storeId} className="transition-shadow hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{item.product.name}</h3>
                              <p className="text-muted-foreground text-sm mt-1">
                                Quantity: {item.quantity} × {item.product.price.toFixed(2)} {t('common.iranToman')}
                              </p>
                              <p className="text-sm font-medium text-primary mt-1">
                                {(item.product.price * item.quantity).toFixed(2)} {t('common.iranToman')}
                              </p>
                            </div>
                            <div className="flex flex-col border border-input rounded-md overflow-hidden w-fit">
                              <Button
                                onClick={() => handleAddToCart(item.product._id, storeCart.storeId, 1, item.catalog._id)}
                                variant="ghost"
                                size="sm"
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-none border-0 hover:bg-muted text-sm font-medium"
                              >
                                +
                              </Button>
                              <div className="text-xs font-medium text-center py-1 bg-muted/50 border-y border-input min-w-[1.5rem]">
                                {item.quantity}
                              </div>
                              <Button
                                onClick={() => item.quantity === 1 ?
                                  updateQuantity(item.product._id, 0, item.catalog._id) :
                                  updateQuantity(item.product._id, item.quantity - 1, item.catalog._id)
                                }
                                variant="ghost"
                                size="sm"
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-none border-0 hover:bg-muted text-sm font-medium ${item.quantity === 1 ? 'text-destructive hover:text-destructive' : ''
                                  }`}
                              >
                                {item.quantity === 1 ? '×' : '−'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Order Summary for this store */}
                  <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                      <CardHeader>
                        <CardTitle className="text-lg">Order Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Price Breakdown */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                              Items ({storeCart.items.reduce((sum, item) => sum + item.quantity, 0)})
                            </span>
                            <span className="font-medium">{calculateSubtotal(storeCart).toFixed(0)} {t('common.iranToman')}</span>
                          </div>

                          {isTakeout && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Driver Fee</span>
                              <span className="font-medium">{calculateDriverFee().toFixed(0)} {t('common.iranToman')}</span>
                            </div>
                          )}

                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold">Total</span>
                              <span className="text-lg font-bold text-primary">{calculateStoreTotal(storeCart).toFixed(0)} {t('common.iranToman')}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            if (isAuthenticated()) {
                              placeOrder(storeCart);
                            } else {
                              setShowGuestForm(true);
                            }
                          }}
                          className="w-full text-sm sm:text-base"
                          size="lg"
                          disabled={placingOrder === storeCart.storeId}
                        >
                          {placingOrder === storeCart.storeId ? 'Placing Order...' :
                            isAuthenticated() ? 'Place Order' : 'Continue as Guest'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Global Delivery Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="takeout"
                    checked={isTakeout}
                    onChange={(e) => setIsTakeout(e.target.checked)}
                    className="rounded border-input"
                  />
                  <Label htmlFor="takeout" className="text-sm font-medium cursor-pointer">
                    Delivery Order (applies to all orders)
                  </Label>
                </div>

                {isTakeout && (
                  <div className="space-y-4 pl-6 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Enter delivery address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Delivery Location</Label>
                      <div className="relative rounded-md overflow-hidden border">
                        <MapComponent
                          latitude={latitude}
                          longitude={longitude}
                          height="120px"
                          userName="Delivery Location"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowMapDialog(true)}
                          className="absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8 p-0"
                        >
                          <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2 sm:gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={getCurrentLocation}
                          disabled={gettingLocation}
                          className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3"
                        >
                          <Navigation className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {gettingLocation ? 'Getting...' : 'Current Location'}
                          </span>
                        </Button>
                        <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3"
                            >
                              <MapPin className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                              <span className="truncate">Select on Map</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Select Delivery Location</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              <InteractiveMapComponent
                                latitude={latitude}
                                longitude={longitude}
                                onLocationSelect={handleLocationSelect}
                                height="500px"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Guest Contact Information Dialog */}
      <Dialog open={showGuestForm} onOpenChange={setShowGuestForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Information</DialogTitle>
            <DialogDescription>
              Please provide your contact information to place your order. This information will be shared with the store owner for order processing and delivery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="guest-name"
                type="text"
                placeholder="Enter your full name"
                value={guestInfo.name}
                onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="guest-phone"
                type="tel"
                placeholder="Enter your phone number"
                value={guestInfo.phone}
                onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="Enter your email address"
                value={guestInfo.email}
                onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowGuestForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Place order for all store carts
                storeCarts.forEach(cart => placeGuestOrder(cart));
              }}
              disabled={placingOrder !== null || !guestInfo.name || !guestInfo.phone || !guestInfo.email}
              className="flex-1"
            >
              {placingOrder ? 'Placing Order...' : `Place Order (${storeCarts.length} ${storeCarts.length === 1 ? 'Store' : 'Stores'})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyCart;