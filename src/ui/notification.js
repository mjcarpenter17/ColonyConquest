/**
 * Colony Conquest - Notification System
 * Handles on-screen notifications for game events
 */

/**
 * NotificationManager class
 * Creates and manages temporary on-screen notifications
 */
export class NotificationManager {
    constructor(scene) {
        this.scene = scene;
        this.notifications = [];
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.position = 'absolute';
        this.container.style.top = '70px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.zIndex = '1000';
        document.body.appendChild(this.container);
    }
    
    /**
     * Show a notification message
     * @param {string} message - The message to display
     * @param {string} type - The notification type (info, success, warning, error)
     * @param {number} duration - How long to show the notification (ms)
     */
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        this.container.appendChild(notification);
        
        // Add to active notifications list
        this.notifications.push(notification);
        
        // Animation - fade in
        setTimeout(() => {
            notification.classList.add('notification-visible');
        }, 10);
        
        // Auto-remove after duration
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        return notification;
    }
    
    /**
     * Show a resource collection notification
     * @param {Object} collection - Collection data
     */
    showResourceCollection(collection, player) {
        // Format a nice message showing what resources were collected
        const resourceMessages = [];
        
        Object.entries(collection).forEach(([resourceType, amount]) => {
            if (amount > 0) {
                resourceMessages.push(`+${amount} ${resourceType}`);
            }
        });
        
        if (resourceMessages.length > 0) {
            const message = `Resources collected: ${resourceMessages.join(', ')}`;
            this.show(message, 'success', 3000);
        }
    }
    
    /**
     * Remove a notification element
     * @param {HTMLElement} notification - The notification to remove
     */
    remove(notification) {
        notification.classList.remove('notification-visible');
        notification.classList.add('notification-hidden');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
            this.notifications = this.notifications.filter(n => n !== notification);
        }, 500);
    }
    
    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications.forEach(notification => this.remove(notification));
    }
    
    /**
     * Clean up when destroying
     */
    destroy() {
        this.clearAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
