// chat.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Socket } from 'ngx-socket-io';

export interface User {
  id: number;
  name: string;
  organization?: string;
  avatar?: string;
  isVerified: boolean;
  unreadCount?: number;
  initials: string;
  isOnline?: boolean;
}

export interface Message {
  id: number;
  userId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
  type?: string; // text, image, etc.
  uri?: string; // for media
  height?: number;
  width?: number;
  mimeType?: string;
  name?: string;
  size?: number;
}

export interface ChatRoom {
  id: string;
  userOne: string;
  userTwo: string;
  lastMessage?: Message;
  unreadCount: number;
}

export interface ChatState {
  users: User[];
  directUsers: User[];
  activeConversation: User | null;
  messages: Message[];
  hasJoinedChat: boolean;
  chatRooms: ChatRoom[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://dev-api.superiornursingpllc.com/api';
  
  // Initial chat state
  private initialState: ChatState = {
    users: [
      { 
        id: 1, 
        name: 'Carlos', 
        organization: 'Canohealth', 
        isVerified: false,
        unreadCount: 3,
        initials: 'C',
        isOnline: false
      },
      { 
        id: 2, 
        name: 'Abel', 
        organization: 'CCMC', 
        isVerified: false,
        unreadCount: 1,
        initials: 'A',
        isOnline: true
      },
      { 
        id: 3, 
        name: 'Shikha', 
        organization: 'CareMax', 
        isVerified: false,
        unreadCount: 2,
        initials: 'S',
        isOnline: false
      },
      { 
        id: 4, 
        name: 'Deepika', 
        organization: 'Conviva', 
        isVerified: false,
        unreadCount: 1,
        initials: 'D',
        isOnline: true
      }
    ],
    directUsers: [
      { 
        id: 5, 
        name: 'Jeremy Firow', 
        isVerified: false,
        initials: 'JF',
        isOnline: false
      },
      { 
        id: 6, 
        name: 'Maria June', 
        isVerified: true,
        unreadCount: 2,
        initials: 'MJ',
        isOnline: true
      },
      { 
        id: 7, 
        name: 'Emil Anders', 
        isVerified: false,
        initials: 'EA',
        isOnline: false
      },
      { 
        id: 8, 
        name: 'Markus Gavrilov', 
        isVerified: false,
        initials: 'MG',
        isOnline: true
      }
    ],
    activeConversation: {
      id: 4,
      name: 'Deepika Sharma',
      organization: 'PCP, Conviva',
      isVerified: true,
      initials: 'DS',
      isOnline: true
    },
    messages: [
      {
        id: 1,
        userId: 4,
        content: 'Irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
        timestamp: '12:49 PM',
        isRead: true
      }
    ],
    chatRooms: [],
    hasJoinedChat: false
  };

  // BehaviorSubject to hold current chat state
  private chatStateSubject = new BehaviorSubject<ChatState>(this.initialState);
  
  // Observable for components to subscribe to
  chatState$: Observable<ChatState> = this.chatStateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private socket: Socket
  ) {
    this.initSocketListeners();
  }

  // Initialize socket listeners
  private initSocketListeners(): void {
    // Listen for new messages
    this.socket.on('chat-message', (message: any) => {
      this.handleNewMessage(message);
    });

    // Listen for message count updates
    this.socket.on('chat-message-count', (message: any) => {
      this.updateUnreadCount(message);
    });

    // Listen for online status updates
    this.socket.on('update-user-online-response', (data: any) => {
      this.updateUserOnlineStatus(data.userId, true);
    });

    // Listen for user logout
    this.socket.on('on-user-logout', (data: any) => {
      this.updateUserOnlineStatus(data.email, false);
    });
  }

  // Get current chat state
  getCurrentState(): ChatState {
    return this.chatStateSubject.getValue();
  }

