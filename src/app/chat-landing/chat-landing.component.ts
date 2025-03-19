// chat-landing.component.ts
import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatService, Message, User, ChatRoom } from '../chat.service';

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
  isLoading = false;
  
  // For message loading pagination
  messageSkip = 0;
  messageLimit = 20;
  hasMoreMessages = true;

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
  chatRooms: ChatRoom[] = [];
  
  // Subscriptions to manage observable cleanup
  private chatSubscription!: Subscription;
  private roomsSubscription?: Subscription;
  private messagesSubscription?: Subscription;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.windowWidth = window.innerWidth;
    this.checkIfMobile();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload() {
    // Logout user when leaving the page
    this.chatService.logoutUser(
      this.currentUser.name, 
      this.currentUser.id.toString()
    );
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
      this.chatRooms = state.chatRooms;
      
      // Update breadcrumbs when active conversation changes
      this.updateBreadcrumbs();
    });
    
    // Fetch chat rooms on init
    this.fetchChatRooms();
    
    // Login user when component loads
    this.chatService.loginUser(this.currentUser.name);
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions when component is destroyed
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    
    if (this.roomsSubscription) {
      this.roomsSubscription.unsubscribe();
    }
    
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    
    // Logout user when component is destroyed
    this.chatService.logoutUser(
      this.currentUser.name, 
      this.currentUser.id.toString()
    );
  }

  checkIfMobile(): void {
    this.isMobile = this.windowWidth < 768;
    // Auto-collapse panel on mobile
    if (this.isMobile) {
      this.isLeftPanelCollapsed = true;
    }
  }

  // Chat container scroll handler
  onChatScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (element && element.scrollTop === 0 && !this.isLoading && this.hasMoreMessages) {
      this.loadMoreMessages();
    }
  }

  // Get chat rooms for current user
  fetchChatRooms(searchTerm: string = ''): void {
    this.isLoading = true;
    this.roomsSubscription = this.chatService.fetchChatRooms(searchTerm)
      .subscribe({
        next: (rooms) => {
          // Update users and direct users based on rooms
          this.updateUsersFromRooms(rooms);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching chat rooms:', error);
          this.isLoading = false;
        }
      });
  }
  
  // Update users lists based on chat rooms
  updateUsersFromRooms(rooms: ChatRoom[]): void {
    // This is a simplified example - in a real app you would map room users to user objects
    // with more details from the backend
    
    // For now we'll keep using our existing users list
    // But this would be where you'd update the users and direct users based on rooms
    console.log('Chat rooms loaded:', rooms);
  }

  // Get messages for a specific room with pagination
  fetchMessages(roomId: string, reset: boolean = false): void {
    if (reset) {
      this.messageSkip = 0;
      this.hasMoreMessages = true;
    }
    
    if (!this.hasMoreMessages) return;
    
    this.isLoading = true;
    this.messagesSubscription = this.chatService.fetchMessagesByRoom(
      roomId, 
      this.messageSkip, 
      this.messageLimit
    ).subscribe({
      next: (messages) => {
        if (messages.length < this.messageLimit) {
          this.hasMoreMessages = false;
        }
        
        const newMessages = reset 
          ? messages 
          : [...messages, ...this.messages];
        
        // Update chat state
        const currentState = this.chatService.getCurrentState();
        // Instead of directly modifying this.messages, update through the service
        // this.messages = newMessages;
        
        this.messageSkip += messages.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching messages:', error);
        this.isLoading = false;
      }
    });
  }

  // Load more messages when scrolling to top of chat
  loadMoreMessages(): void {
    if (this.isLoading || !this.hasMoreMessages) return;
    
    const activeRoom = this.getRoomForActiveConversation();
    if (activeRoom) {
      this.fetchMessages(activeRoom.id);
    }
  }

  // Helper to get room for active conversation
  getRoomForActiveConversation(): ChatRoom | null {
    if (!this.activeConversation) return null;
    
    return this.chatRooms.find(room => 
      room.userOne === this.activeConversation.id.toString() || 
      room.userTwo === this.activeConversation.id.toString()
    ) || null;
  }

  selectChat(user: User): void {
    // Find or create chat room if needed
    this.ensureChatRoomExists(user.id.toString())
      .then(roomId => {
        // Use the service to update active conversation
        this.chatService.setActiveConversation(user);
        
        // Reset message pagination
        this.messageSkip = 0;
        this.hasMoreMessages = true;
        
        // If using API, fetch messages for the room
        if (roomId) {
          this.fetchMessages(roomId, true);
        }
        
        // Mark unread messages as read
        this.markMessagesAsRead();
        
        // If mobile, collapse the left panel to show chat view
        if (this.isMobile) {
          this.isLeftPanelCollapsed = true;
        }
      });
  }
  
  // Create chat room if it doesn't exist
  async ensureChatRoomExists(otherUserId: string): Promise<string | null> {
    const currentUserId = this.currentUser.id.toString();
    
    // First check if room already exists
    const existingRoom = this.chatRooms.find(room => 
      (room.userOne === currentUserId && room.userTwo === otherUserId) ||
      (room.userOne === otherUserId && room.userTwo === currentUserId)
    );
    
    if (existingRoom) {
      return existingRoom.id;
    }
    
    // If not, create a new room
    try {
      const newRoom = await this.chatService.createChatRoom(
        currentUserId, 
        otherUserId
      ).toPromise();
      
      // Update rooms list
      if (newRoom) {
        this.chatRooms = [...this.chatRooms, newRoom];
        return newRoom.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating chat room:', error);
      return null;
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
      this.scrollToBottom();
    }, 0);
  }

  scrollToBottom(): void {
    const chatContainer = document.querySelector('.chat-messages-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  joinChat(): void {
    // Use the service to join chat
    this.chatService.joinChat();
    
    // Mark any unread messages as read
    this.markMessagesAsRead();
    
    // Focus on the message input field
    setTimeout(() => {
      const input = document.querySelector('#messageInput') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);
  }
  
  // Mark all messages in active conversation as read
  markMessagesAsRead(): void {
    const unreadMessages = this.messages.filter(msg => 
      !msg.isRead && msg.userId !== this.currentUser.id
    );
    
    unreadMessages.forEach(msg => {
      this.chatService.markMessageAsRead(msg.id);
    });
  }
  
  // For user-created messages
  isUserMessage(userId: number): boolean {
    return userId === this.currentUser.id;
  }
  
  // Search for conversations
  onSearchChange(): void {
    this.chatService.searchConversations(this.searchQuery);
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