import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { socialAPI } from '../services/api';
import { toast } from 'react-toastify';


interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
}

const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  currentUserId,
  onFollowChange,
  size = 'default',
  variant = 'default'
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [targetUserId, currentUserId]);

  const checkFollowStatus = async () => {
    if (currentUserId === targetUserId) {
      setCheckingStatus(false);
      return;
    }

    try {
      const response = await socialAPI.getStatus(targetUserId);
      if (response.data.success) {
        setIsFollowing(response.data.data.isFollowing);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFollowToggle = async () => {
    if (loading || currentUserId === targetUserId) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await socialAPI.unfollow(targetUserId);
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        await socialAPI.follow(targetUserId);
        setIsFollowing(true);
        toast.success('Followed successfully');
      }

      onFollowChange?.(!isFollowing);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  if (currentUserId === targetUserId) {
    return null; // Don't show follow button for own profile
  }

  if (checkingStatus) {
    return (
      <Button size={size} variant={variant} disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={isFollowing ? 'outline' : variant}
      onClick={handleFollowToggle}
      disabled={loading}
      className="min-w-[100px]"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {loading ? 'Updating...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
};

export default FollowButton;