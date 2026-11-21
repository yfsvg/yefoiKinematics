let allJointsUI = [[30, 2]];
let jointsNow = 0;
let fk = true; // false means using ik
let panX = 0, panY = 0, zoom = 1; // viewport offset + zoom, global so the canvas code can use them

let relative = true, bounded = false;

let jointTypes = []; // "rotational" or "prismatic" for each joint, same order as the joint list

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
                <span class="jointParameterLabels">θ</span>
                <input type="range" min="-180" max="180" step="1" value="30" id="sliderInputJointTheta${jointIndex}">
                <span class="numberInput thetaInput"><input type="number" class="num" value="30" step="1" id="numberInputJointTheta${jointIndex}"><span class="unit" aria-hidden="true">°</span></span>
            </label>

            <label class="jointParameter">
                <span class="jointParameterLabels">L</span>
                <input type="range" min="0.2" max="5" step="0.1" value="2" id="sliderInputJointLength${jointIndex}">
                <span class="numberInput"><input type="number" class="num" value="2.0" step="0.1" id="numberInputJointLength${jointIndex}"></span>
            </label>

            <label class="jointParameter">
                <span class="jointPrismaticOrRotational">
                    <button id="selectRotationalJointForJoint${jointIndex}">Rotational</button>
                    <button id="selectPrismaticJointForJoint${jointIndex}">Primatic</button>
                </span>
            </label>
        </div>
    `;


    jointListContainer.insertAdjacentHTML('beforeend', jointItem);

    // Limit row only shows up for prismatic joints, it sits where theta was. 
    // In real joints each joint has its max length
    const limitItem = `
        <label class="jointParameter" id="limitParameterForJoint${jointIndex}" style="display: none;">
            <span class="jointParameterLabels">Lim</span>
            <input type="range" min="0.2" max="5" step="0.1" value="5" id="sliderInputJointLimit${jointIndex}">
            <span class="numberInput"><input type="number" class="num" value="5.0" step="0.1" id="numberInputJointLimit${jointIndex}"></span>
        </label>
    `;

    const thetaParameter = document.getElementById(`sliderInputJointTheta${jointIndex}`).closest(".jointParameter");
    thetaParameter.insertAdjacentHTML('afterend', limitItem);

    jointTypes[jointIndex] = "rotational";
    document.getElementById(`selectRotationalJointForJoint${jointIndex}`).classList.add("chosen");

    // adding the option in detailed joint analysis
    const analysisItem = `
        <option value=${jointIndex}>Joint ${jointIndex + 1}</option>
    `
    document.getElementById("jointAnalysisSelect").insertAdjacentHTML("beforeend", analysisItem);
}




// Switches a joint between rotational and prismatic, swapping theta for the limit row

function setJointType(jointIndex, type) {
    jointTypes[jointIndex] = type;


    const thetaParameter = document.getElementById(`sliderInputJointTheta${jointIndex}`).closest(".jointParameter");
    const limitParameter = document.getElementById(`limitParameterForJoint${jointIndex}`);
    const rotationalButton = document.getElementById(`selectRotationalJointForJoint${jointIndex}`);
    const prismaticButton = document.getElementById(`selectPrismaticJointForJoint${jointIndex}`);



    if (type == "prismatic") {
        thetaParameter.style.display = "none";
        limitParameter.style.display = "";
        prismaticButton.classList.add("chosen");
        rotationalButton.classList.remove("chosen");
    } else {
        limitParameter.style.display = "none";
        thetaParameter.style.display = "";
        rotationalButton.classList.add("chosen");
        prismaticButton.classList.remove("chosen");
    }

    draw();



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
        updatePJPT();
    });
    jointList.addEventListener("change", (event) => {
        const box = event.target;
        if (box.type !== "number") return;


        if (box.id.startsWith("numberInputJointLength")) {
            box.value = Math.min(5, Math.max(0, box.value));
        }
        if (box.id.startsWith("numberInputJointLimit")) {
            box.value = Math.min(5, Math.max(0.2, box.value));
        }
        box.closest(".jointParameter").querySelector("input[type=range]").value = box.value;
        draw();
        updatePJPT();
    });

    // Buttons don't fire change events so the joint type buttons get their own click listener
    jointList.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        if (button.id.startsWith("selectRotationalJointForJoint")) {
            setJointType(parseInt(button.id.replace("selectRotationalJointForJoint", "")), "rotational");
        }

        if (button.id.startsWith("selectPrismaticJointForJoint")) {
            setJointType(parseInt(button.id.replace("selectPrismaticJointForJoint", "")), "prismatic");
        }
    });




    addJointButton.addEventListener("click", () => {
        if (jointsNow == 6) {
            return
        }
        addJointToList(jointList);
        jointsNow++;
        draw();
        updatePJPT();
    });

    removeJointButton.addEventListener("click", () => {
        if (jointsNow == 0) {
            return
        }
        jointsNow--;
        jointTypes.length = jointsNow;
        jointList.lastElementChild?.remove();
        const emptyJointListElementHTML = `
            <div class="joint" style="display: flex; align-items: center; justify-content: center; height: 50px;" id="emptyJointListElement">
                <p style="font-size: 12px; opacity: 0.5;">No joints here yet. Press "Add joint" to start the magic.</p>
            </div>
        `
        draw();
        updatePJPT();


        if (jointsNow == 0) {
            jointList.insertAdjacentHTML("beforeend", emptyJointListElementHTML)
        }


        document.getElementById("jointAnalysisSelect").lastElementChild?.remove();
    });


    // Giving UI boxes collapsability
    document.addEventListener('click', e => e.target.closest('.sectionTitle')?.parentElement.classList.toggle('collapsed'));















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
        allJointsData[i].push(document.getElementById(`numberInputJointLimit${i}`).value);
    }

    return allJointsData;
}




function draw() {
    c.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    const originX = canvas.clientWidth / 2 + panX;
    const originY = canvas.clientHeight / 2 + canvas.clientHeight * 0.22 * zoom + panY;
    // Progressive variables keep track of where the last joint point. 
    let angle = 0, progressiveX = originX, progressiveY = originY;

    const allJointsData = getData();


    // Draw joints and rotation points
    for (let i = 0; i < jointsNow; i++) {
        const lastAngle = angle;
        const prismatic = jointTypes[i] == "prismatic";
        // Adding every joint together
        const previousAngle = relative ? angle : 0;
        angle = previousAngle + parseFloat(allJointsData[i][0]) * Math.PI / 180;

        // Special trick with rendering, if its prismatic
        if (prismatic) {
            angle = lastAngle;
        }

        const limit = parseFloat(allJointsData[i][2]);
        if (prismatic) {
            let extension = Math.min(parseFloat(allJointsData[i][1]), limit); //clamp

            // Bounded can't rotate a prismatic joint so it shortens the extension instead
            if (bounded && Math.sin(angle) < 0) {
                const maxExtension = Math.floor((originY - progressiveY) / (-Math.sin(angle) * 100 * zoom) * 10) / 10;
                extension = Math.max(0, Math.min(extension, maxExtension));
            }

            if (extension != parseFloat(allJointsData[i][1])) {
                allJointsData[i][1] = extension;
                document.getElementById(`numberInputJointLength${i}`).value = extension.toFixed(1);
                document.getElementById(`sliderInputJointLength${i}`).value = extension;
            }
        }

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
        if (prismatic) {
            angle = lastAngle; // safety net in case the bounded snap above ever catches a prismatic joint
        }

        const nextX = progressiveX + Math.cos(angle) * length;
        const nextY = progressiveY - Math.sin(angle) * length;

        c.beginPath();
        c.moveTo(progressiveX, progressiveY);
        c.lineTo(nextX, nextY);
        c.lineWidth = 8 * zoom;
        c.strokeStyle = transparentJointColorsInOrder[i];
        c.stroke();

        // darw prsimatic sleeve (behind)
        if (prismatic) {
            const sleeveLength = limit * 100 * zoom;
            const sleeveWidth = 20 * zoom;

            c.save();
            c.translate(progressiveX, progressiveY);
            c.rotate(-angle);

            c.beginPath();
            c.rect(0, -sleeveWidth / 2, sleeveLength, sleeveWidth);
            c.strokeStyle = transparentJointColorsInOrder[i];
            c.lineWidth = 2;
            c.stroke();

            c.restore();
        }

        if (i == jointsNow - 1) {
            // If this is the last joint, then we draw a gripper instead
            // Gripper shape is just a circle with a square cut out inside of it that goes to the diameter with a set width
            // Maybe consider not using the grip mechanism for this project, will be hard to implement in 3D + not super necessary. Cosnider later?

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

    c.beginPath();



    c.arc(originX, originY, 100 * zoom, 0, Math.PI, true);
    c.closePath();
    c.lineWidth = 2;
    c.strokeStyle = 'white';
    c.stroke();




    
}









// "PJPT" is slang for "Per-joint parameter tables"
function updatePJPT() {
    const table = document.getElementById("perJointParameterTable");
    const allJointsData = getData();

    table.style.tableLayout = "fixed";

    const rowCells = {
        index: [],
        type: [],
        relativeAngle: [],
        absoluteAngle: [],
        length: [],
        position: []
    };
    let headerCells = "<th></th>";

    // Make it so that when there are no joints it goes back to the html placeholder using hyphen
    if (jointsNow == 0) {
        headerCells += `
            <th style="opacity: 1;">
                <span class="pjptJointIcon" style="display: inline-block; background-color: ${jointColorsInOrder[0]};"></span>
                Joint 1
            </th>`;

        Object.values(rowCells).forEach(cells => cells.push("-"));

    } else {
        // Same progressive total system to calculate
        let previousAngle = 0;
        let x = 0, y = 0;

        for (let i = 0; i < jointsNow; i++) {
            const isPrismatic = jointTypes[i] == "prismatic";
            const inputAngle = parseFloat(allJointsData[i][0]);
            const length = parseFloat(allJointsData[i][1]);

            let absoluteAngle;
            if (isPrismatic) {
                absoluteAngle = previousAngle;
            } else if (relative) {
                absoluteAngle = previousAngle + inputAngle;
            } else {
                absoluteAngle = inputAngle;
            }
            const relativeAngle = absoluteAngle - previousAngle;

            // Move to the end of this joint
            const radians = absoluteAngle * Math.PI / 180;
            x += length * Math.cos(radians);
            y += length * Math.sin(radians);

            previousAngle = absoluteAngle;



            // Build this joint's column
            headerCells += `
                <th style="opacity: 1;">
                    <span class="pjptJointIcon" style="display: inline-block; background-color: ${jointColorsInOrder[i]};"></span>
                    Joint ${i + 1}
                </th>`;


            rowCells.index.push(i + 1)
            if (isPrismatic) {
                rowCells.type.push("P")
            } else {
                rowCells.type.push("R")
            }
            rowCells.relativeAngle.push(relativeAngle.toFixed(0) + "°")
            rowCells.absoluteAngle.push(absoluteAngle.toFixed(0) + "°")
        
            rowCells.length.push(length.toFixed(1))
            rowCells.position.push(`${x.toFixed(2)}, ${y.toFixed(2)}`)

        }
    }

    // Write headers and body rows
    table.tHead.rows[0].innerHTML = headerCells;
    const bodyRows = table.tBodies[0].rows;

    Object.values(rowCells).forEach((cells, i) => {
        bodyRows[i].innerHTML =
            `<td class="tableStart">${bodyRows[i].cells[0].textContent}</td>` +
            cells.map(value => `<td>${value}</td>`).join("");
    });
}