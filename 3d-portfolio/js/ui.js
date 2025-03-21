import * as THREE from "three";
import { projects } from "./projects";
import { findObjectById } from "./utils";
import { wasSelected, reverseSelected } from "../main";

export function uiInit() {
    //populate projects with images from projects array
    //initiate navbar
    initNavbar();
    initInvertButton();
    initListViewToggle();
    populateListView();
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
                slideDivs[i].style.transitionDelay =
                    (slideDivs.length - i - 1) * 0.1 + "s";
                slideDivs[i].style.opacity = 0;
                slideDivs[i].style.transform = "translateX(-100%)";
            }
        });
    }
}

function initInvertButton() {
    const buttonInvert = document.querySelector(".button-invert");
    const invert = document.querySelector(".invert");
    let isInverted = false; // Track inversion state
    
    // Ensure invert is hidden on page load
    if (invert) {
        invert.classList.add("hide");
    }
    
    if (buttonInvert) {
        buttonInvert.addEventListener("click", function () {
            // Check if mobile at the time of click, not just at initialization
            const isMobile = window.innerWidth < 768;
            console.log("Invert button clicked, isMobile:", isMobile, "Window width:", window.innerWidth);
            
            // Toggle inversion state
            isInverted = !isInverted;
            
            if (invert) {
                if (isInverted) {
                    // Show invert div
                    invert.classList.remove("hide");
                    
                    // Also add color-inverted class to the list view
                    const listView = document.querySelector('.list-view');
                    if (listView) {
                        listView.classList.add('color-inverted');
                    }
                    
                    // For mobile, use multiple approaches for better compatibility
                    if (isMobile) {
                        // 1. Add class-based approaches
                        document.body.classList.add("inverted-colors");
                        document.body.classList.add("color-inverted"); // CSS variable approach
                        console.log("Added inversion classes to body");
                        
                        // 2. Direct style manipulation approach
                        try {
                            // Apply inversion to body
                            document.body.style.filter = "invert(1) hue-rotate(180deg)";
                            document.body.style.webkitFilter = "invert(1) hue-rotate(180deg)";
                            
                            // Counter-invert images and canvas to prevent double inversion
                            const images = document.querySelectorAll('img');
                            const canvases = document.querySelectorAll('canvas');
                            
                            images.forEach(img => {
                                img.style.filter = "invert(1) hue-rotate(180deg)";
                                img.style.webkitFilter = "invert(1) hue-rotate(180deg)";
                            });
                            
                            canvases.forEach(canvas => {
                                canvas.style.filter = "invert(1) hue-rotate(180deg)";
                                canvas.style.webkitFilter = "invert(1) hue-rotate(180deg)";
                            });
                            
                            console.log("Applied direct style inversion");
                        } catch (e) {
                            console.error("Error applying direct style inversion:", e);
                        }
                    }
                } else {
                    // Hide invert div
                    invert.classList.add("hide");
                    
                    // Remove color-inverted class from the list view
                    const listView = document.querySelector('.list-view');
                    if (listView) {
                        listView.classList.remove('color-inverted');
                    }
                    
                    // For mobile, remove all inversion approaches
                    if (isMobile) {
                        // 1. Remove class-based approaches
                        document.body.classList.remove("inverted-colors");
                        document.body.classList.remove("color-inverted"); // CSS variable approach
                        console.log("Removed inversion classes from body");
                        
                        // 2. Remove direct style manipulation
                        try {
                            // Remove inversion from body
                            document.body.style.filter = "";
                            document.body.style.webkitFilter = "";
                            
                            // Remove counter-inversion from images and canvas
                            const images = document.querySelectorAll('img');
                            const canvases = document.querySelectorAll('canvas');
                            
                            images.forEach(img => {
                                img.style.filter = "";
                                img.style.webkitFilter = "";
                            });
                            
                            canvases.forEach(canvas => {
                                canvas.style.filter = "";
                                canvas.style.webkitFilter = "";
                            });
                            
                            console.log("Removed direct style inversion");
                        } catch (e) {
                            console.error("Error removing direct style inversion:", e);
                        }
                    }
                }
            }
        });
        console.log("Invert button initialized");
    } else {
        console.error("Invert button not found");
    }
}

