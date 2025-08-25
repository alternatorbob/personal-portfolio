import * as THREE from "three";
import { findObjectById, isMobileDevice, pauseRenderer, resumeRenderer } from "./utils";
import { wasSelected, reverseSelected, toggleSphereMaterial } from "../main";
import { AboutCard, ProjectCard } from "./Components";

// Global variables
let sortedProjects = [];
let invertButton;
let wasIndexOpenWhenProjectOpened = false; // Track index state when opening projects
let wasIndexOpenWhenAboutOpened = false; // Track index state when opening about card

// Helper function to check and set index state when opening projects
export function setIndexStateForProjectOpening() {
    const indexView = document.querySelector(".index-view");
    wasIndexOpenWhenProjectOpened = indexView && indexView.classList.contains("active");
    return wasIndexOpenWhenProjectOpened;
}

// Helper function to check and set index state when opening about card
export function setIndexStateForAboutOpening() {
    const indexView = document.querySelector(".index-view");
    wasIndexOpenWhenAboutOpened = indexView && indexView.classList.contains("active");
    return wasIndexOpenWhenAboutOpened;
}

export function uiInit(projects) {
    // Initialize sortedProjects with projects array
    sortedProjects = [...projects];

    // Initialize blur with 3D view settings
    initializeBlurProperties();

    // Initialize UI components
    initNavbar();
    initInvertButton();
    initBottomNavbar();
    initIndexViewToggle();
    initIndexView();
    initIndexViewTouchHandling();

    // Add name click handler
    const nameElement = document.getElementById("name");
    if (nameElement) {
        nameElement.addEventListener("click", () => {
            const viewToggle = document.querySelector(".view-toggle");
            const indexView = document.querySelector(".index-view");
            const threeCanvas = document.querySelector(".three-canvas");

            if (viewToggle) viewToggle.classList.remove("active");
            if (indexView) indexView.classList.remove("active");
            if (threeCanvas) threeCanvas.style.pointerEvents = "auto";
        });
    }

    // Add about button click handler
    const aboutButton = document.getElementById("about-button");
    if (aboutButton) {
        aboutButton.addEventListener("click", () => {
            pauseRenderer(); // Pause renderer when about button is clicked

            // Track if index was open when about is opened
            setIndexStateForAboutOpening();

            uiSwitchState("about");
        });
    }

    // Add escape key handler (only for desktop)
    if (!isMobileDevice()) {
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                const viewToggle = document.querySelector(".view-toggle");
                const indexView = document.querySelector(".index-view");
                const threeCanvas = document.querySelector(".three-canvas");
                const blur = document.getElementById("blur");
                const projectCards = document.querySelectorAll(".project-card");
                const aboutCard = document.getElementById("about-card");

                // Check if any project card is currently open
                const hasOpenProjectCard = projectCards.length > 0 && Array.from(projectCards).some((card) => card.classList.contains("show"));

                // Check if about card is currently open
                const hasOpenAboutCard = aboutCard && aboutCard.classList.contains("show");

                // Only close index mode if no project card or about card is open
                if (viewToggle && viewToggle.classList.contains("active") && !hasOpenProjectCard && !hasOpenAboutCard) {
                    viewToggle.classList.remove("active");
                    if (indexView) indexView.classList.remove("active");
                    if (threeCanvas) threeCanvas.style.pointerEvents = "auto";

                    // Make sure to handle the blur div properly
                    if (blur) {
                        // Update blur properties back to full blur before hiding
                        updateBlurProperties("full");
                        blur.classList.add("hide");
                    }

                    // Resume rendering
                    resumeRenderer();
                }
            }
        });
    }

    // Single event handler for intercepting mouse clicks in UI areas
    const interceptUIEvents = (e) => {
        const navbar = document.querySelector(".navbar");
        const navbarBottom = document.querySelector(".navbar-bottom");
        const indexView = document.querySelector(".index-view");
        const aboutButton = document.getElementById("about-button");

        // Get coordinates, handling both mouse and touch events
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : null);
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : null);

        if (clientY === null) return; // Skip if we couldn't determine position

        if (navbar) {
            const navbarRect = navbar.getBoundingClientRect();
            // Check if interaction is within navbar bounds
            if (clientY <= navbarRect.bottom) {
                e.stopPropagation();
                return;
            }
        }

        if (navbarBottom) {
            const navbarBottomRect = navbarBottom.getBoundingClientRect();
            // Check if interaction is within bottom navbar bounds
            if (clientY >= navbarBottomRect.top) {
                e.stopPropagation();
                return;
            }
        }

        // Check specifically for about button clicks when in index view to keep blur
        if (aboutButton && indexView && indexView.classList.contains("active")) {
            const aboutRect = aboutButton.getBoundingClientRect();
            if (clientX >= aboutRect.left && clientX <= aboutRect.right && clientY >= aboutRect.top && clientY <= aboutRect.bottom) {
                // Don't need to do anything extra, just prevent this from being handled below
                return;
            }
        }

        // Also block interactions on index view when active
        if (indexView && indexView.classList.contains("active")) {
            e.stopPropagation();
            return;
        }
    };

    // Add event listeners for both mouse and touch events
    document.addEventListener("mousedown", interceptUIEvents);
    document.addEventListener("touchstart", interceptUIEvents);
}

function initNavbar() {
    let nameDiv = document.querySelector(".navbar-name");
    let slideDivs = document.querySelectorAll(".slide-div");

    if (nameDiv && slideDivs.length > 0) {
        nameDiv.addEventListener("mouseover", function () {
            for (let i = 0; i < slideDivs.length; i++) {
                slideDivs[i].style.visibility = "visible";
                slideDivs[i].style.transitionDelay = i * 0.1 + "s";
                slideDivs[i].style.opacity = 1;
                slideDivs[i].style.transform = "translateX(0)";
            }
        });

        nameDiv.addEventListener("mouseout", function () {
            for (let i = 0; i < slideDivs.length; i++) {
                slideDivs[i].style.transitionDelay = (slideDivs.length - i - 1) * 0.1 + "s";
                slideDivs[i].style.opacity = 0;
                slideDivs[i].style.transform = "translateX(-100%)";
            }
        });
    }
}

function initInvertButton() {
    invertButton = document.querySelector(".button-invert");
    const invert = document.querySelector(".invert");

    if (invertButton && invert) {
        invertButton.addEventListener("click", () => {
            invert.classList.toggle("show");
        });
    }
}

function initBottomNavbar() {
    const materialToggleButton = document.querySelector(".button-material-toggle");

    if (materialToggleButton) {
        materialToggleButton.addEventListener("click", () => {
            toggleSphereMaterial();
        });
    }
}

// About page content
const aboutContent = {
    title: "About",
    description: `
       <p>I am an Interaction Designer based in Amsterdam working across 
       interaction, digital, and sound design. Currently working as an Interaction Designer at 
       Random Studio, I work on concept-driven work for clients in technology, fashion, and sports. 
       I collaborate with architects on spatial projects that use contemporary technology. 
       Parallel to this, I have also supported artists in developing interactive installations, I also work with electronic music labels for creative direction, design and promotion.</p>
    `,
};

// Function to create about page using the AboutCard component
export function createAboutPage(container) {
    const aboutCard = new AboutCard({
        container: container,
        content: aboutContent,
        onClose: () => {
            // If index was open when about was opened, return to index view
            if (wasIndexOpenWhenAboutOpened) {
                uiSwitchState("2d");
                wasIndexOpenWhenAboutOpened = false; // Reset the flag
            } else {
                uiSwitchState("3d");
            }
        },
    });

    return aboutCard.render();
}

// Modify uiSwitchState to use the shared animation function
export function uiSwitchState(state) {
    const mainContainer = document.querySelector(".main-container");
    const projectCards = document.querySelectorAll(".project-card");
    const aboutCard = document.getElementById("about-card");
    const threeCanvas = document.querySelector(".three-canvas");
    const indexView = document.querySelector(".index-view");
    const viewToggle = document.querySelector(".view-toggle");
    const blur = document.getElementById("blur");

    // Handle about card
    if (state === "about") {
        pauseRenderer(); // Pause when about card opens
        if (!aboutCard) {
            createAboutPage(mainContainer);
        }
        // Show blur for about card
        if (blur) {
            blur.classList.remove("hide");
            // Update blur properties for about view (use full blur settings)
            updateBlurProperties("full");
        }
    } else if (state === "project") {
        pauseRenderer(); // Pause when project card is open
        // Project card view - keep three.js canvas visible and show blur
        if (threeCanvas) {
            threeCanvas.style.visibility = "visible";
        }
        if (blur) {
            blur.classList.remove("hide");
            // Update blur properties for project view (use full blur settings)
            updateBlurProperties("full");
        }
        // Don't show index view or toggle state for individual projects
    } else if (state === "2d") {
        pauseRenderer(); // Pause when index view is active
        // Index view - keep three.js canvas visible but NO blur
        if (threeCanvas) {
            threeCanvas.style.visibility = "visible";
        }
        // Show index view and update toggle state
        if (indexView) {
            indexView.classList.add("active");
        }
        if (viewToggle) {
            viewToggle.classList.add("active");
        }
        // Keep blur hidden for index view - only show for about and projects
        if (blur) {
            blur.classList.add("hide");
        }
    } else if (state === "3d") {
        resumeRenderer(); // Resume renderer in 3D view
        // 3D view - ensure three.js canvas is visible
        if (threeCanvas) {
            threeCanvas.style.visibility = "visible";
        }
        // Hide index view and update toggle state
        if (indexView) {
            indexView.classList.remove("active");
        }
        if (viewToggle) {
            viewToggle.classList.remove("active");
        }
        if (blur) {
            // Update blur properties back to full blur before hiding
            updateBlurProperties("full");
            blur.classList.add("hide");
        }

        // Close any open cards
        projectCards.forEach((card) => {
            if (card.classList.contains("show")) {
                // Find the close button and click it
                const closeButton = card.querySelector(".button-close");
                if (closeButton) {
                    closeButton.click();
                }
            }
        });
    }
}

export function addProjectCardToPage(projectId, container) {
    // Check if there are already project cards open - prevent multiple cards
    const existingProjectCards = document.querySelectorAll(".project-card");
    if (existingProjectCards.length > 0) {
        return null; // Don't create another card if one exists already
    }

    const project = findObjectById(sortedProjects, projectId);
    if (!project) return;

    // Create and render the project card using the ProjectCard component
    const projectCard = new ProjectCard({
        project: project,
        container: container,
        onClose: () => {
            // If index was open when project was opened, return to index view
            if (wasIndexOpenWhenProjectOpened) {
                uiSwitchState("2d");
                wasIndexOpenWhenProjectOpened = false; // Reset the flag
            } else {
                uiSwitchState("3d");
            }
        },
    });

    return projectCard.render();
}

function populateIndexView() {
    const gridContainer = document.querySelector(".index-view-grid");
    const previewContainer = document.querySelector(".index-view-preview");
    const previewImage = previewContainer ? previewContainer.querySelector("img") : null;

    if (!gridContainer) return;

    // Clear existing items
    gridContainer.innerHTML = "";

    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;

    // Add grid items for each project
    sortedProjects.forEach((project) => {
        // Create main grid item container
        const gridItem = document.createElement("div");
        gridItem.className = "index-view-item";
        gridItem.id = project.id;

        if (isMobile) {
            // Mobile layout: only title and year
            const titleElement = document.createElement("div");
            titleElement.className = "grid-title";
            titleElement.textContent = project.title;

            const yearElement = document.createElement("div");
            yearElement.className = "grid-year";
            yearElement.textContent = project.year;

            gridItem.appendChild(titleElement);
            gridItem.appendChild(yearElement);
        } else {
            // Desktop layout: title group, category, client, and year
            const titleGroupElement = document.createElement("div");
            titleGroupElement.className = "grid-title-group";

            const titleElement = document.createElement("div");
            titleElement.className = "grid-title";
            titleElement.textContent = project.title;

            const categoryElement = document.createElement("div");
            categoryElement.className = "grid-category";
            categoryElement.textContent = project.categories.join(", ");

            const clientElement = document.createElement("div");
            clientElement.className = "grid-client";
            clientElement.textContent = project.client || "N/A";

            const yearElement = document.createElement("div");
            yearElement.className = "grid-year";
            yearElement.textContent = project.year;

            titleGroupElement.appendChild(titleElement);
            gridItem.appendChild(titleGroupElement);
            gridItem.appendChild(categoryElement);
            gridItem.appendChild(clientElement);
            gridItem.appendChild(yearElement);
        }

        // Add hover events for preview (skip on mobile devices)
        if (previewContainer && previewImage) {
            // Use the project's cover image if available, otherwise find first image in media array
            let previewImagePath = project.content.cover;
            
            if (!previewImagePath && project.content.media && project.content.media.length > 0) {
                // Find the first image in the media array (skip videos) as fallback
                const firstImage = project.content.media.find((item) => {
                    const itemPath = typeof item === "string" ? item : item.path;
                    return itemPath && (itemPath.endsWith(".webp") || itemPath.endsWith(".jpg") || itemPath.endsWith(".jpeg") || itemPath.endsWith(".png"));
                });
                previewImagePath = typeof firstImage === "string" ? firstImage : firstImage?.path;
            }

            if (previewImagePath) {
                // Preload the cover image for smooth hover preview
                preloadCoverImage(previewImagePath);
                gridItem.addEventListener("mouseenter", (e) => {
                    previewImage.src = previewImagePath;
                    previewContainer.style.left = `${e.clientX}px`;
                    previewContainer.style.top = `${e.clientY}px`;
                    previewContainer.classList.add("show");
                });

                gridItem.addEventListener("mousemove", (e) => {
                    previewContainer.style.left = `${e.clientX}px`;
                    previewContainer.style.top = `${e.clientY}px`;
                });

                gridItem.addEventListener("mouseleave", () => {
                    previewContainer.classList.remove("show");
                });
            }
        }

        // Add click event to grid item to open project
        gridItem.addEventListener("click", function () {
            const viewToggle = document.querySelector(".view-toggle");
            const indexView = document.querySelector(".index-view");
            const threeCanvas = document.querySelector(".three-canvas");
            const blur = document.getElementById("blur");

            // Track that index was open when project is being opened
            setIndexStateForProjectOpening();

            // Keep index view and toggle active (don't close the index)
            // if (viewToggle) viewToggle.classList.remove("active");
            // if (indexView) indexView.classList.remove("active");
            if (threeCanvas) threeCanvas.style.pointerEvents = "auto";

            // Keep the blur layer visible when transitioning to project card
            if (blur) {
                blur.classList.remove("hide");
            }

            document.dispatchEvent(
                new CustomEvent("open-project", {
                    detail: { projectId: project.id },
                })
            );
        });

        gridContainer.appendChild(gridItem);
    });
}

