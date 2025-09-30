//#A map variable that keeps track of whether or not an Input has changed when sending a Query to server.
//#if Input has not changed, no query will be sent.
//const previouslySentQueries = new Map();

const CorrectionType = Object.freeze({
    INSERTION:"insertion",
    REPLACEMENT:"replacement",
    DELETION:"deletion"
})

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

export function executeAllChanges(inputId, errorMap) {
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
