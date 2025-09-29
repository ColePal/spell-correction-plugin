async function acceptChangeRequest(feedback, isAccepted, correction) {
    console.log("QUERYIDENTIFIER", correction.identifier)

        const data = JSON.stringify({
            "identifier": correction.identifier,
            "accept": isAccepted,
            "feedback": feedback
        })

    const acceptChangeUrl = window.acceptChangeUrl;
        const csrfToken = getCookie("csrftoken");
        try {
            let response = await fetch(acceptChangeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: data
            })
            if (!response.ok) {
                const text = await response.text();
                console.error("Server error:", response.status, text);
                return;
            }

            const queryResponse = await response.json();
            //let misspelledWords = findMisspelledWords(queryResponse);
            console.log("Feedback response:", queryResponse);
            return queryResponse;
        } catch (error) {
            console.log(error);
        }
}

function createCorrectionPanel(correction, span, parent, plainText, inputId, errorMap) {

    //Correction panel that holds the "corrected word", accept and reject buttons

    const correctionPanel = document.createElement("div")
    correctionPanel.className = "correction-panel"
    const rect = span.getBoundingClientRect();
    // position left edge same as span
    correctionPanel.style.left = rect.left + window.scrollX + "px";
    // position top edge just below span
    correctionPanel.style.top = rect.bottom + 30 + window.scrollY + "px";

    const buttonPanel = document.createElement("div");
    buttonPanel.className = "button-panel";

    //this can be changed to something more attractive
    const correctionText = document.createElement("div")
    correctionText.textContent = correction.correctedText
    const acceptButton = document.createElement("button")
    acceptButton.className = "accept-button"
    acceptButton.textContent = "✔";

    acceptButton.addEventListener("mousedown", async () => {
        const newTextNode = document.createTextNode(correction.correctedText)
        span.replaceWith(newTextNode)
        errorMap.get(inputId).delete(correction.startIndex)
        //previouslySentQueries.set(inputId, plainText)
        parent.removeChild(correctionPanel)
        document.getElementById(inputId).value = parent.innerText
        //onInputEventListener(inputId, previouslySentQueries)
        const el = document.getElementById(inputId);

        // Update the value as you already do
        el.value = parent.innerText;

        // Trigger the input event so listeners fire
        el.dispatchEvent(new Event("input", { bubbles: true }));

        if (correction.queryIdentifier === 0) {
            return
        }

        await acceptChangeRequest("", true, correction)

    })

    const rejectButton = document.createElement("button")
    rejectButton.className = "reject-button";
    rejectButton.textContent = "✖";

    rejectButton.addEventListener("mousedown", async () => {
        correctionPanel.style.visibility = "hidden"
        errorMap.get(inputId).delete(correction.startIndex)
        blackList.get(inputId).set(correction.startIndex, correction)
        parent.removeChild(correctionPanel)
        const newTextNode = document.createTextNode(correction.originalText)
        span.replaceWith(newTextNode)
        executeAllChanges(inputId)

        if (correction.identifier === 0) {
            return
        }

        await acceptChangeRequest("", false, correction)
    })
    correctionPanel.appendChild(correctionText)

    buttonPanel.appendChild(acceptButton)
    buttonPanel.appendChild(rejectButton)
    correctionPanel.appendChild(buttonPanel)

    parent.appendChild(correctionPanel)
    console.log("correctionPanel", correctionPanel)
    return correctionPanel
}

export default function updateHighlightedWords(inputId, errorMap) {

    //sort the corrections by index so that they can be applied in reverse order.
    const corrections = [...errorMap.get(inputId).values()].sort((a, b) => b.startIndex - a.startIndex);
    //don't do anything
    if (!corrections || corrections.length === 0) return;

    let shadowDiv = document.getElementById(inputId + "-lmspelldiv");
    let inputElement = document.getElementById(inputId)

    //const plainText = shadowDiv.innerText;
    const plainText = inputElement.value
    shadowDiv.textContent = "";

    const words = plainText.split(/\s+/);

    corrections.forEach((correction) => {
        const numberOfTargetedWords = correction.originalText.split(" ").length;
        const startIndex = correction.startIndex;

        //const targetWords = words.slice(startIndex, startIndex + numberOfTargetedWords);

        const targetWords = words
        .slice(startIndex, startIndex + numberOfTargetedWords)
        .map(w => (typeof w === "string" ? w : w.textContent));

        const span = document.createElement("span");
        span.className = correction.type;
        span.textContent = targetWords.join(" ");
        const correctionPanel = createCorrectionPanel(correction, span, shadowDiv, plainText, inputId, errorMap)

        span.addEventListener("mousedown", () => {
            if (correctionPanel.style.visibility === "visible") {
                correctionPanel.style.visibility = "hidden"
            } else {
                correctionPanel.style.visibility = "visible"
            }

        })

        words.splice(startIndex, numberOfTargetedWords, span);

    });
    words.forEach((word, i) => {
        if (typeof word === "string") {
            shadowDiv.appendChild(document.createTextNode(word));
        } else {
            shadowDiv.appendChild(word); // span element
        }
        if (i < words.length - 1) {
            shadowDiv.appendChild(document.createTextNode(" ")); // restore spaces
        }
    });
}