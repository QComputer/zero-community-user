import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { orderAPI } from '../services/api';
import { toast } from 'react-toastify';
import MapComponent from './MapComponent';
import AvatarLink from './AvatarLink';
import {
  Package,
  Clock,
  ChefHat,
  Truck,
  CheckCircle,
  DollarSign,
  CreditCard,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Laugh,
  Angry,
  Frown,
  Navigation
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
  customerRating?: number;
  customerComment?: string;
  customerReactions?: string[];
}

interface OrderCardCustomerProps {
  order: Order;
  onUpdate: () => void;
}

const OrderCardCustomer: React.FC<OrderCardCustomerProps> = ({ order, onUpdate }) => {
  const { t } = useTranslation();
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedReactions, setSelectedReactions] = useState<string[]>([]);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
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

  const handleReceive = async () => {
    try {
      await orderAPI.receiveOrder(order._id);
      toast.success(t('components.orderCard.orderReceived'));
      onUpdate();
    } catch (error: any) {
      toast.error(t('components.orderCard.failedToConfirmReceipt'));
    }
  };

  const handlePayment = async () => {
    try {
      if (order.payment) {
        await orderAPI.markOrderAsUnpaid(order._id);
        toast.success(t('components.orderCard.orderMarkedUnpaid'));
      } else {
        await orderAPI.markOrderAsPaid(order._id);
        toast.success(t('components.orderCard.orderMarkedPaid'));
      }
      onUpdate();
    } catch (error: any) {
      toast.error(t('components.orderCard.failedToProcessPayment'));
    }
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast.error(t('components.orderCard.pleaseSelectRating'));
      return;
    }

    setSubmittingFeedback(true);
    try {
      await orderAPI.addFeedback({
        orderId: order._id,
        rating,
        comment: comment.trim() || undefined,
        reactions: selectedReactions.length > 0 ? selectedReactions : undefined
      });
      toast.success(t('components.orderCard.thankYouForFeedback'));
      setShowFeedback(false);
      onUpdate();
    } catch (error: any) {
      toast.error(t('components.orderCard.failedToSubmitFeedback'));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const toggleReaction = (reaction: string) => {
    setSelectedReactions(prev =>
      prev.includes(reaction)
        ? prev.filter(r => r !== reaction)
        : [...prev, reaction]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'prepared': return 'bg-green-500';
      case 'pickedup': return 'bg-purple-500';
      case 'delivered': return 'bg-emerald-500';
      case 'received': return 'bg-teal-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'placed': return t('components.orderCard.orderPlaced');
      case 'accepted': return t('components.orderCard.orderAccepted');
      case 'prepared': return t('components.orderCard.orderPrepared');
      case 'pickedup': return t('components.orderCard.outForDelivery');
      case 'delivered': return t('components.orderCard.delivered');
      case 'received': return t('components.orderCard.received');
      case 'rejected': return t('components.orderCard.orderRejected');
      default: return status;
    }
  };

  const canConfirmReceipt = () => {
    return ['pickedup', 'prepared', 'delivered'].includes(order.status);
  };

  return (
    <Card className="w-full max-w-sm sm:max-w-md lg:max-w-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center">
              <AvatarLink
                src={order.store?.avatar}
                userId={order.store?._id}
                className="w-8 h-8 sm:w-10 sm:h-10 mr-2"
              >
                {order.store?.avatar ? (
                  <img
                    src={order.store.avatar}
                    alt={order.store.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 mr-2 flex items-center justify-center text-sm font-bold">
                    {order.store?.name?.charAt(0) || '?'}
                  </div>
                )}
              </AvatarLink>
              {order.store?.name || 'Unknown Store'}
            </CardTitle>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-white font-semibold px-2 sm:px-3 py-1 text-xs sm:text-sm`}>
            {getStatusText(order.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Order Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-green-600 bg-green-100 rounded-full p-1.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('components.orderCard.totalAmount')}</p>
              <p className="text-2xl font-bold">{formatAmount(order.amount + (order.deliveryFee || 0))}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-purple-600 bg-purple-100 rounded-full p-1.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('components.orderCard.items')}</p>
              <p className="text-2xl font-bold">{toPersianNumbers(order.items.length.toString())}</p>
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

        {/* Progress Tracking */}
        <div className="space-y-3 sm:space-y-4">
          <h4 className="font-semibold flex items-center text-sm sm:text-base">
            <Clock className="w-4 h-4 mr-2" />
            {t('components.orderCard.orderProgress')}
          </h4>

          <div className="space-y-3 sm:space-y-4">
            <div className=" rounded-lg p-3 sm:p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center font-medium">
                  <ChefHat className="w-4 h-4 mr-2 text-orange-600" />
                  {t('components.orderCard.preparationProgress')}
                </span>
                <span className="font-semibold">{toPersianNumbers(order.progressPrepare.toString())}%</span>
              </div>
              <Progress value={order.progressPrepare} className="h-3" />
              {order.minutesLeftPrepare && order.minutesLeftPrepare > 0 && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  ~{toPersianNumbers(order.minutesLeftPrepare?.toString() || '0')} {t('components.orderCard.minRemaining')}
                </p>
              )}
            </div>

            {order.isTakeout && (
              <div className=" rounded-lg p-3 sm:p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center font-medium">
                    <Truck className="w-4 h-4 mr-2 text-blue-600" />
                    {t('components.orderCard.delivery')}
                  </span>
                  <span className="font-semibold">{toPersianNumbers(order.progressDeliver.toString())}%</span>
                </div>
                <Progress value={order.progressDeliver} className="h-3" />
                {order.minutesLeftDeliver && order.minutesLeftDeliver > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    ~{toPersianNumbers(order.minutesLeftDeliver?.toString() || '0')} {t('components.orderCard.minRemaining')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Track On Map Button - Only show for active delivery orders not in final/rejected states */}
        {order.isTakeout && order.isActive && !['placed', 'received', 'rejected'].includes(order.status) && (
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

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          className={`w-full h-10 sm:h-12 text-base sm:text-lg font-semibold ${
            order.payment ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          {order.payment
            ? t('components.orderCard.markAsUnpaid')
            : t('components.orderCard.markAsPaid')
          }
        </Button>

        {/* Action Button */}
        {canConfirmReceipt() && (
          <Button
            onClick={handleReceive}
            className="w-full h-10 sm:h-12 text-base sm:text-lg font-semibold"
            variant="default"
          >
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {t('components.orderCard.confirmReceipt')}
          </Button>
        )}

        {/* Feedback Section */}
        {order.status === 'received' && !order.customerRating && (
          <div className="space-y-4">
            {!showFeedback ? (
              <Button
                onClick={() => setShowFeedback(true)}
                variant="outline"
                className="w-full"
              >
                <Star className="w-4 h-4 mr-2" />
                 {t('components.orderCard.shareYourFeedback')}
              </Button>
            ) : (
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold">{t('components.orderCard.shareYourFeedback')}</h4>

                {/* Rating */}
                <div>
                  <label className="text-sm font-medium">{t('components.orderCard.rating')}</label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reactions */}
                <div>
                  <label className="text-sm font-medium">{t('components.orderCard.reactions')}</label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {[
                      { icon: Heart, name: 'love', color: 'text-red-500' },
                      { icon: ThumbsUp, name: 'like', color: 'text-blue-500' },
                      { icon: ThumbsDown, name: 'dislike', color: 'text-gray-500' },
                      { icon: Laugh, name: 'laugh', color: 'text-yellow-500' },
                      { icon: Angry, name: 'angry', color: 'text-red-600' },
                      { icon: Frown, name: 'sad', color: 'text-orange-500' }
                    ].map(({ icon: Icon, name, color }) => (
                      <button
                        key={name}
                        onClick={() => toggleReaction(name)}
                        className={`p-2 rounded-full border ${
                          selectedReactions.includes(name)
                            ? 'bg-primary/10 border-primary'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${color}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="text-sm font-medium">{t('components.orderCard.comment')}</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('components.orderCard.tellUsAboutExperience')}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={submittingFeedback || rating === 0}
                    className="flex-1"
                  >
                    {submittingFeedback ? t('components.orderCard.submittingFeedback') : t('components.orderCard.submitFeedback')}
                  </Button>
                  <Button
                    onClick={() => setShowFeedback(false)}
                    variant="outline"
                  >
                    {t('components.orderCard.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show existing feedback */}
        {order.customerRating && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{t('components.orderCard.yourRating')}:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= (order.customerRating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            {order.customerReactions && order.customerReactions.length > 0 && (
              <div className="mb-2">
                <span className="font-medium">{t('components.orderCard.reactionsLabel')}:</span>
                <div className="flex gap-1 mt-1">
                  {order.customerReactions.map((reaction: string) => {
                    const reactionMap: any = {
                      love: { icon: Heart, color: 'text-red-500' },
                      like: { icon: ThumbsUp, color: 'text-blue-500' },
                      dislike: { icon: ThumbsDown, color: 'text-gray-500' },
                      laugh: { icon: Laugh, color: 'text-yellow-500' },
                      angry: { icon: Angry, color: 'text-red-600' },
                      sad: { icon: Frown, color: 'text-orange-500' }
                    };
                    const { icon: Icon, color } = reactionMap[reaction] || {};
                    return Icon ? <Icon key={reaction} className={`w-4 h-4 ${color}`} /> : null;
                  })}
                </div>
              </div>
            )}
            {order.customerComment && (
              <div>
                <span className="font-medium">{t('components.orderCard.commentLabel')}:</span>
                <p className="text-sm text-muted-foreground mt-1">{order.customerComment}</p>
              </div>
            )}
          </div>
        )}

        {/* Order Timestamp */}
        <div className="text-center pt-4 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center text-xs sm:text-sm text-muted-foreground gap-1">
            <div className="flex items-center justify-center">
              <Clock className="w-4 h-4 mr-1" />
              {t('components.orderCard.orderedOn')} {formatPersianDateTime(order.datePlaced)}
            </div>
            <div className="sm:ml-2">
              {t('components.orderCard.atTime')} {formatPersianDateTime(order.datePlaced)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCardCustomer;