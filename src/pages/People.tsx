import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userAPI, socialAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { UserPlus, Heart, MessageSquare, Users, Crown, Truck } from 'lucide-react';
import FilterHeader from '../components/FilterHeader';

interface User {
  _id: string;
  username: string;
  role: string;
  name?: string;
  statusMain?: string;
  statusCustom?: string;
  lastOnline?: string;
  avatar?: string;
  image?: string;
}

interface PeopleProps {
  user?: any;
}

const People: React.FC<PeopleProps> = ({ user }) => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [friendCustomers, setFriendCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const response = (user.role ==='admin')? await userAPI.getAdminAll():await userAPI.getAll();
      if (response.success && response.data) {
        const allUsers = response.data.filter((u: any) => u._id !== user._id);

        const storesList = allUsers.filter((u: any) => u.role === 'store');
        const driversList = allUsers.filter((u: any) => u.role === 'driver');

        let customersList: User[] = [];
        let friendCustomersList: User[] = [];

        if (user.role === 'admin') {
          // Admins see all customers
          customersList = allUsers.filter((u: any) => u.role === 'customer');
        } else {
          // Other users see only friend customers
          try {
            const socialResponse = await socialAPI.getRelationships();
            if (socialResponse.success && socialResponse.data) {
              const socialData = socialResponse.data;

              // Get friend relationships from the organized data structure
              const friendships = socialData.friends || [];

              // Get friend IDs
              const friendIds = friendships.map((friend: any) => friend._id);

              // Filter customers who are friends
              friendCustomersList = allUsers.filter((u: any) =>
                u.role === 'customer' && friendIds.includes(u._id)
              );
            }
          } catch (socialError) {
            console.error('Failed to load social relationships:', socialError);
          }
        }

        setStores(storesList);
        setDrivers(driversList);
        setCustomers(customersList);
        setFriendCustomers(friendCustomersList);
      }

    } catch (error: any) {
      toast.error('Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAction = async (action: string, targetUserId: string, targetUsername: string) => {
    try {
      switch (action) {
        case 'follow':
          await socialAPI.follow(targetUserId);
          break;
        case 'unfollow':
          await socialAPI.unfollow(targetUserId);
          break;
        case 'add-friend':
          await socialAPI.addFriend(targetUserId);
          break;
        case 'remove-friend':
          await socialAPI.removeFriend(targetUserId);
          break;
        default:
          toast.error('Unknown action');
          return;
      }

      toast.success(`Successfully ${action}ed ${targetUsername}`);
      // Refresh the people list to update relationship status
      loadPeople();
    } catch (error) {
      console.error('Social action error:', error);
      toast.error(`Failed to ${action} ${targetUsername}`);
    }
  };

  const startChat = (targetUser: User) => {
    // Navigate to messages page with target user info
    navigate('/messages', {
      state: {
        startChatWith: targetUser._id,
        targetUser: targetUser
      }
    });
    toast.success(`Starting chat with ${targetUser.username}`);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'store':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'driver':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'customer':
        return <Users className="w-5 h-5 text-green-500" />;
      case 'admin':
        return <Crown className="w-5 h-5 text-red-500" />;
      default:
        return <Users className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'bg-status-online text-white border-status-online';
      case 'offline':
        return 'bg-status-offline text-white border-status-offline';
      case 'busy':
        return 'bg-status-busy text-white border-status-busy';
      case 'soon':
        return 'bg-status-soon text-white border-status-soon';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm font-medium text-foreground animate-pulse">Loading community members...</p>
      </div>
    );
  }

  const allUsers = [...stores, ...drivers, ...customers, ...friendCustomers];
  const baseList = allUsers;

  // Filtered and sorted list
  const filteredList = baseList
    .filter(person => {
      const matchesSearch = !searchTerm ||
        person.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (person.name && person.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = !statusFilter ||
        (statusFilter === 'online' && person.statusMain === 'online') ||
        (statusFilter === 'offline' && person.statusMain === 'offline') ||
        (statusFilter === 'busy' && person.statusMain === 'busy') ||
        (statusFilter === 'soon' && person.statusMain === 'soon');

      const matchesRole = !roleFilter || person.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || a.username).localeCompare(b.name || b.username);
        case 'username':
          return a.username.localeCompare(b.username);
        case 'status':
          return (a.statusMain || '').localeCompare(b.statusMain || '');
        case 'recent':
          return new Date(b.lastOnline || 0).getTime() - new Date(a.lastOnline || 0).getTime();
        default:
          return 0;
      }
    });

  const currentList = filteredList;
  const currentTitle = 'Community';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Discover People</h1>
          <p className="text-muted-foreground mt-2">Connect with stores and drivers in our community</p>
        </div>

      </div>


      {/* Filters */}
      <FilterHeader
        title="Filters"
        isExpanded={filtersExpanded}
        onToggle={() => setFiltersExpanded(!filtersExpanded)}
        onClear={() => {
          setSearchTerm('');
          setStatusFilter('');
          setRoleFilter('');
          setSortBy('name');
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      >
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Search
            </label>
            <Input
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="busy">Busy</option>
              <option value="soon">Soon</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">All Roles</option>
              <option value="store">Store</option>
              <option value="driver">Driver</option>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>


          {/* Sort By */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="name">Name</option>
              <option value="username">Username</option>
              <option value="status">Status</option>
              <option value="recent">Recently Active</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        {(searchTerm || statusFilter || roleFilter || sortBy !== 'name') && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
              <span>Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary">Search: "{searchTerm}"</Badge>
              )}
              {statusFilter && (
                <Badge variant="secondary">Status: {statusFilter}</Badge>
              )}
              {roleFilter && (
                <Badge variant="secondary">Role: {roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}</Badge>
              )}
              {sortBy !== 'name' && (
                <Badge variant="secondary">Sort: {sortBy === 'recent' ? 'Recently Active' : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</Badge>
              )}
              <span className="ml-2">
                Showing {filteredList.length} of {baseList.length} {currentTitle.toLowerCase()}
              </span>
            </div>
          </div>
        )}
      </FilterHeader>

      {/* People Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((person) => (
            <Card key={person._id} className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 text-center space-y-3">
                {/* Avatar */}
                <div
                  className="cursor-pointer hover:bg-muted/50 rounded-full p-2 transition-colors w-fit mx-auto relative"
                  onClick={() => navigate(`/public/profile/${person._id}`)}
                >
                  <div className="relative">
                    {/* Status Ring */}
                    <div className="relative rounded-full p-0.5" style={{
                      '--tw-ring-color': person.statusMain === 'online' ? 'var(--status-online)' :
                        person.statusMain === 'offline' ? 'var(--status-offline)' :
                          person.statusMain === 'busy' ? 'var(--status-busy)' :
                            person.statusMain === 'soon' ? 'var(--status-soon)' :
                              'var(--muted-foreground)',
                      background : 'transparent',
                      padding: '2px',
                      borderRadius: '500%'
                    } as React.CSSProperties}>
                      <Avatar className="w-16 h-16 ring-2" style={{
                        '--tw-ring-color': person.statusMain === 'online' ? 'var(--status-online)' :
                          person.statusMain === 'offline' ? 'var(--status-offline)' :
                            person.statusMain === 'busy' ? 'var(--status-busy)' :
                              person.statusMain === 'soon' ? 'var(--status-soon)' :
                                'var(--muted-foreground)'
                      } as React.CSSProperties}>
                        <AvatarImage src={person.avatar} alt={person.username} />
                        <AvatarFallback className="text-xl font-semibold">
                          {person.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Status Badge */}
                    {person.statusMain && (
                      <div className="absolute -bottom-1 -right-1">
                        <Badge
                          className={`text-xs px-1.5 py-0.5 border-2 border-background font-medium ${
                            person.statusMain === 'online' ? 'bg-status-online text-white' :
                            person.statusMain === 'offline' ? 'bg-status-offline text-white' :
                            person.statusMain === 'busy' ? 'bg-status-busy text-white' :
                            person.statusMain === 'soon' ? 'bg-status-soon text-white' :
                            'bg-muted text-muted-foreground'
                          }`}
                        >
                          {person.statusMain === 'soon' ? 'Soon' :
                           person.statusMain.charAt(0).toUpperCase() + person.statusMain.slice(1)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {person.username}
                    </h3>
                    {getRoleIcon(person.role)}
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {person.role.charAt(0).toUpperCase() + person.role.slice(1)}
                    </div>
                  </div>

                  {person.name && (
                    <p className="text-sm text-muted-foreground">{person.name}</p>
                  )}

                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSocialAction('follow', person._id, person.username)}
                  className="flex items-center justify-center space-x-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Follow</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSocialAction('add-friend', person._id, person.username)}
                  className="flex items-center justify-center space-x-1"
                >
                  <Heart className="w-4 h-4" />
                  <span>Add Friend</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => startChat(person)}
                  className="flex items-center justify-center space-x-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message</span>
                </Button>

              </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentList.map((person) => (
                    <tr key={person._id} className="hover:bg-muted/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="flex-shrink-0 h-10 w-10 cursor-pointer hover:bg-muted/50 rounded-full p-1 transition-colors relative"
                            onClick={() => navigate(`/public/profile/${person._id}`)}
                          >
                            <div className="relative">
                              {/* Status Ring */}
                              <div className="relative rounded-full p-1" style={{
                                '--tw-ring-color': person.statusMain === 'online' ? 'var(--status-online)' :
                                  person.statusMain === 'offline' ? 'var(--status-offline)' :
                                    person.statusMain === 'busy' ? 'var(--status-busy)' :
                                      person.statusMain === 'soon' ? 'var(--status-soon)' :
                                        'var(--muted-foreground)',
                                background: 'transparent',
                                padding: '1px',
                                borderRadius: '50%'
                              } as React.CSSProperties}>
                                <Avatar className="h-6 w-6 ring-1" style={{
                                  '--tw-ring-color': person.statusMain === 'online' ? 'var(--status-online)' :
                                    person.statusMain === 'offline' ? 'var(--status-offline)' :
                                      person.statusMain === 'busy' ? 'var(--status-busy)' :
                                        person.statusMain === 'soon' ? 'var(--status-soon)' :
                                          'var(--muted-foreground)'
                                } as React.CSSProperties}>
                                  <AvatarImage src={person.avatar} alt={person.username} />
                                  <AvatarFallback className="text-xs font-semibold">
                                    {person.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>

                              {/* Status Badge */}
                              {person.statusMain && (
                                <div className="absolute -bottom-4 -right-1">
                                  <Badge
                                    className={`text-xs px-1 py-0 border border-background font-medium ${
                                      person.statusMain === 'online' ? 'bg-status-online text-white' :
                                      person.statusMain === 'offline' ? 'bg-status-offline text-white' :
                                      person.statusMain === 'busy' ? 'bg-status-busy text-white' :
                                      person.statusMain === 'soon' ? 'bg-status-soon text-white' :
                                      'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {person.statusMain === 'soon' ? 'Soon' :
                                     person.statusMain.charAt(0).toUpperCase() + person.statusMain.slice(1)}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">{person.username}</div>
                            {person.name && (
                              <div className="text-sm text-muted-foreground">{person.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRoleIcon(person.role)}
                          <span className="ml-2 text-sm text-foreground capitalize">{person.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {person.statusMain && (
                            <Badge className={`text-xs border ${getStatusBadgeStyle(person.statusMain)}`}>
                              {person.statusMain}
                            </Badge>
                          )}
                          {person.statusCustom && (
                            <Badge variant="secondary" className="text-xs italic">"{person.statusCustom}"</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSocialAction('follow', person._id, person.username)}
                            className="h-8 px-2"
                          >
                            <UserPlus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSocialAction('add-friend', person._id, person.username)}
                            className="h-8 px-2"
                          >
                            <Heart className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => startChat(person)}
                            className="h-8 px-2"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {currentList.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No community members found
          </h3>
          <p className="text-muted-foreground">
            There are currently no community members matching your filters.
          </p>
        </div>
      )}

      {/* Stats Card */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Community Stats</h3>
        <div className={`grid gap-4 ${user.role === 'admin' ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stores.length}</div>
            <div className="text-sm text-muted-foreground">Stores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{drivers.length}</div>
            <div className="text-sm text-muted-foreground">Drivers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {user.role === 'admin' ? customers.length : friendCustomers.length}
            </div>
            <div className="text-sm text-muted-foreground">
              {user.role === 'admin' ? 'Customers' : 'Friend Customers'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stores.length + drivers.length + (user.role === 'admin' ? customers.length : friendCustomers.length)}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">Online</div>
            <div className="text-sm text-muted-foreground">Status</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default People;