/* ============================================
   RAHUL PAL - PORTFOLIO WEBSITE
   Typing Animation Effect
   ============================================ */

/* ============================================
   TABLE OF CONTENTS
   ============================================
   1. Configuration
   2. Typing Effect Class
   3. Glitch Effect
   4. Utility Functions
   5. Initialization
   ============================================ */

// ============================================
// 1. CONFIGURATION
// ============================================

const TypingConfig = {
    // Target element selector
    targetSelector: '.tagline-text',
    cursorSelector: '.tagline-cursor',
    
    // Phrases to type (cycles through these)
    phrases: [
        'Full-Stack Developer × AI Engineer',
        'Building intelligent systems that matter.',
        'Transforming ideas into intelligent reality.',
        'Crafting AI-powered experiences.',
        'From concept to deployment, end-to-end.',
    ],
    
    // Timing (in milliseconds)
    timing: {
        typeSpeed: 50,           // Speed of typing each character
        typeSpeedVariation: 30,  // Random variation in typing speed
        deleteSpeed: 30,         // Speed of deleting each character
        pauseBeforeDelete: 2000, // Pause before starting to delete
        pauseBeforeType: 500,    // Pause before typing next phrase
        initialDelay: 1000,      // Delay before starting animation
    },
    
    // Behavior
    behavior: {
        loop: true,              // Whether to loop through phrases
        loopCount: Infinity,     // Number of loops (Infinity for endless)
        deleteAfterLast: true,   // Delete after last phrase if not looping
        showCursor: true,        // Show blinking cursor
        glitchEffect: true,      // Enable occasional glitch effect
        glitchProbability: 0.05, // Probability of glitch per character
    },
    
    // Glitch settings
    glitch: {
        duration: 100,           // Duration of glitch in ms
        characters: '!@#$%^&*()_+-=[]{}|;:,.<>?/~`',
        iterations: 3,           // Number of random characters before correct one
    },
};

// ============================================
// 2. TYPING EFFECT CLASS
// ============================================

class TypingEffect {
    constructor(config = {}) {
        // Merge config with defaults
        this.config = { ...TypingConfig, ...config };
        
        // Get DOM elements
        this.targetElement = document.querySelector(this.config.targetSelector);
        this.cursorElement = document.querySelector(this.config.cursorSelector);
        
        // State
        this.state = {
            currentPhraseIndex: 0,
            currentCharIndex: 0,
            isDeleting: false,
            isPaused: false,
            isComplete: false,
            loopsCompleted: 0,
            timeoutId: null,
        };
        
        // Check for reduced motion preference
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Bind methods
        this.type = this.type.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }
    
    /**
     * Initialize the typing effect
     */
    init() {
        if (!this.targetElement) {
            console.warn('Typing effect: Target element not found');
            return;
        }
        
        // If reduced motion is preferred, show full text immediately
        if (this.reducedMotion) {
            this.showFullText();
            return;
        }
        
        // Setup visibility change listener
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Start typing after initial delay
        this.state.timeoutId = setTimeout(() => {
            this.type();
        }, this.config.timing.initialDelay);
        
        console.log('⌨️ Typing effect initialized');
    }
    
    /**
     * Main typing function
     */
    type() {
        // Check if paused
        if (this.state.isPaused) return;
        
        const { phrases, timing, behavior } = this.config;
        const currentPhrase = phrases[this.state.currentPhraseIndex];
        
        // Determine what to do: type or delete
        if (this.state.isDeleting) {
            this.deleteCharacter(currentPhrase);
        } else {
            this.typeCharacter(currentPhrase);
        }
    }
    
    /**
     * Type a single character
     */
    typeCharacter(phrase) {
        const { timing, behavior, glitch } = this.config;
        
        // Check if we've finished typing the current phrase
        if (this.state.currentCharIndex >= phrase.length) {
            // Finished typing current phrase
            if (behavior.loop || this.state.currentPhraseIndex < this.config.phrases.length - 1) {
                // Start deleting after pause
                this.state.timeoutId = setTimeout(() => {
                    this.state.isDeleting = true;
                    this.type();
                }, timing.pauseBeforeDelete);
            } else {
                // Animation complete
                this.state.isComplete = true;
                this.onComplete();
            }
            return;
        }
        
        // Get the next character
        const char = phrase[this.state.currentCharIndex];
        
        // Check if we should apply glitch effect
        if (behavior.glitchEffect && Math.random() < behavior.glitchProbability && char !== ' ') {
            this.glitchCharacter(char, () => {
                this.appendCharacter(char);
                this.state.currentCharIndex++;
                this.scheduleNextType();
            });
        } else {
            // Normal typing
            this.appendCharacter(char);
            this.state.currentCharIndex++;
            this.scheduleNextType();
        }
    }
    
