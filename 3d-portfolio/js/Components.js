import { pauseRenderer, resumeRenderer } from "./utils";
import { reverseSelected, wasSelected } from "../main";

/**
 * Base Card class that provides common functionality for project and about cards
 */
export class Card {
    /**
     * Create a new card
     * @param {Object} options - Configuration options for the card
     * @param {string} options.id - Unique ID for the card
     * @param {HTMLElement} options.container - Container element to append the card to
     * @param {Function} options.onClose - Callback function to execute when the card is closed
     */
    constructor(options = {}) {
        const { id, container, onClose } = options;
        this.id = id || `card-${Date.now()}`;
        this.container = container;
        this.onClose = onClose || (() => {});
        this.element = null;
        this.closeButton = null;
        this.escKeyHandler = null;
    }

    /**
     * Create the card DOM element
     * @returns {HTMLElement} The created card element
     */
    createCardElement() {
        const card = document.createElement("div");
        card.className = "project-card";
        card.id = this.id;
        
        return card;
    }

    /**
     * Add a close button to the card
     * @param {HTMLElement} parent - Parent element to append the close button to
     */
    addCloseButton(parent) {
        const closeBtn = document.createElement("div");
        closeBtn.className = "button-close";
        closeBtn.innerHTML = '<img src="/assets/UI/close-button.png" class="button" alt="close project button"/>';
        
        closeBtn.addEventListener("click", () => this.close());
        
        parent.appendChild(closeBtn);
        this.closeButton = closeBtn;
    }

    /**
     * Add ESC key handler for closing the card
     */
    addEscKeyHandler() {
        this.escKeyHandler = (event) => {
            if (event.key === "Escape" && this.element && this.element.parentNode) {
                this.close();
                this.removeEscKeyHandler();
            }
        };
        
        document.addEventListener("keydown", this.escKeyHandler);
    }

    /**
     * Remove the ESC key handler
     */
    removeEscKeyHandler() {
        if (this.escKeyHandler) {
            document.removeEventListener("keydown", this.escKeyHandler);
            this.escKeyHandler = null;
        }
    }

    /**
     * Create and render the card to the container
     * @returns {HTMLElement} The rendered card element
     */
    render() {
        if (!this.container) {
            console.error("No container provided for card rendering");
            return null;
        }

        this.element = this.createCardElement();
        this.container.appendChild(this.element);
        this.addEscKeyHandler();
        this.open();
        
        return this.element;
    }

    /**
     * Animate the card opening
     */
    open() {
        const navbar = document.querySelector(".navbar");
        const blur = document.getElementById("blur");

        // Pause renderer for better performance
        pauseRenderer();

        if (blur) {
            blur.classList.remove("hide");
        }

        // Initial state - positioned below
        this.element.style.transform = "translateY(100%)";
        this.element.style.opacity = "0";
        this.element.style.visibility = "hidden";

        // Hide navbar when card is open - add class first to trigger transition
        if (navbar) {
            navbar.classList.add("project-card-open");
        }

        // Force a reflow to ensure the initial state is applied
        this.element.offsetHeight;

        // Animate in
        requestAnimationFrame(() => {
            this.element.style.transform = "translateY(0)";
            this.element.style.opacity = "1";
            this.element.style.visibility = "visible";
            this.element.classList.add("show");
        });
    }

    /**
     * Animate the card closing
     */
    close() {
        const navbar = document.querySelector(".navbar");
        const blur = document.getElementById("blur");

        // Resume renderer when closing cards
        resumeRenderer();

        if (blur) {
            blur.classList.add("hide");
        }
        
        // Remove project-card-open class from navbar to trigger fade-in transition
        if (navbar) {
            navbar.classList.remove("project-card-open");
        }

        // Animate out
        this.element.style.transform = "translateY(110%)";
        this.element.classList.remove("show");

        // Wait for animation to complete before removing
        setTimeout(() => {
            this.removeEscKeyHandler();
            
            // Reset wasSelected state if needed
            if (typeof reverseSelected === "function") {
                reverseSelected();
            }
            
            // Execute the onClose callback
            this.onClose();
            
            // Remove the element if it's still in the DOM
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }, 350); // Match the CSS transition duration
    }
}

/**
 * AboutCard class for the about page
 */
export class AboutCard extends Card {
    /**
     * Create a new about card
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container to append the card to
     * @param {Object} options.content - Content for the about card
     * @param {Function} options.onClose - Callback function when card is closed
     */
    constructor(options = {}) {
        super({
            id: "about-card",
            ...options
        });
        
        this.content = options.content || {
            title: "About",
            description: ""
        };
    }

