// chat.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  organization?: string;
  avatar?: string;
  isVerified: boolean;
  unreadCount?: number;
  initials: string;
}

export interface Message {
  id: number;
  userId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatState {
  users: User[];
  directUsers: User[];
  activeConversation: User | null;
  messages: Message[];
  hasJoinedChat: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // Initial chat state
  private initialState: ChatState = {
    users: [
      { 
        id: 1, 
        name: 'Carlos', 
        organization: 'Canohealth', 
        isVerified: false,
        unreadCount: 3,
        initials: 'C'
      },
      { 
        id: 2, 
        name: 'Abel', 
        organization: 'CCMC', 
        isVerified: false,
        unreadCount: 1,
        initials: 'A'
      },
      { 
        id: 3, 
        name: 'Shikha', 
        organization: 'CareMax', 
        isVerified: false,
        unreadCount: 2,
        initials: 'S'
      },
      { 
        id: 4, 
        name: 'Deepika', 
        organization: 'Conviva', 
        isVerified: false,
        unreadCount: 1,
        initials: 'D'
      }
    ],
    directUsers: [
      { 
        id: 5, 
        name: 'Jeremy Firow', 
        isVerified: false,
        initials: 'JF'
      },
      { 
        id: 6, 
        name: 'Maria June', 
        isVerified: true,
        unreadCount: 2,
        initials: 'MJ'
      },
      { 
        id: 7, 
        name: 'Emil Anders', 
        isVerified: false,
        initials: 'EA'
      },
      { 
        id: 8, 
        name: 'Markus Gavrilov', 
        isVerified: false,
        initials: 'MG'
      }
    ],
    activeConversation: {
      id: 4,
      name: 'Deepika Sharma',
      organization: 'PCP, Conviva',
      isVerified: true,
      initials: 'DS'
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
    hasJoinedChat: false
  };

  // BehaviorSubject to hold current chat state
  private chatStateSubject = new BehaviorSubject<ChatState>(this.initialState);
  
  // Observable for components to subscribe to
  chatState$: Observable<ChatState> = this.chatStateSubject.asObservable();

  constructor() {}

  // Get current chat state
  getCurrentState(): ChatState {
    return this.chatStateSubject.getValue();
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
  }

  // Join chat
  joinChat(): void {
    const currentState = this.getCurrentState();
    this.chatStateSubject.next({
      ...currentState,
      hasJoinedChat: true
    });
  }

  // Send a message
  sendMessage(content: string, currentUserId: number): void {
    if (!content.trim()) return;
    
    const currentState = this.getCurrentState();
    const newMessage: Message = {
      id: currentState.messages.length + 1,
      userId: currentUserId,
      content: content,
      timestamp: this.formatCurrentTime(),
      isRead: false
    };
    
    this.chatStateSubject.next({
      ...currentState,
      messages: [...currentState.messages, newMessage]
    });
  }

  // Search conversations
  searchConversations(query: string): void {
    // This would filter the conversations based on the query
    // For simplicity, we're not implementing the actual search logic here
    console.log('Searching for:', query);
  }

  // Helper method to get messages for a user
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

  // Format current time helper
  private formatCurrentTime(): string {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // "0" should be "12"
    
    // Add leading zero to minutes if needed
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
  }
}