/* ============================================
   RAHUL PAL - PORTFOLIO WEBSITE
   3D Card Tilt Effect
   ============================================ */

/* ============================================
   TABLE OF CONTENTS
   ============================================
   1. Configuration
   2. TiltEffect Class
   3. Glare Effect
   4. Magnetic Effect
   5. Utility Functions
   6. Initialization
   ============================================ */

// ============================================
// 1. CONFIGURATION
// ============================================

const TiltConfig = {
    // Default settings for tilt effect
    defaults: {
        maxTilt: 15,              // Maximum tilt angle in degrees
        perspective: 1000,        // Perspective value in pixels
        scale: 1.02,              // Scale on hover
        speed: 400,               // Transition speed in ms
        easing: 'cubic-bezier(0.03, 0.98, 0.52, 0.99)',
        glare: true,              // Enable glare effect
        maxGlare: 0.2,            // Maximum glare opacity
        glarePrerender: false,    // Pre-render glare element
        reset: true,              // Reset on mouse leave
        axis: null,               // Lock to specific axis ('x' or 'y')
        reverse: false,           // Reverse tilt direction
        gyroscope: true,          // Enable gyroscope on mobile
        gyroscopeMinAngleX: -45,  // Min X angle for gyroscope
        gyroscopeMaxAngleX: 45,   // Max X angle for gyroscope
        gyroscopeMinAngleY: -45,  // Min Y angle for gyroscope
        gyroscopeMaxAngleY: 45,   // Max Y angle for gyroscope
    },
    
    // Selector for tilt-enabled elements
    selector: '[data-tilt]',
    
    // CSS classes
    classes: {
        tiltElement: 'tilt-element',
        tilting: 'is-tilting',
        glare: 'tilt-glare',
        glareInner: 'tilt-glare-inner',
    },
};

// ============================================
// 2. TILT EFFECT CLASS
// ============================================

class TiltEffect {
    constructor(element, options = {}) {
        // Store element
        this.element = element;
        
        // Merge options with defaults
        this.settings = { ...TiltConfig.defaults, ...options };
        
        // Parse data attributes for individual element settings
        this.parseDataAttributes();
        
        // State
        this.state = {
            isActive: false,
            isTilting: false,
            transitionTimeout: null,
            updateCall: null,
            event: null,
            gyroscopeEvent: null,
        };
        
        // Transform values
        this.transform = {
            tiltX: 0,
            tiltY: 0,
            percentageX: 0,
            percentageY: 0,
        };
        
        // Element dimensions
        this.dimensions = {
            width: 0,
            height: 0,
            left: 0,
            top: 0,
        };
        
        // Check for reduced motion preference
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Glare element
        this.glareElement = null;
        this.glareInnerElement = null;
        
        // Bind methods
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onDeviceOrientation = this.onDeviceOrientation.bind(this);
        this.updateTransform = this.updateTransform.bind(this);
        
        // Initialize
        this.init();
    }
    
    /**
     * Parse data attributes from element
     */
    parseDataAttributes() {
        const data = this.element.dataset;
        
        if (data.tiltMaxTilt) this.settings.maxTilt = parseFloat(data.tiltMaxTilt);
        if (data.tiltPerspective) this.settings.perspective = parseFloat(data.tiltPerspective);
        if (data.tiltScale) this.settings.scale = parseFloat(data.tiltScale);
        if (data.tiltSpeed) this.settings.speed = parseFloat(data.tiltSpeed);
        if (data.tiltAxis) this.settings.axis = data.tiltAxis;
        if (data.tiltGlare === 'true') this.settings.glare = true;
        if (data.tiltGlare === 'false') this.settings.glare = false;
        if (data.tiltMaxGlare) this.settings.maxGlare = parseFloat(data.tiltMaxGlare);
        if (data.tiltReverse === 'true') this.settings.reverse = true;
        if (data.tiltReset === 'false') this.settings.reset = false;
    }
    
    /**
     * Initialize tilt effect
     */
    init() {
        // Skip if reduced motion is preferred
        if (this.reducedMotion) {
            console.log('Tilt effect disabled due to reduced motion preference');
            return;
        }
        
        // Add class
        this.element.classList.add(TiltConfig.classes.tiltElement);
        
        // Set initial styles
        this.setInitialStyles();
        
        // Create glare element if enabled
        if (this.settings.glare) {
            this.createGlare();
        }
        
        // Add event listeners
        this.addEventListeners();
        
        // Mark as active
        this.state.isActive = true;
    }
    
    /**
     * Set initial CSS styles
     */
    setInitialStyles() {
        this.element.style.willChange = 'transform';
        this.element.style.transformStyle = 'preserve-3d';
    }
    
    /**
     * Create glare overlay element
     */
    createGlare() {
        // Create glare wrapper
        this.glareElement = document.createElement('div');
        this.glareElement.classList.add(TiltConfig.classes.glare);
        
        // Create glare inner (the actual gradient)
        this.glareInnerElement = document.createElement('div');
        this.glareInnerElement.classList.add(TiltConfig.classes.glareInner);
        
        // Style glare wrapper
        Object.assign(this.glareElement.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none',
            borderRadius: 'inherit',
            zIndex: '1',
        });
        
        // Style glare inner
        Object.assign(this.glareInnerElement.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '200%',
            height: '200%',
            transform: 'rotate(180deg) translate(-50%, -50%)',
            transformOrigin: '0 0',
            background: `linear-gradient(
                0deg,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, ${this.settings.maxGlare}) 100%
            )`,
            opacity: '0',
            transition: `opacity ${this.settings.speed}ms ${this.settings.easing}`,
        });
        
        // Append elements
        this.glareElement.appendChild(this.glareInnerElement);
        
        // Ensure element has position relative
        const computedStyle = window.getComputedStyle(this.element);
        if (computedStyle.position === 'static') {
            this.element.style.position = 'relative';
        }
        
        this.element.appendChild(this.glareElement);
    }
    
    /**
     * Add event listeners
     */
    addEventListeners() {
        this.element.addEventListener('mouseenter', this.onMouseEnter);
        this.element.addEventListener('mousemove', this.onMouseMove);
        this.element.addEventListener('mouseleave', this.onMouseLeave);
        
        // Touch events
        this.element.addEventListener('touchstart', this.onMouseEnter, { passive: true });
        this.element.addEventListener('touchmove', this.onMouseMove, { passive: true });
        this.element.addEventListener('touchend', this.onMouseLeave);
        
        // Gyroscope (mobile device orientation)
        if (this.settings.gyroscope && window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', this.onDeviceOrientation);
        }
    }
    
    /**
     * Remove event listeners
     */
    removeEventListeners() {
        this.element.removeEventListener('mouseenter', this.onMouseEnter);
        this.element.removeEventListener('mousemove', this.onMouseMove);
        this.element.removeEventListener('mouseleave', this.onMouseLeave);
        this.element.removeEventListener('touchstart', this.onMouseEnter);
        this.element.removeEventListener('touchmove', this.onMouseMove);
        this.element.removeEventListener('touchend', this.onMouseLeave);
        
        if (this.settings.gyroscope) {
            window.removeEventListener('deviceorientation', this.onDeviceOrientation);
        }
    }
    
    /**
     * Handle mouse enter
     */
    onMouseEnter(event) {
        this.updateDimensions();
        
        this.element.classList.add(TiltConfig.classes.tilting);
        this.state.isTilting = true;
        
        // Set transition
        this.setTransition();
    }
    
    /**
     * Handle mouse move
     */
    onMouseMove(event) {
        if (this.state.updateCall !== null) {
            cancelAnimationFrame(this.state.updateCall);
        }
        
        this.state.event = event;
        this.state.updateCall = requestAnimationFrame(this.updateTransform);
    }
    
    /**
     * Handle mouse leave
     */
    onMouseLeave(event) {
        this.element.classList.remove(TiltConfig.classes.tilting);
        this.state.isTilting = false;
        
        if (this.settings.reset) {
            requestAnimationFrame(() => {
                this.resetTransform();
            });
        }
    }
    
    /**
     * Handle device orientation (gyroscope)
     */
    onDeviceOrientation(event) {
        if (!this.state.isTilting) return;
        
        const { gyroscopeMinAngleX, gyroscopeMaxAngleX, gyroscopeMinAngleY, gyroscopeMaxAngleY, maxTilt } = this.settings;
        
        // Get device orientation
        const beta = event.beta || 0;  // X-axis (-180 to 180)
        const gamma = event.gamma || 0; // Y-axis (-90 to 90)
        
        // Map to tilt values
        const tiltX = this.mapRange(beta, gyroscopeMinAngleX, gyroscopeMaxAngleX, -maxTilt, maxTilt);
        const tiltY = this.mapRange(gamma, gyroscopeMinAngleY, gyroscopeMaxAngleY, -maxTilt, maxTilt);
        
        this.transform.tiltX = tiltX;
        this.transform.tiltY = tiltY;
        
        this.applyTransform();
        
        if (this.settings.glare) {
            this.updateGlare();
        }
    }
    
    /**
     * Update element dimensions
     */
    updateDimensions() {
        const rect = this.element.getBoundingClientRect();
        
        this.dimensions = {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top,
        };
    }
    
    /**
     * Calculate and apply transform
     */
    updateTransform() {
        const event = this.state.event;
        if (!event) return;
        
        // Get mouse position
        let clientX, clientY;
        
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        // Calculate position relative to element center
        const { width, height, left, top } = this.dimensions;
        
        const mouseX = clientX - left;
        const mouseY = clientY - top;
        
        // Calculate percentage from center (-0.5 to 0.5)
        const percentageX = (mouseX / width) - 0.5;
        const percentageY = (mouseY / height) - 0.5;
        
        this.transform.percentageX = percentageX;
        this.transform.percentageY = percentageY;
        
        // Calculate tilt
        const { maxTilt, axis, reverse } = this.settings;
        const reverseMultiplier = reverse ? -1 : 1;
        
        // Tilt is inverted: moving mouse right tilts left edge up
        this.transform.tiltX = (axis === 'x' ? 0 : percentageY * maxTilt * reverseMultiplier);
        this.transform.tiltY = (axis === 'y' ? 0 : -percentageX * maxTilt * reverseMultiplier);
        
        // Apply transform
        this.applyTransform();
        
        // Update glare
        if (this.settings.glare) {
            this.updateGlare();
        }
        
        // Clear update call
        this.state.updateCall = null;
    }
    
    /**
     * Apply CSS transform to element
     */
    applyTransform() {
        const { tiltX, tiltY } = this.transform;
        const { perspective, scale } = this.settings;
        
        const transform = `
            perspective(${perspective}px)
            rotateX(${tiltX}deg)
            rotateY(${tiltY}deg)
            scale3d(${scale}, ${scale}, ${scale})
        `;
        
        this.element.style.transform = transform;
    }
    
    /**
     * Reset transform to default
     */
    resetTransform() {
        const { perspective, speed, easing } = this.settings;
        
        this.transform.tiltX = 0;
        this.transform.tiltY = 0;
        this.transform.percentageX = 0;
        this.transform.percentageY = 0;
        
        this.element.style.transition = `transform ${speed}ms ${easing}`;
        this.element.style.transform = `
            perspective(${perspective}px)
            rotateX(0deg)
            rotateY(0deg)
            scale3d(1, 1, 1)
        `;
        
        // Reset glare
        if (this.settings.glare && this.glareInnerElement) {
            this.glareInnerElement.style.opacity = '0';
        }
        
        // Clear transition after animation
        this.state.transitionTimeout = setTimeout(() => {
            this.element.style.transition = '';
        }, speed);
    }
    
    /**
     * Set transition for smooth effect
     */
    setTransition() {
        clearTimeout(this.state.transitionTimeout);
        
        this.element.style.transition = `transform ${this.settings.speed}ms ${this.settings.easing}`;
        
        this.state.transitionTimeout = setTimeout(() => {
            this.element.style.transition = '';
        }, this.settings.speed);
    }
    
    /**
     * Update glare position and opacity
     */
    updateGlare() {
        if (!this.glareInnerElement) return;
        
        const { percentageX, percentageY } = this.transform;
        
        // Calculate glare angle
        const angle = Math.atan2(percentageY, percentageX) * (180 / Math.PI);
        
        // Calculate glare opacity based on distance from center
        const distance = Math.sqrt(percentageX * percentageX + percentageY * percentageY);
        const opacity = Math.min(distance * 2 * this.settings.maxGlare, this.settings.maxGlare);
        
        // Apply styles
        this.glareInnerElement.style.transform = `
            rotate(${angle + 180}deg)
            translate(-50%, -50%)
        `;
        this.glareInnerElement.style.opacity = opacity.toString();
    }
    
    /**
     * Map value from one range to another
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }
    
    /**
     * Destroy tilt effect
     */
    destroy() {
        // Remove event listeners
        this.removeEventListeners();
        
        // Clear timeouts
        clearTimeout(this.state.transitionTimeout);
        
        // Cancel animation frame
        if (this.state.updateCall) {
            cancelAnimationFrame(this.state.updateCall);
        }
        
        // Reset styles
        this.element.style.willChange = '';
        this.element.style.transform = '';
        this.element.style.transition = '';
        this.element.style.transformStyle = '';
        
        // Remove glare element
        if (this.glareElement) {
            this.glareElement.remove();
        }
        
        // Remove classes
        this.element.classList.remove(TiltConfig.classes.tiltElement);
        this.element.classList.remove(TiltConfig.classes.tilting);
        
        // Mark as inactive
        this.state.isActive = false;
    }
}

