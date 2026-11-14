let allJointsUI = [[30, 2]];
let jointsNow = 0;

let jointColorsInOrder = [
    "#F82F2F",
    "#2F9AF8",
    "#2FF840",
    "#F8DA2F",
    "#d53df3",
    "#FFFFFF"
];



function addJointToList(jointListContainer, isGripper) {
    if (jointsNow == 0) {
        document.getElementById("emptyJointListElement").remove();
    }


    const jointIndex = jointsNow;
    const jointItem = `
        <div class="joint">
            <p class="jointName"><span class="dot" style="background-color: ${jointColorsInOrder[jointIndex]};"></span>Joint ${jointIndex + 1}</p>
            <label class="jointParameter">
                <span class="jointParameterLabels">θ<sub>1</sub></span>
                <input type="range" min="-180" max="180" step="1" value="30" id="sliderInputJointTheta${jointIndex}">
                <span class="numberInput thetaInput"><input type="number" class="num" value="30" step="1" id="numberInputJointTheta${jointIndex}"><span class="unit" aria-hidden="true">°</span></span>
            </label>
            <label class="jointParameter">
                <span class="jointParameterLabels">L<sub>1</sub></span>
                <input type="range" min="0.2" max="3" step="0.1" value="2" id="sliderInputJointLength${jointIndex}">
                <span class="numberInput"><input type="number" class="num" value="2.0" step="0.1" id="numberInputJointLength${jointIndex}"></span>
            </label>
        </div>
    `;

    jointListContainer.insertAdjacentHTML('beforeend', jointItem);
}



window.addEventListener("DOMContentLoaded", () => {
    const jointList = document.getElementById("jointList");
    const addJointButton = document.getElementById("addJoint");
    const removeJointButton = document.getElementById("removeJoint");



    // Keeps the slider and number box in each row matched, for all joints
    jointList.addEventListener("input", e => {
        e.target.closest(".jointParameter")?.querySelectorAll("input")
            .forEach(i => i !== e.target && (i.value = e.target.value));
    });

    addJointButton.addEventListener("click", () => {
        if (jointsNow == 6) {
            return
        }
        addJointToList(jointList);
        jointsNow++;
    });


    removeJointButton.addEventListener("click", () => {
        if (jointsNow == 0) {
            return
        }
        jointsNow--;
        jointList.lastElementChild?.remove();
        const emptyJointListElementHTML = `
            <div class="joint" style="display: flex; align-items: center; justify-content: center; height: 50px;" id="emptyJointListElement">
                <p style="font-size: 12px; opacity: 0.5;">No joints here yet. Press "Add joint" to start the magic.</p>
            </div>
        `


        fds
        if (jointsNow == 0) {
            jointList.insertAdjacentHTML("beforeend", emptyJointListElementHTML)
        }
    });








    // Zooming and panning while adjusting ground line
    const viewport = document.querySelector(".viewport")
    const groundLine = viewport.querySelector(".groundLine")
    const originDot = document.getElementById("originThing")

    const gridSizes = [200, 200, 40, 40];

    let panX = 0;
    let panY = 0;
    let zoom = 1;

    let dragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;


    groundLine.style.bottom = "auto"


    function updateViewArea() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        viewport.style.backgroundSize = gridSizes.map(size => `${size * zoom}px ${size * zoom}px`).join(", ");
        viewport.style.backgroundPosition = gridSizes.map(size => `${width / 2 + panX}px ${height / 2 + (height * 0.22 - size) * zoom + panY}px`).join(", ");
        groundLine.style.top = `${height / 2 + height * 0.22 * zoom + panY}px`;
        originDot.style.left = `${width / 2 + panX}px`;
        originDot.style.top = `${height / 2 + height * 0.22 * zoom + panY}px`;
    }
    



    viewport.addEventListener("wheel", e => {
        // Necessary to prevent native browser scrolling behavior with the scroll line and stuff
        e.preventDefault();

        const newZoom = Math.min(5, Math.max(0.2, zoom * Math.exp(-e.deltaY * 0.001)));
        const factor = newZoom / zoom;
        panX = (e.clientX - window.innerWidth / 2) * (1 - factor) + panX * factor;
        panY = (e.clientY - window.innerHeight / 2) * (1 - factor) + panY * factor;
        zoom = newZoom;

        updateViewArea();
        
    }, { passive: false }); // ^^

    viewport.addEventListener("pointerdown", e => {
        if (e.button != 0) {
            return
        }
        dragging = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        viewport.setPointerCapture(e.pointerId);

        viewport.classList.add("dragging");
    });

    

    viewport.addEventListener("pointermove", e => {
        if (!dragging) {
            return
        }
        panX += e.clientX - lastPointerX;
        panY += e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;

        updateViewArea();
    });


    ["pointerup", "pointercancel"].forEach(eventName => viewport.addEventListener(eventName, () => {
        dragging = false;
        viewport.classList.remove("dragging");
    }));
    window.addEventListener("resize", updateViewArea);
    updateViewArea();
});