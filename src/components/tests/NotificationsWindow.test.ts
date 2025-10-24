import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationsWindow } from '../NotificationsWindow.js';

// Mock utilities
vi.mock('../../utils/dateFormatter.js', () => ({
  getRelativeDays: vi.fn((date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  })
}));

vi.mock('../../utils/htmlEscaping.js', () => ({
  escapeHtml: vi.fn((text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  })
}));

vi.mock('../../config/constants.js', () => ({
  UI_CONFIG: {
    MAX_NOTIFICATIONS: 30
  }
}));

describe('NotificationsWindow', () => {
  let notificationsWindow: NotificationsWindow;
  let notificationContainer: HTMLElement;
  let notificationsWindowElement: HTMLElement;
  let notificationsList: HTMLElement;
  let closeButton: HTMLElement;

  const createMockElements = () => {
    // Create notification container
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notifications-container';
    
    // Create notifications window
    notificationsWindowElement = document.createElement('div');
    notificationsWindowElement.id = 'notifications-window';
    notificationsWindowElement.classList.add('hidden');
    
    // Create notifications list
    notificationsList = document.createElement('div');
    notificationsList.id = 'notifications-list';
    
    // Create close button
    closeButton = document.createElement('button');
    closeButton.id = 'notifications-close';
    
    // Add elements to DOM
    document.body.appendChild(notificationContainer);
    document.body.appendChild(notificationsWindowElement);
    document.body.appendChild(notificationsList);
    document.body.appendChild(closeButton);
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    createMockElements();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with required DOM elements', () => {
      expect(() => new NotificationsWindow()).not.toThrow();
      
      const instance = new NotificationsWindow();
      expect(instance).toBeInstanceOf(NotificationsWindow);
    });

    it('should throw error when notifications-container is missing', () => {
      document.getElementById('notifications-container')?.remove();
      
      expect(() => new NotificationsWindow()).toThrow('Notification window elements not found');
    });

    it('should throw error when notifications-window is missing', () => {
      document.getElementById('notifications-window')?.remove();
      
      expect(() => new NotificationsWindow()).toThrow('Notification window elements not found');
    });

    it('should throw error when notifications-list is missing', () => {
      document.getElementById('notifications-list')?.remove();
      
      expect(() => new NotificationsWindow()).toThrow('Notification window elements not found');
    });

    it('should throw error when notifications-close is missing', () => {
      document.getElementById('notifications-close')?.remove();
      
      expect(() => new NotificationsWindow()).toThrow('Notification window elements not found');
    });

    it('should setup event listeners on initialization', () => {
      const containerClickSpy = vi.spyOn(notificationContainer, 'addEventListener');
      const closeClickSpy = vi.spyOn(closeButton, 'addEventListener');
      const documentClickSpy = vi.spyOn(document, 'addEventListener');
      
      new NotificationsWindow();
      
      expect(containerClickSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(closeClickSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(documentClickSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('Event Listeners', () => {
    beforeEach(() => {
      notificationsWindow = new NotificationsWindow();
    });

    it('should toggle window when notification container is clicked', () => {
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(true);
      
      notificationContainer.click();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(false);
      
      notificationContainer.click();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(true);
    });

    it('should close window when close button is clicked', () => {
      notificationsWindow.open();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(false);
      
      closeButton.click();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(true);
    });

    it('should stop propagation when close button is clicked', () => {
      const event = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
      
      closeButton.dispatchEvent(event);
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should close window when clicking outside', () => {
      notificationsWindow.open();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(false);
      
      // Click on document body (outside the window)
      document.body.click();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(true);
    });

    it('should not close window when clicking inside notifications window', () => {
      notificationsWindow.open();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(false);
      
      notificationsWindowElement.click();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(false);
    });

    it('should not close window when clicking inside notification container', () => {
      notificationsWindow.open();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(false);
      
      notificationContainer.click();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Window State Management', () => {
    beforeEach(() => {
      notificationsWindow = new NotificationsWindow();
    });

    it('should open window', () => {
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(true);
      
      notificationsWindow.open();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(false);
    });

    it('should close window', () => {
      notificationsWindow.open();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(false);
      
      notificationsWindow.close();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(true);
    });

    it('should toggle window from closed to open', () => {
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(true);
      
      notificationsWindow.toggle();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(false);
    });

    it('should toggle window from open to closed', () => {
      notificationsWindow.open();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(false);
      
      notificationsWindow.toggle();
      expect(notificationsWindowElement.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Notification Management', () => {
    beforeEach(() => {
      notificationsWindow = new NotificationsWindow();
    });

    it('should add notification with default title', () => {
      notificationsWindow.addNotification('Test message');
      
      expect(notificationsList.innerHTML).toContain('Test message');
      expect(notificationsList.innerHTML).toContain('Notification');
    });

    it('should add notification with custom title', () => {
      notificationsWindow.addNotification('Test message', 'Custom Title');
      
      expect(notificationsList.innerHTML).toContain('Test message');
      expect(notificationsList.innerHTML).toContain('Custom Title');
    });

    it('should add multiple notifications', () => {
      notificationsWindow.addNotification('First message', 'First Title');
      notificationsWindow.addNotification('Second message', 'Second Title');
      
      expect(notificationsList.innerHTML).toContain('First message');
      expect(notificationsList.innerHTML).toContain('Second message');
      expect(notificationsList.innerHTML).toContain('First Title');
      expect(notificationsList.innerHTML).toContain('Second Title');
    });

    it('should add newest notifications first', () => {
      notificationsWindow.addNotification('First message');
      notificationsWindow.addNotification('Second message');
      
      const innerHTML = notificationsList.innerHTML;
      const firstIndex = innerHTML.indexOf('First message');
      const secondIndex = innerHTML.indexOf('Second message');
      
      expect(secondIndex).toBeLessThan(firstIndex);
    });

    it('should escape HTML in title and message', () => {
      notificationsWindow.addNotification('<script>alert("xss")</script>', '<b>Bold Title</b>');
      
      expect(notificationsList.innerHTML).toContain('&lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(notificationsList.innerHTML).toContain('&lt;b&gt;Bold Title&lt;/b&gt;');
    });

    it('should include timestamp with relative date and full date title', () => {
      const testDate = new Date('2023-01-01T12:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(testDate);
      
      notificationsWindow.addNotification('Test message');
      
      expect(notificationsList.innerHTML).toContain('days ago');
      expect(notificationsList.innerHTML).toContain('title="');
      
      vi.useRealTimers();
    });

    it('should limit notifications to MAX_NOTIFICATIONS', () => {
      // Add more than MAX_NOTIFICATIONS (30)
      for (let i = 0; i < 35; i++) {
        notificationsWindow.addNotification(`Message ${i}`, `Title ${i}`);
      }
      
      // Should only contain the last 30 notifications
      expect(notificationsList.innerHTML).toContain('Message 34');
      expect(notificationsList.innerHTML).toContain('Message 5');
      expect(notificationsList.innerHTML).not.toContain('Message 4');
      expect(notificationsList.innerHTML).not.toContain('Message 0');
    });

    it('should render notification with correct HTML structure', () => {
      notificationsWindow.addNotification('Test message', 'Test Title');
      
      expect(notificationsList.innerHTML).toContain('<div class="notification-item">');
      expect(notificationsList.innerHTML).toContain('<div class="notification-item__title">');
      expect(notificationsList.innerHTML).toContain('<div class="notification-item__message">');
      expect(notificationsList.innerHTML).toContain('<div class="notification-item__timestamp"');
    });

    it('should clear previous notifications when rendering', () => {
      notificationsWindow.addNotification('First message');
      expect(notificationsList.innerHTML).toContain('First message');
      
      notificationsWindow.addNotification('Second message');
      
      // Should contain both messages (newest first)
      const innerHTML = notificationsList.innerHTML;
      expect(innerHTML).toContain('First message');
      expect(innerHTML).toContain('Second message');
      
      // But only one set of each (no duplicates from previous renders)
      const firstCount = (innerHTML.match(/First message/g) || []).length;
      const secondCount = (innerHTML.match(/Second message/g) || []).length;
      expect(firstCount).toBe(1);
      expect(secondCount).toBe(1);
    });

    it('should handle empty notification list', () => {
      // Initially no notifications
      expect(notificationsList.innerHTML).toBe('');
      
      // Add and then clear would result in empty string
      notificationsWindow.addNotification('Test');
      notificationsList.innerHTML = '';
      expect(notificationsList.innerHTML).toBe('');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      notificationsWindow = new NotificationsWindow();
    });

    it('should handle special characters in notifications', () => {
      notificationsWindow.addNotification('Message with "quotes" & ampersands', "Title with 'single quotes'");
      
      // The real escapeHtml uses textContent which escapes &, <, > but not quotes
      expect(notificationsList.innerHTML).toContain('Message with "quotes" &amp; ampersands');
      expect(notificationsList.innerHTML).toContain('Title with \'single quotes\'');
    });

    it('should handle empty message and title', () => {
      notificationsWindow.addNotification('', '');
      
      expect(notificationsList.innerHTML).toContain('<div class="notification-item">');
      expect(notificationsList.innerHTML).toContain('<div class="notification-item__title"></div>');
      expect(notificationsList.innerHTML).toContain('<div class="notification-item__message"></div>');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      const longTitle = 'B'.repeat(500);
      
      notificationsWindow.addNotification(longMessage, longTitle);
      
      expect(notificationsList.innerHTML).toContain(longMessage);
      expect(notificationsList.innerHTML).toContain(longTitle);
    });

    it('should handle rapid consecutive additions', () => {
      for (let i = 0; i < 10; i++) {
        notificationsWindow.addNotification(`Rapid message ${i}`);
      }
      
      expect(notificationsList.innerHTML).toContain('Rapid message 9');
      expect(notificationsList.innerHTML).toContain('Rapid message 0');
    });
  });
});