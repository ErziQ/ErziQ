/**
 * ErziQ Website - Main JavaScript
 * Handles: Tab switching, Clipboard functionality, Theme management, PWA support
 */

'use strict';

// ============= Tab Management =============
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');

function switchTab(tabName) {
    // Remove active state from all tabs
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    tabPanes.forEach(pane => pane.classList.remove('active'));

    // Add active state to selected tab
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedPane = document.getElementById(tabName);

    if (selectedButton && selectedPane) {
        selectedButton.classList.add('active');
        selectedButton.setAttribute('aria-selected', 'true');
        selectedPane.classList.add('active');
    }
}

tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        switchTab(tabName);
    });

    // Keyboard navigation: Arrow keys
    button.addEventListener('keydown', function(event) {
        const buttons = Array.from(tabButtons);
        const currentIndex = buttons.indexOf(this);
        let nextButton;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            nextButton = buttons[(currentIndex + 1) % buttons.length];
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            nextButton = buttons[(currentIndex - 1 + buttons.length) % buttons.length];
        }

        if (nextButton) {
            nextButton.focus();
            switchTab(nextButton.getAttribute('data-tab'));
        }
    });
});

// ============= Clipboard Functionality =============
const textFields = document.querySelectorAll('.text-field');
let showNotifications = localStorage.getItem('showNotifications') !== 'false';

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        textArea.remove();
        return success ? Promise.resolve() : Promise.reject(new Error('Copy failed'));
    }
}

function showCopyFeedback(field) {
    // Visual animation
    field.classList.add('copied');
    setTimeout(() => {
        field.classList.remove('copied');
    }, 800);

    // Optional notification
    if (showNotifications) {
        showNotification('Copied to clipboard!', 'success');
    }
}

textFields.forEach(field => {
    const input = field.querySelector('input');
    const textToCopy = field.getAttribute('data-text');

    if (!textToCopy) {
        console.warn('Text field missing data-text attribute', field);
        return;
    }

    input.addEventListener('click', function(e) {
        e.preventDefault();
        copyToClipboard(textToCopy)
            .then(() => {
                showCopyFeedback(field);
            })
            .catch(error => {
                console.error('Copy failed:', error);
                showNotification('Failed to copy text', 'error');
            });
    });

    // Keyboard support: Enter or Space to copy
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            copyToClipboard(textToCopy)
                .then(() => {
                    showCopyFeedback(field);
                })
                .catch(error => {
                    console.error('Copy failed:', error);
                    showNotification('Failed to copy text', 'error');
                });
        }
    });
});

