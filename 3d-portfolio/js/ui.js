import * as THREE from "three";
import { projects } from "./projects";
import { findObjectById, isMobileDevice, pauseRenderer, resumeRenderer } from "./utils";
import { wasSelected, reverseSelected, navbar } from "../main";
import { AboutCard, ProjectCard } from "./Components";
import { PreviewContainer } from "./Components";

// Global variables
let sortedProjects = [];
let invertButton;

const navBarHint = document.querySelector(".navbar-hint");
if (navBarHint) {
    navBarHint.textContent = isMobileDevice()
        ? `To browse, drag the sphere. To open a project, tap an image.`
        : `To browse, drag the sphere or scroll. To open a project, click an image.`;
}

export function uiInit() {
    // Initialize sortedProjects with projects array
    sortedProjects = [...projects];

    // Initialize UI components
    initNavbar();
    initInvertButton();
    initListViewToggle();
    populateListView();

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
            navbar.hide();
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
            const aboutCard = document.getElementById("about-card");
            const indexText = document.getElementById("index");
            const projectCard = document.querySelector(".project-card");

            // If project card is open, close it and return to appropriate view
            if (projectCard) {
                const closeButton = projectCard.querySelector(".button-close");
                if (closeButton) {
                    closeButton.click();
                }
                return;
            }

            // If about card is open, close it and return to appropriate view
            if (aboutCard) {
                aboutCard.remove();
                if (indexView && indexView.classList.contains("active")) {
                    uiSwitchState("2d"); // Return to index view
                } else {
                    uiSwitchState("3d"); // Return to 3D view
                }
                return;
            }

            // Handle index view toggle
            if (viewToggle && viewToggle.classList.contains("active")) {
                viewToggle.classList.remove("active");
                if (indexView) indexView.classList.remove("active");
                if (threeCanvas) threeCanvas.style.pointerEvents = "auto";
                if (blur) blur.classList.add("hide");
                if (indexText) indexText.textContent = "Index";
                resumeRenderer();
            }
        }
    });

    // Single event handler for intercepting mouse clicks in UI areas
    const interceptUIEvents = (e) => {
        const navbar = document.querySelector(".navbar");
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

function initListViewToggle() {
    const viewToggle = document.querySelector(".view-toggle");
    const indexView = document.querySelector(".index-view");
    const threeCanvas = document.querySelector(".three-canvas");
    const blur = document.getElementById("blur");
    const indexText = document.getElementById("index");

    if (!viewToggle || !indexView || !threeCanvas || !indexText) return;

    viewToggle.addEventListener("click", () => {
        if (indexView.classList.contains("active")) {
            // Close index view
            indexView.classList.remove("active");
            viewToggle.classList.remove("active");
            threeCanvas.style.pointerEvents = "auto";
            if (blur) blur.classList.add("hide");
            indexText.textContent = "Index";
            resumeRenderer();

            // Update navbar background
            const navbarName = document.querySelector('.navbar-name');
            const navbarCenter = document.querySelector('.navbar-center');
            const navbarRight = document.querySelector('.navbar-right');
            const navbarHint = document.querySelector('.navbar-hint');

            if (navbarName) navbarName.style.backgroundColor = 'black';
            if (navbarCenter) navbarCenter.style.backgroundColor = 'black';
            if (navbarRight) navbarRight.style.backgroundColor = 'black';
            if (navbarHint) navbarHint.style.backgroundColor = 'black';
        } else {
            // Open index view
            navbar.hide();
            indexView.classList.add("active");
            viewToggle.classList.add("active");
            threeCanvas.style.pointerEvents = "none";
            if (blur) blur.classList.remove("hide");
            indexText.textContent = "Close";
            pauseRenderer();

            // Update navbar background
            const navbarName = document.querySelector('.navbar-name');
            const navbarCenter = document.querySelector('.navbar-center');
            const navbarRight = document.querySelector('.navbar-right');
            const navbarHint = document.querySelector('.navbar-hint');

            if (navbarName) navbarName.style.backgroundColor = '#202020';
            if (navbarCenter) navbarCenter.style.backgroundColor = '#202020';
            if (navbarRight) navbarRight.style.backgroundColor = '#202020';
            if (navbarHint) navbarHint.style.backgroundColor = '#202020';
        }
    });
}

// About page content
const aboutContent = {
    title: "About",
    description: `
       <p> Bogdan Nastase is an experience designer based in Amsterdam working across 
       interaction, digital, and sound design. Currently working as an Interaction Designer at 
       Random Studio, he develops concept-driven work for clients in culture, fashion, and sports, 
       and collaborates with architects on spatial projects involving contemporary technology. 
       Parallel to this, he supports artists as a creative technologist and works as a designer 
       and creative director for electronic music labels. </p>
    `,
};

// Function to create about page using the AboutCard component
export function createAboutPage(container) {
    const aboutCard = new AboutCard({
        container: container,
        content: aboutContent,
        onClose: () => {
            // Check if we're in index view before closing about
            const indexView = document.querySelector(".index-view");
            if (indexView && indexView.classList.contains("active")) {
                uiSwitchState("2d"); // Return to index view
            } else {
                uiSwitchState("3d"); // Return to 3D view
            }
        }
    });
}

//dispatch mouseup event to stop sphere drag when project is open
const event = new MouseEvent("mouseup", {});

export function addProjectCardToPage(projectId, container) {
    // Check if there are already project cards open - prevent multiple cards
    const existingProjectCards = document.querySelectorAll(".project-card");
    if (existingProjectCards.length > 0) {
        return null; // Don't create another card if one exists already
    }

    const project = findObjectById(projects, projectId);
    if (!project) return;

    // Check if we're in index view
    const indexView = document.querySelector(".index-view");
    const isInIndexView = indexView && indexView.classList.contains("active");

    // Create and render the project card using the ProjectCard component
    const projectCard = new ProjectCard({
        project: project,
        container: container,
        onClose: () => {
            if (isInIndexView) {
                // If in index view, just close the project card
                const blur = document.getElementById("blur");
                if (blur) blur.classList.remove("hide");
            } else {
                // If not in index view, return to 3D view
                uiSwitchState("3d");
            }
        }
    });

    return projectCard.render();
}

// UI State Management
const UI_STATES = {
    ABOUT: 'about',
    INDEX: '2d',
    THREE_D: '3d'
};

const uiElements = {
    get mainContainer() { return document.querySelector(".main-container"); },
    get projectCards() { return document.querySelectorAll(".project-card"); },
    get aboutCard() { return document.getElementById("about-card"); },
    get threeCanvas() { return document.querySelector(".three-canvas"); },
    get indexView() { return document.querySelector(".index-view"); },
    get viewToggle() { return document.querySelector(".view-toggle"); },
    get blur() { return document.getElementById("blur"); },
    get indexText() { return document.getElementById("index"); }
};

const uiActions = {
    showAbout() {
        navbar.hide();
        pauseRenderer();
        if (!uiElements.aboutCard) {
            createAboutPage(uiElements.mainContainer);
        }
    },

    showIndex() {
        pauseRenderer();
        const { threeCanvas, indexView, viewToggle, blur, indexText } = uiElements;
        
        if (threeCanvas) threeCanvas.style.pointerEvents = "none";
        if (indexView) {
            indexView.classList.add("active");
        }
        if (viewToggle) viewToggle.classList.add("active");
        if (blur) blur.classList.remove("hide");
        if (indexText) indexText.textContent = "Close";

        // Update navbar background
        const navbarName = document.querySelector('.navbar-name');
        const navbarCenter = document.querySelector('.navbar-center');
        const navbarRight = document.querySelector('.navbar-right');
        const navbarHint = document.querySelector('.navbar-hint');

        if (navbarName) navbarName.style.backgroundColor = '#202020';
        if (navbarCenter) navbarCenter.style.backgroundColor = '#202020';
        if (navbarRight) navbarRight.style.backgroundColor = '#202020';
        if (navbarHint) navbarHint.style.backgroundColor = '#202020';
    },

    showThreeD() {
        resumeRenderer();
        const { threeCanvas, indexView, viewToggle, blur, indexText, projectCards } = uiElements;
        
        if (threeCanvas) threeCanvas.style.visibility = "visible";
        if (indexView) indexView.classList.remove("active");
        if (viewToggle) viewToggle.classList.remove("active");
        if (blur) blur.classList.add("hide");
        if (indexText) indexText.textContent = "Index";

        // Update navbar background
        const navbarName = document.querySelector('.navbar-name');
        const navbarCenter = document.querySelector('.navbar-center');
        const navbarRight = document.querySelector('.navbar-right');
        const navbarHint = document.querySelector('.navbar-hint');

        if (navbarName) navbarName.style.backgroundColor = 'black';
        if (navbarCenter) navbarCenter.style.backgroundColor = 'black';
        if (navbarRight) navbarRight.style.backgroundColor = 'black';
        if (navbarHint) navbarHint.style.backgroundColor = 'black';

        // Close any open project cards
        projectCards.forEach(card => {
            if (card.classList.contains("show")) {
                const closeButton = card.querySelector(".button-close");
                if (closeButton) closeButton.click();
            }
        });
    }
};

export function uiSwitchState(state) {
    switch (state) {
        case UI_STATES.ABOUT:
            uiActions.showAbout();
            break;
        case UI_STATES.INDEX:
            uiActions.showIndex();
            break;
        case UI_STATES.THREE_D:
            uiActions.showThreeD();
            break;
        default:
            console.warn(`Unknown UI state: ${state}`);
    }
}

function populateListView() {
    const tableBody = document.querySelector(".index-view-table tbody");
    // Create a single PreviewContainer instance
    const previewContainer = new PreviewContainer();

    if (!tableBody) return;

    // Clear existing rows
    tableBody.innerHTML = "";

    // Add rows for each project
    sortedProjects.forEach((project) => {
        const row = document.createElement("tr");
        row.id = project.id;

        // Create and add cells
        const titleCell = document.createElement("td");
        titleCell.textContent = project.title;
        row.appendChild(titleCell);

        const categoryCell = document.createElement("td");
        categoryCell.textContent = project.categories.join(", ");
        row.appendChild(categoryCell);

        const yearCell = document.createElement("td");
        yearCell.textContent = project.year;
        row.appendChild(yearCell);

        // Add hover events for preview
        if (project.content && project.content.images && project.content.images.length > 0) {
            row.addEventListener("mouseenter", () => {
                previewContainer.show(project.content.images[0]);
            });

            row.addEventListener("mouseleave", () => {
                previewContainer.hide();
            });
        }

        // Add click event to row to open project
        row.addEventListener("click", function () {
            const threeCanvas = document.querySelector(".three-canvas");
            const blur = document.getElementById("blur");
            const mainContainer = document.querySelector(".main-container");

            if (threeCanvas) threeCanvas.style.pointerEvents = "auto";

            // Keep the blur layer visible when transitioning to project card
            if (blur) {
                blur.classList.remove("hide");
            }

            // Pause renderer and show project card
            pauseRenderer();
            addProjectCardToPage(project.id, mainContainer);
        });

        tableBody.appendChild(row);
    });
}