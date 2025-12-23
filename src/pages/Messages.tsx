import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { messageAPI, userAPI, socialAPI } from '../services/api';
import { logUserAction } from '../services/logger';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Send, Users, MessageSquare, UserPlus, Heart, UserCheck, UserMinus, Menu, Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AvatarLink from '../components/AvatarLink';

interface MessagesProps {
  user: any;
}

interface Conversation {
  _id: string;
  type: 'private' | 'group';
  name: string;
  avatar: string;
  statusMain: string;
  participants: any[];
  lastMessage?: any;
  unreadCount: number;
}

const Messages: React.FC<MessagesProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [socialRelationships, setSocialRelationships] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'chats' | 'social'>('chats');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userUnreadCounts, setUserUnreadCounts] = useState<{ [userId: string]: number }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  // Detect mobile screen size and set initial sidebar state
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      // Auto-collapse sidebar on mobile
      if (mobile) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    loadData();
    // Poll for new conversations and unread messages every 30 seconds
    const interval = setInterval(() => {
      loadConversations();
      loadUnreadMessages();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle navigation state for starting chat with specific user
  useEffect(() => {
    if (location.state?.startChatWith && users.length > 0 && !loading) {
      const targetUser = users.find(u => u._id === location.state.startChatWith);
      if (targetUser) {
        const conversation: Conversation = {
          _id: targetUser._id,
          type: 'private',
          name: targetUser.username,
          statusMain: targetUser.statusMain,
          avatar: targetUser.avatar,
          participants: [targetUser],
          unreadCount: 0
        };
        setSelectedConversation(conversation);
        loadMessages(conversation);
        // Clear the state to prevent re-triggering
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, users, loading]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Smart scroll behavior - only scroll on new messages
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      // New messages were added, scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);


  const loadData = async () => {
    try {
      await Promise.all([
        loadUsers(),
        loadConversations(),
        loadSocialRelationships(),
        loadUnreadMessages()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      if (response.success && response.data) {
        const filteredUsers = response.data.filter((u: any) => u._id !== user._id);
        setUsers(filteredUsers);
      }
    } catch (error: any) {
      toast.error('Failed to load users');
    }
  };

  const loadConversations = async () => {
    try {
      // Use the all-conversations endpoint to include both private and group chats
      try {
        const response = await messageAPI.getAllConversations();
        console.log('All Conversations API response:', response.data); // Debug log
        
        // Debug: Check if conversations have lastMessage with content
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach((conv: any, index: number) => {
            console.log(`Conversation ${index}:`, {
              id: conv._id,
              name: conv.name,
              hasLastMessage: !!conv.lastMessage,
              lastMessageContent: conv.lastMessage?.content,
              lastMessageObject: conv.lastMessage
            });

            // Log warning if lastMessage is missing but conversation exists
            if (!conv.lastMessage) {
              console.warn(`Conversation ${conv._id} (${conv.name}) has no lastMessage`);
            }
          });
        }

        // Handle standardized response structure
        let userConversations = [];
        if (response.success && response.data) {
          userConversations = response.data;
        }

        // Remove duplicates based on conversation id
        const uniqueConversations = userConversations.filter((conversation: Conversation, index: number, self: any[]) =>
          index === self.findIndex((c: any) => c._id === conversation._id)
        );

        // If we have a target user from navigation state, ensure they're in the conversations
        if (location.state?.startChatWith) {
          const targetUser = users.find(u => u._id === location.state.startChatWith);
          if (targetUser && !uniqueConversations.find((c: any) => c._id === targetUser._id)) {
            uniqueConversations.unshift({
              _id: targetUser._id,
              type: 'private',
              name: targetUser.username || targetUser.name || 'Unknown',
              avatar: targetUser.avatar || '',
              statusMain: targetUser.statusMain || 'offline',
              participants: [targetUser],
              unreadCount: 0
            });
          }
        }

        // Ensure conversations have proper structure
        const normalizedConversations = uniqueConversations.map((conversation: any) => ({
          _id: conversation._id || conversation.id,
          type: conversation.type || 'private',
          name: conversation.name || 'Unknown',
          avatar: conversation.avatar || '',
          statusMain: conversation.statusMain || 'pfline',
          participants: conversation.participants || [],
          lastMessage: conversation.lastMessage || null,
          unreadCount: conversation.unreadCount || 0
        }));

        setConversations(normalizedConversations);
        return;
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }

      // Fallback to empty conversations if both fail
      setConversations([]);

    } catch (error) {
      console.error('Failed to load conversations with both endpoints:', error);
      setConversations([]);
    }
  };

  const loadSocialRelationships = async () => {
    try {
      const response = await socialAPI.getRelationships();
      console.log('Social relationships response:', response.data); // Debug log

      // Handle standardized response structure
      let relationships = { friends: [], following: [], followers: [] };
      if (response.success && response.data) {
        relationships = response.data;
      }

      // Ensure all arrays exist
      setSocialRelationships({
        friends: relationships.friends || [],
        following: relationships.following || [],
        followers: relationships.followers || []
      });
    } catch (error) {
      console.error('Failed to load social relationships:', error);
      // Fallback to empty relationships
      setSocialRelationships({ friends: [], following: [], followers: [] });
    }
  };

  const loadUnreadMessages = async () => {
    try {
      const response = await messageAPI.getUnreadMessages();
      const unreadMessages = response.data || [];

      // Calculate per-user unread counts

      // Calculate per-user unread counts
      const userCounts: { [userId: string]: number } = {};
      unreadMessages.forEach((msg: any) => {
        const senderId = msg.senderId;
        userCounts[senderId] = (userCounts[senderId] || 0) + 1;
      });
      setUserUnreadCounts(userCounts);
    } catch (error) {
      console.error('Failed to load unread messages:', error);
      // setTotalUnreadCount(0); // Removed unused state
      setUserUnreadCounts({});
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setActiveTab('chats');
    // Load messages immediately when conversation is selected
    loadMessages(conversation);
  };

  const loadMessages = async (conversation: Conversation) => {
    try {
      let loadedMessages = [];

      if (conversation.type === 'private') {
        const response = await messageAPI.getConversation(conversation._id);

        // Handle standardized API response structure
        if (response.success && response.data) {
          loadedMessages = response.data;
        }

        // Mark messages as read after loading
        await markMessagesAsRead(loadedMessages, conversation._id);
      } else if (conversation.type === 'group') {
        // Handle group messages
        const response = await messageAPI.getGroupMessages(conversation._id);

        if (response.success && response.data) {
          loadedMessages = response.data;
        }
      }

      // Ensure messages is always an array
      if (!Array.isArray(loadedMessages)) {
        loadedMessages = [];
      }

      console.log('Loaded messages:', loadedMessages.length, 'messages for conversation:', conversation._id);
      setMessages(loadedMessages);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
      // Fallback to empty messages if error occurs
      setMessages([]);
    }
  };

  const markMessagesAsRead = async (messages: any[], conversationId: string) => {
    try {
      // Find unread messages from this conversation that are sent to the current user
      const unreadMessages = messages.filter(msg =>
        msg.recipientId === user._id &&
        msg.senderId === conversationId &&
        !msg.isRead &&
        !msg.readByUsers?.includes(user._id)
      );

      // Use bulk mark as read if there are multiple messages
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg._id);
        await messageAPI.markMessagesAsRead(messageIds);

        // Refresh conversations to update unread counts
        loadConversations();
      }
    } catch (error: any) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      if (selectedConversation.type === 'private') {
        await messageAPI.send({
          recipientId: selectedConversation._id,
          content: newMessage,
          messageType: 'text'
        });
      } else if (selectedConversation.type === 'group') {
        await messageAPI.send({
          groupId: selectedConversation._id,
          content: newMessage,
          messageType: 'text'
        });
      }

      logUserAction('send_message', {
        conversationId: selectedConversation._id,
        userId: user._id
      });
      setNewMessage('');
      loadMessages(selectedConversation);
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  };

  const handleMultiSend = async (recipientIds: string[]) => {
    if (!newMessage.trim() || recipientIds.length === 0) return;

    try {
      await messageAPI.send({
        recipientIds,
        content: newMessage,
        messageType: 'text'
      });

      logUserAction('multi_send_message', {
        recipientIds,
        userId: user._id
      });
      setNewMessage('');
      toast.success(`Message sent to ${recipientIds.length} users!`);
    } catch (error: any) {
      toast.error('Failed to send messages');
    }
  };


  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSocialAction = async (action: string, targetUserId: string) => {
    try {
      switch (action) {
        case 'follow':
          await socialAPI.follow(targetUserId);
          toast.success('User followed successfully');
          break;
        case 'unfollow':
          await socialAPI.unfollow(targetUserId);
          toast.success('User unfollowed successfully');
          break;
        case 'add_friend':
          await socialAPI.addFriend(targetUserId);
          toast.success('Friend added successfully');
          break;
        case 'remove_friend':
          await socialAPI.removeFriend(targetUserId);
          toast.success('Friend removed successfully');
          break;
        case 'follow_back':
          await socialAPI.follow(targetUserId);
          toast.success('Followed back successfully');
          break;
        default:
          toast.error('Unknown action');
      }
      // Refresh social relationships
      loadSocialRelationships();
    } catch (error: any) {
      toast.error(`Failed to ${action}: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[87vh] flex bg-background rounded-lg overflow-hidden relative" dir="ltr">
      {/* Sidebar */}
      <div className={`
        ${sidebarCollapsed ? 'w-16' : 'w-80'}
        border-r bg-card/50 backdrop-blur-sm transition-all duration-500 ease-out
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-3 border-b flex items-center justify-between" onClick={toggleSidebar}>
          {!sidebarCollapsed && (
            <h2 className="text-lg font-semibold">Messages</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={sidebarCollapsed ? 'mx-auto' : ''}
          >
            <Menu className={`w-5 h-5 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-90' : ''}`} />
          </Button>
        </div>

        {/* Tab Buttons */}
        <div className="p-3 border-b">
          <div className={`flex ${sidebarCollapsed ? 'flex-col space-y-2' : 'space-x-2'}`}>
            <Button
              variant={activeTab === 'chats' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('chats')}
              className={sidebarCollapsed ? 'w-full justify-center px-2' : 'flex-1'}
              title={sidebarCollapsed ? 'Chats' : undefined}
            >
              <MessageSquare className="w-4 h-4" />
              {!sidebarCollapsed && <span className="ml-2">Chats</span>}
            </Button>
            <Button
              variant={activeTab === 'social' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('social')}
              className={sidebarCollapsed ? 'w-full justify-center px-2' : 'flex-1'}
              title={sidebarCollapsed ? 'Social' : undefined}
            >
              <Users className="w-4 h-4" />
              {!sidebarCollapsed && <span className="ml-2">Social</span>}
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto scrollable-content"
          style={{
            scrollbarWidth: 'none', // Hide scrollbar in Firefox
            msOverflowStyle: 'none', // Hide scrollbar in IE/Edge
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              .scrollable-content::-webkit-scrollbar {
                width: 2px;
              }
              .scrollable-content::-webkit-scrollbar-track {
                background: transparent;
              }
              .scrollable-content::-webkit-scrollbar-thumb {
                background: transparent;
              }
              .scrollable-content:hover::-webkit-scrollbar-thumb {
                background: hsl(var(--muted));
              }
            `
          }} />
          {activeTab === 'chats' ? (
            <div className="p-2">
              {(!conversations || conversations.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  {!sidebarCollapsed && <p className="text-xs">No conversations yet</p>}
                </div>
              ) : (
                conversations.map((conversation, index) => (
                  <div
                    key={`${conversation._id}-${conversation.type}-${index}`}
                    onClick={() => selectConversation(conversation)}
                    className={`
                      ${sidebarCollapsed
                        ? 'p-2 mb-1 flex justify-center'
                        : 'p-3 mb-1'
                      }
                      rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent
                      ${selectedConversation?._id === conversation._id ? 'bg-accent' : ''}
                    `}
                    title={sidebarCollapsed ? conversation.name : undefined}
                  >
                    {sidebarCollapsed ? (
                      // Avatar only mode
                      <div className="relative">
                        {conversation.avatar && conversation.avatar.trim() !== '' ? (
                          <div className="relative">
                            <Avatar className="w-9  h-9 ring-3" style={{
                              '--tw-ring-color': conversation.statusMain === 'online' ? 'var(--status-online)' :
                                conversation.statusMain === 'offline' ? 'var(--status-offline)' :
                                  conversation.statusMain === 'busy' ? 'var(--status-busy)' :
                                    conversation.statusMain === 'soon' ? 'var(--status-soon)' :
                                      'var(--muted-foreground)'
                            } as React.CSSProperties}>
                              <AvatarImage src={conversation.avatar} alt={conversation.name} />
                              <AvatarFallback className="text-xl font-semibold">
                                {conversation.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-primary">
                                {(conversation.name || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}
                        {(conversation.unreadCount || 0) > 0 && (
                          <span className="absolute -top-1 -right-2 bg-constructive text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {(conversation.unreadCount || 0) > 9 ? '9+' : (conversation.unreadCount || 0)}
                          </span>
                        )}
                      </div>
                    ) : (
                      // Full mode with name and details
                      <div className="flex items-center space-x-3">
                        {conversation.avatar && conversation.avatar.trim() !== '' ? (
                          <div className="relative">
                            <Avatar className="w-10 h-10 ring-4" style={{
                              '--tw-ring-color': conversation.statusMain === 'online' ? 'var(--status-online)' :
                                conversation.statusMain === 'offline' ? 'var(--status-offline)' :
                                  conversation.statusMain === 'busy' ? 'var(--status-busy)' :
                                    conversation.statusMain === 'soon' ? 'var(--status-soon)' :
                                      'var(--muted-foreground)'
                            } as React.CSSProperties}>
                              <AvatarImage src={conversation.avatar} alt={conversation.name} />
                              <AvatarFallback className="text-xl font-semibold">
                                {conversation.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-primary">
                                {(conversation.name || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{conversation.name || 'Unknown'}</p>
                            {(conversation.unreadCount || 0) > 0 && (
                              <span className="bg-constructive text-primary-foreground text-xs px-2 py-1 rounded-full flex-shrink-0">
                                {(conversation.unreadCount || 0)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.lastMessage?.content ? conversation.lastMessage.content : (conversation.unreadCount > 0 ? 'New messages' : 'No messages yet')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-3 space-y-4">
              {/* Find People Button */}
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/people')}
                  className={`${sidebarCollapsed ? 'w-full justify-center px-2' : 'w-full flex items-center justify-center'}`}
                  title={sidebarCollapsed ? 'Find People' : undefined}
                >
                  <Users className="w-4 h-4" />
                  {!sidebarCollapsed && <span className="ml-2">Find People</span>}
                </Button>
              </div>

              {/* Friends */}
              <div>
                {!sidebarCollapsed && (
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    Friends ({socialRelationships.friends?.length || 0})
                  </h3>
                )}
                <div className="space-y-2">
                  {(!socialRelationships.friends || socialRelationships.friends.length === 0) ? (
                    !sidebarCollapsed && <p className="text-xs text-muted-foreground">No friends yet</p>
                  ) : (
                    socialRelationships.friends?.map((friend: any) => {
                      if (!friend || !friend._id) return null;
                      const unreadCount = userUnreadCounts[friend._id] || 0;
                      
                      // Find existing conversation with this friend to get last message
                      const existingConversation = conversations.find(c => c._id === friend._id);
                      
                      // If no existing conversation, create a placeholder but don't show "No messages yet" if we have unread messages
                      const displayLastMessage = existingConversation?.lastMessage || null;
                      
                      return (
                        <div
                          key={friend._id}
                          onClick={() => selectConversation({
                            _id: friend._id,
                            type: 'private',
                            name: friend.username || friend.name || 'Unknown',
                            avatar: friend.avatar || '',
                            statusMain: friend.statusMain || 'offline',
                            participants: [friend],
                            lastMessage: displayLastMessage,
                            unreadCount: unreadCount
                          })}
                          className={`
                            ${sidebarCollapsed
                              ? 'p-2 flex justify-center cursor-pointer rounded-lg hover:bg-accent'
                              : 'flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer'
                            }
                          `}
                          title={sidebarCollapsed ? friend.username : undefined}
                        >
                          {sidebarCollapsed ? (
                            <div className="relative">
                              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-white">
                                  {(friend.username || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {unreadCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-semibold text-white">
                                      {(friend.username || 'U').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  {unreadCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                                      {unreadCount > 9 ? '9+' : unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-sm truncate">{friend.username || 'Unknown'}</span>
                              </div>
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Following */}
              <div>
                {!sidebarCollapsed && (
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Following ({socialRelationships.following?.length || 0})
                  </h3>
                )}
                <div className="space-y-2">
                  {(!socialRelationships.following || socialRelationships.following.length === 0) ? (
                    !sidebarCollapsed && <p className="text-xs text-muted-foreground">Not following anyone</p>
                  ) : (
                    socialRelationships.following?.map((following: any) => {
                      if (!following || !following._id) return null;
                      return (
                        <div
                          key={following._id}
                          className={`
                            ${sidebarCollapsed
                              ? 'p-2 flex justify-center cursor-pointer rounded-lg hover:bg-accent'
                              : 'flex items-center justify-between p-2 rounded-lg hover:bg-accent'
                            }
                          `}
                          title={sidebarCollapsed ? following.username : undefined}
                        >
                          {sidebarCollapsed ? (
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-white">
                                {(following.username || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-semibold text-white">
                                    {(following.username || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm truncate">{following.username || 'Unknown'}</span>
                              </div>
                              <div className="flex space-x-1">
                                <UserMinus
                                  className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSocialAction('unfollow', following._id);
                                  }}
                                />
                                <MessageSquare
                                  className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const existingConversation = conversations.find(c => c._id === following._id);
                                    selectConversation({
                                      _id: following._id,
                                      type: 'private',
                                      name: following.username || following.name || 'Unknown',
                                      avatar: following.avatar || '',
                                      statusMain: following.statusMain || 'offline',
                                      participants: [following],
                                      lastMessage: existingConversation?.lastMessage || null,
                                      unreadCount: 0
                                    });
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Followers */}
              <div>
                {!sidebarCollapsed && (
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Followers ({socialRelationships.followers?.length || 0})
                  </h3>
                )}
                <div className="space-y-2">
                  {(!socialRelationships.followers || socialRelationships.followers.length === 0) ? (
                    !sidebarCollapsed && <p className="text-xs text-muted-foreground">No followers yet</p>
                  ) : (
                    socialRelationships.followers?.map((follower: any) => {
                      if (!follower || !follower._id) return null;
                      return (
                        <div
                          key={follower._id}
                          className={`
                            ${sidebarCollapsed
                              ? 'p-2 flex justify-center cursor-pointer rounded-lg hover:bg-accent'
                              : 'flex items-center justify-between p-2 rounded-lg hover:bg-accent'
                            }
                          `}
                          title={sidebarCollapsed ? follower.username : undefined}
                        >
                          {sidebarCollapsed ? (
                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-white">
                                {(follower.username || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-semibold text-white">
                                    {(follower.username || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm truncate">{follower.username || 'Unknown'}</span>
                              </div>
                              <div className="flex space-x-1">
                                <UserCheck
                                  className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSocialAction('follow_back', follower._id);
                                  }}
                                />
                                <MessageSquare
                                  className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const existingConversation = conversations.find(c => c._id === follower._id);
                                    selectConversation({
                                      _id: follower._id,
                                      type: 'private',
                                      name: follower.username || follower.name || 'Unknown',
                                      avatar: follower.avatar || '',
                                      statusMain: follower.statusMain || 'offline',
                                      participants: [follower],
                                      lastMessage: existingConversation?.lastMessage || null,
                                      unreadCount: 0
                                    });
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card/50 backdrop-blur-sm flex items-center">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {selectedConversation.avatar && selectedConversation.avatar.trim() !== '' ? (
                  <AvatarLink
                    src={selectedConversation.avatar}
                    userId={selectedConversation._id}
                    className="w-10 h-10"
                  >
                    <div className="relative rounded-full p-0.5" style={{
                      '--tw-ring-color': selectedConversation.statusMain === 'online' ? 'var(--status-online)' :
                        selectedConversation.statusMain === 'offline' ? 'var(--status-offline)' :
                          selectedConversation.statusMain === 'busy' ? 'var(--status-busy)' :
                            selectedConversation.statusMain === 'soon' ? 'var(--status-soon)' :
                              'var(--muted-foreground)',
                      background: 'transparent',
                      padding: '2px',
                      borderRadius: '50%'
                    } as React.CSSProperties}>
                      <Avatar className="w-10  h-10 ring-3" style={{
                        '--tw-ring-color': selectedConversation.statusMain === 'online' ? 'var(--status-online)' :
                          selectedConversation.statusMain === 'offline' ? 'var(--status-offline)' :
                            selectedConversation.statusMain === 'busy' ? 'var(--status-busy)' :
                              selectedConversation.statusMain === 'soon' ? 'var(--status-soon)' :
                                'var(--muted-foreground)'
                      } as React.CSSProperties}>
                        <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                        <AvatarFallback className="text-xl font-semibold">
                          {selectedConversation.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </AvatarLink>
                ) : (
                  <AvatarLink
                    src={undefined}
                    userId={selectedConversation._id}
                    className="w-10 h-10"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {selectedConversation.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    </div>
                  </AvatarLink>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">{selectedConversation.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.type === 'private' ? 'Private chat' : 'Group chat'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  // Handle different message structures with better normalization
                  const messageContent = msg.content || msg.text || '';
                  const messageTimestamp = msg.timestamp ? new Date(msg.timestamp) : (msg.createdAt ? new Date(msg.createdAt) : new Date());
                  const isRead = msg.isRead !== undefined ? msg.isRead : false;
                  const senderId = msg.senderId || msg.sender || msg.from;
                  
                  // Handle both string IDs and populated objects more robustly
                  const senderIdString = typeof senderId === 'object' && senderId?._id
                    ? senderId._id.toString()
                    : typeof senderId === 'string'
                      ? senderId
                      : user._id; // Default to current user if unknown
                  
                  const isCurrentUser = senderIdString === user._id.toString();

                  // Determine read status for display - prioritize readByUsers for accuracy
                  const hasReadByUsers = msg.readByUsers && Array.isArray(msg.readByUsers) && msg.readByUsers.length > 0;
                  const readStatus = hasReadByUsers
                    ? 'read'
                    : (isRead || false)
                      ? 'read'
                      : 'sent';

                  return (
                    <div
                      key={msg._id || msg.id || Math.random().toString(36)}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-start`}
                    >
                      {!isCurrentUser && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                          {msg.senderId?.avatar && msg.senderId.avatar.trim() !== '' ? (
                            <img
                              src={msg.senderId.avatar}
                              alt={msg.senderName || msg.senderId?.username || 'User'}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {msg.senderName?.charAt(0).toUpperCase() || msg.senderId?.username?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-xs sm:max-w-sm md:max-w-md px-4 py-2 rounded-2xl relative ${isCurrentUser
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                          }`}
                      >
                        <p className="text-sm break-words">{messageContent}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-2 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                          <span className="text-xs">
                            {new Date(messageTimestamp).toLocaleTimeString()}
                          </span>
                          {isCurrentUser && (
                            <div className="flex items-center ml-2" title={readStatus === 'read' ? "Message read" : "Message sent"}>
                              {readStatus === 'read' ? (
                                <div className="flex items-center">
                                  <CheckCheck className="w-4 h-4 text-blue-500 drop-shadow-sm" />
                                  {msg.readByUsers && Array.isArray(msg.readByUsers) && msg.readByUsers.length > 1 && (
                                    <span className="text-xs ml-1 text-blue-500 font-medium">{msg.readByUsers.length}</span>
                                  )}
                                </div>
                              ) : (
                                <Check className="w-4 h-4 text-muted-foreground/80 drop-shadow-sm" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-sm"
                  disabled={!selectedConversation}
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  disabled={!newMessage.trim() || !selectedConversation}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {selectedConversation?.type === 'private' && (
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Press Enter to send
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMultiSend([selectedConversation._id])}
                  >
                    Send to All Friends
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 px-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Select a conversation</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a chat from the sidebar to start messaging
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
