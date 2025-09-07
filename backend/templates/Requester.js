/*
This script is an OnInputEventHandler. When the user interacts with an input,
this script is going to decide when is a good time to send a query to the server,
receive the response and make changes to the text using the response.
 */

//indices are calculated on a word by word basis. If a word is longer than the context window,
//there might be some troubles
const CONTEXT_WINDOW_SIZE = 50;

/*There two maps work together to make sure the user input is sent to the
server in a timely manner. changemap tracks total keystrokes up to a max. This
is determined by the CONTEXT_WINDOW_SIZE.
debounceTimers tracks elapsed time with no keystrokes. */

//#A map variable for storing how many changes have occurred
const changeMap = new Map();
//create a debounce timer for each input so that it does not just continually
//send requests to the server.
const debounceTimers = new Map();

//#A map variable that keeps track of whether or not an Input has changed when sending a Query to server.
//#if Input has not changed, no query will be sent.
const previouslySentQueries = new Map();


//A map variable that keeps track of the errors discovered within each input element.
const errorMap = new Map();

async function onInputEventListener(inputId) {

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
    console.log('previousText',previousText)
    console.log('currentInputValue',currentInputValue)
    console.log('startIndex',startIndex)
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
    let queryString = currentInputValue.split(" ").slice(startIndex).join(" ").trim();
    console.log('queryString',queryString)

    //let queryStartIndex = queryString.match(/[.?!](?=[^?.!]*$)/);
    //queryString = queryString.slice(queryStartIndex).trim();

    /*
    Update the previously sent queries here because the query can take too long to resolve.
    because the user can backspace and insert characters at any point, we take the
    previously sent text up to the start index and add the current query to it.
    */
    let updatedSentText = previousText.split(" ").slice(0, startIndex).concat(queryString.split(" ")).join(" ");
    previouslySentQueries.set(inputId, updatedSentText);
    /*
    Makes a request to the server.
     */
    let queryResponse = await SpellCorrectionQuery(queryString, inputId, startIndex);

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
    updateHighlightedWords(inputId);

     /*This section is for the landing page.*/

    outputElement = document.getElementById("testTarget-lmspelldiv");
    currentWords = document.getElementById(inputId).value.split(" ");

    /*
    "originalText": correction.original,
    "correctedText": correction.corrected,
    "startIndex":correction.startIndex+startIndex,
    "endIndex":(correction.startIndex+startIndex) + correction.original.split(" ").length,
    "type": correction.type
     */
    console.log("currentWords Before:",currentWords)
    errorMap.get(inputId).forEach(correction => {
        if (correction.originalText.split(" ").length === correction.correctedText.split(" ").length) {
            //currentWords.splice(correction.startIndex,correction.endIndex);
            currentWords = currentWords.slice(0,correction.startIndex).concat(correction.correctedText.split(" ")).concat(currentWords.slice(correction.endIndex))
        }
    })

    //currentValidWords = currentWords.slice(startIndex);
    console.log("currentWords", currentWords);
    newText = currentWords.join(" ");
    outputElement.innerHTML = newText;

    console.log("errorMap", errorMap)

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
export async function SpellCorrectionQuery(queryText, inputId, startingIndex) {
    //get the csrftoken from cookies.
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    JSONQuery = JSON.stringify({
        "text": queryText,
        "inputId": inputId,
        "index": startingIndex,
        "language": "en"
    });
    console.log("Sending to server", JSONQuery);
    const spellCheckUrl = "{% url 'spell_check' %}";
    const csrfToken = getCookie("csrftoken");
    try {
        let response = await fetch(spellCheckUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSONQuery
        })
        if (!response.ok) {
            const text = await response.text();
            console.error("Server error:", response.status, text);
            return;
        }
        const queryResponse = await response.json();
        //let misspelledWords = findMisspelledWords(queryResponse);
        console.log("queryResponse after unpacking:",queryResponse);
        return queryResponse;
    } catch(error) {
        console.log(error);
    }
    return null;
}

function updateErrorMap(queryResponse, inputId, startIndex) {
    if (!errorMap.has(inputId)) {
        errorMap.set(inputId, new Map());
    }
    queryStartIndex = queryResponse.index;
    queryEndIndex = queryResponse.index + queryResponse.incorrectText.split(" ").length
    let corrections = errorMap.get(inputId);
    if (!corrections) return;

    console.log("Deleting outdated errors between", queryStartIndex, "and", queryEndIndex);
    corrections.forEach((correction, targetIndex) => {
    if (targetIndex >= queryStartIndex && targetIndex < queryEndIndex) {
        corrections.delete(targetIndex);
    }
    });
    console.log(startIndex)


    Array.from(queryResponse.correctedWords).forEach(correction => {
        errorMap.get(inputId).set(correction.startIndex+startIndex,{
            "originalText": correction.original,
            "correctedText": correction.corrected,
            "startIndex":correction.startIndex+startIndex,
            "endIndex":(correction.startIndex) + correction.original.split(" ").length+startIndex,
            "type": correction.type
        })
    })
}

function updateHighlightedWords(inputId) {
    let shadowDiv = document.getElementById(inputId+"-lmspelldiv");

    shadowDiv.innerHTML = shadowDiv.innerHTML.replace(/<\/?[a-z]+>/g, "")

    let corrections = errorMap.get(inputId);
    if (!corrections) return;

    corrections.forEach((correction, targetIndex) => {

        //The location and length of highlighting
        let numberOfTargetedWords = correction.originalText.split(" ").length;

        //let targetText = correction.originalText;


        //let targetLength = targetText.length;
        //let targetIndex = shadowDiv.innerHTML.indexOf(targetText);

        const correctionType = correction.type;

        //if an index can be found for the error, highlight it, otherwise, delete the error, presuming it dealt with.
        if (targetIndex !== -1) {
            //shadowDiv.innerHTML = `${shadowDiv.innerHTML.substring(0, targetIndex)} <${correctionType}>${targetText}</${correctionType}> ${shadowDiv.innerHTML.substring(targetIndex+targetLength, shadowDiv.innerHTML.length)}`;
            const originalWords = shadowDiv.innerHTML.split(" ");

            const textBeforeTargetedWords = originalWords.slice(0, targetIndex);
            const textAfterTargetedWords = originalWords.slice(targetIndex+numberOfTargetedWords);
            const targetText = originalWords.slice(targetIndex,targetIndex+numberOfTargetedWords).join(" ");
            //console.log(targetText);
            const wrappedTargetWords = `<${correctionType}>${targetText}</${correctionType}>`.split(" ")
            shadowDiv.innerHTML = (textBeforeTargetedWords.concat(wrappedTargetWords).concat(textAfterTargetedWords)).join(" ");
        } else {
            corrections.delete(targetIndex);
        }
    })
    //console.log(shadowDiv.innerHTML);
}

function updateShadowDIV(inputId) {
    let textInput = document.getElementById(inputId);
    let shadowDiv = document.getElementById(inputId+"-lmspelldiv");
    shadowDiv.innerHTML = textInput.value;
    //updateHighlightedWords(inputId);
}