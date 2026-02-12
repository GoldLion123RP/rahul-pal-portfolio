/* ============================================
   RAHUL PAL - PORTFOLIO WEBSITE
   Main JavaScript File
   ============================================ */

/* ============================================
   TABLE OF CONTENTS
   ============================================
   1. DOM Elements & Variables
   2. Initialization
   3. Navigation Functions
   4. Smooth Scrolling
   5. Scroll Spy (Active Nav Link)
   6. Form Handling
   7. Back to Top Button
   8. Utility Functions
   9. Event Listeners
   10. Page Load Effects
   ============================================ */

// ============================================
// 1. DOM ELEMENTS & VARIABLES
// ============================================

const DOM = {
    // Navigation
    navbar: document.getElementById('navbar'),
    navLinks: document.getElementById('nav-links'),
    navHamburger: document.getElementById('nav-hamburger'),
    navItems: document.querySelectorAll('.nav-link'),
    
    // Sections
    sections: document.querySelectorAll('section[id]'),
    
    // Form
    contactForm: document.getElementById('contact-form'),
    formStatus: document.getElementById('form-status'),
    
    // Back to Top
    backToTop: document.getElementById('back-to-top'),
    
    // Canvas
    webglCanvas: document.getElementById('webgl-canvas'),
};

// Configuration
const CONFIG = {
    scrollOffset: 100,
    navScrollThreshold: 50,
    sectionObserverThreshold: 0.3,
    animationDuration: 300,
    debounceDelay: 10,
};

// State
const STATE = {
    isMenuOpen: false,
    isScrolling: false,
    lastScrollY: 0,
    currentSection: 'home',
};

// ============================================
// 2. INITIALIZATION
// ============================================

/**
 * Initialize all functionality when DOM is ready
 */
function init() {
    console.log('🚀 Portfolio initialized');
    
    // Setup all features
    setupNavigation();
    setupSmoothScrolling();
    setupScrollSpy();
    setupFormHandling();
    setupBackToTop();
    setupPageLoadAnimations();
    
    // Initial checks
    handleNavbarScroll();
    updateActiveNavLink();
}

// Run init when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============================================
// 3. NAVIGATION FUNCTIONS
// ============================================

/**
 * Setup navigation functionality
 */
function setupNavigation() {
    // Hamburger menu toggle
    if (DOM.navHamburger) {
        DOM.navHamburger.addEventListener('click', toggleMobileMenu);
    }
    
    // Close menu when clicking nav links
    DOM.navItems.forEach(link => {
        link.addEventListener('click', () => {
            if (STATE.isMenuOpen) {
                closeMobileMenu();
            }
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (STATE.isMenuOpen && 
            !DOM.navLinks.contains(e.target) && 
            !DOM.navHamburger.contains(e.target)) {
            closeMobileMenu();
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && STATE.isMenuOpen) {
            closeMobileMenu();
            DOM.navHamburger.focus();
        }
    });
    
    // Handle navbar background on scroll
    window.addEventListener('scroll', debounce(handleNavbarScroll, CONFIG.debounceDelay));
}

/**
 * Toggle mobile menu open/close
 */
function toggleMobileMenu() {
    STATE.isMenuOpen = !STATE.isMenuOpen;
    
    DOM.navHamburger.classList.toggle('active', STATE.isMenuOpen);
    DOM.navLinks.classList.toggle('active', STATE.isMenuOpen);
    DOM.navHamburger.setAttribute('aria-expanded', STATE.isMenuOpen);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = STATE.isMenuOpen ? 'hidden' : '';
    
    // Trap focus in menu when open
    if (STATE.isMenuOpen) {
        trapFocus(DOM.navLinks);
    }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    STATE.isMenuOpen = false;
    DOM.navHamburger.classList.remove('active');
    DOM.navLinks.classList.remove('active');
    DOM.navHamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

/**
 * Handle navbar appearance on scroll
 */
function handleNavbarScroll() {
    const scrollY = window.scrollY;
    
    if (scrollY > CONFIG.navScrollThreshold) {
        DOM.navbar.classList.add('scrolled');
    } else {
        DOM.navbar.classList.remove('scrolled');
    }
    
    STATE.lastScrollY = scrollY;
}

/**
 * Trap focus within an element (for accessibility)
 */
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    firstElement.focus();
    
    element.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    });
}

// ============================================
// 4. SMOOTH SCROLLING
// ============================================

/**
 * Setup smooth scrolling for anchor links
 */
function setupSmoothScrolling() {
    // Get all anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', handleAnchorClick);
    });
}

/**
 * Handle anchor link clicks
 */
function handleAnchorClick(e) {
    const href = this.getAttribute('href');
    
    // Skip if it's just "#" or empty
    if (!href || href === '#') return;
    
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
        e.preventDefault();
        scrollToElement(targetElement);
        
        // Update URL without jumping
        history.pushState(null, null, href);
    }
}

/**
 * Smoothly scroll to an element
 */
function scrollToElement(element, offset = CONFIG.scrollOffset) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;
    
    STATE.isScrolling = true;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
    
    // Reset scrolling state after animation
    setTimeout(() => {
        STATE.isScrolling = false;
    }, 1000);
}

/**
 * Scroll to top of page
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ============================================
// 5. SCROLL SPY (ACTIVE NAV LINK)
// ============================================

/**
 * Setup scroll spy to highlight active nav link
 */
function setupScrollSpy() {
    // Use Intersection Observer for better performance
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver(handleSectionIntersection, observerOptions);
    
    DOM.sections.forEach(section => {
        observer.observe(section);
    });
    
    // Fallback scroll listener for edge cases
    window.addEventListener('scroll', debounce(updateActiveNavLink, 100));
}

/**
 * Handle section intersection
 */
function handleSectionIntersection(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('id');
            setActiveNavLink(sectionId);
            STATE.currentSection = sectionId;
        }
    });
}

/**
 * Update active nav link based on scroll position
 */
function updateActiveNavLink() {
    if (STATE.isScrolling) return;
    
    const scrollPosition = window.scrollY + CONFIG.scrollOffset + 100;
    
    DOM.sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            setActiveNavLink(sectionId);
        }
    });
}

/**
 * Set active state on nav link
 */
function setActiveNavLink(sectionId) {
    DOM.navItems.forEach(link => {
        const href = link.getAttribute('href');
        
        if (href === `#${sectionId}`) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

// ============================================
// 6. FORM HANDLING
// ============================================

/**
 * Setup contact form handling
 */
function setupFormHandling() {
    if (!DOM.contactForm) return;
    
    DOM.contactForm.addEventListener('submit', handleFormSubmit);
    
    // Real-time validation
    const inputs = DOM.contactForm.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearFieldError(input));
    });
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('.btn-submit');
    
    // Validate all fields
    const isValid = validateForm(form);
    
    if (!isValid) {
        showFormStatus('Please fill in all required fields correctly.', 'error');
        return;
    }
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        // Simulate form submission (replace with actual API call)
        await simulateFormSubmission(data);
        
        // Success
        showFormStatus('Thank you! Your message has been sent successfully. I\'ll get back to you soon!', 'success');
        form.reset();
        
        // Clear all error states
        const inputs = form.querySelectorAll('.form-input');
        inputs.forEach(input => clearFieldError(input));
        
    } catch (error) {
        // Error
        showFormStatus('Oops! Something went wrong. Please try again later.', 'error');
        console.error('Form submission error:', error);
        
    } finally {
        // Reset button state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

/**
 * Simulate form submission (replace with actual API call)
 */
/**
 * Submit form to Formspree
 */
async function simulateFormSubmission(data) {
    const response = await fetch('https://formspree.io/f/mzdaedkp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error('Form submission failed');
    }
    
    return response.json();
}

/**
 * Validate entire form
 */
function validateForm(form) {
    const inputs = form.querySelectorAll('.form-input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Validate individual field
 */
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    const errorElement = document.getElementById(`${fieldName}-error`);
    
    let error = '';
    
    // Required check
    if (field.required && !value) {
        error = 'This field is required';
    }
    // Email validation
    else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            error = 'Please enter a valid email address';
        }
    }
    // Minimum length check
    else if (field.minLength && value.length < field.minLength) {
        error = `Minimum ${field.minLength} characters required`;
    }
    
    // Show/hide error
    if (error) {
        field.classList.add('error');
        if (errorElement) {
            errorElement.textContent = error;
        }
        return false;
    } else {
        clearFieldError(field);
        return true;
    }
}

