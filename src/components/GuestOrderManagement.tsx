import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { toast } from 'react-toastify';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  status: string;
  datePlaced: string;
  progressPrepare?: number;
  minutesLeftPrepare?: number;
  isTakeout?: boolean;
  driver?: any;
  progressPickup?: number;
  minutesLeftPickup?: number;
  items: OrderItem[];
  amount: number;
  store?: {
    name: string;
  };
  phone: string;
  address_details?: string;
  deliveryFee?: number;
}

const GuestOrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchGuestOrders();
  }, []);

  const fetchGuestOrders = async () => {
    try {
      setLoading(true);
      const sessionId = localStorage.getItem('guest_session_id') || '';
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/guest-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const sessionId = localStorage.getItem('guest_session_id') || '';
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/cancel-guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Order canceled successfully');
        fetchGuestOrders(); // Refresh orders
      } else {
        throw new Error(data.message || 'Failed to cancel order');
      }
    } catch (err: unknown) {
      console.error('Failed to cancel order:', err);
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to cancel order');
      } else {
        toast.error('Failed to cancel order');
      }
    }
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'placed': 'bg-blue-100 text-blue-800',
      'accepted': 'bg-yellow-100 text-yellow-800',
      'prepared': 'bg-orange-100 text-orange-800',
      'pickedup': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'received': 'bg-teal-100 text-teal-800',
      'canceled': 'bg-gray-100 text-gray-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="text-center py-8">Loading orders...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Orders</h2>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">You haven't placed any orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id}>
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order #{order._id.substring(order._id.length - 6)}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Placed: {new Date(order.datePlaced).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status.replace('by guest', '')}
                </span>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Order Progress */}
                {(order.status === 'placed' || order.status === 'accepted' || order.status === 'prepared') && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Order Progress</h3>

                    {/* Preparation Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Preparation</span>
                        <span>{order.progressPrepare || 0}%</span>
                      </div>
                      <Progress value={order.progressPrepare || 0} className="h-2" />
                      {order.minutesLeftPrepare && (
                        <p className="text-xs text-gray-500 text-right">
                          ~{order.minutesLeftPrepare} min left
                        </p>
                      )}
                    </div>

                    {/* Pickup Progress (if applicable) */}
                    {order.isTakeout && order.driver && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Pickup</span>
                          <span>{order.progressPickup || 0}%</span>
                        </div>
                        <Progress value={order.progressPickup || 0} className="h-2" />
                        {order.minutesLeftPickup && (
                          <p className="text-xs text-gray-500 text-right">
                            ~{order.minutesLeftPickup} min left
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Order Items */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Items</h3>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">× {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center border-t pt-3 mt-3">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">
                      ${order.amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  {(order.status === 'placed' || order.status === 'accepted') && (
                    <Button
                      variant="outline"
                      onClick={() => handleCancelOrder(order._id)}
                      className="flex-1"
                    >
                      Cancel Order
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    onClick={() => setActiveOrderId(activeOrderId === order._id ? null : order._id)}
                    className="flex-1"
                  >
                    {activeOrderId === order._id ? 'Hide Details' : 'View Details'}
                  </Button>
                </div>

                {/* Expanded Details */}
                {activeOrderId === order._id && (
                  <div className="border-t pt-4 mt-4 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Store</p>
                        <p className="font-medium">{order.store?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Phone</p>
                        <p className="font-medium">{order.phone}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide">Address</p>
                      <p className="font-medium">
                        {order.address_details || (order.isTakeout ? 'Takeout' : 'N/A')}
                      </p>
                    </div>

                    {order.deliveryFee && order.deliveryFee > 0 && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Delivery Fee</p>
                        <p className="font-medium">${order.deliveryFee.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuestOrderManagement;