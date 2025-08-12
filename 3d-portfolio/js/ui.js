import * as THREE from "three";
import { findObjectById, isMobileDevice, pauseRenderer, resumeRenderer } from "./utils";
import { wasSelected, reverseSelected, toggleSphereMaterial } from "../main";
import { AboutCard, ProjectCard } from "./Components";

// Global variables
let sortedProjects = [];
let invertButton;
let wasIndexOpenWhenProjectOpened = false; // Track index state when opening projects

// Helper function to check and set index state when opening projects
export function setIndexStateForProjectOpening() {
    const indexView = document.querySelector(".index-view");
    wasIndexOpenWhenProjectOpened = indexView && indexView.classList.contains("active");
    return wasIndexOpenWhenProjectOpened;
}



export function uiInit(projects) {
    // Initialize sortedProjects with projects array
    sortedProjects = [...projects];

    // Initialize UI components
    initNavbar();
    initInvertButton();
    initBottomNavbar();
    initIndexViewToggle();
    initIndexView();

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

            uiSwitchState("about");
        });
    }

    // Add escape key handler
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const viewToggle = document.querySelector(".view-toggle");
            const indexView = document.querySelector(".index-view");
            const threeCanvas = document.querySelector(".three-canvas");
            const blur = document.getElementById("blur");
            const projectCards = document.querySelectorAll(".project-card");

            // Check if any project card is currently open
            const hasOpenProjectCard = projectCards.length > 0 && 
                Array.from(projectCards).some(card => card.classList.contains("show"));

            // Only close index mode if no project card is open
            if (viewToggle && viewToggle.classList.contains("active") && !hasOpenProjectCard) {
                viewToggle.classList.remove("active");
                if (indexView) indexView.classList.remove("active");
                if (threeCanvas) threeCanvas.style.pointerEvents = "auto";
                
                // Make sure to handle the blur div properly
                if (blur) {
                    blur.classList.add("hide");
                }
                
                // Resume rendering
                resumeRenderer();
            }
        }
    });

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
    document.addEventListener("mousedown", interceptUIEvents, true);
    document.addEventListener("touchstart", interceptUIEvents, true);
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
       <p>I am an experience designer based in Amsterdam working across 
       interaction, digital, and sound design. Currently working as an Interaction Designer at 
       Random Studio, concept-driven work for clients in culture, fashion, and sports, 
       and collaborate with architects on spatial projects involving contemporary technology. 
       Parallel to this, I have also supported artists in developing interactive installations, I also work as a designer 
       and creative director for electronic music labels.</p>
    `,
};

// Function to create about page using the AboutCard component
export function createAboutPage(container) {
    const aboutCard = new AboutCard({
        container: container,
        content: aboutContent,
        onClose: () => {
            uiSwitchState("3d");
        }
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
    } else if (state === "project") {
        pauseRenderer(); // Pause when project card is open
        // Project card view - keep three.js canvas visible and show blur
        if (threeCanvas) {
            threeCanvas.style.visibility = "visible";
        }
        if (blur) {
            blur.classList.remove("hide");
        }
        // Don't show index view or toggle state for individual projects
    } else if (state === "2d") {
        pauseRenderer(); // Pause when index view is active
        // Index view - keep three.js canvas visible
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
        if (blur) {
            blur.classList.remove("hide");
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
            blur.classList.add("hide");
        }
        
        // Close any open cards
        projectCards.forEach(card => {
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

//dispatch mouseup event to stop sphere drag when project is open
const event = new MouseEvent("mouseup", {});

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
        }
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
        if (previewContainer && previewImage && project.content.media && project.content.media.length > 0) {
            // Find the first image in the media array (skip iframes/videos)
            const firstImage = project.content.media.find(item => 
                typeof item === 'string' && 
                (item.endsWith('.webp') || item.endsWith('.jpg') || item.endsWith('.jpeg') || item.endsWith('.png'))
            );
            
            if (firstImage) {
                gridItem.addEventListener("mouseenter", (e) => {
                    previewImage.src = firstImage;
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
    window.addEventListener('resize', () => {
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
        document.dispatchEvent(event);
        const card = addProjectCardToPage(projectId, mainContainer);
    }
});

if (isMobileDevice()) {
    if (invertButton) {
        navigator.vibrate(200);
    }
}
