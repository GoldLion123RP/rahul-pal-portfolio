/* ============================================
   RAHUL PAL - PORTFOLIO WEBSITE
   Three.js 3D Interactive Background
   ============================================ */

/* ============================================
   TABLE OF CONTENTS
   ============================================
   1. Configuration & Variables
   2. Scene Setup
   3. Geometry Creation
   4. Particle System
   5. Lighting & Materials
   6. Mouse Interaction
   7. Animation Loop
   8. Resize Handling
   9. Performance Optimization
   10. Initialization
   ============================================ */

// ============================================
// 1. CONFIGURATION & VARIABLES
// ============================================

const ThreeScene = {
    // Scene elements
    scene: null,
    camera: null,
    renderer: null,
    canvas: null,
    
    // Objects
    mainGeometry: null,
    wireframe: null,
    particles: null,
    innerCore: null,
    outerRings: [],
    floatingShapes: [],
    
    // Animation
    animationId: null,
    clock: null,
    
    // Mouse tracking
    mouse: {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
    },
    
    // Configuration
    config: {
        // Colors (matching CSS variables)
        colors: {
            primary: 0x00d4ff,    // Electric blue
            secondary: 0xa855f7,  // Neon purple
            tertiary: 0xff2d95,   // Hot magenta
            accent: 0x00ff88,     // Cyber green
            background: 0x0a0a0f, // Dark background
        },
        
        // Geometry settings
        geometry: {
            radius: 2.5,
            detail: 1,
            wireframeOpacity: 0.3,
        },
        
        // Particles settings
        particles: {
            count: 1500,
            size: 0.015,
            spread: 25,
            speed: 0.0002,
        },
        
        // Animation settings
        animation: {
            rotationSpeed: 0.001,
            floatSpeed: 0.5,
            mouseInfluence: 0.00005,
            dampening: 0.05,
        },
        
        // Performance
        performance: {
            maxPixelRatio: 2,
            mobileParticleReduction: 0.5,
            lowPerfMode: false,
        },
    },
    
    // State
    state: {
        isInitialized: false,
        isVisible: true,
        isMobile: false,
        isPaused: false,
        reducedMotion: false,
    },
};

// ============================================
// 2. SCENE SETUP
// ============================================

/**
 * Initialize the Three.js scene
 */
ThreeScene.init = function() {
    // Check for WebGL support
    if (!this.checkWebGLSupport()) {
        console.warn('WebGL not supported, skipping 3D scene');
        return;
    }
    
    // Check for reduced motion preference
    this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check if mobile
    this.state.isMobile = this.checkMobile();
    
    // Get canvas
    this.canvas = document.getElementById('webgl-canvas');
    if (!this.canvas) {
        console.warn('WebGL canvas not found');
        return;
    }
    
    // Initialize clock
    this.clock = new THREE.Clock();
    
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera
    this.createCamera();
    
    // Create renderer
    this.createRenderer();
    
    // Create objects
    this.createMainGeometry();
    this.createParticles();
    this.createFloatingShapes();
    this.createAmbientElements();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Mark as initialized
    this.state.isInitialized = true;
    
    // Start animation loop
    this.animate();
    
    console.log('🎮 Three.js scene initialized');
};

/**
 * Check WebGL support
 */
ThreeScene.checkWebGLSupport = function() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
};

/**
 * Check if device is mobile
 */
ThreeScene.checkMobile = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth < 768;
};

/**
 * Create camera
 */
ThreeScene.createCamera = function() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.z = 8;
    this.camera.position.y = 0;
};

/**
 * Create renderer
 */
ThreeScene.createRenderer = function() {
    this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: !this.state.isMobile,
        alpha: true,
        powerPreference: 'high-performance',
    });
    
    // Set size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Set pixel ratio (limit for performance)
    const pixelRatio = Math.min(window.devicePixelRatio, this.config.performance.maxPixelRatio);
    this.renderer.setPixelRatio(pixelRatio);
    
    // Set clear color (transparent)
    this.renderer.setClearColor(0x000000, 0);
    
    // Enable tone mapping for better colors
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
};

// ============================================
// 3. GEOMETRY CREATION
// ============================================

/**
 * Create main geometric shape
 */