  // Update user online status
  private updateUserOnlineStatus(userIdentifier: string | number, isOnline: boolean): void {
    const currentState = this.getCurrentState();
    
    // Update regular users
    const updatedUsers = currentState.users.map(user => {
      if (user.id.toString() === userIdentifier.toString()) {
        return { ...user, isOnline };
      }
      return user;
    });
    
    // Update direct users
    const updatedDirectUsers = currentState.directUsers.map(user => {
      if (user.id.toString() === userIdentifier.toString()) {
        return { ...user, isOnline };
      }
      return user;
    });
    
    // Update active conversation if needed
    let updatedActiveConversation = currentState.activeConversation;
    if (updatedActiveConversation && updatedActiveConversation.id.toString() === userIdentifier.toString()) {
      updatedActiveConversation = { ...updatedActiveConversation, isOnline };
    }
    
    this.chatStateSubject.next({
      ...currentState,
      users: updatedUsers,
      directUsers: updatedDirectUsers,
      activeConversation: updatedActiveConversation
    });
  }

  // Handle new incoming message
  private handleNewMessage(message: any): void {
    const currentState = this.getCurrentState();
    
    // If message belongs to active conversation, add it to messages
    if (currentState.activeConversation && 
        (message.author === currentState.activeConversation.id || 
         message.recipient === currentState.activeConversation.id)) {
      
      const newMessage: Message = {
        id: message.id,
        userId: message.author,
        content: message.text,
        timestamp: this.formatTimestamp(message.createdAt),
        isRead: false,
        type: message.type,
        uri: message.uri,
        height: message.height,
        width: message.width,
        mimeType: message.mimeType,
        name: message.name,
        size: message.size
      };
      
      this.chatStateSubject.next({
        ...currentState,
        messages: [...currentState.messages, newMessage]
      });
      
      // Mark message as read if chat is active
      if (currentState.hasJoinedChat) {
        this.markMessageAsRead(message.id);
      }
    } else {
      // Update unread count for the user
      this.updateUnreadCount(message);
    }
  }

  // Update unread message count
  private updateUnreadCount(message: any): void {
    const currentState = this.getCurrentState();
    const userId = message.author;
    
    // Update regular users
    let updatedUsers = [...currentState.users];
    const userIndex = updatedUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const user = updatedUsers[userIndex];
      updatedUsers[userIndex] = { 
        ...user, 
        unreadCount: (user.unreadCount || 0) + 1 
      };
    }
    
    // Update direct users
    let updatedDirectUsers = [...currentState.directUsers];
    const directUserIndex = updatedDirectUsers.findIndex(u => u.id === userId);
    if (directUserIndex !== -1) {
      const user = updatedDirectUsers[directUserIndex];
      updatedDirectUsers[directUserIndex] = { 
        ...user, 
        unreadCount: (user.unreadCount || 0) + 1 
      };
    }
    
