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
            console.log(wasSelected);
            mainContainer.style.pointerEvents = "none";
            blur.classList.toggle("hide"); // toggle the .hide class
            break;
        case "2d":
            console.log("2d");
            console.log(wasSelected);
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

    const slideshow = document.createElement("div");
    slideshow.className = "slideshow-container";
    gallery.appendChild(slideshow);

    const nextBtn = document.createElement("div");
    nextBtn.className = "button-next button";
    nextBtn.innerHTML = '<img src="/assets/UI/next-button.png" alt="" />';
    gallery.appendChild(nextBtn);

    const { showNextImage, imageWrapper } = generateImageSlideshow(project);
    slideshow.appendChild(imageWrapper);
    nextBtn.addEventListener("click", showNextImage);

    closeBtn.addEventListener("click", () => {
        // wasSelected = false;
        uiSwitchState("3d");
        card.remove();
    });

    return card;
}

function generateImageSlideshow(project) {
    const images = project.images;
    let currentImageIndex = 0;
    let loopedOnce = false;
    const numImages = images.length; // Include the duplicated first image
    const imageWrapper = document.createElement("div");
    imageWrapper.classList.add("image-wrapper");
    imageWrapper.innerHTML = images
        .map((image) => `<img src="${image}" alt="" />`)
        .join("");
    // imageWrapper.innerHTML += `<img src="${images[0]}" alt="" />`; // Duplicate the first image

    // if (project.videos.length > 0 || project.gif !== null) {
    //     project.videos.forEach((video) => {
    //         console.log(video);
    //         imageWrapper.innerHTML += video;
    //     });
    //     // console.log("project.videos", project.videos);
    //     // console.log("project.gif", project.gif);
    // }

    function showNextImage() {
        if (currentImageIndex === numImages - 1) {
            currentImageIndex = 0;
            loopedOnce = true;
        } else {
            currentImageIndex++;
        }

        imageWrapper.style.transform = `translateX(-${
            currentImageIndex * 100
        }%)`;
    }

    return { showNextImage, imageWrapper };
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