    /**
     * Delete a single character
     */
    deleteCharacter(phrase) {
        const { timing, behavior, phrases } = this.config;
        
        // Check if we've finished deleting
        if (this.state.currentCharIndex <= 0) {
            // Move to next phrase
            this.state.isDeleting = false;
            this.state.currentPhraseIndex++;
            
            // Check if we've completed all phrases
            if (this.state.currentPhraseIndex >= phrases.length) {
                this.state.loopsCompleted++;
                
                if (behavior.loop && this.state.loopsCompleted < behavior.loopCount) {
                    // Start over
                    this.state.currentPhraseIndex = 0;
                } else {
                    // Animation complete
                    this.state.isComplete = true;
                    this.onComplete();
                    return;
                }
            }
            
            // Start typing next phrase after pause
            this.state.timeoutId = setTimeout(() => {
                this.type();
            }, timing.pauseBeforeType);
            return;
        }
        
        // Delete one character
        this.removeCharacter();
        this.state.currentCharIndex--;
        
        // Schedule next delete
        this.state.timeoutId = setTimeout(() => {
            this.type();
        }, timing.deleteSpeed);
    }
    
    /**
     * Append a character to the display
     */
    appendCharacter(char) {
        this.targetElement.textContent += char;
    }
    
    /**
     * Remove the last character from display
     */
    removeCharacter() {
        const currentText = this.targetElement.textContent;
        this.targetElement.textContent = currentText.slice(0, -1);
    }
    
    /**
     * Schedule the next typing action
     */
    scheduleNextType() {
        const { timing } = this.config;
        const variation = Math.random() * timing.typeSpeedVariation;
        const delay = timing.typeSpeed + variation;
        
        this.state.timeoutId = setTimeout(() => {
            this.type();
        }, delay);
    }
    
    /**
     * Apply glitch effect to a character
     */
    glitchCharacter(targetChar, callback) {
        const { glitch } = this.config;
        let iterations = 0;
        
        const glitchInterval = setInterval(() => {
            // Show random character
            const randomChar = glitch.characters[Math.floor(Math.random() * glitch.characters.length)];
            this.targetElement.textContent = this.targetElement.textContent.slice(0, -1) + randomChar;
            
            // If first iteration, we need to add the character first
            if (iterations === 0) {
                this.targetElement.textContent += randomChar;
            }
            
            iterations++;
            
            if (iterations >= glitch.iterations) {
                clearInterval(glitchInterval);
                // Remove the glitched character and show correct one
                this.targetElement.textContent = this.targetElement.textContent.slice(0, -1);
                callback();
            }
        }, glitch.duration / glitch.iterations);
    }
    
    /**
     * Show full text immediately (for reduced motion)
     */
    showFullText() {
        if (this.targetElement) {
            this.targetElement.textContent = this.config.phrases[0];
        }
        if (this.cursorElement) {
            this.cursorElement.style.display = 'none';
        }
    }
    
    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }
    
    /**
     * Pause the typing effect
     */
    pause() {
        this.state.isPaused = true;
        if (this.state.timeoutId) {
            clearTimeout(this.state.timeoutId);
        }
    }
    
    /**
     * Resume the typing effect
     */
    resume() {
        if (this.state.isPaused && !this.state.isComplete) {
            this.state.isPaused = false;
            this.type();
        }
    }
    
    /**
     * Reset the typing effect
     */
    reset() {
        // Clear any pending timeouts
        if (this.state.timeoutId) {
            clearTimeout(this.state.timeoutId);
        }
        
        // Reset state
        this.state = {
            currentPhraseIndex: 0,
            currentCharIndex: 0,
            isDeleting: false,
            isPaused: false,
            isComplete: false,
            loopsCompleted: 0,
            timeoutId: null,
        };
        
        // Clear text
        if (this.targetElement) {
            this.targetElement.textContent = '';
        }
    }
    
    /**
     * Restart the typing effect
     */
    restart() {
        this.reset();
        this.init();
    }
    
    /**
     * Called when animation completes
     */
    onComplete() {
        console.log('⌨️ Typing effect complete');
        
        // Hide cursor if animation is complete and not looping
        if (!this.config.behavior.loop && this.cursorElement) {
            setTimeout(() => {
                this.cursorElement.style.animation = 'none';
                this.cursorElement.style.opacity = '0';
            }, 1000);
        }
    }
    
    /**
     * Destroy the typing effect
     */
    destroy() {
        // Clear timeouts
        if (this.state.timeoutId) {
            clearTimeout(this.state.timeoutId);
        }
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        console.log('⌨️ Typing effect destroyed');
    }
}

