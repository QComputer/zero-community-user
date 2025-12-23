import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, UserPlus, UserCheck } from 'lucide-react';
import { socialAPI } from '../services/api';
import { useTranslation } from 'react-i18next';

interface SocialStatsProps {
  userId: string;
  showTitle?: boolean;
  compact?: boolean;
}

interface SocialData {
  friends: number;
  following: number;
  followers: number;
}

const SocialStats: React.FC<SocialStatsProps> = ({
  userId,
  showTitle = true,
  compact = false
}) => {
  const [socialData, setSocialData] = useState<SocialData>({
    friends: 0,
    following: 0,
    followers: 0
  });
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadSocialStats();
  }, [userId]);

  const loadSocialStats = async () => {
    try {
      const response = await socialAPI.getRelationships();
      if (response.data.success) {
        const data = response.data.data;
        setSocialData({
          friends: data.friends.length,
          following: data.following.length,
          followers: data.followers.length
        });
      }
    } catch (error) {
      console.error('Error loading social stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        {showTitle && (
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-lg md:text-xl">Social Stats</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <UserCheck className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{socialData.friends}</span>
          <span className="text-xs text-muted-foreground">Friends</span>
        </div>
        <div className="flex items-center space-x-2">
          <UserPlus className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{socialData.following}</span>
          <span className="text-xs text-muted-foreground">Following</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{socialData.followers}</span>
          <span className="text-xs text-muted-foreground">Followers</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg border-0" style={{ background: 'linear-gradient(135deg, oklch(var(--card)), oklch(var(--card) / 0.5))' }}>
      {showTitle && (
        <CardHeader className="pb-3 md:pb-4">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl">{t("common.socialNetwork")}</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">{t("common.connectionsAnd")}</p>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          <div className="flex justify-between items-center p-2 md:p-3 rounded-lg" style={{ background: 'linear-gradient(90deg, oklch(var(--muted) / 0.3), transparent)' }}>
            <div className="flex items-center space-x-2 md:space-x-3">
              <UserCheck className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <span className="text-xs md:text-sm font-medium">{t("common.friends")}</span>
            </div>
            <Badge variant="secondary" className="font-semibold text-xs md:text-sm">{socialData.friends}</Badge>
          </div>
          <div className="flex justify-between items-center p-2 md:p-3 rounded-lg" style={{ background: 'linear-gradient(90deg, oklch(var(--muted) / 0.3), transparent)' }}>
            <div className="flex items-center space-x-2 md:space-x-3">
              <UserPlus className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <span className="text-xs md:text-sm font-medium">{t("common.following")}</span>
            </div>
            <Badge variant="secondary" className="font-semibold text-xs md:text-sm">{socialData.following}</Badge>
          </div>
          <div className="flex justify-between items-center p-2 md:p-3 rounded-lg" style={{ background: 'linear-gradient(90deg, oklch(var(--muted) / 0.3), transparent)' }}>
            <div className="flex items-center space-x-2 md:space-x-3">
              <Users className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <span className="text-xs md:text-sm font-medium">{t("common.followers")}</span>
            </div>
            <Badge variant="secondary" className="font-semibold text-xs md:text-sm">{socialData.followers}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialStats;