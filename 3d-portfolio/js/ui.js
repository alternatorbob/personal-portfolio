import { projects } from "./projects";
import { findObjectById } from "./utils";
import { wasSelected, reverseSelected } from "../main";

export function uiInit() {
    //populate projects with images from projects array
    //initiate navbar
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
            blur.classList.toggle("hide"); // toggle the .hide class
            break;
        case "2d":
            console.log("2d");
            // console.log(wasSelected);
            mainContainer.style.pointerEvents = "auto";
            blur.classList.toggle("hide"); // toggle the .hide class
            break;
    }
}

//dispatch mouseup event to stop sphere drag when project is open
const event = new MouseEvent("mouseup", {});

export function addProjectCardToPage(project, parent) {
    const card = createProjectCard(project);
    parent.appendChild(card);
    const threeCanvas = document.querySelector(".three-canvas");
    threeCanvas.dispatchEvent(event);
}

function createProjectCard(selectedProject) {
    const project = findObjectById(projects, selectedProject);

    const card = document.createElement("div");
    card.className = "project-card";

    const info = document.createElement("div");
    info.className = "project-info";
    card.appendChild(info);

    const titleGroup = document.createElement("div");
    titleGroup.className = "project-title-group column";
    info.appendChild(titleGroup);

    const category = document.createElement("div");
    category.className = "project-category text-sm text-up";
    category.textContent = project.categories
        .map((category) => `${category} `)
        .join(", ");

    titleGroup.appendChild(category);

    const title = document.createElement("div");
    title.className = "project-title text-lg";
    title.textContent = project.title;
    titleGroup.appendChild(title);

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

    nextBtn.addEventListener("click", showNextSlide);

    let currentIndex = 0;

    function showNextSlide() {
        slides[currentIndex].classList.add("hidden");
        // Calculate the index of the next slide
        currentIndex = (currentIndex + 1) % slides.length;
        // Show the next slide
        slides[currentIndex].classList.remove("hidden");
    }

    closeBtn.addEventListener("click", closeCard);
    // document.addEventListener("keydown", (event) => {
    //     if (event.key === "Escape") {
    //         console.log("Escape ");
    //         closeCard();
    //     }
    // });

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

    let currentIndex = 0;
    let loopedOnce = false;

    let numSlides = images.length;
    if (videos !== undefined && videos.length > 0) numSlides += videos.length;
    if (gifs !== undefined && gifs.length > 0) numSlides += gifs.length;

    console.log("slideshowContainer", slideshowContainer);

    for (let i = 0; i < numSlides; i++) {
        const slide = document.createElement("div");
        slide.className = "slide";
        if (i > 0) slide.classList.add("hidden");
        if (i < images.length) {
            slide.innerHTML = `<img src="${images[i]}" alt="" />`;
        } else if ("videos" in project.content && videos.length > 0) {
            slide.innerHTML = `${videos[i - images.length]}`;
        } else if ("gifs" in project.content && gifs.length > 0) {
            console.log("gifs", gifs);
            slide.innerHTML = `<img src="${gifs[0]}" alt="" />`;
        }

        slideshowContainer.appendChild(slide);
        slides.push(slide);
    }

    return slides;
}

const buttonInvert = document.querySelector(".button-invert");

let nameDiv = document.querySelector(".navbar-name");
let slideDivs = document.querySelectorAll(".slide-div");

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

buttonInvert.addEventListener("click", function () {
    const invert = document.querySelector(".invert");
    if (invert.classList.contains("hide")) {
        invert.classList.remove("hide");
    } else {
        invert.classList.add("hide");
    }
});
