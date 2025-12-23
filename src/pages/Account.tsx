import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { authAPI, imageAPI, invitationAPI } from '../services/api';
import { logUserAction } from '../services/logger';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { User, Camera, MapPin, Lock, Edit3, Upload, Eye, UserPlus, Copy, Share2 } from 'lucide-react';
import { formatPersianDate, toPersianNumbers } from '@/lib/utils';
import MapComponent from '../components/MapComponent';
import SimpleImageCropper from '../components/SimpleImageCropper';
import SocialStats from '../components/SocialStats';
import '@/index.css'
interface AccountProps {
  user: any;
  onUserUpdate?: (updatedUser: any) => void;
}

const Account: React.FC<AccountProps> = ({ user, onUserUpdate }) => {
  const { t } = useTranslation();
  const [accountData, setAccountData] = useState({
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
    shareLocation: false
  });
  const [croppingState, setCroppingState] = useState({
    showCropper: false,
    imageType: '' as 'avatar' | 'image' | '',
    imageSrc: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [invitationType, setInvitationType] = useState<'staff' | 'customer'>('customer');
  const [currentInvitation, setCurrentInvitation] = useState<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadAccount();
    if (user.role === 'store') {
      loadInvitations();
    }
  }, [user]);

  const loadAccount = async () => {
    try {
      const resp: any = await authAPI.userAccount();
      const userData = resp.data;
      setAccountData({
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
        shareLocation: userData.shareLocation || false
      });
    } catch (error: any) {
      toast.error('Failed to load profile');
    }
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setAccountData({
      ...accountData,
      [e.target.name]: e.target.value
    });
  };

  const handleShareLocationChange = (checked: boolean) => {
    setAccountData({
      ...accountData,
      shareLocation: checked
    });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAccountData({
            ...accountData,
            locationLat: position.coords.latitude,
            locationLng: position.coords.longitude
          });
          toast.success('Location updated successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get your location. Please check your browser permissions.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const imageType = name as 'avatar' | 'image';

      setLoading(true);
      try {
        if (imageType === 'avatar') {
          // For avatar: upload first, then show cropper
          const formData = new FormData();
          formData.append('image', file);
          formData.append('description', 'original profile avatar');
          formData.append('tags', 'avatar');

          const uploadResponse: any = await imageAPI.upload(formData);
          const originalUrl = uploadResponse.data.url;

          // Show the cropping UI for avatar only
          setCroppingState({
            showCropper: true,
            imageType,
            imageSrc: originalUrl
          });
        } else {
          // For cover image: upload directly without cropping
          const formData = new FormData();
          formData.append('image', file);
          formData.append('description', 'profile cover image');
          formData.append('tags', 'cover');

          const uploadResponse: any = await imageAPI.upload(formData);
          const imageUrl = uploadResponse.data.url;

          // Update the profile data with the uploaded image URL
          setAccountData(prev => ({
            ...prev,
            image: imageUrl
          }));

          // Save the change to backend immediately
          await authAPI.updateProfile({
            userId: user._id,
            image: imageUrl
          });

          logUserAction('image_upload', { userId: user._id });
          toast.success('Cover image uploaded successfully!');

          // Update the user object in the parent component
          if (onUserUpdate) {
            const updatedUser = { ...user, image: imageUrl };
            onUserUpdate(updatedUser);
          }
        }

        // Reset the input value to allow selecting the same file again
        e.target.value = '';
      } catch (error: any) {
        toast.error(error.message || 'Failed to upload image');
      } finally {
        setLoading(false);
      }
    }
  };



  const handleCropComplete = async (croppedBlob: Blob) => {
    const { imageType } = croppingState;

    if (!imageType || !croppedBlob) return;

    setLoading(true);
    try {
      // Create FormData with cropped image
      const croppedFormData = new FormData();
      croppedFormData.append('image', croppedBlob, `cropped-${imageType}.jpg`);
      croppedFormData.append('description', `cropped profile ${imageType}`);
      croppedFormData.append('tags', imageType);

      // Upload the cropped image
      const uploadResponse: any = await imageAPI.upload(croppedFormData);
      const croppedUrl = uploadResponse.data.url;

      // Update the profile data with the cropped image URL
      setAccountData(prev => ({
        ...prev,
        [imageType]: croppedUrl
      }));

      // Save the change to backend immediately
      await authAPI.updateProfile({
        userId: user._id,
        [imageType]: croppedUrl
      });

      logUserAction(`${imageType}_upload`, { userId: user._id });
      toast.success(`${imageType === 'avatar' ? 'Avatar' : 'Profile image'} cropped and uploaded successfully!`);

      // Update the user object in the parent component
      if (onUserUpdate) {
        const updatedUser = { ...user, [imageType]: croppedUrl };
        onUserUpdate(updatedUser);
      }

      // Close the cropper
      setCroppingState({
        showCropper: false,
        imageType: '',
        imageSrc: ''
      });
    } catch (error: any) {
      console.error('Crop and upload error:', error);
      if (error.message.includes('memory') || error.message.includes('canvas')) {
        toast.error('Image is too large. Please try a smaller image or crop a smaller area.');
      } else {
        toast.error(error.response?.data?.message || `Failed to crop and upload ${imageType}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCropCancel = () => {
    setCroppingState({
      showCropper: false,
      imageType: '',
      imageSrc: ''
    });
  };

  const loadInvitations = async () => {
    if (user.role !== 'store') return;

    try {
      const invitationsData: any = await invitationAPI.getStoreInvitations();
      setInvitations(invitationsData);
    } catch (error: any) {
      console.error('Failed to load invitations:', error);
    }
  };

  const handleCreateInvitation = async () => {
    try {
      setLoading(true);
      const response = await invitationAPI.create({ type: invitationType });

      if (response.success) {
        const invitation = response.data;
        setCurrentInvitation(invitation);
        setInvitations(prev => [invitation, ...prev]);
        toast.success(`${invitationType} invitation created successfully!`);
      }
    } catch (error: any) {
      toast.error('Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareLink = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our team',
          text: 'Click this link to join',
          url: url
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopyLink(url);
    }
  };

  const handleDeleteInvitation = async (token: string) => {
    if (!window.confirm('Are you sure you want to delete this invitation?')) return;

    try {
      setLoading(true);
      await invitationAPI.delete(token);
      setInvitations(prev => prev.filter(inv => inv.token !== token));
      toast.success('Invitation deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete invitation');
    } finally {
      setLoading(false);
    }
  };


  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile({
        userId: user._id,
        name: accountData.name,
        phone: accountData.phone,
        email: accountData.email,
        moreInfo: accountData.moreInfo,
        statusMain: accountData.statusMain,
        statusCustom: accountData.statusCustom,
        avatar: accountData.avatar,
        image: accountData.image,
        locationLat: accountData.locationLat,
        locationLng: accountData.locationLng,
        shareLocation: accountData.shareLocation
      });

      if (response.success) {
        logUserAction('acount_update', { userId: user._id });
        toast.success('Account updated successfully!');

        // Update the user object in the parent component
        if (onUserUpdate) {
          const updatedUser = {
            ...user,
            name: accountData.name,
            phone: accountData.phone,
            email: accountData.email,
            moreInfo: accountData.moreInfo,
            statusMain: accountData.statusMain,
            statusCustom: accountData.statusCustom,
            avatar: accountData.avatar,
            image: accountData.image,
            locationLat: accountData.locationLat,
            locationLng: accountData.locationLng,
            shareLocation: accountData.shareLocation
          };
          onUserUpdate(updatedUser);
        }

        // Reload account data to reflect changes
        loadAccount();
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);

      if (response.success) {
        logUserAction('password_change', { userId: user._id });
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-center mb-6 space-x-4">
        <Button
          onClick={() => navigate(`/profile`)}
          className="w-sm text-muted-foreground btn-modern h-12  font-semibold"
        >
          <Eye />  {t('page.account.publicView')}
        </Button>
      </div>

      <div className="text-center space-y-3 md:space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full mb-2 md:mb-4 bg-gradient-to-br from-primary/20 to-primary/5">
          <User className="w-6 h-6 md:w-8 md:h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('page.account.title')}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base lg:text-lg mt-1 md:mt-2 px-2">{t('page.account.subtitle')}</p>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
        {/* Profile Information */}
        <Card className="shadow-lg border-0" style={{ background: 'linear-gradient(135deg, oklch(var(--card)), oklch(var(--card) / 0.5))' }}>
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                <Edit3 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">{t('page.account.accountInformation')}</CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground">{t('page.account.updateDetails')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Image and Avatar Upload */}
            <div className="rounded-lg md:rounded-xl p-4 md:p-6 border" style={{ background: 'linear-gradient(90deg, oklch(var(--muted) / 0.3), oklch(var(--muted) / 0.1))', borderColor: 'oklch(var(--border) / 0.5)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
                {/* Avatar */}
                <div className="text-center space-y-3 md:space-y-4">
                  <div className="relative group mx-auto w-fit">
                    <Avatar className="w-16 h-16 md:w-20 md:h-20 transition-all duration-300" style={{ boxShadow: '0 0 0 4px oklch(var(--primary) / 0.2)' }}>
                      <AvatarImage src={accountData.avatar} alt="Avatar" />
                      <AvatarFallback className="text-primary text-lg md:text-xl" style={{ background: 'linear-gradient(135deg, oklch(var(--primary) / 0.2), oklch(var(--primary) / 0.1))' }}>
                        <User className="w-6 h-6 md:w-8 md:h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-primary rounded-full p-1 md:p-1.5 shadow-lg">
                      <Upload className="w-2 h-2 md:w-3 md:h-3 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Profile Avatar</Label>
                    <div className="flex flex-col items-center space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e)}
                        name="avatar"
                        className="w-28 md:w-32 text-xs"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Select an image to crop and upload
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Image */}
                <div className="text-center space-y-3 md:space-y-4">
                  <div className="relative group mx-auto w-fit">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300" style={{ background: 'linear-gradient(135deg, oklch(var(--muted)), oklch(var(--muted) / 0.5))', boxShadow: '0 0 0 4px oklch(var(--primary) / 0.2)' }}>
                      {accountData.image ? (
                        <img src={accountData.image} alt="Account" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-primary rounded-full p-1 md:p-1.5 shadow-lg">
                      <Upload className="w-2 h-2 md:w-3 md:h-3 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cover Image</Label>
                    <div className="flex flex-col items-center space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e)}
                        name="image"
                        className="w-28 md:w-32 text-xs"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Select an image to crop and upload
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <form onSubmit={handleProfileSubmit} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">{t('page.account.name')}</Label>
                  <Input
                    id="name"
                    name="name"
                    value={accountData.name}
                    onChange={handleAccountChange}
                    placeholder={t('page.account.enterName')}
                    className="h-9 md:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">{t('page.account.phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={accountData.phone}
                    onChange={handleAccountChange}
                    placeholder={t('page.account.enterPhone')}
                    className="h-9 md:h-10"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email" className="text-sm">{t('page.account.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={accountData.email}
                    onChange={handleAccountChange}
                    placeholder={t('page.account.enterEmail')}
                    className="h-9 md:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusMain" className="text-sm">{t('page.account.mainStatus')}</Label>
                  <Select value={accountData.statusMain} onValueChange={(value: string) => handleAccountChange({ target: { name: 'statusMain', value } } as any)}>
                    <SelectTrigger className="h-9 md:h-10">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="soon">Soon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusCustom" className="text-sm">{t('page.account.customStatus')}</Label>
                  <Input
                    id="statusCustom"
                    name="statusCustom"
                    value={accountData.statusCustom}
                    onChange={handleAccountChange}
                    placeholder={t('page.account.setCustomStatus')}
                    className="h-9 md:h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moreInfo" className="text-sm">{t('page.account.about')}</Label>
                <Textarea
                  id="moreInfo"
                  name="moreInfo"
                  value={accountData.moreInfo}
                  onChange={handleAccountChange}
                  placeholder={t('page.account.tellAboutYourself')}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                variant={'secondary'}
                disabled={loading}
                className="w-full h-10 md:h-11"
              >
                {loading ? t('page.account.updating') : t('page.account.updateProfile')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="shadow-lg border-0" style={{ background: 'linear-gradient(135deg, oklch(var(--card)), oklch(var(--card) / 0.5))' }}>
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                <Lock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">{t('page.account.securitySettings')}</CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground">{t('page.account.updatePassword')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm">{t('page.account.currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder={t('page.account.enterCurrentPassword')}
                  className="h-9 md:h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm">{t('page.account.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder={t('page.account.enterNewPassword')}
                  className="h-9 md:h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm">{t('page.account.confirmNewPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder={t('page.account.enterConfirmPassword')}
                  className="h-9 md:h-10"
                />
              </div>

              <Button
                type="submit"
                variant={'secondary'}
                disabled={loading}
                className="w-full h-10 md:h-11"
              >
                {loading ? t('page.account.changing') : t('page.account.changePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* Location Settings */}
        <div className="space-y-3 md:space-y-4 p-3 md:p-4 rounded-lg border" style={{ background: 'linear-gradient(135deg, oklch(var(--muted) / 0.1), oklch(var(--muted) / 0.05))', borderColor: 'oklch(var(--border) / 0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <MapPin className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <span className="text-xs md:text-sm font-medium">{t('page.account.shareLocation')}</span>
            </div>
            <input
              type="checkbox"
              checked={accountData.shareLocation}
              onChange={(e) => handleShareLocationChange(e.target.checked)}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-muted-foreground">{t('page.account.currentLocation')}</span>
            <Button
              type="button"
              onClick={handleGetCurrentLocation}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              {t('page.account.getLocation')}
            </Button>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="font-mono text-xs">
              {accountData.locationLat && accountData.locationLng
                ? `${toPersianNumbers(accountData.locationLat.toFixed(4))}, ${toPersianNumbers(accountData.locationLng.toFixed(4))}`
                : 'Not set'
              }
            </Badge>
          </div>
          {accountData.locationLat && accountData.locationLng && (
            <div className="mt-4">
              <MapComponent
                latitude={accountData.locationLat}
                longitude={accountData.locationLng}
                userName="Your Location"
                height="250px"
              />
            </div>
          )}
        </div>
        <Separator className="my-8" />

        {/* Social Statistics */}
        <SocialStats userId={user._id} />

        {/* Invitation Management - Only for stores */}
        {user.role === 'store' && (
          <Card className="shadow-lg border-0" style={{ background: 'linear-gradient(135deg, oklch(var(--card)), oklch(var(--card) / 0.5))' }}>
            <CardHeader className="pb-3 md:pb-4">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                  <UserPlus className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg md:text-xl">{t('page.account.invitationManagement')}</CardTitle>
                  <p className="text-xs md:text-sm text-muted-foreground">{t('page.account.createManageInvitations')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                {/* Create Invitation Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={invitationType}
                    onChange={(e) => setInvitationType(e.target.value as 'staff' | 'customer')}
                    className="input-modern flex-1"
                  >
                    <option value="customer">{t('page.account.customerInvitation')}</option>
                    <option value="staff">{t('page.account.staffInvitation')}</option>
                  </select>
                  <Button
                    onClick={handleCreateInvitation}
                    disabled={loading}
                    className="btn-primary whitespace-nowrap"
                  >
                    {loading ? t('page.account.creating') : t('page.account.createInvitation')}
                  </Button>
                </div>

                {/* Current Invitation Display */}
                {currentInvitation && (
                  <div className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">
                        {currentInvitation.type === 'staff' ? t('page.account.staffInvitation') : t('page.account.customerInvitation')} {t('page.account.invitationCreated')}
                      </h4>
                      <Badge variant="secondary">{currentInvitation.type}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* QR Code */}
                      <div className="text-center">
                        <p className="text-sm font-medium mb-2">{t('page.account.qrCode')}</p>
                        <img
                          src={currentInvitation.qrCode}
                          alt="Invitation QR Code"
                          className="mx-auto border rounded"
                          style={{ maxWidth: '150px', maxHeight: '150px' }}
                        />
                      </div>

                      {/* Link and Actions */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">{t('page.account.invitationLink')}</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={currentInvitation.invitationUrl}
                              readOnly
                              className="input-modern text-xs flex-1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyLink(currentInvitation.invitationUrl)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleShareLink(currentInvitation.invitationUrl)}
                            className="flex-1"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            {t('page.account.share')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invitations List */}
                {invitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">{t('page.account.yourInvitations', { count: invitations.length })}</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {invitations.map((invitation) => (
                        <div key={invitation.token} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={invitation.type === 'staff' ? 'default' : 'secondary'} className="text-xs">
                                {invitation.type}
                              </Badge>
                              {invitation.isUsed && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  Used
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {invitation.invitationUrl}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('page.account.created')}: {invitation.createdAt ? formatPersianDate(invitation.createdAt, 'short') : t('page.account.notSet')}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyLink(invitation.invitationUrl)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            {!invitation.isUsed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteInvitation(invitation.token)}
                                className="text-red-600 hover:text-red-700"
                              >
                                ×
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Cropper Modal */}
      {croppingState.showCropper && (
        <SimpleImageCropper
          imageSrc={croppingState.imageSrc}
          type={croppingState.imageType as 'avatar' | 'cover'}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default Account;