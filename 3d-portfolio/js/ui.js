import * as THREE from "three";
import { projects } from "./projects";
import { findObjectById } from "./utils";
import { wasSelected, reverseSelected } from "../main";

// Global variables
let sortedProjects = [];

export function uiInit() {
    // Initialize sortedProjects with projects array
    sortedProjects = [...projects];
    
    // Initialize UI components
    initNavbar();
    initInvertButton();
    initListViewToggle();
    populateListView();
    
    // Add name click handler
    const nameElement = document.getElementById('name');
    if (nameElement) {
        nameElement.addEventListener('click', () => {
            const viewToggle = document.querySelector('.view-toggle');
            const listView = document.querySelector('.list-view');
            const threeCanvas = document.querySelector('.three-canvas');
            
            if (viewToggle) viewToggle.classList.remove('active');
            if (listView) listView.classList.remove('active');
            if (threeCanvas) threeCanvas.style.pointerEvents = 'auto';
        });
    }
    
    // Add escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const viewToggle = document.querySelector('.view-toggle');
            const listView = document.querySelector('.list-view');
            const threeCanvas = document.querySelector('.three-canvas');
            
            if (viewToggle && viewToggle.classList.contains('active')) {
                viewToggle.classList.remove('active');
                if (listView) listView.classList.remove('active');
                if (threeCanvas) threeCanvas.style.pointerEvents = 'auto';
            }
        }
    });

    // Add about button click handler
    const aboutButton = document.querySelector('.about-button');
    const aboutCard = document.querySelector('.about-card');
    
    if (aboutButton && aboutCard) {
        aboutButton.addEventListener('click', () => {
            aboutCard.classList.add('show');
            document.querySelector('.navbar').classList.add('project-card-open');
            document.querySelector('.three-canvas').style.pointerEvents = 'none';
        });

        // Add close button click handler for about card
        aboutCard.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                closeAboutCard();
            }
        });
    }
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
    
    if (buttonInvert && invert) {
        buttonInvert.addEventListener("click", () => {
            invert.classList.toggle("show");
        });
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

    // Add close button functionality
    const closeButton = card.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            document.querySelector('.navbar').classList.remove('project-card-open');
            card.remove();
        });
    }

    // Add project-card-open class to navbar
    document.querySelector('.navbar').classList.add('project-card-open');

    // Initial state - positioned below
    card.style.transform = 'translateY(100%)';
    card.style.opacity = '0';
    card.style.visibility = 'hidden';

    // Force a reflow to ensure the initial state is applied
    card.offsetHeight;

    // Animate in
    requestAnimationFrame(() => {
        card.style.transform = 'translateY(0)';
        card.style.opacity = '1';
        card.style.visibility = 'visible';
    });
    
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
        // Remove project-card-open class from navbar
        document.querySelector('.navbar').classList.remove('project-card-open');
        
        // Animate out
        card.style.transform = 'translateY(100%)';
        card.style.opacity = '0';
        
        // Wait for animation to complete before removing
        setTimeout(() => {
            uiSwitchState("3d");
            card.remove();
        }, 175); // Match the CSS transition duration
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

    // Create preview container and image
    const previewContainer = document.createElement('div');
    previewContainer.className = 'list-view-preview';
    const previewImage = document.createElement('img');
    previewContainer.appendChild(previewImage);
    document.body.appendChild(previewContainer);

    if (viewToggle && listView) {
        viewToggle.addEventListener('click', function() {
            isListViewActive = !isListViewActive;
            
            if (isListViewActive) {
                viewToggle.classList.add('active');
                listView.classList.add('active');
                
                // Disable pointer events on canvas
                if (threeCanvas) {
                    threeCanvas.style.pointerEvents = 'none';
                }
                
                // Populate the list view
                populateListView(previewContainer, previewImage);
            } else {
                viewToggle.classList.remove('active');
                listView.classList.remove('active');
                
                // Re-enable pointer events on canvas
                if (threeCanvas) {
                    threeCanvas.style.pointerEvents = 'auto';
                }
            }
        });
    }
    
    // Initialize sorting functionality
    initTableSorting(previewContainer, previewImage);
}

function initTableSorting(previewContainer, previewImage) {
    const tableHeaders = document.querySelectorAll('.list-view-table th[data-sort]');
    
    // Set default sort by year descending
    sortProjects('year', 'desc');
    populateListView(previewContainer, previewImage);
    
    // Update sort indicators for all headers
    const updateSortIndicators = (activeHeader) => {
        tableHeaders.forEach(header => {
            const indicator = header.querySelector('.sort-indicator');
            if (indicator) {
                if (header === activeHeader) {
                    // Show arrow based on current sort direction
                    if (header.classList.contains('sort-desc')) {
                        indicator.textContent = '↓';
                    } else {
                        indicator.textContent = '↑';
                    }
                } else {
                    // Keep the indicator but with lower opacity
                    indicator.textContent = '↑';
                }
            }
        });
    };
    
    // Set initial sort indicators
    const yearHeader = document.querySelector('.list-view-table th[data-sort="year"]');
    yearHeader.classList.add('sort-active', 'sort-desc');
    updateSortIndicators(yearHeader);
    
    tableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const column = this.getAttribute('data-sort');
            const isCurrentlyDesc = this.classList.contains('sort-desc');
            const newOrder = isCurrentlyDesc ? 'asc' : 'desc';
            
            // Update sort classes
            tableHeaders.forEach(h => {
                h.classList.remove('sort-active', 'sort-asc', 'sort-desc');
            });
            
            this.classList.add('sort-active', `sort-${newOrder}`);
            
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
    const tableBody = document.querySelector('.list-view-table tbody');
    
    if (tableBody) {
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // Add a row for each project
        sortedProjects.forEach(project => {
            const row = document.createElement('tr');
            row.id = project.id;
            
            // Create and add cells
            const titleCell = document.createElement('td');
            titleCell.textContent = project.title;
            row.appendChild(titleCell);
            
            const categoryCell = document.createElement('td');
            categoryCell.textContent = project.categories.join(', ');
            row.appendChild(categoryCell);
            
            const yearCell = document.createElement('td');
            yearCell.textContent = project.year;
            row.appendChild(yearCell);
            
            // Add hover events for preview
            if (project.content && project.content.images && project.content.images.length > 0) {
                row.addEventListener('mouseenter', (e) => {
                    previewImage.src = project.content.images[0];
                    previewContainer.style.left = `${e.clientX}px`;
                    previewContainer.style.top = `${e.clientY}px`;
                    previewContainer.classList.add('show');
                });
                
                row.addEventListener('mousemove', (e) => {
                    previewContainer.style.left = `${e.clientX}px`;
                    previewContainer.style.top = `${e.clientY}px`;
                });
                
                row.addEventListener('mouseleave', () => {
                    previewContainer.classList.remove('show');
                });
            }
            
            // Add click event to row to open project
            row.addEventListener('click', function() {
                const viewToggle = document.querySelector('.view-toggle');
                const listView = document.querySelector('.list-view');
                const threeCanvas = document.querySelector('.three-canvas');
                
                if (viewToggle) viewToggle.classList.remove('active');
                if (listView) listView.classList.remove('active');
                if (threeCanvas) threeCanvas.style.pointerEvents = 'auto';
                
                document.dispatchEvent(new CustomEvent('open-project', { 
                    detail: { projectId: project.id }
                }));
            });
            
            tableBody.appendChild(row);
        });
    }
}

function sortProjects(column, order) {
    sortedProjects = [...projects]; // Create a fresh copy
    
    sortedProjects.sort((a, b) => {
        let valueA, valueB;
        
        if (column === 'title') {
            valueA = a.title.toLowerCase();
            valueB = b.title.toLowerCase();
        } else if (column === 'year') {
            valueA = parseInt(a.year);
            valueB = parseInt(b.year);
        } else if (column === 'category') {
            valueA = a.categories[0].toLowerCase();
            valueB = b.categories[0].toLowerCase();
        }
        
        // Compare the values
        if (valueA < valueB) {
            return order === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
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

function closeAboutCard() {
    const aboutCard = document.querySelector('.about-card');
    document.querySelector('.navbar').classList.remove('project-card-open');
    document.querySelector('.three-canvas').style.pointerEvents = 'auto';
    aboutCard.classList.remove('show');
    setTimeout(() => {
        aboutCard.style.transform = 'translateY(100%)';
    }, 350);
}