    /**
     * Create the about card element with content
     */
    createCardElement() {
        const card = super.createCardElement();
        
        // Create info div like in project card for consistent layout
        const info = document.createElement("div");
        info.className = "project-info";
        card.appendChild(info);

        const title = document.createElement("h2");
        title.className = "project-card-title text-lg column";
        title.textContent = this.content.title;
        title.style.textAlign = "center";
        info.appendChild(title);

        const description = document.createElement("div");
        description.className = "column text-sm";
        description.innerHTML = this.content.description;
        description.style.textAlign = "center";
        info.appendChild(description);

        // Add close button
        this.addCloseButton(info);
        
        return card;
    }
}

/**
 * ProjectCard class for project details
 */
export class ProjectCard extends Card {
    /**
     * Create a new project card
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container to append the card to
     * @param {Object} options.project - Project data
     * @param {Function} options.onClose - Callback function when card is closed
     */
    constructor(options = {}) {
        super({
            id: options.project?.id || `project-${Date.now()}`,
            ...options
        });
        
        this.project = options.project || {};
        this.currentSlideIndex = 0;
        this.slides = [];
    }

    /**
     * Create the project card element with content and gallery
     */
    createCardElement() {
        const card = super.createCardElement();
        
        // Create info section
        const info = document.createElement("div");
        info.className = "project-info";
        card.appendChild(info);

        // Add title
        const title = document.createElement("div");
        title.className = "project-title text-lg column";
        title.textContent = this.project.title;
        info.appendChild(title);

        // Add categories
        const categories = document.createElement("div");
        categories.className = "project-categories column text-sm";
        categories.textContent = this.project.categories.join(", ");
        info.appendChild(categories);

        // Add year
        const year = document.createElement("div");
        year.className = "project-year column text-sm";
        year.textContent = this.project.year;
        info.appendChild(year);

        // Add description
        const description = document.createElement("div");
        description.className = "project-description column text-sm";
        description.textContent = this.project.description;
        info.appendChild(description);

        // Add close button
        this.addCloseButton(info);

        // Create gallery section
        this.createGallery(card);
        
        // Handle mobile layout restructuring
        this.handleMobileLayout(card, year, description);
        
        // Add keyboard navigation
        this.setupKeyboardNavigation();
        
        return card;
    }

