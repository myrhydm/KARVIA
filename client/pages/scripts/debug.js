/**
 * Debug utility for KARVIA client
 * Enable debug mode by setting localStorage.setItem('KARVIA_DEBUG', 'true')
 */
const Debug = {
    isEnabled: function() {
        return localStorage.getItem('KARVIA_DEBUG') === 'true';
    },

    log: function(...args) {
        if (this.isEnabled()) {
            console.log('[DEBUG]', ...args);
        }
    },

    warn: function(...args) {
        if (this.isEnabled()) {
            console.warn('[DEBUG]', ...args);
        }
    },

    error: function(...args) {
        // Always log errors
        console.error('[ERROR]', ...args);
    },

    // Enable debug mode
    enable: function() {
        localStorage.setItem('KARVIA_DEBUG', 'true');
        console.log('Debug mode enabled. Refresh to see debug logs.');
    },

    // Disable debug mode
    disable: function() {
        localStorage.removeItem('KARVIA_DEBUG');
        console.log('Debug mode disabled.');
    }
};

// Make Debug available globally
window.Debug = Debug;
