window.addEventListener("load", function () {
    const fadeElement = document.getElementById("fade");
    setTimeout(function () {
        fadeElement.classList.add("fade-out");
    }, 770);

    // Listen for the 'transitionend' event and remove the element once the fade-out animation is complete
    fadeElement.addEventListener("transitionend", function () {
        fadeElement.remove();
    });
});
