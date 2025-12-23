import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../services/api';
import { CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { User, MapPin, Star, Mail, Phone, AtSign, Quote, Minimize2, Maximize2, EyeOff } from 'lucide-react';
import MapComponent from '../components/MapComponent';
import StoreMenu from '../components/StoreMenu';
import FollowButton from '../components/FollowButton';
import FriendButton from '../components/FriendButton';
import SocialStats from '../components/SocialStats';
import ProfileHeader from '../components/ProfileHeader';

interface PublicProps {
}

const Public: React.FC<PublicProps> = () => {
  const { t } = useTranslation();
  const { targetUserId } = useParams<{ targetUserId: string }>();
  const [profileData, setProfileData] = useState({
    _id: targetUserId || '',
    name: '',
    phone: '',
    email: '',
    moreInfo: '',
    statusMain: 'online',
    statusCustom: '',
    avatar: '',
    image: '',
    locationLat: null as number | null,
    locationLng: null as number | null,
    shareLocation: false,
    username: '',
    role: '',
    friends: [] as any[],
    followers: [] as any[],
    following: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [minimapState, setMinimapState] = useState<'expanded' | 'minimized' | 'collapsed'>('minimized');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    console.log('Public component mounted, targetUserId from params:', targetUserId);
    console.log('Public component: full useParams result:', { targetUserId });
    console.log('Public component: window.location.pathname:', window.location.pathname);
    // Load current user
    const token = localStorage?.getItem('token');
    const userData = localStorage?.getItem('user');
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setCurrentUser(parsedUser);
      setIsAdminView(parsedUser.role === 'admin');
    }
    if (targetUserId) {
      console.log('Public component: targetUserId is valid, calling loadProfile');
      loadProfile();
    } else {
      console.error('Public component: No targetUserId found in URL params');
      console.error('Public component: This suggests routing issue or malformed URL');
      setLoading(false);
      toast.error('Invalid user profile URL');
    }
  }, [targetUserId]);

  // Poll for status updates every 30 seconds
  useEffect(() => {
    if (!targetUserId) return;

    const interval = setInterval(() => {
      loadProfile();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [targetUserId]);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getPublicProfile(targetUserId!);

      if (response.success && response.data) {
        const userData = response.data;
        console.log('Public: User data received successfully:', userData);
        console.log('Public: User role:', userData.role);
        console.log('Public: Products in response:', userData.products ? userData.products.length : 'none');

        setProfileData({
          _id: userData._id || '',
          name: userData.name || '',
          phone: userData.phone || '',
          email: userData.email || '',
          moreInfo: userData.moreInfo || '',
          statusMain: userData.statusMain || 'online',
          statusCustom: userData.statusCustom || '',
          avatar: userData.avatar || '',
          image: userData.image || '',
          locationLat: userData.locationLat || null,
          locationLng: userData.locationLng || null,
          shareLocation: userData.shareLocation || false,
          username: userData.username || '',
          role: userData.role || '',
          friends: userData.friends || [],
          followers: userData.followers || [],
          following: userData.following || []
        });

        // Remove unused products handling - products are not displayed in this component

      } else {
        console.error('Public: API response not successful:', response);
        console.error('Public: Error message:', response.message);
        toast.error(response.message || 'Failed to load profile');
      }
    } catch (error: any) {
      console.error('Public: Error loading profile:', error);
      console.error('Public: Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('Failed to load profile');
    } finally {
      console.log('Public: loadProfile finished, setting loading to false');
      setLoading(false);
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
        return 'bg-status-away text-white border-status-away';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('page.profile.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-6 lg:px-8">
      {/* Profile Header with Cover Image */}
      <ProfileHeader
        name={profileData.name || t('page.profile.title')}
        username={profileData.username}
        avatar={profileData.avatar}
        coverImage={profileData.image}
        statusMain={profileData.statusMain}
        statusCustom={profileData.statusCustom}
        subtitle={t('page.profile.publicView')}
        isStore={false}
      />

      {/* Action Buttons */}
      {currentUser && currentUser._id !== profileData._id && (
        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
          <div className="flex gap-2">
            <FollowButton
              targetUserId={profileData._id}
              currentUserId={currentUser._id}
              size="default"
              variant="outline"
            />
            <FriendButton
              targetUserId={profileData._id}
              currentUserId={currentUser._id}
              size="default"
              variant="outline"
            />
          </div>
        </div>
      )}

      <CardContent className="p-4 md:p-5">
        <div className="space-y-4">

          {/* Status below header */}
          {isAdminView && (profileData.email || profileData.phone) && (

          <div className="flex items-center space-x-3 mt-3">
            <div className="flex items-center space-x-2">
              <Quote className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('page.profile.status')}</p>
                <Badge className={`text-xs border font-medium ${getStatusBadgeStyle(profileData.statusMain)}`}>
                  {t(`common.statusBadge.${profileData.statusMain}`)}
                </Badge>
              </div>
            </div>
            {profileData.statusCustom && (
              <div className="flex items-center space-x-2">
                <span className="text-sm italic text-muted-foreground font-medium">
                  "{profileData.statusCustom}"
                </span>
              </div>
            )}
          </div>
          )}

          {/* Primary Information - Always visible */}
          {isAdminView && (profileData.email || profileData.phone) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('page.profile.name')}</p>
                <p className="text-sm font-medium">{profileData.name || t('page.profile.notProvided')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <AtSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('page.profile.username')}</p>
                <p className="text-sm font-medium text-primary">@{profileData.username}</p>
              </div>
            </div>
          </div>
          )}

          {/* Contact Information - Only for admin */}
          {isAdminView && (profileData.email || profileData.phone) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileData.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('page.profile.email')}</p>
                    <p className="text-sm break-all">{profileData.email}</p>
                  </div>
                </div>
              )}
              {profileData.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('page.profile.phone')}</p>
                    <p className="text-sm">{profileData.phone}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* About Section - Only for admin */}
          {isAdminView && profileData.moreInfo && (
            <div className="flex items-start space-x-2">
              <Star className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{t('page.profile.about')}</p>
                <p className="text-sm leading-relaxed">{profileData.moreInfo}</p>
              </div>
            </div>
          )}

          {/* Location Section - Always visible if shared */}
          {profileData.shareLocation && profileData.locationLat && profileData.locationLng && (
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('page.profile.location')}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMinimapState(minimapState === 'minimized' ? 'expanded' : minimapState === 'expanded' ? 'collapsed' : 'minimized')}
                    className="h-6 w-6 p-0 hover:bg-muted/50"
                  >
                    {minimapState === 'expanded' ? (
                      <Minimize2 className="w-3 h-3" />
                    ) : minimapState === 'minimized' ? (
                      <Maximize2 className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                {minimapState !== 'collapsed' && (
                  <div className={`transition-all duration-300 overflow-hidden ${minimapState === 'expanded' ? 'max-h-96' : 'max-h-24'}`}>
                    <div className="rounded-lg border border-muted/20 overflow-hidden max-w-sm mx-auto">
                      <MapComponent
                        latitude={profileData.locationLat}
                        longitude={profileData.locationLng}
                        userName={`${profileData.name || 'User'}'s Location`}
                        height={minimapState === 'expanded' ? "200px" : "80px"}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Social Stats - Only for admin */}
      {isAdminView && (
        <SocialStats userId={profileData._id} />
      )}

      {profileData.role === 'store' && (
        <StoreMenu
          storeId={profileData._id}
          className="mt-6"
        />
      )}
    </div>
  );
};

export default Public;