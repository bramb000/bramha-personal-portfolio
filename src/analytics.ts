import posthog from 'posthog-js';
import type { Router } from 'vue-router';

let pageStartTime = 0;
let maxScrollDepth = 0;

export function setupAnalytics(router: Router) {
  // Track External Link Clicks
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && link.href) {
      try {
        const url = new URL(link.href);
        // If it's an external link and not a mailto/tel link
        if (url.hostname !== window.location.hostname && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:')) {
          posthog.capture('external_link_clicked', {
            url: link.href,
            hostname: url.hostname,
            text: link.textContent?.trim() || '',
            source_page: window.location.pathname
          });
        }
      } catch (e) {
        // Invalid URL, ignore
      }
    }
  });

  // Track Scroll Depth
  const handleScroll = () => {
    // Calculate percentage based on scroll position and document height
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    
    // Prevent divide by zero or NaN on very short pages
    if (docHeight <= windowHeight) {
        maxScrollDepth = 100;
        return;
    }

    const scrollPercent = Math.round((scrollPosition / (docHeight - windowHeight)) * 100);
    
    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = scrollPercent > 100 ? 100 : scrollPercent;
    }
  };

  // Throttle scroll event to avoid performance issues
  let scrollTimeout: number | null = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout === null) {
      scrollTimeout = window.setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 500);
    }
  }, { passive: true });

  // Hook into Router to capture Time on Page and Scroll Depth for the previous page,
  // and manually capture the pageview of the new page.
  router.beforeEach((_to, from) => {
    if (from.path !== '/' || pageStartTime > 0) { // Avoid capturing on initial load when coming from null
      const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
      
      posthog.capture('page_left', {
        path: from.path,
        time_on_page_seconds: timeOnPage,
        max_scroll_depth_percent: maxScrollDepth
      });
    }
    
    // Reset for new page
    pageStartTime = Date.now();
    maxScrollDepth = 0;
  });

  router.afterEach((to, _from, failure) => {
    if (!failure) {
      posthog.capture('$pageview', {
        $current_url: window.location.origin + to.fullPath
      });
    }
  });
}
