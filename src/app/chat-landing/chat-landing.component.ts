// chat-landing.component.ts
import { Component, OnInit, HostListener } from '@angular/core';

interface User {
  id: number;
  name: string;
  organization?: string;
  avatar?: string;
  isVerified: boolean;
  unreadCount?: number;
  initials: string;
}

interface Message {
  id: number;
  userId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

@Component({
  selector: 'app-chat-landing',
  templateUrl: './chat-landing.component.html',
  styleUrls: ['./chat-landing.component.scss']
})
export class ChatLandingComponent implements OnInit {
  title = 'Vital Imaging';
  searchQuery = '';
  currentMessage = '';
  hasJoinedChat = false;
  windowWidth = window.innerWidth;
  isMobile = false;

  currentUser: User = {
    id: 1,
    name: 'PCP',
    avatar: 'assets/images/avatar-doctor.png',
    isVerified: false,
    initials: 'PCP'
  };

  // Users with pre-calculated initials
  users: User[] = [
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
  ];

  directUsers: User[] = [
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
  ];

  activeConversation: User = {
    id: 4,
    name: 'Deepika Sharma',
    organization: 'PCP, Conviva',
    isVerified: true,
    initials: 'DS'
  };

  messages: Message[] = [
    {
      id: 1,
      userId: 4,
      content: 'Irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
      timestamp: '12:49 PM',
      isRead: true
    }
  ];

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.windowWidth = window.innerWidth;
    this.checkIfMobile();
  }

  constructor() {}

  ngOnInit(): void {
    // Check if mobile on init
    this.checkIfMobile();
  }

  checkIfMobile(): void {
    this.isMobile = this.windowWidth < 768;
  }

  selectChat(user: User): void {
    this.activeConversation = user;
    console.log('Selected chat:', user.name);
    
    // If mobile, switch to chat view
    if (this.isMobile) {
      // Logic to show chat view on mobile would go here
    }
  }

  sendMessage(): void {
    if (this.currentMessage.trim() === '') return;
    
    // Create a new message
    const newMessage = {
      id: this.messages.length + 1,
      userId: this.currentUser.id,
      content: this.currentMessage,
      timestamp: this.formatCurrentTime(),
      isRead: false
    };
    
    // Add the message to the list
    this.messages.push(newMessage);
    
    // Clear the input field
    this.currentMessage = '';
    
    // Scroll to the bottom of the chat
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 0);
  }

  joinChat(): void {
    // Toggle the join state
    this.hasJoinedChat = true;
    console.log('Joining chat with', this.activeConversation.name);
    
    // Focus on the message input field
    setTimeout(() => {
      const input = document.querySelector('#messageInput') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);
  }
  
  formatCurrentTime(): string {
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
  
  // For user-created messages
  isUserMessage(userId: number): boolean {
    return userId === this.currentUser.id;
  }
  
  // For mobile navigation
  goBack(): void {
    // Logic to navigate back on mobile
    console.log('Go back');
  }
}