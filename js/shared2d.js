let allJointsUI = [[30, 2]];
let jointsNow = 0;
let fk = true; // false means using ik
let panX = 0, panY = 0, zoom = 1; // viewport offset + zoom, global so the canvas code can use them

let relative = true, bounded = true;

let jointColorsInOrder = [
    "rgba(248, 47, 47, 1)",
    "rgba(47, 154, 248, 1)",
    "rgba(47, 248, 64, 1)",
    "rgba(248, 218, 47, 1)",
    "rgba(213, 61, 243, 1)",
    "rgba(255, 255, 255, 1)"
];

let transparentJointColorsInOrder = [
    "rgba(248, 47, 47, 0.4)",
    "rgba(47, 154, 248, 0.4)",
    "rgba(47, 248, 64, 0.4)",
    "rgba(248, 218, 47, 0.4)",
    "rgba(213, 61, 243, 0.4)",
    "rgba(255, 255, 255, 0.4)"
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
                <input type="range" min="0.2" max="5" step="0.1" value="2" id="sliderInputJointLength${jointIndex}">
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



    // Syncs between slider + numberical input
    // Sliders use input and boxes use change because boxes can actually go out of bounds and should only
    // update once users click off. Sliders are locked so are safe to use input

    jointList.addEventListener("input", (event) => {
        if (event.target.type !== "range") return;
        const box = event.target.closest(".jointParameter").querySelector("input[type=number]");
        box.value = event.target.value;
        draw();

    });
    jointList.addEventListener("change", (event) => {
        const box = event.target;
        if (box.type !== "number") return;


        if (box.id.startsWith("numberInputJointLength")) {
            box.value = Math.min(5, Math.max(0, box.value));
        }

        box.closest(".jointParameter").querySelector("input[type=range]").value = box.value;
        draw();
    });




    addJointButton.addEventListener("click", () => {
        if (jointsNow == 6) {
            return
        }
        addJointToList(jointList);
        jointsNow++;
        draw();
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
        draw();


        if (jointsNow == 0) {
            jointList.insertAdjacentHTML("beforeend", emptyJointListElementHTML)
        }
    });















    // Zooming and panning while adjusting ground line
    const viewport = document.querySelector(".viewport")
    const groundLine = viewport.querySelector(".groundLine")

    const gridSizes = [200, 200, 40, 40];

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
        draw();
        
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
        draw()

    });


    ["pointerup", "pointercancel"].forEach(eventName => viewport.addEventListener(eventName, () => {
        dragging = false;
        viewport.classList.remove("dragging");
    }));
    window.addEventListener("resize", updateViewArea);
    updateViewArea();

});


// Toggling on and off the relative and absolute, bounded/unbounded
function relativeToggle(t) {
    relative = t;
    if (t) {
        document.getElementById("relativeAngleOption").classList.add("chosen");
        document.getElementById("absoluteAngleOption").classList.remove("chosen");
    } else {
        document.getElementById("absoluteAngleOption").classList.add("chosen");
        document.getElementById("relativeAngleOption").classList.remove("chosen");
    }

    draw();
}

function boundedToggle(t) {
    bounded = t;
    if (t) {
        document.getElementById("boundedYesOption").classList.add("chosen");
        document.getElementById("boundedNoOption").classList.remove("chosen");
    } else {
        document.getElementById("boundedNoOption").classList.add("chosen");
        document.getElementById("boundedYesOption").classList.remove("chosen");
    }

    draw();
}













// Drawing the robot
let canvas, c;
window.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("scene");
    c = canvas.getContext('2d');

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(canvas.clientWidth * dpr);
        canvas.height = Math.round(canvas.clientHeight * dpr);
        c.setTransform(dpr, 0, 0, dpr, 0, 0);

        draw();
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
})

function getData() {
    // Data format: [[Joint angle, joint length] ... ]
    let allJointsData = [];

    for (let i = 0; i < jointsNow; i++) {
        allJointsData.push([
            document.getElementById(`numberInputJointTheta${i}`).value,
            document.getElementById(`numberInputJointLength${i}`).value
        ])
    }

    return allJointsData;
}


function draw() {
    c.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    const originX = canvas.clientWidth / 2 + panX;
    const originY = canvas.clientHeight / 2 + canvas.clientHeight * 0.22 * zoom + panY;
    // Progressive variables vote blue and keep track of where the last joint point. New freezer is the b
    let angle = 0, progressiveX = originX, progressiveY = originY;

    const allJointsData = getData();


    // Draw joints and rotation points
    for (let i = 0; i < jointsNow; i++) {
        // Adding every joint together
        const previousAngle = relative ? angle : 0;
        angle = previousAngle + parseFloat(allJointsData[i][0]) * Math.PI / 180;

        const length = parseFloat(allJointsData[i][1]) * 100 * zoom; // 100px per length unit

        // Bounded adjusts all of the 
        if (bounded) {
            const minSin = (progressiveY - originY) / length; // always go with the lowest sin(angle) that stays above ground
            if (minSin > -1 && Math.sin(angle) < minSin) {
                const limit = Math.asin(minSin);

                angle = Math.cos(angle) >= 0 ? limit : Math.PI - limit; // snap to the nearer edge + correct with ui
                const theta = Math.round(((((angle - previousAngle) * 180 / Math.PI) % 360) + 540) % 360 - 180);
                document.getElementById(`numberInputJointTheta${i}`).value = theta;
                document.getElementById(`sliderInputJointTheta${i}`).value = theta;
            }
        }

        const nextX = progressiveX + Math.cos(angle) * length;
        const nextY = progressiveY - Math.sin(angle) * length;

        c.beginPath();
        c.moveTo(progressiveX, progressiveY);
        c.lineTo(nextX, nextY);
        c.lineWidth = 8 * zoom;
        c.strokeStyle = transparentJointColorsInOrder[i];
        c.stroke();

        if (i == jointsNow - 1) {
            // If this is the last joint, then we draw a gripper instead
            // Gripper shape is just a circle with a square cut out inside of it that goes to the diameter with a set width
            // Set width can be adjusted for the illusion of gripping

            
            // Gripper drawing
            const gripperRadius = 50 * zoom;
            const gripWidth = 30 * zoom

            c.save();
            c.translate(nextX, nextY);
            c.rotate(-angle);

            c.beginPath();
            c.arc(0, 0, gripperRadius, 0, 2 * Math.PI);
            c.clip(); // keeps the cutout's corners from poking outside the circle

            c.beginPath();
            c.arc(0, 0, gripperRadius, 0, 2 * Math.PI);
            c.rect(0, -gripWidth / 2, gripperRadius, gripWidth);
            c.fillStyle = jointColorsInOrder[i];
            c.fill("evenodd"); // the rectangle gets subtracted from the circle

            c.restore();

        } else {
            // Regular joint instead
            c.beginPath();
            c.arc(nextX, nextY, 50 * zoom, 0, 2 * Math.PI);
            c.strokeStyle = "white"
            c.lineWidth = 2;
            c.stroke();
        }



        c.beginPath();
        c.arc(progressiveX, progressiveY, 20 * zoom, 0, 2 * Math.PI);
        c.fillStyle = jointColorsInOrder[i];
        c.fill();

        progressiveX = nextX; progressiveY = nextY;
    }

    // Draw Robot base
    c.beginPath();


    c.arc(originX, originY, 100 * zoom, 0, Math.PI, true);
    c.closePath();
    c.lineWidth = 2;
    c.strokeStyle = 'white';
    c.stroke();


}