    /**
     * Handle mobile layout restructuring
     * @param {HTMLElement} card - Card element
     * @param {HTMLElement} year - Year element
     * @param {HTMLElement} description - Description element
     */
    handleMobileLayout(card, year, description) {
        // Check if we're on mobile (viewport width <= 768px)
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Create a container for year and description below gallery
            const infoBelowContainer = document.createElement("div");
            infoBelowContainer.className = "project-info-below";
            
            // Clone the year and description elements
            const yearClone = year.cloneNode(true);
            const descriptionClone = description.cloneNode(true);
            
            // Add cloned elements to the below container
            infoBelowContainer.appendChild(yearClone);
            infoBelowContainer.appendChild(descriptionClone);
            
            // Hide the original year and description in project-info
            year.style.display = 'none';
            description.style.display = 'none';
            
            // Append the below container to the card (after gallery)
            card.appendChild(infoBelowContainer);
        }
    }

    /**
     * Create gallery section with slides
     * @param {HTMLElement} card - Card element to append gallery to
     */
    createGallery(card) {
        // Skip if no content available
        if (!this.project.content) return;
        
        const gallery = document.createElement("div");
        gallery.className = "project-gallery";
        card.appendChild(gallery);

        const slideshowContainer = document.createElement("div");
        slideshowContainer.className = "slideshow-container";
        gallery.appendChild(slideshowContainer);

        // Add next button if there are multiple items to display
        const hasMultipleItems = 
            (this.project.content.images?.length || 0) +
            (this.project.content.videos?.length || 0) +
            (this.project.content.gifs?.length || 0) > 1;
            
        if (hasMultipleItems) {
            const nextBtn = document.createElement("div");
            nextBtn.className = "button-next button";
            nextBtn.innerHTML = '<img src="/assets/UI/next-button.png" alt="" />';
            gallery.appendChild(nextBtn);
            
            nextBtn.addEventListener("click", () => this.showNextSlide());
        }

        // Create slides
        this.createSlides(slideshowContainer);
        
        // Preload images for smoother transitions
        this.preloadImages();
    }

    /**
     * Create all slides for the gallery
     * @param {HTMLElement} container - Container element for slides
     */
    createSlides(container) {
        const { images = [], videos = [], gifs = [] } = this.project.content || {};
        
        const numSlides = images.length + videos.length + gifs.length;
        
        for (let i = 0; i < numSlides; i++) {
            const slide = document.createElement("div");
            slide.className = "slide";

            if (i < images.length) {
                slide.innerHTML = `<img src="${images[i]}" alt="" />`;
            } else if (videos.length > 0) {
                slide.innerHTML = `${videos[i - images.length]}`;
                // Handle Vimeo iframe to remove vp-center class
                this.setupVimeoIframe(slide);
            } else if (gifs.length > 0) {
                slide.innerHTML = `<img src="${gifs[i - images.length - videos.length]}" alt="" />`;
            }

            // Set initial position
            slide.style.position = "absolute";
            slide.style.top = "0";
            slide.style.left = "0";
            slide.style.transform = i === 0 ? "translateX(0)" : "translateX(100%)";

            container.appendChild(slide);
            this.slides.push(slide);
        }
    }

    /**
     * Setup Vimeo iframe to remove vp-center class from the iframe body
     * @param {HTMLElement} slide - The slide element containing the Vimeo iframe
     */
    setupVimeoIframe(slide) {
        // Wait for the iframe to be added to the DOM
        setTimeout(() => {
            const iframe = slide.querySelector('iframe[src*="player.vimeo.com"]');
            if (!iframe) return;

            // Only process if Vimeo Player API is available
            if (typeof Vimeo === 'undefined') {
                console.warn('Vimeo Player API not available');
                return;
            }

            try {
                // Create a Vimeo Player instance
                const player = new Vimeo.Player(iframe);

                // Listen for when the player is ready
                player.ready().then(() => {
                    // Inject CSS to override vp-center styles
                    this.injectVimeoStyles(iframe);
                }).catch((error) => {
                    console.warn('Vimeo player setup failed:', error);
                });

                // Also try to inject styles on play event as a fallback
                player.on('play', () => {
                    this.injectVimeoStyles(iframe);
                });

            } catch (error) {
                console.warn('Error setting up Vimeo player:', error);
            }
        }, 100);
    }

    /**
     * Inject CSS styles to override Vimeo's vp-center class
     * @param {HTMLElement} iframe - The Vimeo iframe element
     */
    injectVimeoStyles(iframe) {
        try {
            // Since we can't directly access cross-origin iframe content,
            // we'll add CSS that affects the iframe container behavior
            const style = document.createElement('style');
            style.textContent = `
                /* Override Vimeo's centering for project videos */
                .project-card .slide iframe[src*="player.vimeo.com"] {
                    object-fit: cover !important;
                    object-position: top !important;
                }
                
                /* Ensure the iframe takes full slide dimensions */
                .project-card .slide {
                    overflow: hidden;
                }
                
                .project-card .slide iframe[src*="player.vimeo.com"] {
                    width: 100% !important;
                    height: 100% !important;
                    border: none !important;
                }
            `;
            
            // Add unique identifier to avoid duplicate styles
            style.id = `vimeo-override-${this.id}`;
            
            // Remove any existing override for this card
            const existingStyle = document.getElementById(style.id);
            if (existingStyle) {
                existingStyle.remove();
            }
            
            // Add the new style to the document head
            document.head.appendChild(style);
            
        } catch (error) {
            console.warn('Error injecting Vimeo styles:', error);
        }
    }

    /**
     * Preload all images in the gallery
     */
    preloadImages() {
        const { images = [], gifs = [] } = this.project.content || {};
        
        [...images, ...gifs].forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    /**
     * Show the next slide in the gallery
     */
    showNextSlide() {
        if (this.slides.length <= 1) return;
        
        // Calculate the index of the next slide
        const nextIndex = (this.currentSlideIndex + 1) % this.slides.length;

        // Position the next slide off-screen to the right
        this.slides[nextIndex].style.transition = "none";
        this.slides[nextIndex].style.transform = "translateX(100%)";

        // Force reflow to ensure the position is set before starting animation
        this.slides[nextIndex].offsetHeight;

        // Move the current slide out to the left
        this.slides[this.currentSlideIndex].style.transition = "transform 0.3s ease-in-out";
        this.slides[this.currentSlideIndex].style.transform = "translateX(-100%)";

        // Animate the next slide in from the right
        this.slides[nextIndex].style.transition = "transform 0.3s ease-in-out";
        this.slides[nextIndex].style.transform = "translateX(0)";

        // Update the current index
        this.currentSlideIndex = nextIndex;
    }

    /**
     * Clean up Vimeo styles when the card is closed
     */
    cleanupVimeoStyles() {
        const styleElement = document.getElementById(`vimeo-override-${this.id}`);
        if (styleElement) {
            styleElement.remove();
        }
    }

    /**
     * Set up keyboard navigation for the card
     */
    setupKeyboardNavigation() {
        const keyHandler = (e) => {
            if (e.key === "ArrowRight") {
                this.showNextSlide();
            }
        };
        
        document.addEventListener("keydown", keyHandler);
        
        // Store the handler for cleanup
        this._keyboardHandler = keyHandler;
        
        // Make sure to clean up when the card is closed
        const originalOnClose = this.onClose;
        this.onClose = () => {
            document.removeEventListener("keydown", this._keyboardHandler);
            // Clean up Vimeo styles
            this.cleanupVimeoStyles();
            if (originalOnClose) originalOnClose();
        };
    }
} 