function initIndexViewToggle() {
    const viewToggle = document.querySelector(".view-toggle");
    const indexView = document.querySelector(".index-view");
    const threeCanvas = document.querySelector(".three-canvas");

    if (!viewToggle || !indexView || !threeCanvas) return;

    viewToggle.addEventListener("click", () => {
        console.log("viewToggle clicked");
        if (indexView.classList.contains("active")) {
            uiSwitchState("3d");
            viewToggle.textContent = "Index";
        } else {
            uiSwitchState("2d");
            viewToggle.textContent = "Close";
        }
    });
}

function initIndexView() {
    // Set default sort by year descending - sortedProjects should already be initialized
    if (sortedProjects.length > 0) {
        sortedProjects = [...sortedProjects].sort((a, b) => {
            return parseInt(b.year) - parseInt(a.year);
        });
    }
    populateIndexView();

    // Add resize listener to update index view when switching between mobile and desktop
    let currentIsMobile = window.innerWidth <= 768;
    window.addEventListener("resize", () => {
        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile !== currentIsMobile) {
            currentIsMobile = newIsMobile;
            populateIndexView();
        }
    });
}

// Add event listener for the custom 'open-project' event
document.addEventListener("open-project", function (e) {
    if (e.detail && e.detail.projectId) {
        const mainContainer = document.querySelector(".main-container");
        const projectId = e.detail.projectId;
        const blur = document.getElementById("blur");

        // Pause renderer when opening a project from list view
        pauseRenderer();

        // Ensure blur is visible
        if (blur) {
            blur.classList.remove("hide");
        }

        // Similar to what happens when a cube is clicked
        uiSwitchState("project");
        const card = addProjectCardToPage(projectId, mainContainer);
    }
});

if (isMobileDevice()) {
    if (invertButton) {
        navigator.vibrate(200);
    }
}

/**
 * Preload a cover image for smooth hover preview
 * @param {string} imagePath - Path to the cover image
 */
function preloadCoverImage(imagePath) {
    if (!imagePath) return;
    
    // Check if image is already preloaded
    if (preloadedCoverImages.has(imagePath)) return;
    
    // Preload the image
    const img = new Image();
    img.onload = () => {
        preloadedCoverImages.add(imagePath);
    };
    img.onerror = () => {
        console.warn(`Failed to preload cover image: ${imagePath}`);
    };
    img.src = imagePath;
}

// Set to track preloaded cover images
const preloadedCoverImages = new Set();

// Touch handling variables for index view
let indexTouchStartX = 0;
let indexTouchStartY = 0;
let isIndexSwiping = false;
const indexMinSwipeDistance = 50;

/**
 * Initialize blur properties with 3D view settings
 */
function initializeBlurProperties() {
    const blur = document.getElementById("blur");
    if (!blur) return;

    // Initialize with full blur settings (24px blur, 0.75 opacity for desktop, 15px blur, 0.65 opacity for mobile)
    updateBlurProperties("full");
}

/**
 * Update blur properties based on view state
 * @param {string} blurType - Type of blur: "index" for light blur, "full" for full blur
 */
