window.addEventListener("load", () => findAllInput());


function findAllInput() {
      let textInputs = document.getElementsByTagName("input");
      let textAreas = document.getElementsByTagName("textarea");
      //console.log(inputs);
      let inputs = Array.from(textInputs).concat(Array.from(textAreas));

      //for each input element found:
      inputs.forEach(element => {

        //add an input event listener for sending to server
        element.addEventListener("input", () => onInputEventListener(element.id))
        //initialise previouslySentQueries SOMEWHERE ELSE DONT DO IT HERE YOU IDIOT
        previouslySentQueries.set(element.id, "");

        //Add a shadow div for highlighting mischief
        let shadowDiv = document.createElement("div");
        shadowDiv.id = element.id + "-lmspelldiv";
        shadowDiv.style.position = "absolute";
        shadowDiv.style.zIndex = 2;
        shadowDiv.style.whiteSpace = "pre-wrap";
        shadowDiv.style.overflowWrap = "break-word";
        shadowDiv.style.color = "Black";
        shadowDiv.style.left = element.getBoundingClientRect().left + "px";
        shadowDiv.style.top = element.getBoundingClientRect().top + "px";
        shadowDiv.style.width = element.getBoundingClientRect().width + "px";
        shadowDiv.style.height = element.getBoundingClientRect().height + "px";
        shadowDiv.style.font = window.getComputedStyle(element).font;
        shadowDiv.style.lineHeight = window.getComputedStyle(element).lineHeight;
        shadowDiv.style.padding = window.getComputedStyle(element).padding;
        shadowDiv.style.pointerEvents = "none";

        document.body.appendChild(shadowDiv);

        //add a second input event listener for updating shadowDiv
        element.addEventListener("input", () => updateShadowDIV(element.id))

        //Make it disappear!!
        element.style.background="transparent";
        element.style.color="transparent";
      });
    }