// ============================================
// 3. GLARE EFFECT (STANDALONE)
// ============================================

class GlareEffect {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            maxOpacity: options.maxOpacity || 0.3,
            color: options.color || 'rgba(255, 255, 255, 0.5)',
            size: options.size || 300,
            ...options,
        };
        
        this.glareElement = null;
        this.init();
    }
    
    init() {
        // Create glare element
        this.glareElement = document.createElement('div');
        this.glareElement.style.cssText = `
            position: absolute;
            width: ${this.options.size}px;
            height: ${this.options.size}px;
            background: radial-gradient(circle, ${this.options.color} 0%, transparent 70%);
            pointer-events: none;
            border-radius: 50%;
            opacity: 0;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
            z-index: 10;
        `;
        
        // Ensure parent has position
        if (getComputedStyle(this.element).position === 'static') {
            this.element.style.position = 'relative';
        }
        this.element.style.overflow = 'hidden';
        
        this.element.appendChild(this.glareElement);
        
        // Add event listeners
        this.element.addEventListener('mousemove', (e) => this.onMove(e));
        this.element.addEventListener('mouseleave', () => this.onLeave());
    }
    
    onMove(e) {
        const rect = this.element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.glareElement.style.left = `${x}px`;
        this.glareElement.style.top = `${y}px`;
        this.glareElement.style.opacity = this.options.maxOpacity.toString();
    }
    
    onLeave() {
        this.glareElement.style.opacity = '0';
    }
    
    destroy() {
        if (this.glareElement) {
            this.glareElement.remove();
        }
    }
}

