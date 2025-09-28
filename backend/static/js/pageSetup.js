
/*What does this script do?
*
* Upon page load, this script will find every instance of textareas and inputs.
* It will then create a *shadow div* for the element.
    *   The shadow div is an overlay that copies the size and position of an element.
    *   Every time an element is edited, the contents are copied to the *shadow div*
    *   The *shadow div* hides the underlying element, but does not accept input. This
    *   means that users will only ever type into the original page elements. This is
    *   important as we don't want to break the functionality of the pages we are
    *   spell correcting for.
* Current issues:
*   None found.
*/
import onInputEventListener from "./requester.js";


/*
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
const previouslySentQueries = new Map();

const CorrectionType = Object.freeze({
    INSERTION:"insertion",
    REPLACEMENT:"replacement",
    DELETION:"deletion"
})

//A map variable that keeps track of the errors discovered within each input element.
const errorMap = new Map();
let blackList = new Map();

let lastIndex = 0;



var loginWarning = true
*/
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

window.findAllInput = findAllInput;
window.addEventListener("load", () => findAllInput());