// ============================================
// 3. GLITCH TEXT EFFECT (STANDALONE)
// ============================================

class GlitchText {
    constructor(element, options = {}) {
        this.element = element;
        this.originalText = element.textContent;
        this.options = {
            duration: options.duration || 2000,
            interval: options.interval || 50,
            characters: options.characters || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
            iterations: options.iterations || 3,
            ...options,
        };
        this.isAnimating = false;
    }
    
    /**
     * Trigger glitch animation
     */
    animate() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const originalText = this.originalText;
        const chars = originalText.split('');
        const iterations = this.options.iterations;
        let currentIteration = 0;
        
        const interval = setInterval(() => {
            this.element.textContent = chars.map((char, index) => {
                if (char === ' ') return char;
                
                // Gradually reveal correct characters
                if (index < Math.floor((currentIteration / iterations) * chars.length)) {
                    return originalText[index];
                }
                
                // Show random character
                return this.options.characters[Math.floor(Math.random() * this.options.characters.length)];
            }).join('');
            
            currentIteration++;
            
            if (currentIteration >= iterations * 2) {
                clearInterval(interval);
                this.element.textContent = originalText;
                this.isAnimating = false;
            }
        }, this.options.interval);
    }
    
    /**
     * Reset to original text
     */
    reset() {
        this.element.textContent = this.originalText;
        this.isAnimating = false;
    }
}

// ============================================
// 4. SCRAMBLE TEXT EFFECT
// ============================================

class ScrambleText {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            speed: options.speed || 30,
            characters: options.characters || '!<>-_\\/[]{}—=+*^?#________',
            ...options,
        };
        this.queue = [];
        this.frameRequest = null;
        this.frame = 0;
        this.resolve = null;
    }
    
    /**
     * Set new text with scramble effect
     */
    setText(newText) {
        const oldText = this.element.textContent;
        const length = Math.max(oldText.length, newText.length);
        
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.queue = [];
            
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                this.queue.push({ from, to, start, end });
            }
            
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
        });
    }
    
    /**
     * Update animation frame
     */
    update() {
        let output = '';
        let complete = 0;
        
        for (let i = 0; i < this.queue.length; i++) {
            let { from, to, start, end, char } = this.queue[i];
            
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="scramble-char">${char}</span>`;
            } else {
                output += from;
            }
        }
        
        this.element.innerHTML = output;
        
        if (complete === this.queue.length) {
            if (this.resolve) this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(() => this.update());
            this.frame++;
        }
    }
    
    /**
     * Get random character
     */
    randomChar() {
        return this.options.characters[Math.floor(Math.random() * this.options.characters.length)];
    }
}

// ============================================
// 5. INITIALIZATION
// ============================================

// Global instance
let typingEffectInstance = null;

/**
 * Initialize typing effect
 */
function initTypingEffect() {
    // Create instance with default config
    typingEffectInstance = new TypingEffect(TypingConfig);
    
    // Initialize
    typingEffectInstance.init();
}

/**
 * Initialize on DOM ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypingEffect);
} else {
    // Small delay to ensure hero section is rendered
    setTimeout(initTypingEffect, 100);
}

// Expose to global scope
window.TypingEffect = TypingEffect;
window.GlitchText = GlitchText;
window.ScrambleText = ScrambleText;
window.typingEffectInstance = typingEffectInstance;

/* ============================================
   END OF TYPING.JS
   ============================================ */