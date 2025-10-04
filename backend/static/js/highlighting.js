import {executeAllChanges, CorrectionType} from "./frontendOutput.js";
//import {CorrectionType} from "./frontendOutput";

async function acceptChangeRequest(feedback, isAccepted, correction) {
    console.log("QUERYIDENTIFIER", correction.identifier)
    if (correction.identifier === 0) {
        return
    }

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

function createCorrectionPanel(correction, span, parent, plainText, inputId, errorMap, blackList, preText, postText) {

    //Correction panel that holds the "corrected word", accept and reject buttons

    const correctionPanel = document.createElement("div")
    correctionPanel.className = "correction-panel"


    const buttonPanel = document.createElement("div");
    buttonPanel.className = "button-panel";

    const correctionText = document.createElement("div");

    // Pre text (grey)
    const preSpan = document.createElement("span");
    preSpan.textContent = preText;
    preSpan.style.color = "grey";

    // Corrected text (highlighted)
    const correctSpan = document.createElement("span");
    correctSpan.textContent = correction.correctedText;

    // Post text (grey)
    const postSpan = document.createElement("span");
    postSpan.textContent = postText;
    postSpan.style.color = "grey";

    // Append in order
    correctionText.appendChild(preSpan);
    correctionText.appendChild(correctSpan);
    correctionText.appendChild(postSpan);

    //correctionText.textContent = preText + " " + correction.correctedText + " " + postText;
    const feedbackButton = document.createElement("button");
    feedbackButton.className = "feedback-button";
    feedbackButton.textContent = "Feedback";

    const feedbackBox = document.createElement("textarea");
    feedbackBox.hidden = true;
    feedbackBox.style.width = "100%";
    let feedbackToggle = true;
    feedbackButton.addEventListener("mousedown", async () => {
        if (!feedbackToggle) {
            feedbackBox.hidden = true;
            feedbackToggle = !feedbackToggle;
        } else {
            feedbackBox.hidden = false;
            feedbackToggle = !feedbackToggle;
        }
    })

    const acceptButton = document.createElement("button")
    acceptButton.className = "accept-button bg-primary"
    acceptButton.textContent = "Accept";

    const input = document.getElementById(inputId);

    acceptButton.addEventListener("mousedown", async () => {
        if (correction.type !== CorrectionType.INSERTION ) {
            const newTextNode = document.createTextNode(correction.correctedText)
            span.replaceWith(newTextNode)
        } else {
            let newTextNode = null;
            if (parent.firstChild === span) {
                newTextNode = document.createTextNode(correction.correctedText + " ");
            } else {
                newTextNode = document.createTextNode(correction.correctedText);
            }
            const spanTextNode = document.createTextNode(span.textContent);

            parent.insertBefore(newTextNode,span);
            span.replaceWith(spanTextNode);
        }
        errorMap.get(inputId).delete(correction.startIndex)
        //previouslySentQueries.set(inputId, plainText)
        //parent.removeChild(correctionPanel)
        document.body.removeChild(correctionPanel)
        input.value = parent.innerText
        //onInputEventListener(inputId, previouslySentQueries)

        input.dispatchEvent(new Event("input", { bubbles: true }));

        if (correction.identifier === 0) {
            return
        }

        await acceptChangeRequest(feedbackBox.value, true, correction)

    })

    const rejectButton = document.createElement("button")
    rejectButton.className = "reject-button";
    rejectButton.textContent = "Reject";

    rejectButton.addEventListener("mousedown", async () => {
        correctionPanel.style.visibility = "hidden"
        errorMap.get(inputId).delete(correction.startIndex)
        blackList.get(inputId).set(correction.startIndex, correction)
        //parent.removeChild(correctionPanel)
        document.body.removeChild(correctionPanel)

        const newTextNode = document.createTextNode(correction.originalText)
        span.replaceWith(newTextNode)
        executeAllChanges(inputId, errorMap)

        if (correction.identifier === 0) {
            return
        }

        await acceptChangeRequest(feedbackBox.value, false, correction)
    })
    correctionPanel.appendChild(correctionText)

    buttonPanel.appendChild(feedbackButton)

    const acceptRejectContainer = document.createElement("div");
    acceptRejectContainer.appendChild(rejectButton)
    acceptRejectContainer.appendChild(acceptButton)

    buttonPanel.appendChild(acceptRejectContainer)

    correctionPanel.appendChild(buttonPanel)

    correctionPanel.appendChild(feedbackBox)

    document.body.appendChild(correctionPanel);
    //parent.appendChild(correctionPanel)
    console.log("correctionPanel", correctionPanel)
    return correctionPanel
}

export default function updateHighlightedWords(inputId, errorMap, blackList) {

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

    const spans = new Map();

    corrections.forEach((correction) => {
        const numberOfTargetedWords = correction.originalText.split(" ").length;
        const startIndex = correction.startIndex;

        //const targetWords = words.slice(startIndex, startIndex + numberOfTargetedWords);

        const targetWords = words
        .slice(startIndex, startIndex + numberOfTargetedWords)
        .map(w => (typeof w === "string" ? w : w.textContent));

        function generateRandomId(length = 8) {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let id = '';
          for (let i = 0; i < length; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return id;
        }

        let charIndex = 0;
        for (let i = 0; i < startIndex; i++) {
            charIndex += words[i].length + 1; // +1 for the space
        }

        const span = document.createElement("span");
        span.className = correction.type;
        span.textContent = targetWords.join(" ");
        span.id = generateRandomId()



        const preStart = Math.max(0, charIndex - 20);
        const preText = "..."+plainText.slice(preStart, charIndex);

        const postStart = charIndex + span.textContent.length;
        const postText = plainText.slice(postStart, postStart + 20)+"...";

        const correctionPanel = createCorrectionPanel(correction, span, shadowDiv, plainText, inputId, errorMap, blackList, preText, postText)
        correctionPanel.id = span.id + "-panel";

        let showTimeout, hideTimeout;

        span.addEventListener("mouseenter", () => {
            clearTimeout(hideTimeout); // cancel hiding if moving back fast
            showTimeout = setTimeout(() => {
                correctionPanel.style.visibility = "visible";
            }, 500);
        });
        span.addEventListener("mouseleave", () => {
            clearTimeout(showTimeout);
            startHideTimer();
        });
        correctionPanel.addEventListener("mouseenter", () => {
            clearTimeout(hideTimeout);
        });

        correctionPanel.addEventListener("mouseleave", () => {
            startHideTimer();
        });
        function startHideTimer() {
            hideTimeout = setTimeout(() => {
                correctionPanel.style.visibility = "hidden";
            }, 500);
        }
        words.splice(startIndex, numberOfTargetedWords, span);

        spans.set(span,correctionPanel);

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
    spans.forEach((panel,span) => {

        const spanRect = span.getBoundingClientRect()
        const panelRect = panel.getBoundingClientRect();

        console.log("spanRect",spanRect);

        panel.style.left = (spanRect.left + window.scrollX - (panelRect.width / 2)) + "px";
        panel.style.top = (spanRect.bottom + window.scrollY) + "px";
    })
}