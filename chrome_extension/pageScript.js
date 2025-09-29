
const rootUrl = "http://localhost:8000";
const spellCheckUrl = rootUrl+"/api/spell-check/";
const acceptChangeUrl = rootUrl+"/api/accept-change/";
const fetchCSRFTokenUrl = rootUrl+"/api/fetch-csrf-token/";

const previouslySentQueries = new Map();


function updateShadowDIV(inputId) {
    let textInput = document.getElementById(inputId);
    let shadowDiv = document.getElementById(inputId+"-lmspelldiv");
    shadowDiv.innerHTML = textInput.value;
    //updateHighlightedWords(inputId);
}

function findAllInput() {
      let textInputs = document.getElementsByTagName("input");
      let textAreas = document.getElementsByTagName("textarea");
      //console.log(inputs);
      let inputs = Array.from(textInputs).concat(Array.from(textAreas));

      // Rob note
      // Without this the model tries and sends "on" when the switch is clicked
      // doing this prevents that
      inputs = inputs.filter(element => {
        return (
            element.tagName.toLowerCase() === "textarea" ||
            (element.tagName.toLowerCase() === "input" &&
            !["checkbox", "radio"].includes(element.type))
        );
      });


      //for each input element found:
      inputs.forEach(element => {

          if (!element.id) {
              element.id = "input-" + Math.random().toString(36).substring(2, 9);
          }

        //add an input event listener for sending to server
        element.addEventListener("input", () => onInputEventListener(element.id, previouslySentQueries))

        previouslySentQueries.set(element.id, "");

        //Add a shadow div for highlighting mischief
        let shadowDiv = document.createElement("div");
        shadowDiv.id = element.id + "-lmspelldiv";
        shadowDiv.className = "shadowDiv"

        shadowDiv.style.position = "absolute";
        shadowDiv.style.zIndex = 2;
        shadowDiv.style.whiteSpace = "pre-wrap";
        shadowDiv.style.overflowWrap = "break-word";
        shadowDiv.style.color = "Black";
        const rect = element.getBoundingClientRect();
        shadowDiv.style.left = rect.left + "px";
        shadowDiv.style.top = rect.top + "px";
        shadowDiv.style.width = rect.width + "px";
        shadowDiv.style.height = rect.height + "px";
        let inputStyle = window.getComputedStyle(element);
        shadowDiv.style.font = inputStyle.font;
        shadowDiv.style.fontWeight = inputStyle.fontWeight;
        shadowDiv.style.fontStyle = inputStyle.fontStyle;
        shadowDiv.style.textDecoration = inputStyle.textDecoration;
        shadowDiv.style.letterSpacing = inputStyle.letterSpacing;
        shadowDiv.style.textTransform = inputStyle.textTransform;
        shadowDiv.style.textAlign = inputStyle.textAlign;

        shadowDiv.style.lineHeight = window.getComputedStyle(element).lineHeight;
        shadowDiv.style.padding = window.getComputedStyle(element).padding;

        function updateOverlay(element, shadowDiv) {
            const rect = element.getBoundingClientRect();
            shadowDiv.style.left = rect.left + window.scrollX + "px";
            shadowDiv.style.top = rect.top + window.scrollY + "px";
            shadowDiv.style.width = rect.width + "px";
            shadowDiv.style.height = rect.height + "px";
        }
        //shadowDiv.style.pointerEvents = "none";
          let observer = new ResizeObserver(() => {
            updateOverlay(element, shadowDiv)
        });
        observer.observe(element);

        let mutationObserver = new MutationObserver(() => {
            updateOverlay(element,shadowDiv)
        })
          mutationObserver.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });

        document.body.appendChild(shadowDiv);

        window.addEventListener("scroll", () => updateOverlay(element,shadowDiv));
        window.addEventListener("resize", () => updateOverlay(element, shadowDiv));



        //add a second input event listener for updating shadowDiv
        element.addEventListener("input", () => updateShadowDIV(element.id))

        //Make it disappear!!
        element.style.background="transparent";
        element.style.color="transparent";
        //but keep the caret because we need to see where we are editing
        element.style.caretColor="black";

        updateShadowDIV(element.id);
      });
    }

