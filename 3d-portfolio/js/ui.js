import * as THREE from "three";
import { projects } from "./projects";
import { findObjectById, isMobileDevice, pauseRenderer, resumeRenderer } from "./utils";
import { wasSelected, reverseSelected, navbarHint } from "../main";
import { AboutCard, ProjectCard } from "./Components";

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
            const listView = document.querySelector(".list-view");
            const threeCanvas = document.querySelector(".three-canvas");

            if (viewToggle) viewToggle.classList.remove("active");
            if (listView) listView.classList.remove("active");
            if (threeCanvas) threeCanvas.style.pointerEvents = "auto";
        });
    }

    // Add about button click handler
    const aboutButton = document.getElementById("about-button");
    if (aboutButton) {
        aboutButton.addEventListener("click", () => {
            pauseRenderer(); // Pause renderer when about button is clicked

            // Hide navbar hint when about button is clicked
            if (navbarHint) {
                navbarHint.classList.add("fade-out");
            }

            uiSwitchState("about");
        });
    }

    // Add escape key handler
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const viewToggle = document.querySelector(".view-toggle");
            const listView = document.querySelector(".list-view");
            const threeCanvas = document.querySelector(".three-canvas");
            const blur = document.getElementById("blur");

            if (viewToggle && viewToggle.classList.contains("active")) {
                viewToggle.classList.remove("active");
                if (listView) listView.classList.remove("active");
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
        const listView = document.querySelector(".list-view");
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

        // Check specifically for about button clicks when in list view to keep blur
        if (aboutButton && listView && listView.classList.contains("active")) {
            const aboutRect = aboutButton.getBoundingClientRect();
            if (clientX >= aboutRect.left && clientX <= aboutRect.right && clientY >= aboutRect.top && clientY <= aboutRect.bottom) {
                // Don't need to do anything extra, just prevent this from being handled below
                return;
            }
        }

        // Also block interactions on list view when active
        if (listView && listView.classList.contains("active")) {
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

// About page content
const aboutContent = {
    title: "About Me",
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

    // Handle about card
    if (state === "about") {
        pauseRenderer(); // Pause when about card opens
        if (!aboutCard) {
            createAboutPage(mainContainer);
        }
    } else if (state === "2d") {
        pauseRenderer(); // Pause when project card view is active
        // Project card view - keep three.js canvas visible
        if (threeCanvas) {
            threeCanvas.style.visibility = "visible";
        }
    } else if (state === "3d") {
        resumeRenderer(); // Resume renderer in 3D view
        // 3D view - ensure three.js canvas is visible
        if (threeCanvas) {
            threeCanvas.style.visibility = "visible";
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

    const project = findObjectById(projects, projectId);
    if (!project) return;

    // Create and render the project card using the ProjectCard component
    const projectCard = new ProjectCard({
        project: project,
        container: container,
        onClose: () => {
            uiSwitchState("3d");
        }
    });
    
    return projectCard.render();
}

export function addCursorStyles(camera, cubes) {
    console.log(camera, cubes);

    const raycaster = new THREE.Raycaster();
    window.addEventListener("mousemove", (e) => {
        raycaster.setFromCamera(
            new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, (-e.clientY / window.innerHeight) * 2 + 1),
            camera
        );

        for (const cube of cubes) {
            const intersections = raycaster.intersectObject(cube);

            if (intersections.length > 0) {
                console.log(cube);

                document.body.style.cursor = "pointer";
            } else {
                document.body.style.cursor = "auto";
            }
        }
    });
}

function initListViewToggle() {
    const viewToggle = document.querySelector(".view-toggle");
    const listView = document.querySelector(".list-view");
    const threeCanvas = document.querySelector(".three-canvas");
    const blur = document.getElementById("blur");
    let isListViewActive = false;

    // Create preview container and image
    const previewContainer = document.createElement("div");
    previewContainer.className = "list-view-preview";
    const previewImage = document.createElement("img");
    previewContainer.appendChild(previewImage);
    document.body.appendChild(previewContainer);

    if (viewToggle && listView) {
        viewToggle.addEventListener("click", function () {
            isListViewActive = !isListViewActive;

            if (isListViewActive) {
                pauseRenderer(); // Pause renderer when list view is active
                viewToggle.classList.add("active");
                listView.classList.add("active");

                // Show blur layer
                if (blur) {
                    blur.classList.remove("hide");
                }

                // Hide navbar hint when switching to list view
                if (navbarHint) {
                    navbarHint.classList.add("fade-out");
                }

                // Disable pointer events on canvas
                if (threeCanvas) {
                    threeCanvas.style.pointerEvents = "none";
                }

                // Populate the list view
                populateListView(previewContainer, previewImage);
            } else {
                resumeRenderer(); // Resume renderer when returning to 3D view
                viewToggle.classList.remove("active");
                listView.classList.remove("active");

                // Hide blur layer
                if (blur) {
                    blur.classList.add("hide");
                }

                // Re-enable pointer events on canvas
                if (threeCanvas) {
                    threeCanvas.style.pointerEvents = "auto";
                }
            }
        });
    }

    // Initialize sorting functionality
    initTableSorting(previewContainer, previewImage);
}

function initTableSorting(previewContainer, previewImage) {
    const tableHeaders = document.querySelectorAll(".list-view-table th[data-sort]");

    // Set default sort by year descending
    sortProjects("year", "desc");
    populateListView(previewContainer, previewImage);

    // Update sort indicators for all headers
    const updateSortIndicators = (activeHeader) => {
        tableHeaders.forEach((header) => {
            const indicator = header.querySelector(".sort-indicator");
            if (indicator) {
                if (header === activeHeader) {
                    // Show arrow based on current sort direction
                    if (header.classList.contains("sort-desc")) {
                        indicator.textContent = "↓";
                    } else {
                        indicator.textContent = "↑";
                    }
                } else {
                    // Keep the indicator but with lower opacity
                    indicator.textContent = "↑";
                }
            }
        });
    };

    // Set initial sort indicators
    const yearHeader = document.querySelector('.list-view-table th[data-sort="year"]');
    yearHeader.classList.add("sort-active", "sort-desc");
    updateSortIndicators(yearHeader);

    tableHeaders.forEach((header) => {
        header.addEventListener("click", function () {
            const column = this.getAttribute("data-sort");
            const isCurrentlyDesc = this.classList.contains("sort-desc");
            const newOrder = isCurrentlyDesc ? "asc" : "desc";

            // Update sort classes
            tableHeaders.forEach((h) => {
                h.classList.remove("sort-active", "sort-asc", "sort-desc");
            });

            this.classList.add("sort-active", `sort-${newOrder}`);

            // Update sort indicators
            updateSortIndicators(this);

            // Sort projects
            sortProjects(column, newOrder);

            // Repopulate the list view with the sorted projects
            populateListView(previewContainer, previewImage);
        });
    });
}

function populateListView(previewContainer, previewImage) {
    const tableBody = document.querySelector(".list-view-table tbody");

    if (tableBody) {
        // Clear existing rows
        tableBody.innerHTML = "";

        // Add a row for each project
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
                row.addEventListener("mouseenter", (e) => {
                    previewImage.src = project.content.images[0];
                    previewContainer.style.left = `${e.clientX}px`;
                    previewContainer.style.top = `${e.clientY}px`;
                    previewContainer.classList.add("show");
                });

                row.addEventListener("mousemove", (e) => {
                    previewContainer.style.left = `${e.clientX}px`;
                    previewContainer.style.top = `${e.clientY}px`;
                });

                row.addEventListener("mouseleave", () => {
                    previewContainer.classList.remove("show");
                });
            }

            // Add click event to row to open project
            row.addEventListener("click", function () {
                const viewToggle = document.querySelector(".view-toggle");
                const listView = document.querySelector(".list-view");
                const threeCanvas = document.querySelector(".three-canvas");
                const blur = document.getElementById("blur");

                if (viewToggle) viewToggle.classList.remove("active");
                if (listView) listView.classList.remove("active");
                if (threeCanvas) threeCanvas.style.pointerEvents = "auto";

                // Keep the blur layer visible when transitioning to project card
                // (Don't add the hide class to the blur element)

                document.dispatchEvent(
                    new CustomEvent("open-project", {
                        detail: { projectId: project.id },
                    })
                );
            });

            tableBody.appendChild(row);
        });
    }
}

function sortProjects(column, order) {
    sortedProjects = [...projects]; // Create a fresh copy

    sortedProjects.sort((a, b) => {
        let valueA, valueB;

        if (column === "title") {
            valueA = a.title.toLowerCase();
            valueB = b.title.toLowerCase();
        } else if (column === "year") {
            valueA = parseInt(a.year);
            valueB = parseInt(b.year);
        } else if (column === "category") {
            valueA = a.categories[0].toLowerCase();
            valueB = b.categories[0].toLowerCase();
        }

        // Compare the values
        if (valueA < valueB) {
            return order === "asc" ? -1 : 1;
        }
        if (valueA > valueB) {
            return order === "asc" ? 1 : -1;
        }
        return 0;
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
        uiSwitchState("2d");
        document.dispatchEvent(event);
        const card = addProjectCardToPage(projectId, mainContainer);
    }
});

if (isMobileDevice()) {
    if (invertButton) {
        navigator.vibrate(200);
    }
}
