import content from "../src/content.json";

export class Navbar {
    constructor() {
        this.element = document.querySelector(".navbar-hint");
        if (!this.element) {
            console.warn("Navbar element not found");
            return;
        }
    }

    hide() {
        if (!this.element) return;
        
        // Store a reference to the element before removing it
        const element = this.element;
        this.element = null;
        
        element.classList.add("fade-out");
        element.addEventListener("transitionend", () => {
            if (element && element.classList.contains("fade-out")) {
                element.remove();
            }
        }, { once: true });
    }

    isVisible() {
        return this.element && !this.element.classList.contains("fade-out");
    }
} 