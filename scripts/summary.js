let boardsLS = importandFormatLocalStorageData("boards");

function initSummary() {
    addNameToGoodMorning();
}

function toDoOpen() {}

function addNameToGoodMorning() {
    if (currentUserNameLS !== "Gast") {
        document.getElementById("js-greeting-name").innerHTML = currentUserNameLS;
        document.getElementById("js-greeting-morning").innerText += `,`;
    }
}
