//#This function is an example of what will be sent to the backend to perform queries.
//#We must make sure we have API expecting a data structure that looks something like this
async function SpellCorrectionQuery(queryText, inputId, startingIndex) {
    JSONQuery = JSON.stringify({
        "text": queryText,
        "inputId": inputId,
        "startingIndex": startingIndex,
    });

    //Promise.
    let response = await fetch("localhost:8000/queryLMSpell", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSONQuery}
    )
        .then((response) => response.json())
        .then(()=> data)
        .catch((error) => console.log(error))
    //return promise
    return response;
}

//#A map variable for storing how many changes have occurred 
let changeMap = {};

//#A map variable that keeps track of whether or not an Input has changed when sending a Query to server.
//#if Input has not changed, no query will be sent.
let previouslySentQueries = {};

//#A function that returns true after 3 seconds have passed.
async function conditionsForSendingQuery(inputId) {
    if (changeMap.get(inputId) == null) {
        changeMap.set(inputId, 1);
    } else if (changeMap.get(inputId) == 10) {
        changeMap.set(inputId, 0);
        return true;
    } else {
        setInterval(3);
        return true;
    }
}

//Returns the first index where the previously queried string and the real string dont match. This should be
//after a whitespace character, or at the end of a string
function detectFirstDifference(inputText, previouslySentText) {
    let lastWhitespace = 0;
    for (let i = 0; i < inputText.length; i++) {
        if (inputText[i] == previouslySentText[i]) {
            //index++;
            if (inputText[i-1] == ' ' || inputText[i-1] == '/n') {
                lastWhitespace = i;
            }
        } else {
            break;
        }
    }
    return lastWhitespace;
}

//#Returns a list of individual words with corrections, indices and input_ids. Everything needed for highlighting?
async function onInputEventListener(inputId) {

    //wait for the timer, or until significant changes have occured
    await conditionsForSendingQuery(inputId);
    let inputElement = document.getElementById(inputId);

    //if the conditions for querying are met but there is no difference to what was
    //previously sent, do not do anything.
    if (inputElement.value == previouslySentQueries.get(inputId)) {
        return;
    }
    //find the first instance of whitespace before there is a difference in what has already been queried
    let startIndex = detectFirstDifference(inputElement.value, previouslySentQueries.get(inputId));

    //deal with query length chunking if you need to. For now its a nice to have for pasting large chunks of text
    let queryLength = inputElement.value.length - startIndex;
    queryString = inputElement.value.substr(startIndex,queryLength);
    SpellCorrectionQuery(queryString, inputId, startIndex);
}