/**
 * Clear field error state
 */
function clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = document.getElementById(`${field.name}-error`);
    if (errorElement) {
        errorElement.textContent = '';
    }
}

/**
 * Show form status message
 */
function showFormStatus(message, type) {
    if (!DOM.formStatus) return;
    
    DOM.formStatus.textContent = message;
    DOM.formStatus.className = 'form-status';
    DOM.formStatus.classList.add(type);
    
    // Auto-hide success message after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            DOM.formStatus.className = 'form-status';
            DOM.formStatus.textContent = '';
        }, 5000);
    }
}

// ============================================
// 7. BACK TO TOP BUTTON
// ============================================

/**
 * Setup back to top button
 */
function setupBackToTop() {
    if (!DOM.backToTop) return;
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', debounce(handleBackToTopVisibility, 100));
    
    // Click handler
    DOM.backToTop.addEventListener('click', scrollToTop);
    
    // Initial check
    handleBackToTopVisibility();
}

/**
 * Handle back to top button visibility
 */
function handleBackToTopVisibility() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    
    if (scrollY > windowHeight * 0.5) {
        DOM.backToTop.classList.add('visible');
    } else {
        DOM.backToTop.classList.remove('visible');
    }
}

// ============================================
// 8. UTILITY FUNCTIONS
// ============================================

/**
 * Debounce function to limit execution rate
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit execution rate
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Check if element is in viewport
 */
function isInViewport(element, threshold = 0) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= -threshold &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Get CSS variable value
 */
function getCSSVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Set CSS variable value
 */
function setCSSVariable(name, value) {
    document.documentElement.style.setProperty(name, value);
}

/**
 * Check if device is touch-enabled
 */
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ============================================
// 9. EVENT LISTENERS
// ============================================

/**
 * Handle window resize
 */
window.addEventListener('resize', debounce(() => {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 1024 && STATE.isMenuOpen) {
        closeMobileMenu();
    }
}, 250));

/**
 * Handle page visibility change
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden - pause animations if needed
        document.body.classList.add('page-hidden');
    } else {
        // Page is visible - resume animations
        document.body.classList.remove('page-hidden');
    }
});

/**
 * Handle keyboard navigation
 */
document.addEventListener('keydown', (e) => {
    // Skip link functionality (for accessibility)
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
});

// ============================================
// 10. PAGE LOAD EFFECTS
// ============================================

/**
 * Setup page load animations and effects
 */
function setupPageLoadAnimations() {
    // Add loaded class to body when everything is ready
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        
        // Remove initial loading state if any
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }
    });
    
    // Handle reduced motion preference
    if (prefersReducedMotion()) {
        document.body.classList.add('reduced-motion');
    }
    
    // Listen for changes in motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
    });
}

// ============================================
// EXPORT FOR MODULES (if using ES modules)
// ============================================

// Expose functions globally if needed
window.portfolioApp = {
    scrollToElement,
    scrollToTop,
    toggleMobileMenu,
    closeMobileMenu,
    isInViewport,
    debounce,
    throttle,
};

/* ============================================
   END OF MAIN.JS
   ============================================ */