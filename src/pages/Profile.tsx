import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { User, MapPin, Star, Mail, Phone, AtSign, Quote, Minimize2, Maximize2, EyeOff } from 'lucide-react';
//import { formatPersianDate, formatPersianDateTime, toPersianNumbers } from '@/lib/utils';
import MapComponent from '../components/MapComponent';
import SocialStats from '../components/SocialStats';


interface ProfileProps {
}
const Profile: React.FC<ProfileProps> = () => {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState({
    _id: '',
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res: any = await authAPI.userProfile();
      const userData = res.data.user;
      console.log('User data received:',userData );
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
      
    } catch (error: any) {
      console.error('Error loading profile:', error);
      const errorMessage = error.message || 'Failed to load profile';
      toast.error(errorMessage);
    } finally {
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
        return 'bg-status-soon text-white border-status-soon';
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
      <div className="relative overflow-hidden rounded-lg md:rounded-xl">
        {/* Cover Image Background */}
        <div
          className="h-48 md:h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 relative"
          style={{
            backgroundImage: profileData.image ? `url(${profileData.image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30"></div>

          {/* Profile Content */}
          <div className="relative h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
            {/* Profile Avatar */}
            <div className="relative rounded-full  ring-6 shadow-lg" style={{
              '--tw-ring-color': profileData.statusMain === 'online' ? 'var(--status-online)' :
                profileData.statusMain === 'offline' ? 'var(--status-offline)' :
                  profileData.statusMain === 'busy' ? 'var(--status-busy)' :
                    profileData.statusMain === 'soon' ? 'var(--status-soon)' :
                      'var(--muted-foreground)',
              //background: 'linear-gradient(135deg, var(--status-online), var(--status-busy), var(--status-soon), var(--status-offline))'
            } as React.CSSProperties}>
              <Avatar className="w-20 h-20 md:w-24 md:h-24 border-2 border-white">
                {profileData.avatar ? (
                  <AvatarImage src={profileData.avatar} alt="Profile Avatar" />
                ) : (
                  <AvatarFallback className="text-2xl md:text-3xl font-semibold bg-primary text-primary-foreground">
                    {(profileData.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="text-white">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight drop-shadow-lg">
                {profileData.name || t('page.profile.title')}
              </h1>
              <p className="text-white/90 text-sm md:text-base lg:text-lg mt-1 md:mt-2 drop-shadow-md">
                {t('page.profile.publicView')}
              </p>
              {profileData.statusCustom && (
                <p className="text-white/80 text-xs md:text-sm mt-1 italic drop-shadow-sm">
                  "{profileData.statusCustom}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
        {/* Profile Information */}
        <Card className="shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-all duration-300" style={{ background: 'linear-gradient(135deg, oklch(var(--card)), oklch(var(--card) / 0.8))' }}>

          <CardHeader className="pb-3 md:pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-xl shadow-sm">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    {t('page.profile.profileInformation')}
                  </CardTitle>
                  <Badge variant="outline" className=" text-xs capitalize font-medium border-primary/30 text-primary px-3 py-1">
                    {t("common."+profileData.role) || t('page.profile.profileInformation')}
                  </Badge>
                </div>

              </div>

            </div>


          </CardHeader>

        </Card>

        <CardContent className="p-4 md:p-5">
          <div className="space-y-4">

            {/* Status below header */}
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

            {/* Primary Information */}
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

            {/* Contact Information */}
            {(profileData.email || profileData.phone) && (
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

            {/* About Section */}
            {profileData.moreInfo && (
              <div className="flex items-start space-x-2">
                <Star className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{t('page.profile.about')}</p>
                  <p className="text-sm leading-relaxed">{profileData.moreInfo}</p>
                </div>
              </div>
            )}

            {/* Location Section */}
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
        {/* Social Stats */}
        <SocialStats userId={profileData._id} />

      </div>
    </div>
  );
};

export default Profile;