//window.findAllInput = findAllInput;
window.addEventListener("load", () => findAllInput());

/*
This script is an OnInputEventHandler. When the user interacts with an input,
this script is going to decide when is a good time to send a query to the server,
receive the response and make changes to the text using the response.
 */


//indices are calculated on a word by word basis. If a word is longer than the context window,
//there might be some troubles
const CONTEXT_WINDOW_SIZE = 50;

//There two maps work together to make sure the user input is sent to the
//server in a timely manner. changemap tracks total keystrokes up to a max. This
//is determined by the CONTEXT_WINDOW_SIZE.
//debounceTimers tracks elapsed time with no keystrokes.

//#A map variable for storing how many changes have occurred
const changeMap = new Map();
//create a debounce timer for each input so that it does not just continually
//send requests to the server.
const debounceTimers = new Map();

//#A map variable that keeps track of whether or not an Input has changed when sending a Query to server.
//#if Input has not changed, no query will be sent.
//const previouslySentQueries = new Map();

const CorrectionType = Object.freeze({
    INSERTION:"insertion",
    REPLACEMENT:"replacement",
    DELETION:"deletion"
})

//A map variable that keeps track of the errors discovered within each input element.
const errorMap = new Map();
let blackList = new Map();

let lastIndex = 0;
let loginWarning = true;


async function onInputEventListener(inputId, previouslySentQueries) {
    /*
    The eventListener is going to handle requesting different depending on which condition
    was satisfied for sending. Timeouts get treated as terminated sentences. isTimedOut
    keeps track of whether the query condition was triggered by timeout.
    */

    let isTimedOut = await conditionsForSendingQuery(inputId);

    const inputElement = document.getElementById(inputId);
    const currentInputValue = inputElement.value;

    /*
    instead of a previously sent query, take the buffer.
     */

    let previousText = previouslySentQueries.get(inputId)

    /*
    The responses from the server work by returning the index at the word level instead of at the character
    level. Therefore, detectFirstDifference will operate on the word level rather than the character level as
    well.
     */
    let startIndex = detectFirstDifference(currentInputValue, previousText);
    let sentenceIndex = detectSentenceIndex(currentInputValue, startIndex);
    console.log('previousText',previousText)
    console.log('currentInputValue',currentInputValue)
    console.log('startIndex',startIndex)
    if (startIndex < lastIndex) {
        startIndex = sentenceIndex;
    }

    /*
    if the startIndex indicates no differences were found, finish the function. There is no point
    in sending the same text to the server twice unless if isTimedOut === true, then there is a reason to
    send a new request to server. When isTimedOut is true, the server needs to know that the sentence has
    been terminated, "presumed finished" despite no periods or sentence stoppers.
    */
    if (startIndex === -1 && isTimedOut === false) {
        return
    }

    /*
    split inputString into words, detach the first words upto the startIndex, and rejoin them into string
     */
    //CURRENT CHANGES
    let queryString = currentInputValue.split(" ").slice(startIndex).join(" ").trim();
    //let queryString = currentInputValue.split(" ").slice(sentenceIndex).join(" ").trim();
    console.log('queryString',queryString)

    /*
    Update the previously sent queries here because the query can take too long to resolve.
    because the user can backspace and insert characters at any point, we take the
    previously sent text up to the start index and add the current query to it.
    */
    let updatedSentWords = previousText.split(" ").slice(0, startIndex).concat(queryString.split(" "))
    let updatedSentText = updatedSentWords.join(" ");
    previouslySentQueries.set(inputId, updatedSentText);
    lastIndex = updatedSentWords.length;

    /*
    Formulate message for the server
     */
    let JSONQuery = {
        "text": queryString,
        "sentenceIndex": sentenceIndex,
        "index": startIndex,
        "language": "en",
        "premium": false
    };
    /*
    Makes a request to the server.
     */
    //CURRENT CHANGES
    const queryResponse = await chrome.runtime.sendMessage({
        type: "SPELL_CHECK",
        data: JSONQuery,
        warning: loginWarning,
        url: spellCheckUrl,
        csrfTokenUrl: fetchCSRFTokenUrl
      });



    //let queryResponse = await SpellCorrectionQuery(queryString, inputId, sentenceIndex, sentenceIndex);
    if (queryResponse == null) {
        console.log("Query Response:", queryResponse);
        return
    }
    /*
    If the response from the server was what we were expecting we should find the misspelled words and store them.
    */
    //let queryStartIndex = currentInputValue.slice(0,currentInputValue.search(/[.?!](?=[^?.!]*$)/)).split().length;
    let queryStartIndex = queryResponse.index;
    if (queryResponse) {
        updateErrorMap(queryResponse, inputId, queryStartIndex);
    } else {
        return;
    }



    //Because the corrections have been updated, update the highlighting for this particular input.
    console.log("errormap",errorMap)
    updateHighlightedWords(inputId, errorMap);
}

