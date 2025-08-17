const CONTEXT_WINDOW_SIZE = 20;

/*There two maps work together to make sure the user input is sent to the
server in a timely manner. changemap tracks total keystrokes up to a max. This
is determined by the CONTEXT_WINDOW_SIZE.
debounceTimers tracks elapsed time with no ketstrokes. */

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

//#This function is an example of what will be sent to the backend to perform queries.
//#We must make sure we have API expecting a data structure that looks something like this
async function SpellCorrectionQuery(queryText, inputId, startingIndex) {
    JSONQuery = JSON.stringify({
        "text": queryText,
        "inputId": inputId,
        "index": startingIndex,
        "language": "en"
    });
    console.log("Sending to server", JSONQuery);
    //Promise.
    const spellCheckUrl = "{% url 'spell_check' %}";

    try {
        let response = await fetch(spellCheckUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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

        findMisspelledWords(queryResponse);

        /*This section is for the landing page.*/
        outputElement = document.getElementById("testTarget-lmspelldiv");
        currentText = outputElement.innerHTML;

        currentValidText = currentText.substring(0,queryResponse.index);
        newText = currentValidText + queryResponse.correctText;
        outputElement.innerHTML = newText;

    } catch(error) {
        console.log(error);
    }
}



//This function will allow a query to be sent to the server if one of two conditions
//are met. 
// 
//Condition A, the last actions the user performed on a particular input element
//occured 3 seconds ago.

//Condition B, the user has performed a certain number of actions since the last
//query was sent.
async function conditionsForSendingQuery(inputId) {
    if (changeMap.get(inputId) == null) {
        changeMap.set(inputId, 1);
    }
    
    if (changeMap.get(inputId) == CONTEXT_WINDOW_SIZE) {
        changeMap.set(inputId, 0);
        if (debounceTimers.has(inputId)) {
            clearTimeout(debounceTimers.get(inputId));
        }
        return true;
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

//Returns the first index where the previously queried string and the real string dont match. This should be
//after a whitespace character, or at the end of a string
function detectFirstDifference(inputText, previouslySentText) {
    let lastWhitespace = 0;

    //console.log("real Text",inputText);
    //console.log("sent Text",previouslySentText)
    for (let i = 0; i < inputText.length; i++) {
        if (inputText[i] !== previouslySentText[i]) {
            //break if chars are differents
            break;
        }
        //Update lastWhitespace if current char is whitespace
        if (inputText[i] === ' ' || inputText[i] === '\n' || inputText[i] === '\t') {
            lastWhitespace = i;
        }
    }
    if (lastWhitespace == inputText.length) {
        return -1;
    }
    return lastWhitespace;
}

//#Returns a list of individual words with corrections, indices and input_ids. Everything needed for highlighting?
async function onInputEventListener(inputId) {
    //wait for the timer, or until significant changes have occured
    await conditionsForSendingQuery(inputId);

    const inputElement = document.getElementById(inputId);
    const currentInputValue = inputElement.value;

    let previousText = previouslySentQueries.get(inputId)
    //if the conditions for querying are met but there is no difference to what was
    //previously sent, do not do anything.
    //find the first instance of whitespace before there is a difference in what has already been queried
    let startIndex = detectFirstDifference(currentInputValue, previousText);
    if (startIndex == -1) {
        return
    }
    //console.log('StartIndex', startIndex);
    //deal with query length chunking if you need to. For now its a nice to have for pasting large chunks of text
    let queryLength = currentInputValue.length - startIndex;
    queryString = currentInputValue.substring(startIndex,startIndex+queryLength);
    let queryResponse = await SpellCorrectionQuery(queryString, inputId, startIndex);

    //because the user can backspace and insert characters at any point, we take the
    //previously sent text up to the start index and add the current query to it.
    let validPreviousText = previousText.substring(0,startIndex);
    const newPreviousText = validPreviousText + queryString;
    previouslySentQueries.set(inputId, newPreviousText);

    //let misspelledWords = findMisspelledWords(queryResponse);

    //findMisspelledWords(queryResponse);
/*
    misspelledWords.forEach(wordData => {
        let textInput = document.getElementById(wordData.inputId);
        let shadowDiv = document.getElementById(wordData.inputId+"-lmspelldiv");
        shadowDiv.innerHTML = textInput.value;

        let targetWord = wordData.incorrectWord;
        let targetLength = targetWord.length;
        let targetIndex = shadowDiv.innerHTML.indexOf(targetWord);
        if (targetIndex != -1) {
            shadowDiv.innerHTML = shadowDiv.innerHTML.substring(0, targetIndex)+"<u style=\"color:red;\">"+targetWord+"</u>"+shadowDiv.innerHTML.substring(targetIndex+targetLength, shadowDiv.innerHTML.length);
        }

        
    })
        */
    /*
    errorMap.get(inputId).forEach(wordData => {
        let textInput = document.getElementById(wordData.inputId);
        let shadowDiv = document.getElementById(wordData.inputId+"-lmspelldiv");
        shadowDiv.innerHTML = textInput.value;

        let targetWord = wordData.incorrectWord;
        let targetLength = targetWord.length;
        let targetIndex = shadowDiv.innerHTML.indexOf(targetWord);
        if (targetIndex != -1) {
            shadowDiv.innerHTML = shadowDiv.innerHTML.substring(0, targetIndex)+"<u style=\"color:red;\">"+targetWord+"</u>"+shadowDiv.innerHTML.substring(targetIndex+targetLength, shadowDiv.innerHTML.length);
        }


    })
        */
       highlightWords(inputId);
}

//given the response from the server, find the misspelt words, get their index,
//return a list of misspelt words, their indexs, their correct spellings, their inputId

//if the text has double spaces, this wont work!!! Thats why its naive

function findMisspelledWords(queryResponse) {
    console.log(queryResponse);
    Array.from(queryResponse.correctedWords).forEach(incorrectWord => {
        if (incorrectWord.type === 'replacement') {
            errorMap.get(queryResponse.inputId).push({
                "incorrectWord": incorrectWord.original,
                "correctWord":incorrectWord.corrected,
                "index":queryResponse.index+incorrectWord.original_index,
                "inputId":queryResponse.inputId
            })
        }
    })
    /*

    const incorrectText = queryResponse.incorrectText;
    const correctText = queryResponse.correctText;
    const contextIndex = queryResponse.index;
    const inputId = queryResponse.inputId

    const incorrectTextArray = incorrectText.split(/\s+/);
    const correctTextArray = correctText.split(/\s+/);

    let index = 0;
    //const wordArray = new Array();
    const length = Math.max(incorrectTextArray.length, correctTextArray.length);

    for (let i = 0; i < length; i++) {
        const word1 = incorrectTextArray[i] || "";
        const word2 = correctTextArray[i] || "";

        if (word1 != word2) {
            errorMap.get(inputId).push({
                "incorrectWord": word1,
                "correctWord":word2,
                "index":index+contextIndex,
                "inputId":inputId
            })
        }
        index += word1.length +1

    }

     */
    //return wordArray;
}

function highlightWords(inputId) {

    let shadowDiv = document.getElementById(inputId+"-lmspelldiv");
    if (!errorMap.has(inputId)) {
        errorMap.set(inputId, new Array());
    }
    
    errorMap.get(inputId).forEach(wordData => {
        let targetWord = wordData.incorrectWord;
        let targetLength = targetWord.length;
        let targetIndex = shadowDiv.innerHTML.indexOf(targetWord);
        if (targetIndex != -1) {
            shadowDiv.innerHTML = shadowDiv.innerHTML.substring(0, targetIndex)+"<u style=\"color:red;\">"+targetWord+"</u>"+shadowDiv.innerHTML.substring(targetIndex+targetLength, shadowDiv.innerHTML.length);
        } else {
            const excludingArray = errorMap.get(inputId).filter(item => item.targetWord !== wordData.targetWord);
            errorMap.set(inputId, excludingArray);
        }

    })
}

function updateShadowDIV(inputId) {
    let textInput = document.getElementById(inputId);
    let shadowDiv = document.getElementById(inputId+"-lmspelldiv"); 
    shadowDiv.innerHTML = textInput.value;    

    highlightWords(inputId, shadowDiv);
}