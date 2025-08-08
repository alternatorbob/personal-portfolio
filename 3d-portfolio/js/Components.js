import { pauseRenderer, resumeRenderer, detectMediaType } from "./utils";
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
                {
                    title: "Vimeo",
                    url: "https://vimeo.com/your-vimeo",
                },
            ],
        };
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
        title.style.textAlign = "left"; // Left-aligned as requested
        title.style.fontSize = "var(--text-title)"; // Match project title font size
        title.style.color = "var(--text-color)"; // Match project title color
        title.style.fontWeight = "600"; // Match project title font weight
        title.style.margin = "0"; // Reset margin
        title.style.transform = "translateY(-7px)"; // Match project title vertical positioning

        // Create description with two-column layout
        const description = document.createElement("div");
        description.className = "about-card-description text-sm";
        description.style.textAlign = "left"; // Left-aligned as requested
        description.style.display = "flex";
        description.style.flexDirection = "column";
        description.style.gap = "2rem";

        // Add the main description content first (full width)
        const descriptionContent = document.createElement("div");
        descriptionContent.innerHTML = this.content.description;
        description.appendChild(descriptionContent);

        // Create the two-column links section
        const linksGrid = document.createElement("div");
        linksGrid.className = "text-sm";
        linksGrid.id = "links-grid";
        linksGrid.style.display = "flex";
        linksGrid.style.gap = "2rem";
        linksGrid.style.marginTop = "auto"; // Push to bottom of flex container
        description.appendChild(linksGrid);

        // Column 1: Email and CV
        const column1 = document.createElement("div");
        column1.id = "column-1";
        column1.style.flex = "1";
        column1.style.display = "flex";
        column1.style.flexDirection = "column";
        column1.style.gap = "0.2rem";

        // Add email
        const email = document.createElement("div");
        email.innerHTML = '<a href="mailto:cbogdan.nastase@gmail.com" class="external-link">cbogdan.nastase@gmail.com</a>';
        column1.appendChild(email);

        // Add phone number
        const phone = document.createElement("div");
        phone.innerHTML = ' <a href="tel:+31615184195" class="external-link">+31 (0) 615 184 195</a>';
        column1.appendChild(phone);

        // Column 2: External links
        const column2 = document.createElement("div");
        column2.id = "column-2";
        column2.style.flex = "1";
        column2.style.display = "flex";
        column2.style.flexDirection = "column";
        column2.style.gap = "0.2rem";

        // Add social media links as comma-separated
        const socialLinks = document.createElement("div");
        socialLinks.innerHTML =
            '<a href="https://www.instagram.com/__bogdan__n/" class="external-link">Instagram</a>, <a href="https://vimeo.com/user94524059" class="external-link">Vimeo</a>, <a href="https://www.linkedin.com/in/cbogdann/" class="external-link">LinkedIn</a>';
        column2.appendChild(socialLinks);

        // Add CV link
        const cvLink = document.createElement("div");
        cvLink.innerHTML = '<a href="/assets/files/08.08.2025_CV_Bogdan-Nastase.pdf" class="external-link">CV</a>';
        column2.appendChild(cvLink);

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
        this.slides = [];
        this.intersectionObserver = null;
        this.vimeoPlayers = new Map(); // Store Vimeo player instances
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

            // Modify slide positioning for mobile - use display toggle instead of transforms
            const slides = card.querySelectorAll(".slide");
            slides.forEach((slide, index) => {
                slide.style.position = "relative";
                slide.style.top = "auto";
                slide.style.left = "auto";
                slide.style.width = "100%";
                slide.style.height = "auto";
                slide.style.transform = "none";

                // Show only the current slide (first slide initially)
                if (index === 0) {
                    slide.style.display = "block";
                } else {
                    slide.style.display = "none";
                }
            });

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

        // Preload images for smoother transitions
        this.preloadImages();
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
            mediaItems = media.map((item) => ({
                path: item,
                type: detectMediaType(item),
            }));
        } else {
            // Fall back to old structure: images first, then videos, then gifs
            const imageItems = images.map((img) => ({ path: img, type: "image" }));
            const videoItems = videos.map((video) => ({ path: video, type: detectMediaType(video) }));
            const gifItems = gifs.map((gif) => ({ path: gif, type: "gif" }));
            mediaItems = [...imageItems, ...videoItems, ...gifItems];
        }

        const numSlides = mediaItems.length;

        for (let i = 0; i < numSlides; i++) {
            const slide = document.createElement("div");
            slide.className = "slide";
            const mediaItem = mediaItems[i];

            switch (mediaItem.type) {
                case "image":
                case "gif":
                    slide.innerHTML = `<img src="${mediaItem.path}" alt="" />`;
                    break;

                case "video":
                    slide.innerHTML = `<video controls loop preload="none" playsinline muted controlsList="nodownload"><source src="${mediaItem.path}" type="video/mp4">Your browser does not support the video tag.</video>`;
                    this.setupVideoOptimization(slide);
                    break;

                case "iframe":
                    slide.innerHTML = mediaItem.path;
                    this.setupVimeoIframe(slide);
                    break;

                default:
                    // Fallback to image for unknown types
                    slide.innerHTML = `<img src="${mediaItem.path}" alt="" />`;
                    break;
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
            let iframe = slide.querySelector('iframe[src*="player.vimeo.com"]');
            if (!iframe) return;

            // Modify iframe src to include necessary parameters
            const currentSrc = new URL(iframe.src);
            currentSrc.searchParams.set("autoplay", "0");
            currentSrc.searchParams.set("autopause", "1");
            currentSrc.searchParams.set("background", "0");
            currentSrc.searchParams.set("playsinline", "1");

            // Create new iframe with modified attributes
            const newIframe = document.createElement("iframe");
            newIframe.src = currentSrc.toString();
            newIframe.allow = "fullscreen; picture-in-picture";
            newIframe.setAttribute("loading", "lazy");
            newIframe.style.cssText = iframe.style.cssText;
            iframe.parentNode.replaceChild(newIframe, iframe);
            iframe = newIframe;

            // Only process if Vimeo Player API is available
            if (typeof Vimeo === "undefined") {
                console.warn("Vimeo Player API not available");
                return;
            }

            try {
                // Create a Vimeo Player instance with explicit options
                const player = new Vimeo.Player(iframe, {
                    autoplay: false,
                    autopause: true,
                    background: false,
                    playsinline: true,
                    muted: true,
                });

                // Store the player instance for later control
                this.vimeoPlayers.set(iframe, player);

                // Listen for when the player is ready
                player
                    .ready()
                    .then(() => {
                        // Inject CSS to override vp-center styles
                        this.injectVimeoStyles(iframe);
                        // Ensure video is paused initially
                        player.pause();
                    })
                    .catch((error) => {
                        console.warn("Vimeo player setup failed:", error);
                    });

                // Also try to inject styles on play event as a fallback
                player.on("play", () => {
                    this.injectVimeoStyles(iframe);
                });
            } catch (error) {
                console.warn("Error setting up Vimeo player:", error);
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
            const style = document.createElement("style");
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
            console.warn("Error injecting Vimeo styles:", error);
        }
    }

    /**
     * Setup video optimization for mobile devices
     * @param {HTMLElement} slide - The slide element containing the video
     */
    setupVideoOptimization(slide) {
        const video = slide.querySelector("video");
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
     * Preload all images in the gallery
     */
    preloadImages() {
        const { images = [], videos = [], gifs = [], media = [] } = this.project.content || {};

        let imageSources = [];

        if (media && media.length > 0) {
            // Use new media array - only preload images and gifs
            imageSources = media.filter((item) => {
                const type = detectMediaType(item);
                return type === "image" || type === "gif";
            });
        } else {
            // Fall back to old structure
            imageSources = [...images, ...gifs];
        }

        imageSources.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }

    /**
     * Show the next slide in the gallery
     */
    showNextSlide() {
        if (this.slides.length <= 1) return;

        // Check if we're on mobile
        const isMobile = window.innerWidth <= 768;

        // Calculate the index of the next slide
        const nextIndex = (this.currentSlideIndex + 1) % this.slides.length;

        if (isMobile) {
            // Mobile: use display toggling for better content adaptation
            this.slides[this.currentSlideIndex].style.display = "none";
            this.slides[nextIndex].style.display = "block";
        } else {
            // Desktop: use transform animations
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
        }

        // Pause video in the old slide
        const oldSlide = this.slides[this.currentSlideIndex];
        const oldVideo = oldSlide.querySelector("video");
        const oldIframe = oldSlide.querySelector('iframe[src*="player.vimeo.com"]');
        this.pauseVideoInSlide(oldSlide, oldVideo, oldIframe);

        // Update the current index
        this.currentSlideIndex = nextIndex;

        // Play video in the new slide if visible
        const newSlide = this.slides[this.currentSlideIndex];
        const newVideo = newSlide.querySelector("video");
        const newIframe = newSlide.querySelector('iframe[src*="player.vimeo.com"]');

        // Use setTimeout to ensure slide transition has started
        setTimeout(() => {
            // Check if the new slide is in viewport before playing
            const rect = newSlide.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

            if (isVisible) {
                this.playVideoInSlide(newSlide, newVideo, newIframe);
            }
        }, 100);
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
            // Clean up intersection observer
            if (this.intersectionObserver) {
                this.intersectionObserver.disconnect();
            }
            // Clean up Vimeo styles
            this.cleanupVimeoStyles();
            if (originalOnClose) originalOnClose();
        };
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
                const iframe = slide.querySelector('iframe[src*="player.vimeo.com"]');

                if (entry.isIntersecting) {
                    // Slide is visible, play video if it's the current slide
                    if (this.slides[this.currentSlideIndex] === slide) {
                        this.playVideoInSlide(slide, video, iframe);
                    }
                } else {
                    // Slide is not visible, pause video
                    this.pauseVideoInSlide(slide, video, iframe);
                }
            });
        }, options);

        // Observe all slides
        this.slides.forEach((slide) => {
            this.intersectionObserver.observe(slide);
        });
    }

    /**
     * Play video in the given slide
     * @param {HTMLElement} slide - The slide element
     * @param {HTMLElement} video - The video element (if any)
     * @param {HTMLElement} iframe - The iframe element (if any)
     */
    playVideoInSlide(slide, video, iframe) {
        if (video && video.paused) {
            video.play().catch((error) => {
                console.log("Video play failed:", error);
            });
        }

        if (iframe) {
            const player = this.vimeoPlayers.get(iframe);
            if (player) {
                player.play().catch((error) => {
                    console.log("Vimeo play failed:", error);
                });
            }
        }
    }

    /**
     * Pause video in the given slide
     * @param {HTMLElement} slide - The slide element
     * @param {HTMLElement} video - The video element (if any)
     * @param {HTMLElement} iframe - The iframe element (if any)
     */
    pauseVideoInSlide(slide, video, iframe) {
        if (video && !video.paused) {
            video.pause();
        }

        if (iframe) {
            const player = this.vimeoPlayers.get(iframe);
            if (player) {
                player.pause().catch((error) => {
                    console.log("Vimeo pause failed:", error);
                });
            }
        }
    }
}