    this.chatStateSubject.next({
      ...currentState,
      users: updatedUsers,
      directUsers: updatedDirectUsers
    });
  }

  // Get chat rooms for current user
  fetchChatRooms(searchTerm: string = ''): Observable<ChatRoom[]> {
    const url = searchTerm 
      ? `${this.apiUrl}/chatRoom?search=${encodeURIComponent(searchTerm)}` 
      : `${this.apiUrl}/chatRoom`;
    
    return this.http.get<ChatRoom[]>(url);
  }

  // Get messages by room ID
  fetchMessagesByRoom(roomId: string, skip: number = 0, limit: number = 20): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.apiUrl}/chatRoom/${roomId}/messages?skip=${skip}&limit=${limit}`
    );
  }

  // Create a new chat room
  createChatRoom(userOneId: string, userTwoId: string): Observable<ChatRoom> {
    return this.http.post<ChatRoom>(`${this.apiUrl}/chatRoom/add`, {
      userOne: userOneId,
      userTwo: userTwoId
    });
  }

  // Update active conversation
  setActiveConversation(user: User): void {
    const currentState = this.getCurrentState();
    
    // Clear unread count when selecting a conversation
    let updatedUsers = [...currentState.users];
    let updatedDirectUsers = [...currentState.directUsers];
    
    // Find and update the user in the appropriate list
    const userInRegular = updatedUsers.findIndex(u => u.id === user.id);
    if (userInRegular !== -1) {
      updatedUsers[userInRegular] = { ...updatedUsers[userInRegular], unreadCount: 0 };
    }
    
    const userInDirect = updatedDirectUsers.findIndex(u => u.id === user.id);
    if (userInDirect !== -1) {
      updatedDirectUsers[userInDirect] = { ...updatedDirectUsers[userInDirect], unreadCount: 0 };
    }
    
    // Get conversation messages - in a real app, this would be an API call
    const messages = this.getMessagesForUser(user.id);
    
    this.chatStateSubject.next({
      ...currentState,
      activeConversation: user,
      messages: messages,
      hasJoinedChat: false,
      users: updatedUsers,
      directUsers: updatedDirectUsers
    });

    // Fetch real messages when using the API
    // this.fetchMessagesByRoom(roomId).subscribe(messages => {
    //   this.chatStateSubject.next({
    //     ...this.getCurrentState(),
    //     messages: messages
    //   });
    // });
  }

  // Join chat
  joinChat(): void {
    const currentState = this.getCurrentState();
    this.chatStateSubject.next({
      ...currentState,
      hasJoinedChat: true
    });
    
    // Update user online status
    this.emitUserOnlineStatus();
  }

  // Emit user online status update to server
  emitUserOnlineStatus(userId?: string): void {
    // Use the current user ID if not provided
    const currentUserId = userId || this.getCurrentState().activeConversation?.id?.toString() || '';
    
    this.socket.emit('update-user-online', { userId: currentUserId });
  }

  // Send a message via socket
  sendMessage(content: string, currentUserId: number): void {
    if (!content.trim()) return;
    
    const currentState = this.getCurrentState();
    const recipientId = currentState.activeConversation?.id;
    
    if (!recipientId) return;
    
    // Create a temporary message for UI
    const tempMessage: Message = {
      id: currentState.messages.length + 1,
      userId: currentUserId,
      content: content,
      timestamp: this.formatCurrentTime(),
      isRead: false
    };
    
    // Update UI immediately
    this.chatStateSubject.next({
      ...currentState,
      messages: [...currentState.messages, tempMessage]
    });
    
    // Assume we have a roomId - in a real app, you'd get this from your state
    const roomId = this.getRoomIdForUsers(currentUserId, recipientId);
    
    // Send message via socket
    this.socket.emit('user-chat', {
      room: roomId,
      author: currentUserId,
      text: content,
      type: 'text'
    });
    
    // Listen for confirmation
    this.socket.on('user-chat-response', (response: any) => {
      // Could update the temporary message with the real one from server
      console.log('Message sent successfully:', response);
    });
  }

  // Mark message as read
  markMessageAsRead(messageId: number): void {
    this.socket.emit('read-message', { messageId });
  }
  
  // User login event
  loginUser(email: string): void {
    this.socket.emit('on-user-login', { email });
  }
  
  // User logout event
  logoutUser(email: string, userId: string): void {
    this.socket.emit('on-user-logout', { email });
    this.socket.emit('logout', { userId });
  }

  // Search conversations
  searchConversations(query: string): void {
    // This would filter the conversations based on the query or call API
    this.fetchChatRooms(query).subscribe(rooms => {
      const currentState = this.getCurrentState();
      this.chatStateSubject.next({
        ...currentState,
        chatRooms: rooms
      });
    });
  }

  // Helper method to get messages for a user - this would be replaced by API calls
  private getMessagesForUser(userId: number): Message[] {
    // In a real application, this would fetch messages from an API
    // For now, we'll just return a demo message if it's not the current active conversation
    
    const currentState = this.getCurrentState();
    if (currentState.activeConversation?.id === userId) {
      return currentState.messages;
    }
    
    return [
      {
        id: 1,
        userId: userId,
        content: 'This is a previous message from this conversation.',
        timestamp: '12:30 PM',
        isRead: true
      }
    ];
  }

  // Helper to get room ID for users - would be replaced by looking up in your state
  private getRoomIdForUsers(userOneId: number, userTwoId: number): string {
    // In a real app, you'd look up the room ID from your state or create one if it doesn't exist
    return `room_${Math.min(userOneId, userTwoId)}_${Math.max(userOneId, userTwoId)}`;
  }

  // Format current time helper
  private formatCurrentTime(): string {
    const now = new Date();
    return this.formatTimestamp(now);
  }
  
  // Format timestamp helper
  private formatTimestamp(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // "0" should be "12"
    
    // Add leading zero to minutes if needed
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
  }
}