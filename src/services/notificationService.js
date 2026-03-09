/**
 * notificationService.js
 * Centralized service for browser-level system notifications.
 */

export const notificationService = {
    /**
     * Request permission from the user to send notifications
     */
    requestPermission: async () => {
        if (!('Notification' in window)) {
            console.warn("This browser does not support desktop notifications");
            return false;
        }

        if (Notification.permission === 'granted') return true;

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },

    /**
     * Send a system-level notification
     * @param {string} title - The notification title
     * @param {Object} options - Notification options (body, icon, etc.)
     */
    send: async (title, options = {}) => {
        if (!('Notification' in window)) return;

        // Ensure we have permission
        if (Notification.permission !== 'granted') {
            const allowed = await notificationService.requestPermission();
            if (!allowed) return;
        }

        const defaultOptions = {
            icon: '/favicon.ico', // Adjust path as needed
            badge: '/favicon.ico',
            silent: false,
            ...options
        };

        try {
            const notif = new Notification(title, defaultOptions);

            notif.onclick = () => {
                window.focus();
                notif.close();
            };

            return notif;
        } catch (err) {
            console.error("Error creating notification:", err);
        }
    },

    /**
     * Cache for recently sent notifications to prevent duplicates
     */
    sentHistory: new Set(),

    /**
     * Check for any tasks/events scheduled for "now"
     * @param {Array} events - List of events with { date, time, title, id }
     */
    checkSchedule: async (events, userName) => {
        if (!events || events.length === 0) return;

        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const currentDate = now.toISOString().split('T')[0];

        events.forEach(event => {
            // Check if date matches (or if no date is provided - like daily reminders)
            const eventDate = event.date ? new Date(event.date).toISOString().split('T')[0] : currentDate;

            if (eventDate === currentDate && event.time === currentTime) {
                const uniqueId = `${event.id || event.title}-${currentDate}-${currentTime}`;

                if (!notificationService.sentHistory.has(uniqueId)) {
                    notificationService.send(`Study Reminder: ${event.title} 📚`, {
                        body: `Hey ${userName || 'Expert'}, it's time for your scheduled session: "${event.title}".`,
                        requireInteraction: true
                    });
                    notificationService.sentHistory.add(uniqueId);

                    // Clean up history after 2 minutes so it stays fresh
                    setTimeout(() => notificationService.sentHistory.delete(uniqueId), 120000);
                }
            }
        });
    },

    /**
     * Convenience method for study reminders
     */
    remindToStudy: (userName) => {
        return notificationService.send("Time to crush your goals! 🚀", {
            body: `Hey ${userName || 'Expert'}, you have study tasks waiting. Let's get started!`,
            tag: 'study-reminder'
        });
    },

    /**
     * Convenience method for session completion
     */
    notifyCompletion: (subject) => {
        return notificationService.send("Session Complete! ✅", {
            body: `Great job on ${subject || 'your session'}. Take a short break!`,
            tag: 'session-complete'
        });
    }
};

export default notificationService;
