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

        if (jointsNow == 0) {
            jointList.insertAdjacentHTML("beforeend", emptyJointListElementHTML)
        }
    });


});















