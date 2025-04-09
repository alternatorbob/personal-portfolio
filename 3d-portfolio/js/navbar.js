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
        
        this.element.classList.add("fade-out");
        this.element.addEventListener("transitionend", () => {
            if (this.element.classList.contains("fade-out")) {
                this.element.remove();
                this.element = null;
            }
        }, { once: true });
    }

    isVisible() {
        return this.element && !this.element.classList.contains("fade-out");
    }
} 