ThreeScene.createMainGeometry = function() {
    const { colors, geometry } = this.config;
    
    // Create group to hold all elements
    this.mainGeometry = new THREE.Group();
    
    // Create icosahedron (main shape)
    const icosahedronGeometry = new THREE.IcosahedronGeometry(geometry.radius, geometry.detail);
    
    // Wireframe material
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: colors.primary,
        wireframe: true,
        transparent: true,
        opacity: geometry.wireframeOpacity,
    });
    
    this.wireframe = new THREE.Mesh(icosahedronGeometry, wireframeMaterial);
    this.mainGeometry.add(this.wireframe);
    
    // Inner core (smaller, solid)
    const coreGeometry = new THREE.IcosahedronGeometry(geometry.radius * 0.3, 0);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: colors.secondary,
        transparent: true,
        opacity: 0.6,
    });
    
    this.innerCore = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mainGeometry.add(this.innerCore);
    
    // Create outer rings
    this.createOuterRings();
    
    // Add to scene
    this.scene.add(this.mainGeometry);
    
    // Position slightly to the right on desktop
    if (!this.state.isMobile) {
        this.mainGeometry.position.x = 3;
        this.mainGeometry.position.y = 0.5;
    }
};

/**
 * Create decorative outer rings
 */
ThreeScene.createOuterRings = function() {
    const { colors, geometry } = this.config;
    
    const ringConfigs = [
        { radius: geometry.radius * 1.3, tube: 0.008, color: colors.primary, rotationAxis: 'x' },
        { radius: geometry.radius * 1.5, tube: 0.006, color: colors.secondary, rotationAxis: 'y' },
        { radius: geometry.radius * 1.7, tube: 0.004, color: colors.tertiary, rotationAxis: 'z' },
    ];
    
    ringConfigs.forEach((config, index) => {
        const ringGeometry = new THREE.TorusGeometry(config.radius, config.tube, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.4 - (index * 0.1),
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        // Set initial rotation
        if (config.rotationAxis === 'x') {
            ring.rotation.x = Math.PI / 2;
        } else if (config.rotationAxis === 'y') {
            ring.rotation.y = Math.PI / 3;
        } else {
            ring.rotation.z = Math.PI / 4;
        }
        
        ring.userData.rotationAxis = config.rotationAxis;
        ring.userData.rotationSpeed = 0.002 + (index * 0.001);
        
        this.outerRings.push(ring);
        this.mainGeometry.add(ring);
    });
};

// ============================================
// 4. PARTICLE SYSTEM
// ============================================

/**
 * Create particle system (starfield)
 */
ThreeScene.createParticles = function() {
    const { colors, particles } = this.config;
    
    // Reduce particles on mobile
    let particleCount = particles.count;
    if (this.state.isMobile) {
        particleCount = Math.floor(particleCount * this.config.performance.mobileParticleReduction);
    }
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    
    // Create position and color arrays
    const positions = new Float32Array(particleCount * 3);
    const colors_array = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Color palette
    const colorPalette = [
        new THREE.Color(colors.primary),
        new THREE.Color(colors.secondary),
        new THREE.Color(colors.tertiary),
        new THREE.Color(colors.accent),
        new THREE.Color(0xffffff),
    ];
    
    // Populate arrays
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Random position in sphere
        const radius = particles.spread * (0.5 + Math.random() * 0.5);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
        
        // Random color from palette
        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors_array[i3] = color.r;
        colors_array[i3 + 1] = color.g;
        colors_array[i3 + 2] = color.b;
        
        // Random size
        sizes[i] = particles.size * (0.5 + Math.random());
    }
    
    // Set attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors_array, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material
    const material = new THREE.PointsMaterial({
        size: particles.size,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
    });
    
    // Create points
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
};

// ============================================
// 5. FLOATING SHAPES
// ============================================

/**
 * Create floating decorative shapes
 */
ThreeScene.createFloatingShapes = function() {
    const { colors } = this.config;
    
    // Skip on mobile for performance
    if (this.state.isMobile) return;
    
    const shapeConfigs = [
        { type: 'octahedron', radius: 0.3, position: [-5, 3, -5], color: colors.primary },
        { type: 'tetrahedron', radius: 0.25, position: [6, -2, -4], color: colors.secondary },
        { type: 'octahedron', radius: 0.2, position: [-4, -3, -6], color: colors.tertiary },
        { type: 'tetrahedron', radius: 0.35, position: [5, 4, -7], color: colors.accent },
        { type: 'dodecahedron', radius: 0.15, position: [-6, 1, -3], color: colors.primary },
        { type: 'icosahedron', radius: 0.2, position: [4, -4, -5], color: colors.secondary },
    ];
    
    shapeConfigs.forEach((config, index) => {
        let geometry;
        
        switch (config.type) {
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(config.radius);
                break;
            case 'tetrahedron':
                geometry = new THREE.TetrahedronGeometry(config.radius);
                break;
            case 'dodecahedron':
                geometry = new THREE.DodecahedronGeometry(config.radius);
                break;
            case 'icosahedron':
            default:
                geometry = new THREE.IcosahedronGeometry(config.radius);
        }
        
        const material = new THREE.MeshBasicMaterial({
            color: config.color,
            wireframe: true,
            transparent: true,
            opacity: 0.5,
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...config.position);
        
        // Store animation data
        mesh.userData = {
            initialPosition: [...config.position],
            floatOffset: Math.random() * Math.PI * 2,
            floatSpeed: 0.5 + Math.random() * 0.5,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02,
            },
        };
        
        this.floatingShapes.push(mesh);
        this.scene.add(mesh);
    });
};

