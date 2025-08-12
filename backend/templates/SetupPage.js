const body = document.getElementsByTagName("body")[0];
body.addEventListener("onload", () => findAllInput());


function findAllInput() {
      let inputs = document.getElementsByTagName("input");
      console.log(inputs);

      //for each input element found:
      Array.from(inputs).forEach(element => {

        //add an input event listener for sending to server
        element.addEventListener("input", () => onInputEventListener(element.id))
        //initialise previouslySentQueries SOMEWHERE ELSE DONT DO IT HERE YOU IDIOT
        previouslySentQueries.set(element.id, "");

        //Add a shadow div for highlighting mischief
        let parentContainer = element.parentNode;
        let shadowDiv = document.createElement("div");
        shadowDiv.id = element.id + "-lmspelldiv";
        shadowDiv.style.position = "absolute";
        shadowDiv.style.top = "82px";
        shadowDiv.style.left = "84px";
        element.after(shadowDiv)

        //add a second input event listener for updating shadowDiv
        element.addEventListener("input", () => updateShadowDIV(element.id))

        //Make it disappear!!
        element.style.background="transparent";
        element.style.color="transparent";
      });
    }