function executeChange(correction, currentWords) {
    if (correction.type === CorrectionType.INSERTION) {
        console.log("INSERTION: Replacing", correction.originalText, "with", correction.correctedText)
        const textBeforeTargetedWords = currentWords.slice(0,correction.startIndex)
        const textAfterTargetedWords = currentWords.slice(correction.startIndex)
        const targetText = correction.correctedText.split(" ")

        console.log("Before Replacement", textBeforeTargetedWords);
        console.log("Replacement", targetText);
        console.log("After Replacement", textAfterTargetedWords);

        currentWords = textBeforeTargetedWords.concat(targetText).concat(textAfterTargetedWords)
    } else {
        currentWords = currentWords.slice(0,correction.startIndex).concat(correction.correctedText.split(" ")).concat(currentWords.slice(correction.endIndex))
    }
    return currentWords
}

function executeAllChanges(inputId) {
     /*This section is for the landing page.*/

    const outputElement = document.getElementById("testTarget-lmspelldiv");
    let currentWords = document.getElementById(inputId).value.split(" ");

    /*
    "originalText": correction.original,
    "correctedText": correction.corrected,
    "startIndex":correction.startIndex+startIndex,
    "endIndex":(correction.startIndex+startIndex) + correction.original.split(" ").length,
    "type": correction.type
     */

    /*
    Changing the length of the currentWords makes performing future changes incredibly hard.
    The chosen solution is to add all changes that do not change the length of currentWords first,
    then add all changes that do change current length starting at the end of the currentWords and working
    towards the beginning.
     */
    //[...errorMap.get(inputId).entries()] == [[5,{}][7,{}][2,{}][2,{}]]
    const errors = [...errorMap.get(inputId).values()].sort((a,b) => b.startIndex - a.startIndex)
    console.log("ErrorMap",errors);


    console.log("currentWords Before:",currentWords)
    errors.forEach(correction => {
        currentWords = executeChange(correction, currentWords)
    })

    console.log("currentWords", currentWords);
    outputElement.innerHTML = currentWords.join(" ");
}


async function conditionsForSendingQuery(inputId) {
    if (changeMap.get(inputId) == null) {
        changeMap.set(inputId, 1);
    }

    if (changeMap.get(inputId) === CONTEXT_WINDOW_SIZE) {
        changeMap.set(inputId, 0);
        if (debounceTimers.has(inputId)) {
            clearTimeout(debounceTimers.get(inputId));
        }
        return false;
    } else {
        //if we reach this point, make sure to update the changeMap.
        changeMap.set(inputId, changeMap.get(inputId)+1);
        return new Promise(resolve => {
            //If there is already a timer running, kill it.
            if (debounceTimers.has(inputId)) {
                clearTimeout(debounceTimers.get(inputId));
            }

            //start the timer
            const timer = setTimeout(() => {
                debounceTimers.delete(inputId); // cleanup
                resolve(true);
            }, 3000);

            //set the timer again
            debounceTimers.set(inputId, timer);
        });
    }
}
/*
Compare each sentence at the word level rather than the character level.
If no difference can be found between the two texts, -1 is returned.
 */