/**
 * Create ambient background elements
 */
ThreeScene.createAmbientElements = function() {
    // Create distant stars/dots
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = this.state.isMobile ? 200 : 500;
    const positions = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 100;
        positions[i3 + 1] = (Math.random() - 0.5) * 100;
        positions[i3 + 2] = -20 - Math.random() * 50;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
};

// ============================================
// 6. MOUSE INTERACTION
// ============================================

/**
 * Setup event listeners
 */
ThreeScene.setupEventListeners = function() {
    // Mouse move
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    
    // Touch move (for mobile)
    window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });
    
    // Resize
    window.addEventListener('resize', () => this.onResize());
    
    // Visibility change
    document.addEventListener('visibilitychange', () => this.onVisibilityChange());
    
    // Reduced motion preference change
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.state.reducedMotion = e.matches;
    });
};

/**
 * Handle mouse movement
 */
ThreeScene.onMouseMove = function(event) {
    // Normalize mouse position (-1 to 1)
    this.mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
};

/**
 * Handle touch movement
 */
ThreeScene.onTouchMove = function(event) {
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        this.mouse.targetX = (touch.clientX / window.innerWidth) * 2 - 1;
        this.mouse.targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
    }
};

/**
 * Update mouse position with smoothing
 */
ThreeScene.updateMousePosition = function() {
    const dampening = this.config.animation.dampening;
    
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * dampening;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * dampening;
};

// ============================================
// 7. ANIMATION LOOP
// ============================================

/**
 * Main animation loop
 */
