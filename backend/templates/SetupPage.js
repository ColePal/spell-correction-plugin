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
*   When the page is resized the *shadow div* does not resize or change location.
*/
loginWarning = true

window.addEventListener("load", () => findAllInput());


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
        element.addEventListener("input", () => onInputEventListener(element.id))
        //initialise previouslySentQueries SOMEWHERE ELSE DONT DO IT HERE YOU IDIOT
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
        shadowDiv.style.left = element.getBoundingClientRect().left + "px";
        shadowDiv.style.top = element.getBoundingClientRect().top + "px";
        shadowDiv.style.width = element.getBoundingClientRect().width + "px";
        shadowDiv.style.height = element.getBoundingClientRect().height + "px";
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

        function updateOverlay(shadowDiv) {
            const rect = element.getBoundingClientRect();
            shadowDiv.style.left = rect.left + window.scrollX + "px";
            shadowDiv.style.top = rect.top + window.scrollY + "px";
            shadowDiv.style.width = rect.width + "px";
            shadowDiv.style.height = rect.height + "px";
        }
        //shadowDiv.style.pointerEvents = "none";
          let observer = new ResizeObserver(() => {
            updateOverlay(shadowDiv)
        });
        observer.observe(element);

        let mutationObserver = new MutationObserver(() => {
            updateOverlay(shadowDiv)
        })
          mutationObserver.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });

        window.addEventListener("scroll", updateOverlay);
        window.addEventListener("resize", updateOverlay);

        document.body.appendChild(shadowDiv);

        //add a second input event listener for updating shadowDiv
        element.addEventListener("input", () => updateShadowDIV(element.id))

        //Make it disappear!!
        element.style.background="transparent";
        element.style.color="transparent";
        element.style.caretColor="black";
      });
    }

    function updateShadowDIV(inputId) {
    let textInput = document.getElementById(inputId);
    let shadowDiv = document.getElementById(inputId+"-lmspelldiv");
    shadowDiv.innerHTML = textInput.value;
    //updateHighlightedWords(inputId);
}

