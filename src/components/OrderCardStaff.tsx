import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { orderAPI } from '../services/api';
import { toast } from 'react-toastify';
import MapComponent from './MapComponent';
import AvatarLink from './AvatarLink';
import {
  Clock,
  MapPin,
  DollarSign,
  Package,
  CheckCircle,
  ChefHat,
  Truck,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  X,
  Navigation,
  CreditCard
} from 'lucide-react';
import { formatPersianDateTime, formatPersianCurrency, toPersianNumbers } from '@/lib/utils';

interface Order {
  _id: string;
  orderName?: string;
  status: string;
  amount: number;
  deliveryFee?: number;
  currency: 'IRT' | 'USD';
  payment: boolean;
  isTakeout: boolean;
  isActive?: boolean;
  items: any[];
  user: { _id?: string; username: string; name: string; avatar?: string };
  store: { _id?: string; username: string; name: string; avatar?: string; locationLat?: number; locationLng?: number };
  driver?: { _id?: string; username: string; name: string; avatar?: string; locationLat?: number; locationLng?: number };
  datePlaced: string;
  progressPrepare: number;
  progressPickup: number;
  progressDeliver: number;
  minutesLeftPrepare?: number;
  minutesLeftPickup?: number;
  minutesLeftDeliver?: number;
  datePrepared_byMarketer_est?: string;
  datePickedup_byDriver_est?: string;
  dateDelivered_byDriver_est?: string;
  stateGiven?: string;
}

interface OrderCardStaffProps {
  order: Order;
  user: any;
  onUpdate: () => void;
}

