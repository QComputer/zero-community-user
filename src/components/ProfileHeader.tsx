import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

interface ProfileHeaderProps {
  name: string;
  username?: string;
  avatar?: string;
  coverImage?: string;
  statusMain?: string;
  statusCustom?: string;
  subtitle?: string;
  isStore?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  username,
  avatar,
  coverImage,
  statusMain = 'online',
  statusCustom,
  subtitle,
  isStore = false
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Cover Image Background */}
      <div
        className="h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 relative"
        style={{
          backgroundImage: coverImage ? `url(${coverImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Profile Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
          {/* Profile Avatar */}
          <div className="relative">
            {/* Status Ring */}
            <div className="relative rounded-full p-0.5" style={{
              '--tw-ring-color': statusMain === 'online' ? 'var(--status-online)' :
                statusMain === 'offline' ? 'var(--status-offline)' :
                  statusMain === 'busy' ? 'var(--status-busy)' :
                    statusMain === 'soon' ? 'var(--status-soon)' :
                      'var(--muted-foreground)',
              background: statusMain ? `conic-gradient(
                var(--status-online) 0deg,
                var(--status-busy) 90deg,
                var(--status-soon) 180deg,
                var(--status-offline) 270deg,
                var(--status-online) 360deg
              )` : 'transparent',
              padding: '3px',
              borderRadius: '50%'
            } as React.CSSProperties}>
              <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-white shadow-lg ring-2" style={{
                '--tw-ring-color': statusMain === 'online' ? 'var(--status-online)' :
                  statusMain === 'offline' ? 'var(--status-offline)' :
                    statusMain === 'busy' ? 'var(--status-busy)' :
                      statusMain === 'soon' ? 'var(--status-soon)' :
                        'var(--muted-foreground)'
              } as React.CSSProperties}>
                <AvatarImage src={avatar} alt="Profile Avatar" />
                <AvatarFallback className="text-2xl md:text-3xl font-semibold bg-primary text-primary-foreground">
                  {(name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Status Badge */}
            {statusMain && (
              <div className="absolute -bottom-2 -right-2">
                <Badge
                  className={`text-xs px-2 py-1 border-2 border-white shadow-md font-medium ${
                    statusMain === 'online' ? 'bg-status-online text-white' :
                    statusMain === 'offline' ? 'bg-status-offline text-white' :
                    statusMain === 'busy' ? 'bg-status-busy text-white' :
                    statusMain === 'soon' ? 'bg-status-soon text-white' :
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  {t(`common.statusBadge.${statusMain}`)}
                </Badge>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="text-white">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight drop-shadow-lg">
              {name}
            </h1>
            <p className="text-white/90 text-sm md:text-base lg:text-lg mt-1 md:mt-2 drop-shadow-md">
              {subtitle || (isStore ? t('common.store') : t('page.profile.publicView'))}
            </p>
            {username && (
              <p className="text-white/80 text-xs md:text-sm mt-1 italic drop-shadow-sm">
                @{username}
              </p>
            )}
            {statusCustom && (
              <p className="text-white/80 text-xs md:text-sm mt-1 italic drop-shadow-sm">
                "{statusCustom}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;