// ============= Notification System =============
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `copy-notification ${type}`;
    notification.textContent = message;
    notification.setAttribute('aria-live', 'polite');
    notification.setAttribute('aria-atomic', 'true');
    notification.setAttribute('role', 'status');
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Inject notification styles
const notificationStyles = `
.copy-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--copy-color);
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    pointer-events: none;
}

.copy-notification.show {
    opacity: 1;
    transform: translateY(0);
}

.copy-notification.error {
    background: #dc3545;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// ============= Dark Mode Management =============
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

// Load saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.checked = true;
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.classList.add('dark-mode');
            body.setAttribute('aria-label', 'Dark mode enabled');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            body.setAttribute('aria-label', 'Light mode enabled');
            localStorage.setItem('theme', 'light');
        }
    });
}

// ============= Notifications Toggle =============
const copyNotificationsToggle = document.getElementById('copy-notifications');
if (copyNotificationsToggle) {
    copyNotificationsToggle.checked = showNotifications;
    copyNotificationsToggle.addEventListener('change', function() {
        showNotifications = this.checked;
        localStorage.setItem('showNotifications', showNotifications);
    });
}

// ============= Page Load & Initialization =============
document.addEventListener('DOMContentLoaded', function() {
    // Ensure page is visible
    body.style.opacity = '1';

    // Register Service Worker for PWA support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }

    // Check for updates to service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            console.log('New service worker activated');
        });
    }

    // Accessibility: Add skip link functionality
    const skipLink = document.querySelector('.skip-to-content');
    if (skipLink) {
        skipLink.addEventListener('click', function(e) {
            e.preventDefault();
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.focus();
                mainContent.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Ensure all interactive elements have proper ARIA attributes
    tabButtons.forEach(button => {
        if (!button.hasAttribute('role')) {
            button.setAttribute('role', 'tab');
        }
    });

    console.log('ErziQ Website initialized');
});

// ============= Error Handling =============
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

// ============= Export for testing (if needed) =============
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { switchTab, copyToClipboard, showNotification };
}


// ============= Clipboard Functionality =============
const textFields = document.querySelectorAll('.text-field');
let showNotifications = localStorage.getItem('showNotifications') !== 'false';

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        textArea.remove();
        return success ? Promise.resolve() : Promise.reject(new Error('Copy failed'));
    }
}

function showCopyFeedback(field) {
    // Visual animation
    field.classList.add('copied');
    setTimeout(() => {
        field.classList.remove('copied');
    }, 800);

    // Optional notification
    if (showNotifications) {
        showNotification('Copied to clipboard!', 'success');
    }
}

textFields.forEach(field => {
    const input = field.querySelector('input');
    const textToCopy = field.getAttribute('data-text');

    if (!textToCopy) {
        console.warn('Text field missing data-text attribute', field);
        return;
    }

    input.addEventListener('click', function(e) {
        e.preventDefault();
        copyToClipboard(textToCopy)
            .then(() => {
                showCopyFeedback(field);
            })
            .catch(error => {
                console.error('Copy failed:', error);
                showNotification('Failed to copy text', 'error');
            });
    });

    // Keyboard support: Enter or Space to copy
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            copyToClipboard(textToCopy)
                .then(() => {
                    showCopyFeedback(field);
                })
                .catch(error => {
                    console.error('Copy failed:', error);
                    showNotification('Failed to copy text', 'error');
                });
        }
    });
});

// ============= Notification System =============
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `copy-notification ${type}`;
    notification.textContent = message;
    notification.setAttribute('aria-live', 'polite');
    notification.setAttribute('aria-atomic', 'true');
    notification.setAttribute('role', 'status');
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Inject notification styles
const notificationStyles = `
.copy-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--copy-color);
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    pointer-events: none;
}

.copy-notification.show {
    opacity: 1;
    transform: translateY(0);
}

.copy-notification.error {
    background: #dc3545;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// ============= Dark Mode Management =============
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

// Load saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.checked = true;
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.classList.add('dark-mode');
            body.setAttribute('aria-label', 'Dark mode enabled');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            body.setAttribute('aria-label', 'Light mode enabled');
            localStorage.setItem('theme', 'light');
        }
    });
}

// ============= Notifications Toggle =============
const copyNotificationsToggle = document.getElementById('copy-notifications');
if (copyNotificationsToggle) {
    copyNotificationsToggle.checked = showNotifications;
    copyNotificationsToggle.addEventListener('change', function() {
        showNotifications = this.checked;
        localStorage.setItem('showNotifications', showNotifications);
    });
}

// ============= Page Load & Initialization =============
document.addEventListener('DOMContentLoaded', function() {
    // Ensure page is visible
    body.style.opacity = '1';

    // Register Service Worker for PWA support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }

    // Check for updates to service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            console.log('New service worker activated');
        });
    }

    // Accessibility: Add skip link functionality
    const skipLink = document.querySelector('.skip-to-content');
    if (skipLink) {
        skipLink.addEventListener('click', function(e) {
            e.preventDefault();
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.focus();
                mainContent.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    console.log('ErziQ Website initialized');
});

// ============= Error Handling =============
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

// ============= Export for testing (if needed) =============
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { switchTab, copyToClipboard, showNotification };
}