export function uiSwitchState(mode) {
    const mainContainer = document.querySelector(".main-container");
    const blur = document.querySelector("#blur");
    //switch between 3d and 2d
    switch (mode) {
        case "3d":
            reverseSelected();
            console.log("3d");
            // console.log(wasSelected);
            mainContainer.style.pointerEvents = "none";
            blur.classList.add("hide"); // Always hide blur in 3D mode
            break;
        case "2d":
            console.log("2d");
            // console.log(wasSelected);
            mainContainer.style.pointerEvents = "auto";
            blur.classList.remove("hide"); // Always show blur in 2D mode
            break;
    }
}

//dispatch mouseup event to stop sphere drag when project is open
const event = new MouseEvent("mouseup", {});

export function addProjectCardToPage(projectId, container) {
    const project = findObjectById(projects, projectId);
    if (!project) return;

    const card = createProjectCard(project, container);
    container.appendChild(card);
    
    // Add keyboard navigation for the project card
    setupKeyboardNavigation(card);
    
    return card;
}

// Function to set up keyboard navigation for project cards
function setupKeyboardNavigation(card) {
    // Remove any existing keyboard event listeners to prevent duplicates
    document.removeEventListener('keydown', handleKeyDown);
    
    // Add the keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Handler function for keyboard events
    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            // Find and click the close button
            const closeBtn = card.querySelector('.button-close');
            if (closeBtn) {
                closeBtn.click();
            }
        } else if (event.key === 'ArrowRight') {
            // Find and click the next button
            const nextBtn = card.querySelector('.button-next');
            if (nextBtn) {
                nextBtn.click();
            }
        }
    }
    
    // Store the handler function on the card for cleanup
    card.handleKeyDown = handleKeyDown;
    
    // Clean up the event listener when the card is removed
    const closeBtn = card.querySelector('.button-close');
    if (closeBtn) {
        const originalClickHandler = closeBtn.onclick;
        closeBtn.onclick = function(event) {
            // Call the original handler if it exists
            if (originalClickHandler) {
                originalClickHandler.call(this, event);
            }
            
            // Remove the keyboard event listener
            document.removeEventListener('keydown', card.handleKeyDown);
        };
    }
}

