import * as THREE from "three";
import { projects } from "./projects";
import { findObjectById } from "./utils";
import { wasSelected, reverseSelected } from "../main";

export function uiInit() {
    //populate projects with images from projects array
    //initiate navbar
    initNavbar();
    initInvertButton();
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
    
    // Ensure invert is hidden on page load
    if (invert) {
        invert.classList.add("hide");
    }
    
    if (buttonInvert) {
        buttonInvert.addEventListener("click", function () {
            if (invert) {
                if (invert.classList.contains("hide")) {
                    invert.classList.remove("hide");
                } else {
                    invert.classList.add("hide");
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
        slide.style.transition = 'transform 0.3s ease-in-out';
        slide.style.position = 'absolute';
        slide.style.top = '0';
        slide.style.left = '0';
        slide.style.transform = index === 0 ? 'translateX(0)' : 'translateX(100%)';
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

        // If we're at the last slide, prepare the first slide to come from the right
        if (nextIndex === 0) {
            // Move all slides except current and first to the right
            slides.forEach((slide, index) => {
                if (index !== currentIndex) {
                    slide.style.transition = 'none';
                    slide.style.transform = 'translateX(100%)';
                }
            });

            // Force reflow to ensure the position is set before starting animation
            slides[0].offsetHeight;

            // Move the current slide out to the left
            slides[currentIndex].style.transition = 'transform 0.3s ease-in-out';
            slides[currentIndex].style.transform = 'translateX(-100%)';

            // After a short delay, animate the first slide in
            setTimeout(() => {
                slides[0].style.transition = 'transform 0.3s ease-in-out';
                slides[0].style.transform = 'translateX(0)';
            }, 50);
        } else {
            // Normal slide transition
            // Move the current slide out to the left
            slides[currentIndex].style.transition = 'transform 0.3s ease-in-out';
            slides[currentIndex].style.transform = 'translateX(-100%)';

            // Move the next slide in from the right
            slides[nextIndex].style.transition = 'transform 0.3s ease-in-out';
            slides[nextIndex].style.transform = 'translateX(0)';
        }

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