function detectFirstDifference(textA, textB) {
    const textAWords = textA.split(" ");
    const textBWords = textB.split(" ");
    for (let i = 0; i < textAWords.length; i++) {
        if(textAWords[i] !== textBWords[i]) {
            return i;
        }
    }
    if (textAWords.length < textBWords.length) {
        return textAWords.length;
    }
    //return -1;
    return textAWords.length-1;
}

/*
Send a correction request to the server. The server will respond with corrections or with null.
 */

function updateErrorMap(queryResponse, inputId, startIndex) {
    //make sure the errorMap for this input is initialised
    if (!errorMap.has(inputId)) {
        errorMap.set(inputId, new Map());
        blackList.set(inputId, new Map());
    }
    //get the span of the replacement
    const queryStartIndex = queryResponse.index;
    const queryEndIndex = queryResponse.index + queryResponse.incorrectText.split(" ").length

    let corrections = errorMap.get(inputId);
    if (!corrections) return;

    let currentTextEnd = document.getElementById(inputId).value.split(" ").length;
    console.log("Deleting outdated errors between", queryStartIndex, "and", queryEndIndex, "and deleting stale errors");
    corrections.forEach((correction, targetIndex) => {
    if (targetIndex >= queryStartIndex && targetIndex < queryEndIndex) {
        corrections.delete(targetIndex);
    }
    if (targetIndex > currentTextEnd) {
        corrections.delete(targetIndex);
    }
    });
    console.log(startIndex)


    Array.from(queryResponse.correctedWords).forEach(correction => {
        const rejectedCorrection = blackList.get(inputId).get(correction.startIndex+startIndex)
        if (rejectedCorrection && (rejectedCorrection.originalText === correction.original)) {
            return
        }
            errorMap.get(inputId).set(correction.startIndex + startIndex, {
                "originalText": correction.original,
                "correctedText": correction.corrected,
                "startIndex": correction.startIndex + startIndex,
                "endIndex": (correction.startIndex) + correction.original.split(" ").length + startIndex,
                "type": correction.type,
                "identifier": correction.identifier
            })

    })
}


function detectSentenceIndex(text, queryStartIndex) {
    let firstText = text.split(" ").slice(0,queryStartIndex).join(" ");
    let lastSentenceStopper = firstText.search(/[.?!](?=[^?.!]*$)/);
    console.log(lastSentenceStopper)
    if (lastSentenceStopper === -1) {
        return 0;
    }
    return firstText.slice(0,lastSentenceStopper).split(" ").length;
    //return lastSentenceStopper;
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
        const data = {
            "identifier": correction.identifier,
            "accept": true,
            "feedback": ""
        }

        const queryResponse = await chrome.runtime.sendMessage({
        type: "ACCEPT_CHANGE",
        data: data,
        url: acceptChangeUrl,
        csrfTokenUrl: fetchCSRFTokenUrl
      });


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

        const data = {
            "identifier": correction.identifier,
            "accept": false,
            "feedback": ""
        }

        const queryResponse = await chrome.runtime.sendMessage({
        type: "ACCEPT_CHANGE",
        data: data,
        url: acceptChangeUrl,
        csrfTokenUrl: fetchCSRFTokenUrl
      });
    })
    correctionPanel.appendChild(correctionText)

    buttonPanel.appendChild(acceptButton)
    buttonPanel.appendChild(rejectButton)
    correctionPanel.appendChild(buttonPanel)

    parent.appendChild(correctionPanel)
    console.log("correctionPanel", correctionPanel)
    return correctionPanel
}

function updateHighlightedWords(inputId, errorMap) {

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