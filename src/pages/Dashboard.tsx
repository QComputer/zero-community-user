import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, PieChart, LineChart, Package, Truck, ShoppingCart, MessageSquare, Settings, Users, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { orderAPI, messageAPI } from '@/services/api';
import { formatPersianDateTime, formatPersianCurrency, toPersianNumbers } from '@/lib/utils';
import { Order } from '@/services/api';

interface DashboardProps {
  user: any;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color?: string;
  trend?: string;
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  onClick: () => void;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'text-primary', trend }) => (
  <Card className="card-modern hover:shadow-lg transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <div className="flex items-center space-x-2">
            <h3 className="text-2xl font-bold text-card-foreground">{value}</h3>
            {trend && (
              <span className={`text-xs px-2 py-1 rounded-full ${trend.includes('+') ? 'bg-constructive/10 text-constructive' : 'bg-destructive/10 text-destructive'}`}>
                {trend}
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-')}/10`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon, onClick, color = 'bg-primary' }) => (
  <Card className="card-modern hover:scale-105 transition-transform duration-200 cursor-pointer" onClick={onClick}>
    <CardContent className="p-6">
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full ${color.replace('bg-', '')}/10`}>
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-card-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const RecentActivity: React.FC<{ activities: any[] }> = ({ activities }) => {
  const { t } = useTranslation();

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('page.dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
              <div className="p-2 rounded-full bg-muted">
                {activity.type === 'order' && <ShoppingCart className="h-4 w-4 text-muted-foreground" />}
                {activity.type === 'message' && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                {activity.type === 'delivery' && <Truck className="h-4 w-4 text-muted-foreground" />}
                {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${activity.status === 'completed' ? 'bg-constructive/10 text-constructive' : activity.status === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {activity.status}
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-muted-foreground">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PerformanceChart: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('page.dashboard.performanceOverview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex items-center justify-center bg-muted/50 rounded-lg">
          <BarChart className="h-24 w-24 text-muted-foreground" />
          <p className="text-muted-foreground ml-4">{t('page.dashboard.performanceChartVisualization')}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const [stats, setStats] = useState({
    orders: 0,
    revenue: 0,
    customers: 0,
    products: 0,
    placedOrders: 0,
    acceptedOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the new unified dashboard statistics endpoint
        await fetchDashboardStatistics();

        // Fetch recent activities (common for all roles)
        await fetchRecentActivities();

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardStatistics = async () => {
    try {
      // Use the new unified dashboard statistics endpoint
      const response = await orderAPI.getDashboardStatistics();

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard statistics');
      }

      // Fetch recent orders based on user role
      if (user?.role === 'admin') {
        const ordersResponse = await orderAPI.getAllOrders();
        setRecentOrders(ordersResponse.success ? ordersResponse.data?.slice(0, 5) || [] : []);
      } else if (user?.role === 'store') {
        const ordersResponse = await orderAPI.getStoreOrders();
        setRecentOrders(ordersResponse.success ? ordersResponse.data?.slice(0, 5) || [] : []);
      } else if (user?.role === 'driver') {
        const ordersResponse = await orderAPI.getDriverOrders();
        setRecentOrders(ordersResponse.success ? ordersResponse.data?.slice(0, 5) || [] : []);
      } else if (user?.role === 'customer' || user?.role === 'guest') {
        const ordersResponse = await orderAPI.getUserOrders();
        setRecentOrders(ordersResponse.success ? ordersResponse.data?.slice(0, 5) || [] : []);
      }

    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
      throw err;
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Fetch unread messages
      const messagesResponse = await messageAPI.getUnreadMessages();
      const unreadCount = messagesResponse.success ? messagesResponse.data?.length || 0 : 0;

      // Create activities based on recent orders and messages
      const activities = [];

      // Add order activities
      recentOrders.forEach((order, index) => {
        activities.push({
          id: `order-${index}`,
          type: 'order',
          title: `Order #${order._id.slice(-6)} - ${order.status}`,
          time: formatPersianDateTime(order.datePlaced),
          status: order.status === 'delivered' || order.status === 'received' ? 'completed' : 'pending'
        });
      });

      // Add message activity if there are unread messages
      if (unreadCount > 0) {
        activities.push({
          id: 'messages',
          type: 'message',
          title: `${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}`,
          time: 'Just now',
          status: 'unread'
        });
      }

      setRecentActivities(activities);
      setStats(prev => ({ ...prev, unreadMessages: unreadCount }));

    } catch (err) {
      console.error('Error fetching recent activities:', err);
      // Set default activities if there's an error
      setRecentActivities([
        { id: 1, type: 'order', title: 'New order received', time: '2 hours ago', status: 'pending' },
        { id: 2, type: 'message', title: 'Customer inquiry', time: '5 hours ago', status: 'unread' },
        { id: 3, type: 'delivery', title: 'Order delivered', time: '1 day ago', status: 'completed' },
        { id: 4, type: 'payment', title: 'Payment processed', time: '2 days ago', status: 'success' },
      ]);
    }
  };

  const getRoleSpecificActions = () => {

    switch (user?.role) {
      case 'customer':
        return [
          {
            title: t('common.browseProducts'),
            description: t('common.exploreCatalog'),
            icon: <Package className="h-6 w-6" />,
            onClick: () => navigate('/products'),
            color: 'bg-primary'
          },
          {
            title: t('common.viewOrders'),
            description: t('common.checkOrderHistory'),
            icon: <ShoppingCart className="h-6 w-6" />,
            onClick: () => navigate('/orders'),
            color: 'bg-constructive'
          },
          {
            title: t('common.messages'),
            description: t('common.contactSupport'),
            icon: <MessageSquare className="h-6 w-6" />,
            onClick: () => navigate('/messages'),
            color: 'bg-destructive'
          },
          {
            title: t('common.accountSettings'),
            description: t('common.manageProfile'),
            icon: <Settings className="h-6 w-6" />,
            onClick: () => navigate('/account'),
            color: 'bg-secondary'
          },
        ];
      case 'guest':
        return [
          {
            title: t('common.browseProducts'),
            description: t('common.exploreCatalog'),
            icon: <Package className="h-6 w-6" />,
            onClick: () => navigate('/products'),
            color: 'bg-primary'
          },
          {
            title: t('common.viewOrders'),
            description: t('common.checkOrderHistory'),
            icon: <ShoppingCart className="h-6 w-6" />,
            onClick: () => navigate('/orders'),
            color: 'bg-constructive'
          },
          {
            title: t('common.messages'),
            description: t('common.contactSupport'),
            icon: <MessageSquare className="h-6 w-6" />,
            onClick: () => navigate('/messages'),
            color: 'bg-destructive'
          },
          {
            title: t('common.accountSettings'),
            description: t('common.manageProfile'),
            icon: <Settings className="h-6 w-6" />,
            onClick: () => navigate('/account'),
            color: 'bg-secondary'
          },
        ];

      case 'driver':
        return [
          {
            title: t('common.availableOrders'),
            description: t('common.viewAcceptRequests'),
            icon: <Truck className="h-6 w-6" />,
            onClick: () => navigate('/orders'),
            color: 'bg-primary'
          },
          {
            title: t('common.deliveryStatus'),
            description: t('common.updateDeliveries'),
            icon: <Clock className="h-6 w-6" />,
            onClick: () => navigate('/orders'),
            color: 'bg-constructive'
          },
          {
            title: t('common.messages'),
            description: t('common.communicateCustomers'),
            icon: <MessageSquare className="h-6 w-6" />,
            onClick: () => navigate('/messages'),
            color: 'bg-destructive'
          },
          {
            title: t('common.performance'),
            description: t('common.viewDeliveryStats'),
            icon: <BarChart className="h-6 w-6" />,
            onClick: () => navigate('/account'),
            color: 'bg-secondary'
          },
        ];

      case 'store':
        return [
          {
            title: t('common.manageProducts'),
            description: t('common.addEditRemoveProducts'),
            icon: <Package className="h-6 w-6" />,
            onClick: () => navigate('/products'),
            color: 'bg-primary'
          },
          {
            title: t('common.viewOrders'),
            description: t('common.monitorProcessOrders'),
            icon: <ShoppingCart className="h-6 w-6" />,
            onClick: () => navigate('/orders'),
            color: 'bg-constructive'
          },
          {
            title: t('common.customerMessages'),
            description: t('common.respondInquiries'),
            icon: <MessageSquare className="h-6 w-6" />,
            onClick: () => navigate('/messages'),
            color: 'bg-destructive'
          },
          {
            title: t('common.salesAnalytics'),
            description: t('common.viewStorePerformance'),
            icon: <LineChart className="h-6 w-6" />,
            onClick: () => navigate('/account'),
            color: 'bg-secondary'
          },
        ];

      case 'admin':
        return [
          {
            title: t('common.userManagement'),
            description: t('common.manageUsersPermissions'),
            icon: <Users className="h-6 w-6" />,
            onClick: () => navigate('/people'),
            color: 'bg-primary'
          },
          {
            title: t('common.systemAnalytics'),
            description: t('common.monitorPlatformPerformance'),
            icon: <BarChart className="h-6 w-6" />,
            onClick: () => navigate('/dashboard'),
            color: 'bg-constructive'
          },
          {
            title: t('common.contentManagement'),
            description: t('common.manageProductsCatalogs'),
            icon: <Package className="h-6 w-6" />,
            onClick: () => navigate('/products'),
            color: 'bg-destructive'
          },
          {
            title: t('common.imageManagement'),
            description: t('common.manageSystemImages'),
            icon: <Settings className="h-6 w-6" />,
            onClick: () => navigate('/images'),
            color: 'bg-secondary'
          },
        ];

      default:
        return [];
    }
  };

  const getRoleSpecificStats = () => {

    switch (user?.role) {
      case 'customer':
        return [
          { title: t('common.totalOrders'), value: stats.orders, icon: <ShoppingCart className="h-6 w-6" />, color: 'text-primary' },
          { title: t('common.pendingOrders'), value: stats.pendingOrders, icon: <Clock className="h-6 w-6" />, color: 'text-constructive' },
          { title: t('common.completedOrders'), value: stats.completedOrders, icon: <CheckCircle className="h-6 w-6" />, color: 'text-destructive' },
          { title: t('common.messages'), value: stats.unreadMessages, icon: <MessageSquare className="h-6 w-6" />, color: 'text-secondary' },
        ];

      case 'driver':
        return [
          { title: t('common.totalDeliveries'), value: stats.orders, icon: <Truck className="h-6 w-6" />, color: 'text-primary' },
          { title: t('common.pendingDeliveries'), value: stats.pendingOrders, icon: <Clock className="h-6 w-6" />, color: 'text-constructive' },
          { title: t('common.completedDeliveries'), value: stats.completedOrders, icon: <CheckCircle className="h-6 w-6" />, color: 'text-destructive' },
          { title: t('common.earnings'), value: formatPersianCurrency(stats.revenue, 'USD'), icon: <DollarSign className="h-6 w-6" />, color: 'text-secondary' },
        ];

      case 'store':
        return [
          { title: t('common.totalOrders'), value: stats.orders, icon: <ShoppingCart className="h-6 w-6" />, color: 'text-primary' },
          { title: t('common.revenue'), value: formatPersianCurrency(stats.revenue, 'USD'), icon: <DollarSign className="h-6 w-6" />, color: 'text-constructive' },
          { title: t('common.products'), value: stats.products, icon: <Package className="h-6 w-6" />, color: 'text-destructive' },
          { title: t('common.pendingOrders'), value: stats.placedOrders, icon: <Clock className="h-6 w-6" />, color: 'text-secondary' },
        ];

      case 'admin':
        return [
          { title: t('common.totalUsers'), value: stats.customers, icon: <Users className="h-6 w-6" />, color: 'text-primary' },
          { title: t('common.totalOrders'), value: stats.orders, icon: <ShoppingCart className="h-6 w-6" />, color: 'text-constructive' },
          { title: t('common.platformRevenue'), value: formatPersianCurrency(stats.revenue, 'USD'), icon: <DollarSign className="h-6 w-6" />, color: 'text-destructive' },
          { title: t('common.activeProducts'), value: stats.products, icon: <Package className="h-6 w-6" />, color: 'text-secondary' },
        ];

      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h3 className="text-xl font-semibold text-destructive">{error}</h3>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">{t('page.dashboard.title')}</h1>
        <p className="text-muted-foreground text-lg">{t('page.dashboard.welcome', { username: user?.username })}</p>
        <div className="inline-flex items-center space-x-2 bg-secondary/50 px-3 py-1 rounded-full">
          <span className="text-muted-foreground text-sm">{t('common.role') + ": "}</span>
          <span className="capitalize font-medium">{t('common.' + user?.role)}</span>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getRoleSpecificStats().map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-card-foreground">{t('common.quickActions')}</h3>
            <Button variant="outline" size="sm" className="border-border">
              {t('common.viewAll')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getRoleSpecificActions().map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <RecentActivity activities={recentActivities} />
        </div>
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart />
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('common.systemStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="text-card-foreground">{t('common.apiHealth')}</span>
                </div>
                <span className="text-sm font-medium text-constructive">{t('common.operational')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-card-foreground">{t('common.systemUptime')}</span>
                </div>
                <span className="text-sm font-medium text-card-foreground">{toPersianNumbers('99.9')}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-constructive" />
                  <span className="text-card-foreground">{t('common.databaseStatus')}</span>
                </div>
                <span className="text-sm font-medium text-constructive">{t('common.connected')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific content */}
      <div className="card-modern p-6">
        <h3 className="text-xl font-semibold text-card-foreground mb-4">{t('common.roleSpecificFeatures')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('common.roleSpecificDescription', { role: user?.role })}
        </p>

        {user?.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-modern hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <PieChart className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-2">{t('common.userAnalytics')}</h4>
                <p className="text-sm text-muted-foreground">{t('common.detailedBreakdown')}</p>
              </CardContent>
            </Card>
            <Card className="card-modern hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <BarChart className="h-8 w-8 mx-auto mb-3 text-constructive" />
                <h4 className="font-semibold mb-2">{t('common.systemReports')}</h4>
                <p className="text-sm text-muted-foreground">{t('common.generateReports')}</p>
              </CardContent>
            </Card>
            <Card className="card-modern hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <Settings className="h-8 w-8 mx-auto mb-3 text-destructive" />
                <h4 className="font-semibold mb-2">{t('common.systemSettings')}</h4>
                <p className="text-sm text-muted-foreground">{t('common.configureSettings')}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {user?.role === 'store' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-modern hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <Package className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-2">{t('common.inventoryManagement')}</h4>
                <p className="text-sm text-muted-foreground">{t('common.trackInventory')}</p>
              </CardContent>
            </Card>
            <Card className="card-modern hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <LineChart className="h-8 w-8 mx-auto mb-3 text-constructive" />
                <h4 className="font-semibold mb-2">{t('common.salesTrends')}</h4>
                <p className="text-sm text-muted-foreground">{t('common.analyzeSales')}</p>
              </CardContent>
            </Card>
            <Card className="card-modern hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-destructive" />
                <h4 className="font-semibold mb-2">{t('common.customerInsights')}</h4>
                <p className="text-sm text-muted-foreground">{t('common.understandCustomers')}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {(user?.role === 'customer' || user?.role === 'driver') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="card-modern hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <ShoppingCart className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-2">{t('common.orderTracking')}</h4>
                <p className="text-sm text-muted-foreground">{t('common.monitorOrders')}</p>
              </CardContent>
            </Card>
            <Card className="card-modern hover:shadow-lg transition-all">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 text-constructive" />
                <h4 className="font-semibold mb-2">{t('common.communicationCenter')}</h4>
                <p className="text-sm text-muted-foreground">{t('common.stayConnected')}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;