const OrderCardStaff: React.FC<OrderCardStaffProps> = ({ order, user, onUpdate }) => {
  const { t } = useTranslation();
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);

  const formatAmount = (amount: number) => {
    return formatPersianCurrency(amount, order.currency);
  };

  const getTrackingLocation = () => {
    // Before pickup: show store's location
    // After pickup until delivered: show driver's location
    if (order.status === 'pickedup' || order.status === 'delivered' || order.status === 'received') {
      // Show driver's location
      const driver = order.driver as any; // Type assertion for populated data
      return {
        lat: driver?.locationLat || 35.6892,
        lng: driver?.locationLng || 51.3890,
        name: driver?.name || t('components.orderCard.driverLocation')
      };
    } else {
      // Show store's location
      const store = order.store as any; // Type assertion for populated data
      return {
        lat: store?.locationLat || 35.6892,
        lng: store?.locationLng || 51.3890,
        name: store?.name || t('components.orderCard.storeLocation')
      };
    }
  };

  const handleAction = async (action: string) => {
    try {
      if (action === 'accept_store') {
        await orderAPI.acceptByStore(order._id);
        toast.success(t('components.orderCard.orderAccepted'));
      } else if (action === 'reject_store') {
        await orderAPI.rejectByStore(order._id);
        toast.success(t('components.orderCard.orderRejected'));
      } else if (action === 'prepare') {
        await orderAPI.prepareOrder(order._id);
        toast.success(t('components.orderCard.orderPrepared'));
      } else if (action === 'accept_driver') {
        await orderAPI.acceptByDriver(order._id);
        toast.success(t('components.orderCard.orderAcceptedForDelivery'));
      } else if (action === 'pickup') {
        await orderAPI.pickupOrder(order._id);
        toast.success(t('components.orderCard.orderPickedUp'));
      } else if (action === 'deliver') {
        await orderAPI.deliverOrder(order._id);
        toast.success(t('components.orderCard.orderDelivered'));
      } else if (action.startsWith('adjust_prepare_')) {
        const minutes = parseInt(action.split('_')[2]);
        await orderAPI.adjustPreparationTime(order._id, minutes);
        toast.success(minutes > 0 ? t('components.orderCard.preparationTimeExtended', { minutes: Math.abs(minutes) }) : t('components.orderCard.preparationTimeReduced', { minutes: Math.abs(minutes) }));
      } else if (action.startsWith('adjust_pickup_')) {
        const minutes = parseInt(action.split('_')[2]);
        await orderAPI.adjustPickupTime(order._id, minutes);
        toast.success(minutes > 0 ? t('components.orderCard.pickupTimeExtended', { minutes: Math.abs(minutes) }) : t('components.orderCard.pickupTimeReduced', { minutes: Math.abs(minutes) }));
      } else if (action.startsWith('adjust_deliver_')) {
        const minutes = parseInt(action.split('_')[2]);
        await orderAPI.adjustDeliveryTime(order._id, minutes);
        toast.success(minutes > 0 ? t('common.components.orderCard.deliveryTimeExtended', { minutes: Math.abs(minutes) }) : t('common.components.orderCard.deliveryTimeReduced', { minutes: Math.abs(minutes) }));
      }
      onUpdate();
      // Dispatch event to refresh navigation counts
      window.dispatchEvent(new CustomEvent('orderUpdate'));
    } catch (error: any) {
      toast.error(t('components.orderCard.failedToActionOrder', { action }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'accepted-by-driver': return 'bg-indigo-500';
      case 'prepared': return 'bg-green-500';
      case 'pickedup': return 'bg-purple-500';
      case 'delivered': return 'bg-emerald-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderTimeAdjustmentButtons = (type: 'prepare' | 'pickup' | 'deliver') => {
    const timeAdjustments = [5, 3, 1, -1, -3, -5];
    const actionPrefix = `adjust_${type}_`;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {timeAdjustments.map((minutes) => (
          <Button
            key={`${type}_${minutes}`}
            variant="outline"
            size="sm"
            onClick={() => handleAction(`${actionPrefix}${minutes}`)}
            className="h-8 px-2 text-xs"
          >
            {minutes > 0 ? <Plus className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
            {Math.abs(minutes)}m
          </Button>
        ))}
      </div>
    );
  };

  const renderActionButtons = () => {
    const buttons = [];

    if (user?.role === 'store') {
      if (order.status === 'placed') {
        buttons.push(
          <div key="actions" className="flex gap-2">
            <Button onClick={() => handleAction('accept_store')} className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('components.orderCard.accept')}
            </Button>
            <Button onClick={() => handleAction('reject_store')} variant="destructive" className="flex-1">
              <X className="w-4 h-4 mr-2" />
              {t('components.orderCard.reject')}
            </Button>
          </div>
        );
      } else if (order.status === 'accepted') {
        buttons.push(
          <Button key="prepare" onClick={() => handleAction('prepare')} className="w-full mb-3">
            <ChefHat className="w-4 h-4 mr-2" />
            {t('components.orderCard.markAsPrepared')}
          </Button>
        );

        // Time adjustment section
        buttons.push(
          <div key="time-adjust" className="border-t pt-3">
            <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
              <Clock className="w-4 h-4 mr-1" />
              {t('components.orderCard.adjustPreparationTime')}
            </div>
            {renderTimeAdjustmentButtons('prepare')}
          </div>
        );
      }
    } else if (user?.role === 'driver') {
      // Check if this is an available order (no driver assigned yet)
      const isAvailableOrder = !order.driver && order.stateGiven === 'by-store';

      if (isAvailableOrder && order.isTakeout) {
        buttons.push(
          <Button key="accept_driver" onClick={() => handleAction('accept_driver')} className="w-full mb-3">
            <Truck className="w-4 h-4 mr-2" />
            {t('components.orderCard.acceptDelivery')}
          </Button>
        );
      } else if (order.driver && order.isTakeout) {
        // Show pickup button when order is prepared or accepted-by-driver
        if (order.status === 'prepared' || order.status === 'accepted-by-driver') {
          buttons.push(
            <Button
              key="pickup"
              onClick={() => handleAction('pickup')}
              disabled={order.status !== 'prepared'}
              className="w-full mb-3"
            >
              <Package className="w-4 h-4 mr-2" />
              {t('components.orderCard.pickUpOrder')}
              {order.status !== 'prepared' && (
                <span className="ml-2 text-xs opacity-75">({t('components.orderCard.waitingForPreparation')})</span>
              )}
            </Button>
          );
        }

        // Time adjustment section - show for accepted orders (after driver accepts, before pickup)
        if (order.status === 'accepted' || order.status === 'accepted-by-driver') {
          buttons.push(
            <div key="time-adjust-pickup" className="border-t pt-3">
              <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                <Clock className="w-4 h-4 mr-1" />
                {t('components.orderCard.adjustPickupTime')}
              </div>
              {renderTimeAdjustmentButtons('pickup')}
            </div>
          );
        }

        // Show deliver button when order is picked up
        if (order.status === 'pickedup') {
          buttons.push(
            <Button key="deliver" onClick={() => handleAction('deliver')} className="w-full mb-3">
              <MapPin className="w-4 h-4 mr-2" />
              {t('components.orderCard.deliverToCustomer')}
            </Button>
          );

          // Time adjustment section for delivery
          buttons.push(
            <div key="time-adjust-deliver" className="border-t pt-3">
              <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                <Clock className="w-4 h-4 mr-1" />
                {t('components.orderCard.adjustDeliveryTime')}
              </div>
              {renderTimeAdjustmentButtons('deliver')}
            </div>
          );
        }
      }
    }

    return buttons;
  };

  return (
    <Card className="w-full max-w-sm sm:max-w-md lg:max-w-2xl shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg font-bold flex flex-col gap-1">
              {user?.role === 'store' ? (
                <>
                  {/* Customer */}
                  <div className="flex items-center gap-1">
                    <AvatarLink
                      src={order.user?.avatar}
                      userId={order.user?._id}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    >
                      {order.user?.avatar ? (
                        <img
                          src={order.user.avatar}
                          alt={order.user.name}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                          {order.user?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </AvatarLink>
                    <span className="text-sm sm:text-base">{order.user?.name || 'Unknown'}</span>
                  </div>
                  {/* Driver if assigned */}
                  {order.driver && (
                    <div className="flex items-center gap-1">
                      <AvatarLink
                        src={order.driver?.avatar}
                        userId={order.driver?._id}
                        className="w-5 h-5 sm:w-6 sm:h-6"
                      >
                        {order.driver.avatar ? (
                          <img
                            src={order.driver.avatar}
                            alt={order.driver.name}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                            {order.driver.name.charAt(0)}
                          </div>
                        )}
                      </AvatarLink>
                      <span className="text-sm sm:text-base">{order.driver.name}</span>
                    </div>
                  )}
                </>
              ) : user?.role === 'driver' ? (
                <>
                  {/* Customer */}
                  <div className="flex items-center gap-1">
                    <AvatarLink
                      src={order.user?.avatar}
                      userId={order.user?._id}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    >
                      {order.user?.avatar ? (
                        <img
                          src={order.user.avatar}
                          alt={order.user.name}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                          {order.user?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </AvatarLink>
                    <span className="text-sm sm:text-base">{order.user?.name || 'Unknown'}</span>
                  </div>
                  {/* store */}
                  <div className="flex items-center gap-1">
                    <AvatarLink
                      src={order.store?.avatar}
                      userId={order.store?._id}
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    >
                      {order.store?.avatar ? (
                        <img
                          src={order.store.avatar}
                          alt={order.store.name}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                          {order.store?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </AvatarLink>
                    <span className="text-sm sm:text-base">{order.store?.name || 'Unknown'}</span>
                  </div>
                </>
              ) : (
                <span>{t('components.orderCard.order')}</span>
              )}
            </CardTitle>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-white font-semibold px-2 sm:px-3 py-1 text-xs sm:text-sm`}>
            {order.status === 'placed' ? t('components.orderCard.orderPlaced') :
             order.status === 'accepted' ? t('components.orderCard.orderAccepted') :
             order.status === 'accepted-by-driver' ? t('components.orderCard.driverAccepted') :
             order.status === 'prepared' ? t('components.orderCard.orderPrepared') :
             order.status === 'pickedup' ? t('components.orderCard.outForDelivery') :
             order.status === 'delivered' ? t('components.orderCard.delivered') :
             order.status === 'received' ? t('components.orderCard.received') :
             order.status === 'rejected' ? t('components.orderCard.orderRejected') :
             order.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Order Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('components.orderCard.orderAmount')}</p>
                <p className="text-xl sm:text-2xl font-bold">{formatAmount(order.amount)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('components.orderCard.deliveryFee')}</p>
                <p className="text-base sm:text-lg font-semibold">{formatAmount(order.deliveryFee || 0)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-2 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('components.orderCard.type')}</p>
                <p className="text-base sm:text-lg font-semibold">{order.isTakeout ? t('components.orderCard.delivery') : t('components.orderCard.inStore')}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('components.orderCard.placed')}</p>
                <p className="text-xs sm:text-sm font-semibold">{formatPersianDateTime(order.datePlaced)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm sm:text-base flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
              {t('components.orderCard.paymentStatus')}
            </span>
            <Badge
              className={`${
                order.payment
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              } text-white font-semibold`}
            >
              {order.payment
                ? t('components.orderCard.paid')
                : t('components.orderCard.unpaid')
              }
            </Badge>
          </div>
        </div>

        {/* Items List */}
        <div className="border-t pt-4">
          <button
            onClick={() => setItemsExpanded(!itemsExpanded)}
            className="font-semibold mb-3 flex items-center text-sm sm:text-base w-full justify-between hover:bg-muted/50 rounded p-2 transition-colors"
          >
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-2" />
              {t('components.orderCard.orderItems')} ({toPersianNumbers(order.items.length.toString())})
            </div>
            {itemsExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {itemsExpanded && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="font-medium text-sm sm:text-base">{item.name}</span>
                  <Badge variant="secondary" className="text-xs">x{item.quantity}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Bars */}
        <div className="space-y-3 sm:space-y-4 border-t pt-4">
          <h4 className="font-semibold flex items-center text-sm sm:text-base">
            <Clock className="w-4 h-4 mr-2" />
            {t('components.orderCard.progressTracking')}
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center">
                  <ChefHat className="w-4 h-4 mr-1 text-orange-600" />
                  {t('components.orderCard.preparationProgress')}
                </span>
                <span className="font-semibold">{toPersianNumbers(order.progressPrepare.toString())}%</span>
              </div>
              <Progress value={order.progressPrepare} className="h-3" />
              {order.minutesLeftPrepare && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {toPersianNumbers(order.minutesLeftPrepare?.toString() || '0')} {t('components.orderCard.minRemaining')}
                </p>
              )}
            </div>

            {order.driver && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center">
                    <Package className="w-4 h-4 mr-1 text-purple-600" />
                    {t('components.orderCard.pickupProgress')}
                  </span>
                  <span className="font-semibold">{toPersianNumbers(order.progressPickup.toString())}%</span>
                </div>
                <Progress value={order.progressPickup} className="h-3" />
                {order.minutesLeftPickup && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {toPersianNumbers(order.minutesLeftPickup?.toString() || '0')} {t('components.orderCard.minRemaining')}
                  </p>
                )}
              </div>
            )}

            {order.isTakeout && order.driver && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center">
                    <Truck className="w-4 h-4 mr-1 text-blue-600" />
                    {t('components.orderCard.deliveryProgress')}
                  </span>
                  <span className="font-semibold">{toPersianNumbers(order.progressDeliver.toString())}%</span>
                </div>
                <Progress value={order.progressDeliver} className="h-3" />
                {order.minutesLeftDeliver && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {toPersianNumbers(order.minutesLeftDeliver?.toString() || '0')} {t('components.orderCard.minRemaining')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4">
          <div className="space-y-3">
            {/* Track On Map Button - Only show for active orders not in final/rejected states */}
            {order.isActive && !['placed', 'received', 'rejected'].includes(order.status) && (
              <div className="flex justify-center">
                <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      {t('components.orderCard.trackOnMap')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{t('components.orderCard.orderTracking')} - {getTrackingLocation().name}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <MapComponent
                        latitude={getTrackingLocation().lat}
                        longitude={getTrackingLocation().lng}
                        height="400px"
                        userName={getTrackingLocation().name}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {renderActionButtons()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCardStaff;