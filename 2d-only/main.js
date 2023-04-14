import "./css/style.css";
import "./css/global_styles.css";

import { projects } from "/js/projects.js";
import { addProjectCardToPage } from "./js/ui";

const mainContainer = document.querySelector(".main-container");
// mainContainer.innerHTML += projectCardTemplate;
// addProjectToCard(projects[0]);

const gridContainer = document.createElement("div");
gridContainer.classList.add("grid-container");
mainContainer.appendChild(gridContainer);

projects.forEach((project) => {
    const gridItem = document.createElement("div");
    gridItem.classList.add("grid-item");
    gridItem.id = project.id;
    gridItem.innerHTML = `${project.title}`;
    gridContainer.appendChild(gridItem);

    gridItem.addEventListener("click", (e) => {
        openProject(gridItem.id);
    });
});

// const gridItems = document.querySelectorAll(".grid-item");
// gridItems.forEach((gridItem) => {
//     gridItem.addEventListener("click", (e) => {
//         openProject(gridItem.id);
//     });
// });

function openProject(id) {
    const selectedProject = projects.find((project) => project.id === id);
    addProjectCardToPage(selectedProject, mainContainer);
    // const projectCardTemplate = generateProjectCardTemplate(selectedProject);
    // const tempCard = document.createElement("div");
    // tempCard.innerHTML = projectCardTemplate;
    // mainContainer.appendChild(tempCard);
    // mainContainer.innerHTML += projectCardTemplate;
}

// gridContainer.style.width = `${Math.ceil(projects.length / 4) * 25}%`;
