import { pauseRenderer, resumeRenderer, detectMediaType, isMobileDevice } from "./utils";
import { reverseSelected, wasSelected } from "../main";
import { disableCanvasInteractions, enableCanvasInteractions } from "./dragControl";

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
     * Add click outside handler for closing the card
     */
    addClickOutsideHandler() {
        this.clickOutsideHandler = (event) => {
            if (this.element && this.element.parentNode && !this.element.contains(event.target)) {
                this.close();
                this.removeClickOutsideHandler();
            }
        };

        // Use a small delay to prevent immediate closing when opening
        setTimeout(() => {
            document.addEventListener("click", this.clickOutsideHandler);
            // Add touchstart event for mobile devices
            document.addEventListener("touchstart", this.clickOutsideHandler, { passive: true });
        }, 100);
    }

    /**
     * Remove the click outside handler
     */
    removeClickOutsideHandler() {
        if (this.clickOutsideHandler) {
            document.removeEventListener("click", this.clickOutsideHandler);
            document.removeEventListener("touchstart", this.clickOutsideHandler);
            this.clickOutsideHandler = null;
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
        this.addClickOutsideHandler();
        this.open();

        return this.element;
    }

    /**
     * Generate a random rotation between -1.5 and 1.5 degrees
     * @returns {number} Random rotation value
     */
    generateRandomRotation() {
        return Math.random() * 3 - 1.5;
    }

    /**
     * Animate the card opening
     */
    open() {
        const navbar = document.querySelector(".navbar");
        const blur = document.getElementById("blur");

        // Pause renderer for better performance
        pauseRenderer();

        // Disable canvas interactions when card opens
        disableCanvasInteractions();

        if (blur) {
            blur.classList.remove("hide");
        }

        // Handle different card types for animation
        const isAboutCard = this.element.classList.contains("about-card");

        if (isAboutCard) {
            // About card uses CSS transforms for centering, so we clear inline styles
            this.element.style.transform = "";
            this.element.style.visibility = "hidden";
        } else {
            // Project card uses inline transforms
            this.element.style.transform = "translateY(110%)";
            this.element.style.opacity = "0";
            this.element.style.visibility = "hidden";
        }

        // Hide navbars when card is open - add class first to trigger transition
        if (navbar) {
            navbar.classList.add("navbar-hide");
        }

        const navbarBottom = document.querySelector(".navbar-bottom");
        if (navbarBottom) {
            navbarBottom.classList.add("navbar-hide");
        }

        // Force a reflow to ensure the initial state is applied
        this.element.offsetHeight;

        // Animate in
        requestAnimationFrame(() => {
            if (isAboutCard) {
                // About card: generate random rotation
                const randomRotation = this.generateRandomRotation();
                this.element.style.transform = `translate(-50%, -50%) rotate(${randomRotation}deg)`;
                this.element.style.opacity = "1";
                this.element.style.visibility = "visible";
            } else {
                // Project card uses inline transforms
                this.element.style.transform = "translateY(0)";
                this.element.style.opacity = "1";
                this.element.style.visibility = "visible";
            }
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

        // Re-enable canvas interactions when card closes
        enableCanvasInteractions();

        if (blur) {
            blur.classList.add("hide");
        }

        // Remove navbar-hide class from both navbars to trigger fade-in transition
        if (navbar) {
            navbar.classList.remove("navbar-hide");
        }

        const navbarBottom = document.querySelector(".navbar-bottom");
        if (navbarBottom) {
            navbarBottom.classList.remove("navbar-hide");
        }

        // Handle different card types for closing animation
        const isAboutCard = this.element.classList.contains("about-card");

        if (isAboutCard) {
            // About card: fade out and slide down
            this.element.style.transition = "transform 0.35s ease-in-out, opacity 0.35s ease-in-out";
            this.element.style.transform = "translate(-50%, 110%) rotate(0deg)";
            this.element.style.opacity = "0";
            this.element.classList.remove("show");
        } else {
            // Project card: fade out and slide down
            this.element.style.transition = "transform 0.35s ease-in-out, opacity 0.35s ease-in-out";
            this.element.style.transform = "translateY(110%)";
            this.element.style.opacity = "0";
            this.element.classList.remove("show");
        }

        // Wait for animation to complete before removing
        setTimeout(() => {
            this.removeEscKeyHandler();
            this.removeClickOutsideHandler();

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

    /**
     * Setup external links to open in new tabs with security attributes
     * @param {HTMLElement} container - Container element to search for external links
     */
    setupExternalLinks(container) {
        // Find all links with the external-link class
        const externalLinks = container.querySelectorAll("a.external-link");

        externalLinks.forEach((link) => {
            // Add target="_blank" to open in new tab
            link.setAttribute("target", "_blank");

            // Add security attributes for external links
            link.setAttribute("rel", "noopener noreferrer");

            // Optional: Add visual indicator that link opens in new tab
            if (!link.getAttribute("title")) {
                link.setAttribute("title", "Opens in new tab");
            }
        });

        // Also setup any links that might not have the external-link class but are external
        const allLinks = container.querySelectorAll("a[href]");
        allLinks.forEach((link) => {
            const href = link.getAttribute("href");

            // Check if it's an external link (starts with http/https and not current domain)
            if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
                const currentDomain = window.location.hostname;
                const linkDomain = new URL(href).hostname;

                // If it's a different domain, treat as external
                if (linkDomain !== currentDomain) {
                    link.setAttribute("target", "_blank");
                    link.setAttribute("rel", "noopener noreferrer");

                    if (!link.getAttribute("title")) {
                        link.setAttribute("title", "Opens in new tab");
                    }
                }
            }
        });
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
            ...options,
        });

        this.content = options.content || {
            title: "About",
            description: "",
            externalLinks: [
                {
                    title: "CV",
                    url: "/assets/files/08.08.2025_CV_Bogdan-Nastase.pdf",
                },
                {
                    title: "Instagram",
                    url: "https://www.instagram.com/your-instagram",
                },
                {
                    title: "LinkedIn",
                    url: "https://www.linkedin.com/in/your-linkedin",
                },
                {},
            ],
        };

        // Touch/swipe handling for mobile
        this.cardTouchStartY = 0;
        this.cardTouchStartX = 0;
        this.isSwipingDown = false;
        this.minSwipeDistance = 50;
    }

    /**
     * Create the about card element with content
     */
    createCardElement() {
        const card = document.createElement("div");
        card.id = this.id;
        card.classList.add("about-card"); // Only add about-card class

        // Create info div
        const info = document.createElement("div");
        info.className = "about-card-info";
        card.appendChild(info);

        // Create title
        const title = document.createElement("div");
        title.className = "about-card-title text-lg";
        title.textContent = this.content.title;

        // Create description with two-column layout
        const description = document.createElement("div");
        description.className = "about-card-description text-sm";

        // Add the main description content first (full width)
        const descriptionContent = document.createElement("div");
        descriptionContent.innerHTML = this.content.description;
        description.appendChild(descriptionContent);

        // Create the two-column links section
        const linksGrid = document.createElement("div");
        linksGrid.className = "text-sm about-card-links-grid";
        linksGrid.id = "links-grid";
        description.appendChild(linksGrid);

        // Column 1: Email and Phone
        const column1 = document.createElement("div");
        column1.id = "column-1";
        column1.className = "about-card-column";

        // Add email
        const email = document.createElement("div");
        email.innerHTML = '<a href="mailto:cbogdan.nastase@gmail.com" class="external-link">cbogdan.nastase@gmail.com</a>';
        column1.appendChild(email);

        // Add phone number
        const phone = document.createElement("div");
        phone.innerHTML = ' <a href="tel:+31615184195" class="external-link">+31 (0) 615 184 195</a>';
        column1.appendChild(phone);

        // Column 2: Social links and CV
        const column2 = document.createElement("div");
        column2.id = "column-2";
        column2.className = "about-card-column";

        // Add social media links and CV as comma-separated
        const socialLinks = document.createElement("div");
        socialLinks.innerHTML =
            '<a href="https://www.linkedin.com/in/cbogdann/" class="external-link">LinkedIn</a>, <a href="https://www.instagram.com/__bogdan__n/" class="external-link">Instagram</a>, <a href="/assets/files/08.08.2025_CV_Bogdan-Nastase.pdf" class="external-link">CV</a>';
        column2.appendChild(socialLinks);

        // Add columns to links grid
        linksGrid.appendChild(column1);
        linksGrid.appendChild(column2);

        // Setup external links to open in new tabs (inherited from base Card class)
        this.setupExternalLinks(description);

        // Append elements
        info.appendChild(title);
        info.appendChild(description);

        // Add close button to the info div
        this.addCloseButton(info);

        return card;
    }

    /**
     * Override the base render method to set up touch handling after rendering
     */
    render() {
        // Call the parent render method first
        const result = super.render();

        // Set up touch handling only on mobile devices
        if (this.element && isMobileDevice()) {
            // Use a small delay to ensure DOM is fully ready
            setTimeout(() => {
                this.setupAboutCardTouchHandling();
            }, 50);
        }

        return result;
    }

    /**
     * Set up touch/swipe handling for about card closing
     */
    setupAboutCardTouchHandling() {
        if (!this.element) {
            console.warn("AboutCard element not yet created, skipping touch handling setup");
            return;
        }

        // Touch handlers for entire card (vertical swipes for closing)
        this.element.addEventListener(
            "touchstart",
            (e) => {
                this.handleCardTouchStart(e);
            },
            { passive: true }
        );

        this.element.addEventListener(
            "touchmove",
            (e) => {
                this.handleCardTouchMove(e);
            },
            { passive: false }
        );

        this.element.addEventListener(
            "touchend",
            (e) => {
                this.handleCardTouchEnd(e);
            },
            { passive: true }
        );
    }

    /**
     * Handle touch start event for card (vertical swipes for closing)
     * @param {TouchEvent} e - Touch event
     */
    handleCardTouchStart(e) {
        try {
            if (!e.touches || e.touches.length === 0) return;

            // Store touch position for card-level swipe detection
            this.cardTouchStartY = e.touches[0].clientY;
            this.cardTouchStartX = e.touches[0].clientX;
            this.isSwipingDown = false;
        } catch (error) {
            console.warn("Error handling about card touch start:", error);
        }
    }

    /**
     * Handle touch move event for card (vertical swipes for closing)
     * @param {TouchEvent} e - Touch event
     */
    handleCardTouchMove(e) {
        try {
            if (!this.cardTouchStartY || !this.cardTouchStartX || !e.touches || e.touches.length === 0) return;

            const currentY = e.touches[0].clientY;
            const currentX = e.touches[0].clientX;

            const deltaY = currentY - this.cardTouchStartY;
            const deltaX = Math.abs(currentX - this.cardTouchStartX);

            // Check if this is a vertical swipe down (more vertical than horizontal movement)
            if (Math.abs(deltaY) > deltaX && deltaY > 20) {
                this.isSwipingDown = true;

                // Create visual feedback for swipe down
                const cardElement = this.element;
                if (cardElement && deltaY > 0) {
                    // Only allow downward swipes
                    const swipeProgress = Math.min(deltaY / 150, 1); // Normalize to 0-1 over 150px

                    // Apply transform and opacity changes
                    cardElement.style.transition = "none";
                    cardElement.style.transform = `translate(-50%, -50%) translateY(${deltaY * 0.5}px)`;
                    cardElement.style.opacity = `${1 - swipeProgress * 0.3}`; // Fade slightly

                    // Prevent default to avoid page scrolling during swipe
                    e.preventDefault();
                }
            }
        } catch (error) {
            console.warn("Error handling about card touch move:", error);
        }
    }

    /**
     * Handle touch end event for card (vertical swipes for closing)
     * @param {TouchEvent} e - Touch event
     */
    handleCardTouchEnd(e) {
        try {
            if (!this.isSwipingDown) {
                // Reset card position if no swipe was detected
                this.resetAboutCardPosition();
                return;
            }

            const deltaY = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0) - this.cardTouchStartY;

            // Check if swipe down distance is sufficient to close the card
            if (deltaY > this.minSwipeDistance) {
                // Close the card
                this.close();
            } else {
                // Swipe not sufficient, animate back to original position
                this.resetAboutCardPosition();
            }

            // Reset touch state
            this.cardTouchStartY = 0;
            this.cardTouchStartX = 0;
            this.isSwipingDown = false;
        } catch (error) {
            console.warn("Error handling about card touch end:", error);
            // Reset touch state and card position on error
            this.cardTouchStartY = 0;
            this.cardTouchStartX = 0;
            this.isSwipingDown = false;
            this.resetAboutCardPosition();
        }
    }

    /**
     * Reset about card position to original state
     */
    resetAboutCardPosition() {
        try {
            const cardElement = this.element;
            if (cardElement) {
                cardElement.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
                cardElement.style.transform = "translate(-50%, -50%)";
                cardElement.style.opacity = "1";

                // Clear transition after animation completes
                setTimeout(() => {
                    if (cardElement) {
                        cardElement.style.transition = "";
                    }
                }, 300);
            }
        } catch (error) {
            console.warn("Error resetting about card position:", error);
        }
    }
}

/**
 * Create a styled video element using player.style
 * @param {string} videoSrc - Video source URL
 * @param {Object} options - Video options
 * @returns {HTMLElement} - The styled video container element
 */
function createStyledVideo(videoSrc, options = {}) {
    const { controls = false, preload = "none", playsinline = true, muted = true, autoplay = false, controlsList = "nodownload" } = options;

    const template = document.createElement("template");
    template.innerHTML = `
        <media-theme-microvideo style="width: 100%; height: 100%;">
            <video
                slot="media"
                src="${videoSrc}"
                ${controls ? "controls" : ""}
                preload="${preload}"
                ${playsinline ? "playsinline" : ""}
                ${muted ? "muted" : ""}
                ${autoplay ? "autoplay" : ""}
                controlsList="${controlsList}"
                style="width: 100%; height: 100%; object-fit: contain;"
            ></video>
        </media-theme-microvideo>
    `;

    return template.content.cloneNode(true);
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
            ...options,
        });

        this.project = options.project || {};
        this.currentSlideIndex = 0;
        this.currentPosition = 0; // Track actual position in infinite carousel
        this.totalSlides = 0; // Number of original slides (not including duplicates)
        this.slides = [];
        this.intersectionObserver = null;

        // Touch/swipe handling for mobile
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50; // Minimum distance for a swipe
        this.isSwiping = false;
        this.isSwipingDown = false; // Track vertical swipe for card closing
        this.cardTouchStartY = 0;
        this.cardTouchStartX = 0;
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

        // Create title-group
        const titleGroup = document.createElement("div");
        titleGroup.className = "title-group column";

        // Add title
        const title = document.createElement("div");
        title.className = "project-title text-lg";
        title.textContent = this.project.title;
        titleGroup.appendChild(title);

        // Add categories
        const categories = document.createElement("div");
        categories.className = "project-categories text-sm";
        categories.textContent = this.project.categories.join(", ");
        titleGroup.appendChild(categories);

        // Add title-group to info
        info.appendChild(titleGroup);

        // Add client column
        const clientColumn = document.createElement("div");
        clientColumn.className = "project-client column text-sm";
        clientColumn.textContent = this.project.client || "N/A";
        info.appendChild(clientColumn);

        // Add year
        const year = document.createElement("div");
        year.className = "project-year column text-sm";
        year.textContent = this.project.year;
        info.appendChild(year);

        // Add description
        const description = document.createElement("div");
        description.className = "project-description column text-sm";

        // Handle new description format with HTML content
        if (this.project.content && this.project.content.description) {
            // Render HTML content from the description array
            this.project.content.description.forEach((item) => {
                if (item.type === "paragraph" && item.html) {
                    description.innerHTML += item.html;
                }
            });

            // Setup external links to open in new tabs (inherited from base Card class)
            this.setupExternalLinks(description);
        } else {
            // Fallback to old format
            description.textContent = this.project.description;
        }

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
            // Get the client element from project-info
            const clientElement = card.querySelector(".project-client");

            // Create a container for client-year and description
            const infoBelowContainer = document.createElement("div");
            infoBelowContainer.className = "project-info-below";

            // Create client-year parent div
            const clientYearDiv = document.createElement("div");
            clientYearDiv.className = "project-client-year text-sm";

            // Combine client and year with comma separator
            const clientText = clientElement ? clientElement.textContent : "N/A";
            const yearText = year.textContent;
            clientYearDiv.innerHTML = `${clientText}, ${yearText}`;

            // Clone the description element
            const descriptionClone = description.cloneNode(true);

            // Add client-year div and description to the below container
            infoBelowContainer.appendChild(clientYearDiv);
            infoBelowContainer.appendChild(descriptionClone);

            // Hide the original client, year and description in project-info
            if (clientElement) clientElement.style.display = "none";
            year.style.display = "none";
            description.style.display = "none";

            // Find the gallery container and append the info below the slideshow
            const gallery = card.querySelector(".project-gallery");
            if (gallery) {
                gallery.appendChild(infoBelowContainer);
            }

            // Note: Slide positioning is now handled in createSlides method
            // The current slide (index 0) will be static for container sizing
            // Other slides will be absolutely positioned

            // Move next button directly to the project card for mobile
            const nextButton = card.querySelector(".button-next");

            if (nextButton) {
                // Remove from gallery and append to card
                nextButton.remove();
                card.appendChild(nextButton);

                // Set positioning
                nextButton.style.position = "absolute";
                nextButton.style.bottom = "16px";
                nextButton.style.right = "16px";
                nextButton.style.top = "auto";
                nextButton.style.marginTop = "0";
            }
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
        const { images = [], videos = [], gifs = [], media = [] } = this.project.content || {};

        let hasMultipleItems = false;

        if (media && media.length > 0) {
            // Use new media array
            hasMultipleItems = media.length > 1;
        } else {
            // Fall back to old structure
            hasMultipleItems = images.length + videos.length + gifs.length > 1;
        }

        if (hasMultipleItems) {
            // Add next button only
            const nextBtn = document.createElement("div");
            nextBtn.className = "button-next button";
            nextBtn.innerHTML = '<img src="/assets/UI/next-button.png" alt="" />';
            gallery.appendChild(nextBtn);

            nextBtn.addEventListener("click", () => this.showNextSlide());
        }

        // Create slides
        this.createSlides(slideshowContainer);

        // Set up intersection observer for video visibility
        this.setupIntersectionObserver();

        // Progressive media loading - only load media when project is opened
        this.preloadProjectMedia();

        // Note: Touch handling will be set up after the card is rendered
    }

    /**
     * Complete the swipe animation to the next or previous slide
     * @param {boolean} isNext - Whether to go to next slide (true) or previous (false)
     */
    completeSwipeAnimation(isNext) {
        try {
            if (!this.slides || this.slides.length <= 1) return;

            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                // Mobile uses different logic
                if (isNext) {
                    this.showNextSlideMobile();
                } else {
                    this.showPreviousSlideMobile();
                }
            } else {
                // Desktop uses the infinite carousel
                if (isNext) {
                    this.showNextSlideDesktop();
                } else {
                    this.showPreviousSlide();
                }
            }
        } catch (error) {
            console.warn("Error completing swipe animation:", error);
        }
    }

    /**
     * Show previous slide on mobile using absolute positioning
     */
    showPreviousSlideMobile() {
        const currentSlide = this.slides[this.currentSlideIndex];
        const prevIndex = this.currentSlideIndex === 0 ? this.totalSlides - 1 : this.currentSlideIndex - 1;
        const prevSlide = this.slides[prevIndex];

        if (!currentSlide || !prevSlide) return;

        // Position previous slide off-screen to the left
        prevSlide.style.position = "absolute";
        prevSlide.style.top = "0";
        prevSlide.style.left = "0";
        prevSlide.style.width = "100%";
        prevSlide.style.height = "auto";
        prevSlide.style.transform = "translateX(-100%)";
        prevSlide.style.zIndex = "2";

        // Force reflow
        prevSlide.offsetHeight;

        // Animate current slide out to the right and previous slide in
        currentSlide.style.transform = "translateX(100%)";
        currentSlide.style.zIndex = "1";
        prevSlide.style.transform = "translateX(0%)";

        // Update current index
        this.currentSlideIndex = prevIndex;

        // After animation, make previous slide static for container sizing
        setTimeout(() => {
            if (prevSlide) {
                prevSlide.style.position = "static";
                prevSlide.style.top = "auto";
                prevSlide.style.left = "auto";
                prevSlide.style.transform = "translateX(0%)";
            }
            if (currentSlide) {
                currentSlide.style.position = "absolute";
                currentSlide.style.top = "0";
                currentSlide.style.left = "0";
                currentSlide.style.transform = "translateX(100%)";
            }
        }, 300);

        // Handle video playback
        this.handleVideoPlayback();
    }

    /**
     * Show the previous slide in the gallery (desktop)
     */
    showPreviousSlide() {
        try {
            if (!this.slides || this.slides.length <= 1) return;

            const slideGroup = this.element.querySelector(".slide-group");
            if (!slideGroup) return;

            // Initialize the current position if not set
            if (this.currentPosition === undefined) {
                this.currentPosition = 0;
            }

            // Move to previous position
            this.currentPosition--;

            // If we go below 0, jump to the end of duplicates
            if (this.currentPosition < 0) {
                slideGroup.style.transition = "none";
                this.currentPosition = this.totalSlides - 1;
                slideGroup.style.transform = `translateX(-${this.currentPosition * 100}%)`;

                // Re-enable transition
                setTimeout(() => {
                    slideGroup.style.transition = "transform 0.3s ease-in-out";
                }, 50);
            } else {
                // Normal previous slide
                slideGroup.style.transform = `translateX(-${this.currentPosition * 100}%)`;
            }

            // Update the logical slide index for video handling
            this.currentSlideIndex = this.currentPosition % this.totalSlides;

            // Handle video pause/play
            this.handleVideoPlayback();
        } catch (error) {
            console.warn("Error showing previous slide:", error);
        }
    }

    /**
     * Snap back to current slide when swipe is insufficient
     */
    snapBackToCurrentSlide() {
        try {
            if (!this.slides || this.slides.length <= 1) return;

            const currentSlide = this.slides[this.currentSlideIndex];
            const nextSlide = this.slides[(this.currentSlideIndex + 1) % this.slides.length];
            const prevSlide = this.slides[this.currentSlideIndex === 0 ? this.slides.length - 1 : this.currentSlideIndex - 1];

            if (!currentSlide) return;

            // Animate current slide back to center
            currentSlide.style.transition = "transform 0.3s ease-out";
            currentSlide.style.transform = "translateX(0)";

            // Reset other slides
            if (nextSlide) {
                nextSlide.style.transition = "transform 0.3s ease-out";
                nextSlide.style.transform = "translateX(100%)";
            }

            if (prevSlide) {
                prevSlide.style.transition = "transform 0.3s ease-out";
                prevSlide.style.transform = "translateX(-100%)";
            }
        } catch (error) {
            console.warn("Error snapping back to current slide:", error);
        }
    }

    /**
     * Create animated pull effect during swipe
     * @param {number} deltaX - Horizontal swipe distance
     */
    createPullEffect(deltaX) {
        try {
            if (!this.slides || this.slides.length <= 1) return;

            const currentSlide = this.slides[this.currentSlideIndex];
            const nextSlide = this.slides[(this.currentSlideIndex + 1) % this.slides.length];

            if (!currentSlide || !nextSlide) return;

            // Calculate swipe progress (0 to 1)
            const swipeProgress = Math.min(Math.abs(deltaX) / 100, 1);

            // Apply transform to current slide (slide out)
            currentSlide.style.transition = "none";
            currentSlide.style.transform = `translateX(-${deltaX * 0.3}px)`;

            // Apply transform to next slide (slide in)
            nextSlide.style.transition = "none";
            nextSlide.style.transform = `translateX(${100 - deltaX * 0.3}%)`;

            // Remove opacity effects - use only transform for clean slide transition
        } catch (error) {
            console.warn("Error creating pull effect:", error);
        }
    }

    /**
     * Set up touch/swipe handling for mobile gallery and card closing
     */
    setupTouchHandling() {
        if (!this.element) {
            console.warn("ProjectCard element not yet created, skipping touch handling setup");
            return;
        }

        const slideshowContainer = this.element.querySelector(".slideshow-container");
        if (slideshowContainer) {
            // Touch handlers for slideshow (horizontal swipes)
            slideshowContainer.addEventListener(
                "touchstart",
                (e) => {
                    this.handleSlideshowTouchStart(e);
                },
                { passive: true }
            );

            slideshowContainer.addEventListener(
                "touchmove",
                (e) => {
                    this.handleSlideshowTouchMove(e);
                },
                { passive: false }
            );

            slideshowContainer.addEventListener(
                "touchend",
                (e) => {
                    this.handleSlideshowTouchEnd(e);
                },
                { passive: true }
            );
        }

        // Touch handlers for entire card (vertical swipes for closing)
        this.element.addEventListener(
            "touchstart",
            (e) => {
                this.handleCardTouchStart(e);
            },
            { passive: true }
        );

        this.element.addEventListener(
            "touchmove",
            (e) => {
                this.handleCardTouchMove(e);
            },
            { passive: false }
        );

        this.element.addEventListener(
            "touchend",
            (e) => {
                this.handleCardTouchEnd(e);
            },
            { passive: true }
        );
    }

    /**
     * Handle touch start event for slideshow (horizontal swipes)
     * @param {TouchEvent} e - Touch event
     */
    handleSlideshowTouchStart(e) {
        try {
            if (!e.touches || e.touches.length === 0) return;

            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.isSwiping = false;
        } catch (error) {
            console.warn("Error handling slideshow touch start:", error);
        }
    }

    /**
     * Handle touch start event for card (vertical swipes for closing)
     * @param {TouchEvent} e - Touch event
     */
    handleCardTouchStart(e) {
        try {
            if (!e.touches || e.touches.length === 0) return;

            // Store touch position for card-level swipe detection
            this.cardTouchStartY = e.touches[0].clientY;
            this.cardTouchStartX = e.touches[0].clientX;
            this.isSwipingDown = false;
        } catch (error) {
            console.warn("Error handling card touch start:", error);
        }
    }

    /**
     * Handle touch move event for slideshow (horizontal swipes)
     * @param {TouchEvent} e - Touch event
     */
    handleSlideshowTouchMove(e) {
        try {
            if (!this.touchStartX || !this.touchStartY || !e.touches || e.touches.length === 0) return;

            this.touchEndX = e.touches[0].clientX;
            this.touchEndY = e.touches[0].clientY;

            const deltaX = this.touchStartX - this.touchEndX;
            const deltaY = this.touchStartY - this.touchEndY;

            // Check if this is a horizontal swipe (more horizontal than vertical movement)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                this.isSwiping = true;

                // Create animated pull effect during swipe
                this.createPullEffect(deltaX);

                // Add visual feedback class
                const slideshowContainer = this.element.querySelector(".slideshow-container");
                if (slideshowContainer) {
                    slideshowContainer.classList.add("swiping");
                }
                // Prevent default to avoid page scrolling during swipe
                e.preventDefault();
            }
        } catch (error) {
            console.warn("Error handling slideshow touch move:", error);
        }
    }

    /**
     * Handle touch move event for card (vertical swipes for closing)
     * @param {TouchEvent} e - Touch event
     */
    handleCardTouchMove(e) {
        try {
            if (!this.cardTouchStartY || !this.cardTouchStartX || !e.touches || e.touches.length === 0) return;

            const currentY = e.touches[0].clientY;
            const currentX = e.touches[0].clientX;

            const deltaY = currentY - this.cardTouchStartY;
            const deltaX = Math.abs(currentX - this.cardTouchStartX);

            // Check if this is a vertical swipe down (more vertical than horizontal movement)
            if (Math.abs(deltaY) > deltaX && deltaY > 20) {
                this.isSwipingDown = true;

                // Create visual feedback for swipe down
                const cardElement = this.element;
                if (cardElement && deltaY > 0) {
                    // Only allow downward swipes
                    const swipeProgress = Math.min(deltaY / 150, 1); // Normalize to 0-1 over 150px

                    // Apply transform and opacity changes
                    cardElement.style.transition = "none";
                    cardElement.style.transform = `translateY(${deltaY * 0.5}px)`;
                    cardElement.style.opacity = `${1 - swipeProgress * 0.3}`; // Fade slightly

                    // Prevent default to avoid page scrolling during swipe
                    e.preventDefault();
                }
            }
        } catch (error) {
            console.warn("Error handling card touch move:", error);
        }
    }

    /**
     * Handle touch end event for slideshow (horizontal swipes)
     * @param {TouchEvent} e - Touch event
     */
    handleSlideshowTouchEnd(e) {
        try {
            if (!this.isSwiping) return;

            const deltaX = this.touchStartX - this.touchEndX;
            const deltaY = this.touchStartY - this.touchEndY;

            // Check if swipe distance is sufficient
            if (Math.abs(deltaX) > this.minSwipeDistance) {
                if (deltaX > 0) {
                    // Swipe left - go to next slide with animation
                    this.completeSwipeAnimation(true);
                } else {
                    // Swipe right - go to previous slide with animation
                    this.completeSwipeAnimation(false);
                }
            } else {
                // Swipe not sufficient, snap back to current slide
                this.snapBackToCurrentSlide();
            }

            // Reset touch state
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchEndX = 0;
            this.touchEndY = 0;
            this.isSwiping = false;

            // Remove swiping visual feedback
            const slideshowContainer = this.element.querySelector(".slideshow-container");
            if (slideshowContainer) {
                slideshowContainer.classList.remove("swiping");
            }
        } catch (error) {
            console.warn("Error handling slideshow touch end:", error);
            // Reset touch state on error
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchEndX = 0;
            this.touchEndY = 0;
            this.isSwiping = false;
        }
    }

    /**
     * Handle touch end event for card (vertical swipes for closing)
     * @param {TouchEvent} e - Touch event
     */
    handleCardTouchEnd(e) {
        try {
            if (!this.isSwipingDown) {
                // Reset card position if no swipe was detected
                this.resetCardPosition();
                return;
            }

            const deltaY = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0) - this.cardTouchStartY;

            // Check if swipe down distance is sufficient to close the card
            if (deltaY > this.minSwipeDistance) {
                // Close the card
                this.close();
            } else {
                // Swipe not sufficient, animate back to original position
                this.resetCardPosition();
            }

            // Reset touch state
            this.cardTouchStartY = 0;
            this.cardTouchStartX = 0;
            this.isSwipingDown = false;
        } catch (error) {
            console.warn("Error handling card touch end:", error);
            // Reset touch state and card position on error
            this.cardTouchStartY = 0;
            this.cardTouchStartX = 0;
            this.isSwipingDown = false;
            this.resetCardPosition();
        }
    }

    /**
     * Reset card position to original state
     */
    resetCardPosition() {
        try {
            const cardElement = this.element;
            if (cardElement) {
                cardElement.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
                cardElement.style.transform = "translateY(0)";
                cardElement.style.opacity = "1";

                // Clear transition after animation completes
                setTimeout(() => {
                    if (cardElement) {
                        cardElement.style.transition = "";
                    }
                }, 300);
            }
        } catch (error) {
            console.warn("Error resetting card position:", error);
        }
    }

    /**
     * Override the base render method to set up touch handling after rendering
     */
    render() {
        // Call the parent render method first
        const result = super.render();

        // Set up touch handling only on mobile devices
        if (this.element && isMobileDevice()) {
            // Use a small delay to ensure DOM is fully ready
            setTimeout(() => {
                this.setupTouchHandling();
            }, 50);
        }

        return result;
    }

    /**
     * Create all slides for the gallery
     * @param {HTMLElement} container - Container element for slides
     */
    createSlides(container) {
        const { images = [], videos = [], gifs = [], media = [] } = this.project.content || {};

        // Use new media array if available, otherwise fall back to old structure
        let mediaItems = [];

        if (media && media.length > 0) {
            // Use the new media array with custom ordering
            mediaItems = media.map((item) => {
                // Handle both string and object formats
                if (typeof item === "string") {
                    return {
                        path: item,
                        type: detectMediaType(item),
                        thumbnail: null,
                    };
                } else {
                    return {
                        path: item.path,
                        type: detectMediaType(item.path),
                        thumbnail: item.thumbnail || null,
                    };
                }
            });
        } else {
            // Fall back to old structure: images first, then videos, then gifs
            const imageItems = images.map((img) => ({ path: img, type: "image" }));
            const videoItems = videos.map((video) => ({ path: video, type: detectMediaType(video) }));
            const gifItems = gifs.map((gif) => ({ path: gif, type: "gif" }));
            mediaItems = [...imageItems, ...videoItems, ...gifItems];
        }

        this.mediaItems = mediaItems;
        const numSlides = mediaItems.length;
        const isMobile = window.innerWidth <= 768;

        // Clear existing slides
        this.slides = [];
        container.innerHTML = "";

        if (isMobile) {
            // Mobile: Use absolute positioning approach with one static slide for container sizing
            container.className = "slideshow-container mobile";
            this.currentSlideIndex = 0;
            this.totalSlides = numSlides;

            // Create slides with absolute positioning
            for (let i = 0; i < numSlides; i++) {
                const slide = document.createElement("div");
                slide.className = "slide";
                slide.dataset.index = i;
                const mediaItem = mediaItems[i];

                this.createSlideContent(slide, mediaItem);

                // First slide is static to provide container dimensions, others are absolute
                if (i === 0) {
                    slide.style.position = "static";
                    slide.style.width = "100%";
                    slide.style.height = "auto";
                    slide.style.transform = "translateX(0%)";
                    slide.style.zIndex = "2";
                } else {
                    slide.style.position = "absolute";
                    slide.style.top = "0";
                    slide.style.left = "0";
                    slide.style.width = "100%";
                    slide.style.height = "auto";
                    slide.style.transform = "translateX(100%)";
                    slide.style.zIndex = "1";
                }
                slide.style.transition = "transform 0.3s ease-in-out";

                container.appendChild(slide);
                this.slides.push(slide);
            }
        } else {
            // Desktop: Use flexbox with infinite scroll
            container.className = "slideshow-container desktop";
            this.currentPosition = 0;
            this.totalSlides = numSlides;

            const slideGroup = document.createElement("div");
            slideGroup.className = "slide-group";

            // Create original slides
            for (let i = 0; i < numSlides; i++) {
                const slide = document.createElement("div");
                slide.className = "slide";
                const mediaItem = mediaItems[i];

                this.createSlideContent(slide, mediaItem);
                slideGroup.appendChild(slide);
                this.slides.push(slide);
            }

            // Duplicate ALL slides for infinite effect
            for (let i = 0; i < numSlides; i++) {
                const slide = document.createElement("div");
                slide.className = "slide";
                slide.setAttribute("aria-hidden", "true");
                const mediaItem = mediaItems[i];

                this.createSlideContent(slide, mediaItem);
                slideGroup.appendChild(slide);
            }

            container.appendChild(slideGroup);
        }
    }

    /**
     * Create content for a slide
     * @param {HTMLElement} slide - The slide element
     * @param {Object} mediaItem - Media item data
     */
    createSlideContent(slide, mediaItem) {
        switch (mediaItem.type) {
            case "image":
            case "gif":
                slide.innerHTML = `<img src="${mediaItem.path}" alt="" />`;
                break;

            case "video":
                if (mediaItem.thumbnail) {
                    // Create initial thumbnail image that will be replaced by video when clicked
                    slide.innerHTML = `
                        <div class="video-container" data-video-src="${mediaItem.path}">
                            <img src="${mediaItem.thumbnail}" alt="Video thumbnail" class="video-thumbnail" />
                            <div class="video-play-button"><span id="video-play-icon">▶</span></div>
                        </div>
                    `;
                    this.setupVideoThumbnailClick(slide);
                } else {
                    // No thumbnail provided, show styled video directly
                    const styledVideo = createStyledVideo(mediaItem.path);
                    slide.appendChild(styledVideo);
                    this.setupVideoOptimization(slide);
                }
                break;

            case "audio":
                slide.innerHTML = `
                    <media-theme-microvideo style="width: 100%">
                        <audio
                            slot="media"
                            src="${mediaItem.path}"
                            playsinline
                            crossorigin="anonymous"
                        ></audio>
                    </media-theme-microvideo>
                `;
                break;

            default:
                // Fallback to image for unknown types
                slide.innerHTML = `<img src="${mediaItem.path}" alt="" />`;
                break;
        }
    }

    /**
     * Setup click handler for video thumbnails
     * @param {HTMLElement} slide - The slide element containing the video thumbnail
     */
    setupVideoThumbnailClick(slide) {
        const videoContainer = slide.querySelector(".video-container");
        const thumbnail = slide.querySelector(".video-thumbnail");
        const playButton = slide.querySelector(".video-play-button");

        if (!videoContainer || !thumbnail) return;

        // Position play button relative to thumbnail image content
        this.positionPlayButtonOnThumbnail(thumbnail, playButton);

        const clickHandler = (event) => {
            // Prevent event bubbling to avoid closing the card
            event.stopPropagation();
            event.preventDefault();

            const videoSrc = videoContainer.getAttribute("data-video-src");
            if (!videoSrc) return;

            // Replace thumbnail with styled video
            const styledVideo = createStyledVideo(videoSrc, {
                preload: "auto",
                autoplay: true,
            });
            videoContainer.innerHTML = "";
            videoContainer.appendChild(styledVideo);

            // Setup video optimization for the new video element
            this.setupVideoOptimization(slide);
        };

        // Add click handlers to both thumbnail and play button
        if (thumbnail) thumbnail.addEventListener("click", clickHandler);
        if (playButton) playButton.addEventListener("click", clickHandler);

        // Add touch handlers for mobile with event prevention
        const touchHandler = (event) => {
            event.stopPropagation();
            event.preventDefault();
            clickHandler(event);
        };

        if (thumbnail) thumbnail.addEventListener("touchend", touchHandler);
        if (playButton) playButton.addEventListener("touchend", touchHandler);

        // Reposition play button when window is resized or image loads
        if (thumbnail && playButton) {
            const repositionHandler = () => this.positionPlayButtonOnThumbnail(thumbnail, playButton);
            thumbnail.addEventListener("load", repositionHandler);
            window.addEventListener("resize", repositionHandler);
        }
    }

    /**
     * Position play button relative to the actual thumbnail image content
     * @param {HTMLElement} thumbnail - The thumbnail image element
     * @param {HTMLElement} playButton - The play button element
     */
    positionPlayButtonOnThumbnail(thumbnail, playButton) {
        if (!thumbnail || !playButton) return;

        // Wait for image to load if it hasn't already
        const positionButton = () => {
            const containerRect = thumbnail.getBoundingClientRect();
            const containerStyle = window.getComputedStyle(thumbnail);

            // Get the natural dimensions of the image
            const naturalWidth = thumbnail.naturalWidth;
            const naturalHeight = thumbnail.naturalHeight;

            if (naturalWidth === 0 || naturalHeight === 0) {
                // Image hasn't loaded yet, try again after a short delay
                setTimeout(() => this.positionPlayButtonOnThumbnail(thumbnail, playButton), 100);
                return;
            }

            // Calculate the container dimensions (excluding padding/border)
            const containerWidth = thumbnail.offsetWidth;
            const containerHeight = thumbnail.offsetHeight;

            // Calculate the actual image display dimensions with object-fit: contain
            const imageAspectRatio = naturalWidth / naturalHeight;
            const containerAspectRatio = containerWidth / containerHeight;

            let imageDisplayWidth, imageDisplayHeight;
            let imageOffsetX, imageOffsetY;

            if (imageAspectRatio > containerAspectRatio) {
                // Image is wider than container ratio - limited by width
                imageDisplayWidth = containerWidth;
                imageDisplayHeight = containerWidth / imageAspectRatio;
                imageOffsetX = 0;
                imageOffsetY = (containerHeight - imageDisplayHeight) / 2;
            } else {
                // Image is taller than container ratio - limited by height
                imageDisplayWidth = containerHeight * imageAspectRatio;
                imageDisplayHeight = containerHeight;
                imageOffsetX = (containerWidth - imageDisplayWidth) / 2;
                imageOffsetY = 0;
            }

            // Adjust offset based on object-position: left top
            if (containerStyle.objectPosition && containerStyle.objectPosition.includes("left")) {
                imageOffsetX = 0;
            }
            if (containerStyle.objectPosition && containerStyle.objectPosition.includes("top")) {
                imageOffsetY = 0;
            }

            // Position the play button at the center of the actual image content
            const centerX = imageOffsetX + imageDisplayWidth / 2;
            const centerY = imageOffsetY + imageDisplayHeight / 2;

            // Set the position using percentage for responsive behavior
            const leftPercent = (centerX / containerWidth) * 100;
            const topPercent = (centerY / containerHeight) * 100;

            playButton.style.left = `${leftPercent}%`;
            playButton.style.top = `${topPercent}%`;
            playButton.style.transform = "translate(-50%, -50%)";
        };

        if (thumbnail.complete && thumbnail.naturalWidth > 0) {
            positionButton();
        } else {
            thumbnail.addEventListener("load", positionButton, { once: true });
        }
    }

    /**
     * Setup video optimization for mobile devices
     * @param {HTMLElement} slide - The slide element containing the video
     */
    setupVideoOptimization(slide) {
        // Look for video element in both regular video tags and player.style containers
        const video = slide.querySelector("video") || slide.querySelector("media-theme-minimal video");
        if (!video) return;

        // Set up intersection observer for lazy loading
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const targetVideo = entry.target;

                        // Only load the video when it's about to be viewed
                        if (targetVideo.preload === "metadata") {
                            targetVideo.preload = "auto";
                        }

                        // Disconnect observer for this video as it's no longer needed
                        observer.unobserve(targetVideo);
                    }
                });
            },
            {
                rootMargin: "50px", // Start loading when video is 50px from viewport
            }
        );

        observer.observe(video);

        // Add event listeners for better mobile experience
        video.addEventListener("loadstart", () => {
            console.log("Video loading started");
        });

        video.addEventListener("canplay", () => {
            console.log("Video can start playing");
        });

        video.addEventListener("error", (e) => {
            console.error("Video error:", e);
            // On error, try to reload with different preload setting
            video.preload = "none";
        });

        // Handle mobile data saving preferences
        if ("connection" in navigator) {
            const connection = navigator.connection;
            if (connection.saveData || connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") {
                video.preload = "none";
                console.log("Disabled video preload due to slow connection or data saver");
            }
        }
    }

    /**
     * Progressive media loading - loads all project media (images, videos, thumbnails) when project is opened
     * This improves initial page load performance by only loading covers initially
     */
    preloadProjectMedia() {
        const { media = [] } = this.project.content || {};

        if (!media || media.length === 0) return;

        // Track loading progress
        let totalMedia = 0;
        let loadedMedia = 0;

        // Preload all media items
        media.forEach((item) => {
            const mediaPath = typeof item === "string" ? item : item.path;
            const mediaType = detectMediaType(mediaPath);

            if (mediaType === "image" || mediaType === "gif") {
                // Preload images and GIFs
                totalMedia++;
                const img = new Image();
                img.onload = () => {
                    loadedMedia++;
                };
                img.onerror = () => {
                    console.warn(`Failed to load image: ${mediaPath}`);
                };
                img.src = mediaPath;
            } else if (mediaType === "video") {
                // Preload video thumbnails if available
                if (item.thumbnail) {
                    totalMedia++;
                    const thumbnailImg = new Image();
                    thumbnailImg.onload = () => {
                        loadedMedia++;
                    };
                    thumbnailImg.onerror = () => {
                        console.warn(`Failed to load video thumbnail: ${item.thumbnail}`);
                    };
                    thumbnailImg.src = item.thumbnail;
                }

                // Preload video metadata (doesn't download the full video, just gets metadata)
                totalMedia++;
                const video = document.createElement("video");
                video.preload = "metadata";
                video.onloadedmetadata = () => {
                    loadedMedia++;
                };
                video.onerror = () => {
                    console.warn(`Failed to load video metadata: ${mediaPath}`);
                };
                video.src = mediaPath;
            } else if (mediaType === "iframe") {
                // For iframes (Vimeo), just count them as loaded
                totalMedia++;
                loadedMedia++;
            }
        });

        // Log completion
        if (totalMedia > 0) {
            console.log(`Preloading ${totalMedia} media items for ${this.project.title}`);
        }
    }

    /**
     * Show the next slide in the gallery
     */
    showNextSlide() {
        try {
            if (!this.slides || this.slides.length <= 1) return;

            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                // Mobile: Use absolute positioning with transforms
                this.showNextSlideMobile();
            } else {
                // Desktop: Use flexbox infinite carousel
                this.showNextSlideDesktop();
            }
        } catch (error) {
            console.warn("Error showing next slide:", error);
        }
    }

    /**
     * Show next slide on mobile using absolute positioning
     */
    showNextSlideMobile() {
        const currentSlide = this.slides[this.currentSlideIndex];
        const nextIndex = (this.currentSlideIndex + 1) % this.totalSlides;
        const nextSlide = this.slides[nextIndex];

        if (!currentSlide || !nextSlide) return;

        // Position next slide off-screen to the right
        nextSlide.style.position = "absolute";
        nextSlide.style.top = "0";
        nextSlide.style.left = "0";
        nextSlide.style.width = "100%";
        nextSlide.style.height = "auto";
        nextSlide.style.transform = "translateX(100%)";
        nextSlide.style.zIndex = "2";

        // Force reflow
        nextSlide.offsetHeight;

        // Animate current slide out to the left and next slide in
        currentSlide.style.transform = "translateX(-100%)";
        currentSlide.style.zIndex = "1";
        nextSlide.style.transform = "translateX(0%)";

        // Update current index
        this.currentSlideIndex = nextIndex;

        // After animation, make next slide static for container sizing
        setTimeout(() => {
            if (nextSlide) {
                nextSlide.style.position = "static";
                nextSlide.style.top = "auto";
                nextSlide.style.left = "auto";
                nextSlide.style.transform = "translateX(0%)";
            }
            if (currentSlide) {
                currentSlide.style.position = "absolute";
                currentSlide.style.top = "0";
                currentSlide.style.left = "0";
                currentSlide.style.transform = "translateX(100%)";
            }
        }, 300);

        // Handle video playback
        this.handleVideoPlayback();
    }

    /**
     * Show next slide on desktop using infinite carousel
     */
    showNextSlideDesktop() {
        const slideGroup = this.element.querySelector(".slide-group");
        if (!slideGroup) return;

        // Initialize the current position if not set
        if (this.currentPosition === undefined) {
            this.currentPosition = 0;
        }

        // Move to next position
        this.currentPosition++;

        // Apply the transform
        slideGroup.style.transform = `translateX(-${this.currentPosition * 100}%)`;

        // Update the logical slide index for video handling
        this.currentSlideIndex = this.currentPosition % this.totalSlides;

        // Check if we've reached the end of original slides (need to reset)
        if (this.currentPosition === this.totalSlides) {
            // After transition completes, reset to position 0 without animation
            setTimeout(() => {
                slideGroup.style.transition = "none";
                this.currentPosition = 0;
                slideGroup.style.transform = "translateX(0%)";

                // Re-enable transition
                setTimeout(() => {
                    slideGroup.style.transition = "transform 0.3s ease-in-out";
                }, 50);
            }, 300); // Match CSS transition duration
        }

        // Handle video pause/play
        this.handleVideoPlayback();
    }

    /**
     * Handle video playback for current slide
     */
    handleVideoPlayback() {
        if (!this.slides) return;

        // Pause all videos (both actual video elements and thumbnails)
        this.slides.forEach((slide, index) => {
            const video = slide.querySelector("video");

            if (index !== this.currentSlideIndex) {
                this.pauseVideoInSlide(slide, video);
            }
        });

        // For current slide, just ensure it's ready (don't auto-play)
        const currentSlide = this.slides[this.currentSlideIndex];
        if (currentSlide) {
            const video = currentSlide.querySelector("video");

            // Note: We don't auto-play videos anymore - user must click to play
            // This applies to both thumbnail approach and direct video elements
        }
    }

    /**
     * Set up keyboard navigation for the card (only for desktop)
     */
    setupKeyboardNavigation() {
        // Only enable keyboard navigation on desktop
        if (window.innerWidth > 768 && !("ontouchstart" in window)) {
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
                if (this._keyboardHandler) {
                    document.removeEventListener("keydown", this._keyboardHandler);
                }
                // Clean up intersection observer
                if (this.intersectionObserver) {
                    this.intersectionObserver.disconnect();
                }

                if (originalOnClose) originalOnClose();
            };
        } else {
            // For mobile, just set up the cleanup without keyboard handler
            const originalOnClose = this.onClose;
            this.onClose = () => {
                // Clean up intersection observer
                if (this.intersectionObserver) {
                    this.intersectionObserver.disconnect();
                }

                if (originalOnClose) originalOnClose();
            };
        }
    }

    /**
     * Set up intersection observer to handle video visibility
     */
    setupIntersectionObserver() {
        if (!window.IntersectionObserver) {
            console.warn("IntersectionObserver not supported");
            return;
        }

        const options = {
            threshold: 0.5, // Video must be at least 50% visible
            rootMargin: "0px",
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const slide = entry.target;
                const video = slide.querySelector("video");
                if (entry.isIntersecting) {
                    // Slide is visible, play video if it's the current slide
                    if (this.slides[this.currentSlideIndex] === slide) {
                        this.playVideoInSlide(slide, video);
                    }
                } else {
                    // Slide is not visible, pause video
                    this.pauseVideoInSlide(slide, video);
                }
            });
        }, options);

        // Observe all slides
        if (this.slides) {
            this.slides.forEach((slide) => {
                if (slide && this.intersectionObserver) {
                    try {
                        this.intersectionObserver.observe(slide);
                    } catch (error) {
                        console.warn("Error observing slide:", error);
                    }
                }
            });
        }
    }

    /**
     * Play video in the given slide
     * @param {HTMLElement} slide - The slide element
     * @param {HTMLElement} video - The video element (if any)
     */
    playVideoInSlide(slide, video) {
        // Videos no longer auto-play - user must click to play
        // if (video && video.paused) {
        //     video.play().catch((error) => {
        //         console.log("Video play failed:", error);
        //     });
        // }
    }

    /**
     * Pause video in the given slide
     * @param {HTMLElement} slide - The slide element
     * @param {HTMLElement} video - The video element (if any)
     */
    pauseVideoInSlide(slide, video) {
        if (video && !video.paused) {
            video.pause();
        }
    }
}
