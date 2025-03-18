// chat-landing.component.ts
import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService, Message, User } from '../chat.service';

@Component({
  selector: 'app-chat-landing',
  templateUrl: './chat-landing.component.html',
  styleUrls: ['./chat-landing.component.scss']
})
export class ChatLandingComponent implements OnInit, OnDestroy {
  title = 'Vital Imaging';
  searchQuery = '';
  currentMessage = '';
  hasJoinedChat = false;
  windowWidth = window.innerWidth;
  isMobile = false;

  // Navigation breadcrumbs
  breadcrumbs: string[] = ['Dashboard', 'Conversations'];
  
  // Panel collapse state
  isIncomingMessagesCollapsed = false;
  isDirectMessagesCollapsed = false;
  isLeftPanelCollapsed = false;

  // Current user (logged in user)
  currentUser: User = {
    id: 999,
    name: 'John',
    isVerified: false,
    initials: 'J'
  };

  // Chat data from service
  users: User[] = [];
  directUsers: User[] = [];
  activeConversation!: User;
  messages: Message[] = [];
  
  // Subscription to manage observable cleanup
  private chatSubscription!: Subscription;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.windowWidth = window.innerWidth;
    this.checkIfMobile();
  }

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Check if mobile on init
    this.checkIfMobile();
    
    // Subscribe to chat state changes
    this.chatSubscription = this.chatService.chatState$.subscribe(state => {
      this.users = state.users;
      this.directUsers = state.directUsers;
      this.activeConversation = state.activeConversation!;
      this.messages = state.messages;
      this.hasJoinedChat = state.hasJoinedChat;
      
      // Update breadcrumbs when active conversation changes
      this.updateBreadcrumbs();
    });
  }
  
  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  checkIfMobile(): void {
    this.isMobile = this.windowWidth < 768;
    // Auto-collapse panel on mobile
    if (this.isMobile) {
      this.isLeftPanelCollapsed = true;
    }
  }

  selectChat(user: User): void {
    // Use the service to update active conversation
    this.chatService.setActiveConversation(user);
    
    // If mobile, collapse the left panel to show chat view
    if (this.isMobile) {
      this.isLeftPanelCollapsed = true;
    }
  }

  updateBreadcrumbs(): void {
    if (this.activeConversation) {
      this.breadcrumbs = ['Dashboard', 'Conversations', this.activeConversation.name];
    } else {
      this.breadcrumbs = ['Dashboard', 'Conversations'];
    }
  }

  sendMessage(): void {
    if (this.currentMessage.trim() === '') return;
    
    // Use the service to send the message
    this.chatService.sendMessage(this.currentMessage, this.currentUser.id);
    
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
    // Use the service to join chat
    this.chatService.joinChat();
    
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
  
  // Toggles for sections
  toggleIncomingMessages(): void {
    this.isIncomingMessagesCollapsed = !this.isIncomingMessagesCollapsed;
  }
  
  toggleDirectMessages(): void {
    this.isDirectMessagesCollapsed = !this.isDirectMessagesCollapsed;
  }
  
  // For mobile navigation and panel toggle
  toggleLeftPanel(): void {
    this.isLeftPanelCollapsed = !this.isLeftPanelCollapsed;
  }
  
  // For navigation back to the conversations list on mobile
  showConversationsList(): void {
    this.isLeftPanelCollapsed = false;
  }
}