function updateBlurProperties(blurType) {
    const blur = document.getElementById("blur");
    if (!blur) return;

    const isMobile = isMobileDevice();
    
    if (blurType === "index") {
        // Index view - lighter blur
        blur.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
        blur.style.backdropFilter = "blur(3px)";
        blur.style.webkitBackdropFilter = "blur(3px)"; // Safari support
    } else if (blurType === "full") {
        // About/Project cards - full blur (24px desktop, 15px mobile)
        if (isMobile) {
            blur.style.backgroundColor = "rgba(0, 0, 0, 0.65)";
            blur.style.backdropFilter = "blur(15px)";
            blur.style.webkitBackdropFilter = "blur(15px)";
        } else {
            blur.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
            blur.style.backdropFilter = "blur(24px)";
            blur.style.webkitBackdropFilter = "blur(24px)";
        }
    }
}

/**
 * Initialize touch handling for index view to enable swipe left to close
 * Only initializes on mobile devices
 */
function initIndexViewTouchHandling() {
    // Only set up touch handling on mobile devices
    if (!isMobileDevice()) return;
    
    const indexView = document.querySelector(".index-view");
    if (!indexView) return;

    // Touch start event
    indexView.addEventListener("touchstart", handleIndexTouchStart, { passive: true });

    // Touch move event
    indexView.addEventListener("touchmove", handleIndexTouchMove, { passive: false });

    // Touch end event
    indexView.addEventListener("touchend", handleIndexTouchEnd, { passive: true });
}

/**
 * Handle touch start event for index view
 * @param {TouchEvent} e - Touch event
 */
function handleIndexTouchStart(e) {
    try {
        if (!e.touches || e.touches.length === 0) return;
        
        indexTouchStartX = e.touches[0].clientX;
        indexTouchStartY = e.touches[0].clientY;
        isIndexSwiping = false;
    } catch (error) {
        console.warn("Error handling index touch start:", error);
    }
}

/**
 * Handle touch move event for index view
 * @param {TouchEvent} e - Touch event
 */
function handleIndexTouchMove(e) {
    try {
        if (!indexTouchStartX || !indexTouchStartY || !e.touches || e.touches.length === 0) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        const deltaX = indexTouchStartX - currentX; // Positive for left swipe
        const deltaY = Math.abs(currentY - indexTouchStartY);

        // Check if this is a horizontal swipe left (more horizontal than vertical movement)
        if (Math.abs(deltaX) > deltaY && deltaX > 20) {
            isIndexSwiping = true;
            
            // Create visual feedback for swipe left
            const indexView = document.querySelector(".index-view");
            if (indexView && deltaX > 0) {
                // Only allow leftward swipes
                const swipeProgress = Math.min(deltaX / 200, 1); // Normalize to 0-1 over 200px
                
                // Apply transform and opacity changes
                indexView.style.transition = "none";
                indexView.style.transform = `translateX(-${deltaX * 0.3}px)`;
                indexView.style.opacity = `${1 - (swipeProgress * 0.2)}`; // Fade slightly
                
                // Prevent default to avoid page scrolling during swipe
                e.preventDefault();
            }
        }
    } catch (error) {
        console.warn("Error handling index touch move:", error);
    }
}

/**
 * Handle touch end event for index view
 * @param {TouchEvent} e - Touch event
 */
function handleIndexTouchEnd(e) {
    try {
        if (!isIndexSwiping) {
            // Reset index position if no swipe was detected
            resetIndexPosition();
            return;
        }

        const deltaX = indexTouchStartX - (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : indexTouchStartX);

        // Check if swipe left distance is sufficient to close the index
        if (deltaX > indexMinSwipeDistance) {
            // Close the index view
            uiSwitchState("3d");
            const viewToggle = document.querySelector(".view-toggle");
            if (viewToggle) {
                viewToggle.textContent = "Index";
            }
        } else {
            // Swipe not sufficient, animate back to original position
            resetIndexPosition();
        }

        // Reset touch state
        indexTouchStartX = 0;
        indexTouchStartY = 0;
        isIndexSwiping = false;

    } catch (error) {
        console.warn("Error handling index touch end:", error);
        // Reset touch state and index position on error
        indexTouchStartX = 0;
        indexTouchStartY = 0;
        isIndexSwiping = false;
        resetIndexPosition();
    }
}

/**
 * Reset index view position to original state
 */
function resetIndexPosition() {
    try {
        const indexView = document.querySelector(".index-view");
        if (indexView) {
            indexView.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
            indexView.style.transform = "translateX(0)";
            indexView.style.opacity = "1";
            
            // Clear transition after animation completes
            setTimeout(() => {
                if (indexView) {
                    indexView.style.transition = "";
                }
            }, 300);
        }
    } catch (error) {
        console.warn("Error resetting index position:", error);
    }
}