ThreeScene.animate = function() {
    // Request next frame
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Skip if paused or not visible
    if (this.state.isPaused || !this.state.isVisible) return;
    
    // Get delta time
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    
    // Update mouse position
    this.updateMousePosition();
    
    // Animate elements (skip if reduced motion is preferred)
    if (!this.state.reducedMotion) {
        this.animateMainGeometry(elapsed, delta);
        this.animateParticles(elapsed);
        this.animateFloatingShapes(elapsed);
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
};

/**
 * Animate main geometry
 */
ThreeScene.animateMainGeometry = function(elapsed, delta) {
    if (!this.mainGeometry) return;
    
    const { animation } = this.config;
    
    // Base rotation
    this.mainGeometry.rotation.y += animation.rotationSpeed;
    this.mainGeometry.rotation.x += animation.rotationSpeed * 0.5;
    
    // Mouse influence
    this.mainGeometry.rotation.y += this.mouse.x * animation.mouseInfluence * 100;
    this.mainGeometry.rotation.x += this.mouse.y * animation.mouseInfluence * 100;
    
    // Animate wireframe
    if (this.wireframe) {
        this.wireframe.rotation.z += animation.rotationSpeed * 0.3;
    }
    
    // Animate inner core
    if (this.innerCore) {
        this.innerCore.rotation.y -= animation.rotationSpeed * 2;
        this.innerCore.rotation.x -= animation.rotationSpeed;
        
        // Pulsing scale
        const pulse = 1 + Math.sin(elapsed * 2) * 0.1;
        this.innerCore.scale.setScalar(pulse);
    }
    
    // Animate outer rings
    this.outerRings.forEach((ring, index) => {
        const speed = ring.userData.rotationSpeed;
        ring.rotation.x += speed;
        ring.rotation.y += speed * 0.7;
        ring.rotation.z += speed * 0.5;
    });
    
    // Floating motion
    const floatY = Math.sin(elapsed * animation.floatSpeed) * 0.2;
    const floatX = Math.cos(elapsed * animation.floatSpeed * 0.7) * 0.1;
    this.mainGeometry.position.y = (this.state.isMobile ? 0 : 0.5) + floatY;
    this.mainGeometry.position.x = (this.state.isMobile ? 0 : 3) + floatX;
};

/**
 * Animate particles
 */
ThreeScene.animateParticles = function(elapsed) {
    if (!this.particles) return;
    
    const { particles } = this.config;
    
    // Rotate particle system
    this.particles.rotation.y += particles.speed;
    this.particles.rotation.x += particles.speed * 0.5;
    
    // Mouse influence on particles
    this.particles.rotation.y += this.mouse.x * 0.0002;
    this.particles.rotation.x += this.mouse.y * 0.0002;
};

/**
 * Animate floating shapes
 */
ThreeScene.animateFloatingShapes = function(elapsed) {
    this.floatingShapes.forEach((shape) => {
        const { initialPosition, floatOffset, floatSpeed, rotationSpeed } = shape.userData;
        
        // Floating motion
        shape.position.y = initialPosition[1] + Math.sin(elapsed * floatSpeed + floatOffset) * 0.5;
        shape.position.x = initialPosition[0] + Math.cos(elapsed * floatSpeed * 0.7 + floatOffset) * 0.3;
        
        // Rotation
        shape.rotation.x += rotationSpeed.x;
        shape.rotation.y += rotationSpeed.y;
        shape.rotation.z += rotationSpeed.z;
        
        // Mouse influence
        shape.rotation.y += this.mouse.x * 0.001;
        shape.rotation.x += this.mouse.y * 0.001;
    });
};

// ============================================
// 8. RESIZE HANDLING
// ============================================

/**
 * Handle window resize
 */
ThreeScene.onResize = function() {
    // Update camera
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    
    // Update renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update mobile state
    const wasMobile = this.state.isMobile;
    this.state.isMobile = this.checkMobile();
    
    // Reposition geometry for mobile/desktop
    if (this.mainGeometry) {
        if (this.state.isMobile) {
            this.mainGeometry.position.x = 0;
            this.mainGeometry.position.y = 0;
        } else {
            this.mainGeometry.position.x = 3;
            this.mainGeometry.position.y = 0.5;
        }
    }
    
    // Update pixel ratio
    const pixelRatio = Math.min(window.devicePixelRatio, this.config.performance.maxPixelRatio);
    this.renderer.setPixelRatio(pixelRatio);
};

/**
 * Handle visibility change
 */
ThreeScene.onVisibilityChange = function() {
    if (document.hidden) {
        this.state.isVisible = false;
        this.clock.stop();
    } else {
        this.state.isVisible = true;
        this.clock.start();
    }
};

// ============================================
// 9. PERFORMANCE OPTIMIZATION
// ============================================

/**
 * Enable low performance mode
 */
ThreeScene.enableLowPerfMode = function() {
    this.config.performance.lowPerfMode = true;
    
    // Reduce particle count
    if (this.particles) {
        const currentCount = this.particles.geometry.attributes.position.count;
        // Hide half the particles
        const positions = this.particles.geometry.attributes.position.array;
        for (let i = Math.floor(currentCount / 2) * 3; i < positions.length; i++) {
            positions[i] = 0;
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Reduce floating shapes
    this.floatingShapes.forEach((shape, index) => {
        if (index > 2) {
            shape.visible = false;
        }
    });
    
    // Simplify main geometry
    if (this.outerRings.length > 1) {
        this.outerRings.forEach((ring, index) => {
            if (index > 0) {
                ring.visible = false;
            }
        });
    }
};

/**
 * Disable low performance mode
 */
ThreeScene.disableLowPerfMode = function() {
    this.config.performance.lowPerfMode = false;
    
    // Restore floating shapes
    this.floatingShapes.forEach((shape) => {
        shape.visible = true;
    });
    
    // Restore rings
    this.outerRings.forEach((ring) => {
        ring.visible = true;
    });
};

/**
 * Pause animation
 */
ThreeScene.pause = function() {
    this.state.isPaused = true;
    this.clock.stop();
};

/**
 * Resume animation
 */
ThreeScene.resume = function() {
    this.state.isPaused = false;
    this.clock.start();
};

/**
 * Destroy scene and clean up
 */
ThreeScene.destroy = function() {
    // Cancel animation frame
    if (this.animationId) {
        cancelAnimationFrame(this.animationId);
    }
    
    // Dispose geometries and materials
    this.scene.traverse((object) => {
        if (object.geometry) {
            object.geometry.dispose();
        }
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
    });
    
    // Dispose renderer
    if (this.renderer) {
        this.renderer.dispose();
    }
    
    // Clear scene
    while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
    }
    
    // Reset state
    this.state.isInitialized = false;
    
    console.log('🎮 Three.js scene destroyed');
};

// ============================================
// 10. INITIALIZATION
// ============================================

/**
 * Initialize when DOM is ready
 */
function initThreeScene() {
    // Check if THREE is available
    if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded, skipping 3D scene');
        return;
    }
    
    // Initialize scene
    ThreeScene.init();
}

// Initialize based on document ready state
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThreeScene);
} else {
    // Small delay to ensure everything is loaded
    setTimeout(initThreeScene, 100);
}

// Expose to global scope for debugging
window.ThreeScene = ThreeScene;

/* ============================================
   END OF THREE-SCENE.JS
   ============================================ */