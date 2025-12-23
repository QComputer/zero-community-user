import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { UserCheck, UserPlus, Loader2 } from 'lucide-react';
import { socialAPI } from '../services/api';
import { toast } from 'react-toastify';

interface FriendButtonProps {
  targetUserId: string;
  currentUserId: string;
  onFriendChange?: (isFriend: boolean) => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
}

const FriendButton: React.FC<FriendButtonProps> = ({
  targetUserId,
  currentUserId,
  onFriendChange,
  size = 'default',
  variant = 'default'
}) => {
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkFriendStatus();
  }, [targetUserId, currentUserId]);

  const checkFriendStatus = async () => {
    if (currentUserId === targetUserId) {
      setCheckingStatus(false);
      return;
    }

    try {
      const response = await socialAPI.getStatus(targetUserId);
      if (response.data.success) {
        setIsFriend(response.data.data.isFriend);
      }
    } catch (error) {
      console.error('Error checking friend status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFriendToggle = async () => {
    if (loading || currentUserId === targetUserId) return;

    setLoading(true);
    try {
      if (isFriend) {
        await socialAPI.removeFriend(targetUserId);
        setIsFriend(false);
        toast.success('Friend removed successfully');
      } else {
        await socialAPI.addFriend(targetUserId);
        setIsFriend(true);
        toast.success('Friend added successfully');
      }

      onFriendChange?.(!isFriend);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update friend status');
    } finally {
      setLoading(false);
    }
  };

  if (currentUserId === targetUserId) {
    return null; // Don't show friend button for own profile
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
      variant={isFriend ? 'outline' : variant}
      onClick={handleFriendToggle}
      disabled={loading}
      className="min-w-[100px]"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : isFriend ? (
        <UserCheck className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {loading ? 'Updating...' : isFriend ? 'Friends' : 'Add Friend'}
    </Button>
  );
};

export default FriendButton;