function createProjectCard(project, container) {
    const card = document.createElement("div");
    card.className = "project-card";

    const info = document.createElement("div");
    info.className = "project-info";
    card.appendChild(info);

    const title = document.createElement("div");
    title.className = "project-title text-lg column";
    title.textContent = project.title;
    info.appendChild(title);

    const categories = document.createElement("div");
    categories.className = "project-categories text-sm column";
    categories.textContent = project.categories.join(", ");
    info.appendChild(categories);

    const year = document.createElement("div");
    year.className = "project-year text-sm column";
    year.textContent = project.year;
    info.appendChild(year);

    const description = document.createElement("div");
    description.className = "project-description text-sm column";
    description.textContent = project.description;
    info.appendChild(description);

    const closeBtn = document.createElement("div");
    closeBtn.className = "button-close button";
    closeBtn.innerHTML = '<img src="/assets/UI/close-button.png" alt="" />';
    info.appendChild(closeBtn);

    const gallery = document.createElement("div");
    gallery.className = "project-gallery";
    card.appendChild(gallery);

    const slideshowContainer = document.createElement("div");
    slideshowContainer.className = "slideshow-container";
    gallery.appendChild(slideshowContainer);

    const nextBtn = document.createElement("div");
    nextBtn.className = "button-next button";
    nextBtn.innerHTML = '<img src="/assets/UI/next-button.png" alt="" />';
    gallery.appendChild(nextBtn);

    const slides = generateGallery(project, slideshowContainer);

    // Preload images when the gallery is opened
    preloadImages(project);

    // Initial setup: position all slides except the first one off-screen to the right
    slides.forEach((slide, index) => {
        slide.style.position = 'absolute';
        slide.style.top = '0';
        slide.style.left = '0';
        
        if (index === 0) {
            // First slide is visible
            slide.style.transform = 'translateX(0)';
        } else {
            // All other slides are off-screen to the right
            slide.style.transform = 'translateX(100%)';
        }
    });

    nextBtn.addEventListener("click", showNextSlide);

    let currentIndex = 0;

    function preloadImages(project) {
        const images = project.content.images;
        images.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }

    function showNextSlide() {
        // Calculate the index of the next slide
        const nextIndex = (currentIndex + 1) % slides.length;
        
        // Always create the infinite scrolling effect
        // 1. Position the next slide off-screen to the right
        slides[nextIndex].style.transition = 'none';
        slides[nextIndex].style.transform = 'translateX(100%)';
        
        // Force reflow to ensure the position is set before starting animation
        slides[nextIndex].offsetHeight;
        
        // 2. Move the current slide out to the left
        slides[currentIndex].style.transition = 'transform 0.3s ease-in-out';
        slides[currentIndex].style.transform = 'translateX(-100%)';
        
        // 3. Animate the next slide in from the right
        slides[nextIndex].style.transition = 'transform 0.3s ease-in-out';
        slides[nextIndex].style.transform = 'translateX(0)';
        
        // Update the current index
        currentIndex = nextIndex;
    }

    closeBtn.addEventListener("click", closeCard);

    function closeCard() {
        uiSwitchState("3d");
        card.remove();
    }

    return card;
}

function generateGallery(project, slideshowContainer) {
    const images = project.content.images;
    const videos = project.content.videos;
    const gifs = project.content.gifs;

    let slides = [];

    let numSlides = images.length;
    if (videos !== undefined && videos.length > 0) numSlides += videos.length;
    if (gifs !== undefined && gifs.length > 0) numSlides += gifs.length;

    for (let i = 0; i < numSlides; i++) {
        const slide = document.createElement("div");
        slide.className = "slide";
        
        if (i < images.length) {
            slide.innerHTML = `<img src="${images[i]}" alt="" />`;
        } else if ("videos" in project.content && videos.length > 0) {
            slide.innerHTML = `${videos[i - images.length]}`;
        } else if ("gifs" in project.content && gifs.length > 0) {
            slide.innerHTML = `<img src="${gifs[0]}" alt="" />`;
        }

        // Set initial position
        slide.style.transform = i === 0 ? 'translateX(0)' : 'translateX(100%)';
        
        slideshowContainer.appendChild(slide);
        slides.push(slide);
    }

    return slides;
}

export function addCursorStyles(camera, cubes) {
    console.log(camera, cubes);

    const raycaster = new THREE.Raycaster();
    window.addEventListener("mousemove", (e) => {
        raycaster.setFromCamera(
            new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                (-e.clientY / window.innerHeight) * 2 + 1
            ),
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
    const viewToggle = document.querySelector('.view-toggle');
    const listView = document.querySelector('.list-view');
    const threeCanvas = document.querySelector('.three-canvas');
    let isListViewActive = false;

    if (viewToggle && listView) {
        viewToggle.addEventListener('click', function() {
            isListViewActive = !isListViewActive;
            
            if (isListViewActive) {
                viewToggle.classList.add('active');
                listView.classList.add('active');
                if (threeCanvas) {
                    threeCanvas.classList.add('hide');
                }
            } else {
                viewToggle.classList.remove('active');
                listView.classList.remove('active');
                if (threeCanvas) {
                    threeCanvas.classList.remove('hide');
                }
            }
        });
    }
    
    // Initialize sorting functionality
    initTableSorting();
}

// Global variables to keep track of sorting state
let sortField = 'year';
let sortDirection = 'desc';
let sortedProjects = []; // Initialize empty, will be filled on first sort

function initTableSorting() {
    const tableHeaders = document.querySelectorAll('.list-view-table th[data-sort]');
    
    if (tableHeaders) {
        // Set initial sorting state - year is active by default, title should have 40% opacity
        updateSortIndicators();
        
        // Add click event to headers
        tableHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const field = this.getAttribute('data-sort');
                
                // Toggle sort direction if clicking the same header again
                if (field === sortField) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortField = field;
                    sortDirection = 'asc';
                }
                
                // Sort and repopulate the list
                sortProjects();
                populateListView();
            });
        });
    }
}

function sortProjects() {
    sortedProjects = [...projects]; // Create a fresh copy
    
    sortedProjects.sort((a, b) => {
        let valueA, valueB;
        
        if (sortField === 'title') {
            valueA = a.title.toLowerCase();
            valueB = b.title.toLowerCase();
        } else if (sortField === 'year') {
            valueA = parseInt(a.year);
            valueB = parseInt(b.year);
        } else if (sortField === 'category') {
            valueA = a.categories[0].toLowerCase();
            valueB = b.categories[0].toLowerCase();
        }
        
        // Compare the values
        if (valueA < valueB) {
            return sortDirection === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

function populateListView() {
    const tableBody = document.querySelector('.list-view-table tbody');
    
    if (tableBody) {
        // Sort projects first
        if (sortedProjects.length === 0) {
            sortProjects(); // Initial sort
        }
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // Update header indicators
        updateSortIndicators();
        
        // Add a row for each project
        sortedProjects.forEach(project => {
            const row = document.createElement('tr');
            
            // Create and add title cell
            const titleCell = document.createElement('td');
            titleCell.textContent = project.title;
            row.appendChild(titleCell);
            
            // Create and add category cell
            const categoryCell = document.createElement('td');
            categoryCell.textContent = project.categories.join(', ');
            row.appendChild(categoryCell);
            
            // Create and add year cell
            const yearCell = document.createElement('td');
            yearCell.textContent = project.year;
            row.appendChild(yearCell);
            
            // Add click event to row to open project
            row.addEventListener('click', function() {
                // Close list view first
                const viewToggle = document.querySelector('.view-toggle');
                const listView = document.querySelector('.list-view');
                const threeCanvas = document.querySelector('.three-canvas');
                
                if (viewToggle) viewToggle.classList.remove('active');
                if (listView) listView.classList.remove('active');
                if (threeCanvas) threeCanvas.classList.remove('hide');
                
                // Simulate click on the cube to open project card
                document.dispatchEvent(new CustomEvent('open-project', { 
                    detail: { projectId: project.id }
                }));
            });
            
            tableBody.appendChild(row);
        });
    }
}

function updateSortIndicators() {
    // Reset all headers
    const allHeaders = document.querySelectorAll('.list-view-table th[data-sort]');
    allHeaders.forEach(header => {
        header.classList.remove('sort-active');
        
        // Find the sort indicator span
        const indicator = header.querySelector('.sort-indicator');
        if (indicator) {
            indicator.style.transform = 'rotate(0deg)';
            indicator.style.transition = 'transform 0.55s ease-in-out';
        }
    });
    
    // Update the active header
    const activeHeader = document.querySelector(`.list-view-table th[data-sort="${sortField}"]`);
    if (activeHeader) {
        activeHeader.classList.add('sort-active');
        
        // Update sort indicator rotation
        const indicator = activeHeader.querySelector('.sort-indicator');
        if (indicator) {
            indicator.style.transform = sortDirection === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)';
            indicator.style.transition = 'transform 0.55s ease-in-out';
        }
    }
}

// Add event listener for the custom 'open-project' event
document.addEventListener('open-project', function(e) {
    if (e.detail && e.detail.projectId) {
        const mainContainer = document.querySelector('.main-container');
        const projectId = e.detail.projectId;
        
        // Similar to what happens when a cube is clicked
        uiSwitchState('2d');
        document.dispatchEvent(event);
        const card = addProjectCardToPage(projectId, mainContainer);
    }
});
