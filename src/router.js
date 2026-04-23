/**
 * EmoSense Client-Side Router
 * Hash-based SPA routing with page transitions.
 */

const routes = {};
let currentRoute = null;

/**
 * Register a route
 */
export function registerRoute(path, handler) {
    routes[path] = handler;
}

/**
 * Navigate to a route
 */
export function navigate(path) {
    window.location.hash = path;
}

/**
 * Get the current route path
 */
export function getCurrentRoute() {
    return window.location.hash.slice(1) || 'home';
}

/**
 * Initialize the router
 */
export function initRouter() {
    const handleRoute = () => {
        const path = getCurrentRoute();

        if (path === currentRoute) return;
        currentRoute = path;

        const content = document.getElementById('page-content');
        if (!content) return;

        // Page transition
        content.style.opacity = '0';
        content.style.transform = 'translateY(8px)';

        setTimeout(() => {
            const handler = routes[path] || routes['home'];
            if (handler) {
                handler(content);
            }

            // Update active nav link
            document.querySelectorAll('.navbar-links a, .mobile-nav-links a').forEach(link => {
                const href = link.getAttribute('href')?.slice(1);
                link.classList.toggle('active', href === path);
            });

            // Animate in
            content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'instant' });
        }, 150);
    };

    window.addEventListener('hashchange', handleRoute);

    // Initial route
    if (!window.location.hash) {
        window.location.hash = '#home';
    } else {
        handleRoute();
    }
}
