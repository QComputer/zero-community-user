import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { orderAPI } from '../services/api';
import OrderCardStaff from '../components/OrderCardStaff';
import OrderCardCustomer from '../components/OrderCardCustomer';
import OrderFilters, { OrderFilters as OrderFiltersType } from '../components/OrderFilters';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Grid, List, Eye, Clock, MapPin, DollarSign } from 'lucide-react';
import { formatPersianDateTime, formatPersianCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Custom hook for batch progress updates
const useBatchProgressUpdates = (orders: any[]) => {
  const [progressData, setProgressData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (orders.length === 0) return;

    const updateProgress = async () => {
      try {
        const orderIds = orders.map(order => order._id);
        const progressArray: any = await orderAPI.getOrdersProgress(orderIds);
        const progressMap: Record<string, any> = {};
        progressArray.forEach((progress: any) => {
          progressMap[progress._id] = progress;
        });
        setProgressData(progressMap);
      } catch (error) {
        // Silently fail for progress updates
      }
    };

    // Update immediately
    updateProgress();

    // Update every 2 seconds for batch updates
    const interval = setInterval(updateProgress, 2000);

    return () => clearInterval(interval);
  }, [orders]);

  return progressData;
};

interface OrdersProps {
  user: any;
}

const Orders: React.FC<OrdersProps> = ({ user }) => {
    const { t } = useTranslation();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFiltersType>(user?.role === 'store' ? { status: ['placed', 'accepted'] } : {});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'assigned' | 'available'>('assigned');

  // Use batch progress updates
  const progressData = useBatchProgressUpdates(orders);

  useEffect(() => {
    loadOrders();
  }, [user]);

  // Determine which orders to display based on active tab
  const displayOrders = user?.role === 'driver' && activeTab === 'available' ? availableOrders : orders;
  const displayFilteredOrders = useMemo(() => {
    const ordersArray = Array.isArray(displayOrders) ? displayOrders : [];
    return ordersArray.filter((order) => {
      // Status filter
      if (filters.status && filters.status.length > 0 && !filters.status.includes(order.status)) {
        return false;
      }

      // Date and time range filter
      if (filters.dateFrom || filters.dateTo || filters.timeFrom || filters.timeTo) {
        const orderDate = new Date(order.datePlaced);

        // Date filtering
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (filters.timeFrom) {
            const [hours, minutes] = filters.timeFrom.split(':');
            fromDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          } else {
            fromDate.setHours(0, 0, 0, 0); // Start of day
          }
          if (orderDate < fromDate) return false;
        }

        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          if (filters.timeTo) {
            const [hours, minutes] = filters.timeTo.split(':');
            toDate.setHours(parseInt(hours), parseInt(minutes), 59, 999);
          } else {
            toDate.setHours(23, 59, 59, 999); // End of day
          }
          if (orderDate > toDate) return false;
        }

        // Time-only filtering (if dates are not set but times are)
        if (!filters.dateFrom && !filters.dateTo && (filters.timeFrom || filters.timeTo)) {
          const orderTime = orderDate.getHours() * 60 + orderDate.getMinutes();

          if (filters.timeFrom) {
            const [hours, minutes] = filters.timeFrom.split(':');
            const fromTime = parseInt(hours) * 60 + parseInt(minutes);
            if (orderTime < fromTime) return false;
          }

          if (filters.timeTo) {
            const [hours, minutes] = filters.timeTo.split(':');
            const toTime = parseInt(hours) * 60 + parseInt(minutes);
            if (orderTime > toTime) return false;
          }
        }
      }

      // Price range filter
      if (filters.priceMin || filters.priceMax) {
        const orderAmount = Number(order.amount || 0);
        const minPrice = filters.priceMin ? Number(filters.priceMin) : null;
        const maxPrice = filters.priceMax ? Number(filters.priceMax) : null;

        if (minPrice !== null && orderAmount < minPrice) return false;
        if (maxPrice !== null && orderAmount > maxPrice) return false;
      }

      // Order type filter
      if (filters.orderType) {
        const isTakeout = filters.orderType === 'delivery';
        if (order.isTakeout !== isTakeout) return false;
      }

      // Driver assignment filter (for stores and drivers)
      if (filters.hasDriver && (user?.role === 'store' || user?.role === 'driver')) {
        const hasDriver = !!order.driver;
        const shouldHaveDriver = filters.hasDriver === 'assigned';
        if (hasDriver !== shouldHaveDriver) return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const matchesOrderId = order._id.toLowerCase().includes(searchTerm);
        const matchesOrderName = order.orderName?.toLowerCase().includes(searchTerm);

        let matchesCustomer = false;
        if (user?.role !== 'customer') {
          matchesCustomer = order.user?.name?.toLowerCase().includes(searchTerm) ||
                            order.user?.username?.toLowerCase().includes(searchTerm);
        }

        if (!matchesOrderId && !matchesOrderName && !matchesCustomer) {
          return false;
        }
      }

      return true;
    });
  }, [displayOrders, filters, user?.role]);

  const handleFiltersChange = (newFilters: OrderFiltersType) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const loadOrders = async () => {
    try {
      let ordersData: any;
      if (user?.role === 'customer') {
        const response = await orderAPI.getUserOrders();
        ordersData = Array.isArray(response) ? response : (response?.data || []);
      } else if (user?.role === 'store') {
        const response = await orderAPI.getStoreOrders();
        ordersData = Array.isArray(response) ? response : (response?.data || []);
      } else if (user?.role === 'driver') {
        // Load both assigned and available orders for drivers
        const [assignedResponse, availableResponse] = await Promise.all([
          orderAPI.getDriverOrders(),
          orderAPI.getAvailableForDriver()
        ]);
        const assignedData = Array.isArray(assignedResponse) ? assignedResponse : (assignedResponse?.data || []);
        const availableData = Array.isArray(availableResponse) ? availableResponse : (availableResponse?.data || []);
        setOrders(assignedData);
        setAvailableOrders(availableData);
        return;
      } else if (user?.role === 'admin') {
        const response = await orderAPI.getAllOrders();
        ordersData = Array.isArray(response) ? response : (response?.data || []);
      } else if (!user || user?.role === 'guest') {
        // Handle guest users
        const response = await orderAPI.getGuestOrders();
        ordersData = Array.isArray(response) ? response : (response?.data || []);
      }

      if (ordersData) {
        setOrders(ordersData);
      }
    } catch (error: any) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">{t('common.loadingStates.loadingOrders')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex items-center space-x-4">
          {displayFilteredOrders.length !== displayOrders.length && (
            <div className="text-sm text-muted-foreground">
              Showing {displayFilteredOrders.length} of {displayOrders.length} orders
            </div>
          )}
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Driver Tabs */}
      {user?.role === 'driver' && (
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'assigned' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('assigned')}
            className="flex-1"
          >
            My Orders ({orders.length})
          </Button>
          <Button
            variant={activeTab === 'available' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('available')}
            className="flex-1"
          >
            Available Orders ({availableOrders.length})
          </Button>
        </div>
      )}

      <OrderFilters
        user={user}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {loading ? (
        <div className="flex justify-center items-center min-h-64">
          <div className="text-lg">Loading orders...</div>
        </div>
      ) : displayFilteredOrders.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          {displayOrders.length === 0 ? `No ${activeTab} orders found` : 'No orders match the current filters'}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {displayFilteredOrders.map((order) => {
            // Merge order data with real-time progress data
            const orderWithProgress = { ...order, ...progressData[order._id] };

            if (user?.role === 'customer' || !user || user?.role === 'guest') {
              return (
                <OrderCardCustomer
                  key={order._id}
                  order={orderWithProgress}
                  onUpdate={loadOrders}
                />
              );
            } else {
              return (
                <OrderCardStaff
                  key={order._id}
                  order={orderWithProgress}
                  user={user}
                  onUpdate={loadOrders}
                />
              );
            }
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {displayFilteredOrders.map((order) => {
                // Merge order data with real-time progress data
                const orderWithProgress = { ...order, ...progressData[order._id] };

                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'placed':
                      return <Badge className="bg-blue-500">Placed</Badge>;
                    case 'accepted':
                      return <Badge className="bg-yellow-500">Accepted</Badge>;
                    case 'accepted-by-driver':
                      return <Badge className="bg-indigo-500">Driver Accepted</Badge>;
                    case 'prepared':
                      return <Badge className="bg-orange-500">Prepared</Badge>;
                    case 'pickedup':
                      return <Badge className="bg-purple-500">Picked Up</Badge>;
                    case 'delivered':
                      return <Badge className="bg-green-500">Delivered</Badge>;
                    case 'received':
                      return <Badge className="bg-green-600">Received</Badge>;
                    case 'canceled':
                      return <Badge variant="destructive">Canceled</Badge>;
                    default:
                      return <Badge variant="secondary">{status}</Badge>;
                  }
                };

                return (
                  <div key={order._id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">Order #{order._id.slice(-8)}</h3>
                          {getStatusBadge(order.status)}
                          <Badge variant="outline" className="text-xs">
                            {order.isTakeout ? 'Delivery' : 'In-store'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatPersianDateTime(order.datePlaced)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatPersianCurrency(order.amount || 0, 'USD')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{order.isTakeout ? 'Delivery' : 'In-store'}</span>
                          </div>
                        </div>
                        {(user?.role !== 'customer' && user?.role !== 'guest' && user) && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Customer: </span>
                            <span className="font-medium">
                              {order.user?.name || order.user?.username || 'Unknown'}
                            </span>
                            {order.driver && (
                              <>
                                <span className="text-muted-foreground ml-4">Driver: </span>
                                <span className="font-medium">
                                  {order.driver?.name || order.driver?.username || 'Unknown'}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        {orderWithProgress.progressPrepare !== undefined && (
                          <div className="mt-2">
                            <div className="flex items-center space-x-2 text-xs">
                              <span>Preparation Progress:</span>
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${orderWithProgress.progressPrepare || 0}%` }}
                                />
                              </div>
                              <span>{orderWithProgress.progressPrepare || 0}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // For now, just show a toast. In a real app, this would open order details
                            toast.info(`Viewing order ${order._id.slice(-8)}`);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Orders;