// ============================================
// 4. MAGNETIC EFFECT
// ============================================

class MagneticEffect {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            strength: options.strength || 30,
            ease: options.ease || 0.15,
            ...options,
        };
        
        this.position = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.animationId = null;
        this.isHovering = false;
        
        this.init();
    }
    
    init() {
        this.element.style.willChange = 'transform';
        this.element.style.transition = 'transform 0.1s ease-out';
        
        this.element.addEventListener('mouseenter', () => this.onEnter());
        this.element.addEventListener('mousemove', (e) => this.onMove(e));
        this.element.addEventListener('mouseleave', () => this.onLeave());
    }
    
    onEnter() {
        this.isHovering = true;
        this.animate();
    }
    
    onMove(e) {
        const rect = this.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        
        this.target.x = distanceX * (this.options.strength / 100);
        this.target.y = distanceY * (this.options.strength / 100);
    }
    
    onLeave() {
        this.isHovering = false;
        this.target = { x: 0, y: 0 };
    }
    
    animate() {
        if (!this.isHovering && 
            Math.abs(this.position.x) < 0.1 && 
            Math.abs(this.position.y) < 0.1) {
            this.position = { x: 0, y: 0 };
            this.element.style.transform = '';
            cancelAnimationFrame(this.animationId);
            return;
        }
        
        this.position.x += (this.target.x - this.position.x) * this.options.ease;
        this.position.y += (this.target.y - this.position.y) * this.options.ease;
        
        this.element.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        cancelAnimationFrame(this.animationId);
        this.element.style.transform = '';
        this.element.style.willChange = '';
        this.element.style.transition = '';
    }
}

// ============================================
// 5. UTILITY FUNCTIONS
// ============================================

/**
 * Check if device supports touch
 */
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if reduced motion is preferred
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ============================================
// 6. INITIALIZATION
// ============================================

// Store all tilt instances
const tiltInstances = [];

/**
 * Initialize tilt effect on all matching elements
 */
function initTiltEffect() {
    // Skip on touch devices for better UX
    if (isTouchDevice()) {
        console.log('🎴 Tilt effect skipped on touch device');
        return;
    }
    
    // Skip if reduced motion is preferred
    if (prefersReducedMotion()) {
        console.log('🎴 Tilt effect skipped due to reduced motion preference');
        return;
    }
    
    // Get all tilt-enabled elements
    const elements = document.querySelectorAll(TiltConfig.selector);
    
    if (elements.length === 0) {
        console.log('🎴 No tilt elements found');
        return;
    }
    
    // Create tilt instance for each element
    elements.forEach((element) => {
        const instance = new TiltEffect(element);
        tiltInstances.push(instance);
    });
    
    console.log(`🎴 Tilt effect initialized on ${elements.length} elements`);
}

/**
 * Destroy all tilt instances
 */
function destroyAllTiltEffects() {
    tiltInstances.forEach((instance) => {
        instance.destroy();
    });
    tiltInstances.length = 0;
}

/**
 * Refresh tilt effect (useful after DOM changes)
 */
function refreshTiltEffect() {
    destroyAllTiltEffects();
    initTiltEffect();
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTiltEffect);
} else {
    // Small delay to ensure all elements are rendered
    setTimeout(initTiltEffect, 200);
}

// Expose to global scope
window.TiltEffect = TiltEffect;
window.GlareEffect = GlareEffect;
window.MagneticEffect = MagneticEffect;
window.tiltInstances = tiltInstances;
window.refreshTiltEffect = refreshTiltEffect;

/* ============================================
   END OF TILT.JS
   ============================================ */