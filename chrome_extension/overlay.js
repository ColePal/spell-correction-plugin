// Movable Button + Overlay Container
const toggleButton = document.createElement('div');
const logo = document.createElement('img');
const overlayContainer = document.createElement('div');
let userEditEvent;
let injectTextAck = true;
let highlightEnabled = true;
let visualiseFetch = false;

let lastFireText;


let useAltWords = false;

// Element types extension should look for / Editable fields to look for user changes in.
const valid_field_types = `
  input[type="text"],
  input[type="search"],
  input:not([type]),
  textarea
`;

let suggest_html;
let mostRecentlyEditedField;

let textResponse; // LLM response
let outputWords  = [];
let inputWords = [];

async function getSuggestHtml() {	  
  // Get suggestionPopup.html for word popups.
  const suggest = await fetch(chrome.runtime.getURL('suggestionPopup.html')); // fetch suggestion, get response
  suggest_html = await suggest.text();
}

async function createMovableOverlay(showToggle) {
  
  // Where the button first appears on the page
  let starting_point = 'right'
  
  // Get user selected overlay side if exists.
  chrome.storage.local.get('overlaySide', function(data) {
    if (data.overlaySide) {
      console.log('The Starting Side is Now:', data.overlaySide);
	  starting_point = data.overlaySide;
    }
  });
  
  let top_offset = 75
  let left_offset = 20
  let right_offset = left_offset
  
  // Button Size
  let button_width = 50
  let button_height = 50
  
  // Movable Button
  toggleButton.id = 'toggle-button';
  toggleButton.draggable = false;
  toggleButton.style.userSelect = 'none';
  toggleButton.style.position = 'fixed';
  toggleButton.style.top = top_offset + 'px';
  toggleButton.style.width = button_width + 'px';
  toggleButton.style.height = button_height + 'px';
  toggleButton.style.backgroundColor = 'transparent';
  toggleButton.style.color = 'transparent';
  toggleButton.style.textAlign = 'center';
  toggleButton.style.lineHeight = '50px';
  toggleButton.style.borderRadius = '8px';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.zIndex = '12345'; // big number to always appear on top
  toggleButton.innerText = '';
  if (showToggle === false) {toggleButton.style.display = 'none';}
  
  
  
  // Logo
  logo.src = chrome.runtime.getURL('./icon.png');
  logo.draggable = false;
  logo.width = button_width;
  logo.height = button_height;
  
  // How far below the button the overlay is
  let overlay_from_top = 60

  // Popup Container when click on button
  overlayContainer.id = 'overlay-container';
  overlayContainer.style.position = 'fixed';
  overlayContainer.style.top = (top_offset + overlay_from_top) + 'px';
  overlayContainer.style.backgroundColor = 'white';
  overlayContainer.style.border = '1px solid lightgray';
  overlayContainer.style.borderRadius = '8px';
  overlayContainer.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  overlayContainer.style.zIndex = '12345';
  overlayContainer.style.display = 'none';
  overlayContainer.style.maxWidth = 'none';
  overlayContainer.style.maxHeight = 'none';
  overlayContainer.style.overflow = 'visible';
  
  // Add overlay.html into overlay container
  const overlay = await fetch(chrome.runtime.getURL('overlay.html')); // fetch overlay, get response
  const overlay_html = await overlay.text();
  overlayContainer.innerHTML = overlay_html;
  
  // Make Query for All Text Button on Overlay.html functional
  const query_all_text_button = await  overlayContainer.querySelector('button#query-all-text-button');
  query_all_text_button.addEventListener('click', (event) => {
	queryForWholeTextBox();
  });
  
  
  // Premium Button Toggle
  const use_premium_model_button = await overlayContainer.querySelector('button#use-premium-model');
  
  function colourButton(result, button) {
	  if (result === true) {
		  button.style.backgroundColor = "#95B309";
	  }
	  else {
		  button.style.backgroundColor = "#AB3232";
	  }
  }

  chrome.storage.local.get('premiumModelButton').then(result => {
	  if (result.premiumModelButton === undefined) {result.premiumModelButton = false;}
	  colourButton(result.premiumModelButton,use_premium_model_button);
  });
  use_premium_model_button.addEventListener('click', function() {
	  chrome.storage.local.get('premiumModelButton', function(userVar) {
		userVar.premiumModelButton = !userVar.premiumModelButton
		chrome.storage.local.set({ premiumModelButton: userVar.premiumModelButton }, function() {
			console.log('Premium Toggled!', userVar.premiumModelButton);
		});
		colourButton(userVar.premiumModelButton,use_premium_model_button);
      });
  });
  
  // Visualise Fetch Toggle
  const visualise_fetch_button = await overlayContainer.querySelector('button#visualise-fetch');

  chrome.storage.local.get('visualiseFetchButton').then(result => {
	  if (result.visualiseFetchButton === undefined) {result.visualiseFetchButton = true;}
	  visualiseFetch = result.visualiseFetchButton;
	  colourButton(result.visualiseFetchButton,visualise_fetch_button);
  });
  visualise_fetch_button.addEventListener('click', function() {
	  chrome.storage.local.get('visualiseFetchButton', function(userVar) {
		userVar.visualiseFetchButton = !userVar.visualiseFetchButton
		chrome.storage.local.set({ visualiseFetchButton: userVar.visualiseFetchButton }, function() {
			console.log('Fetch Toggled!', userVar.visualiseFetchButton);
		});
		visualiseFetch = userVar.visualiseFetchButton;
		colourButton(userVar.visualiseFetchButton,visualise_fetch_button);
      });
  });
  
  
  // Positions elements based on if Button appears on left or right side of screen
  switch (starting_point) {
	  case 'left':
	    toggleButton.style.left = left_offset + 'px';
		overlayContainer.style.left = (left_offset + 0) + 'px';
		break;
	  case 'right':
	    toggleButton.style.right = right_offset + 'px';
		overlayContainer.style.right = (right_offset + 0) + 'px';
		break;
  }
  
  
  
  
  // Inject into Webpage/Document
  toggleButton.appendChild(logo);
  document.body.appendChild(toggleButton);
  document.body.appendChild(overlayContainer);


  // Popup Positioning + Dragging
  let offsetX, offsetY
  let userDragging = false;

  toggleButton.addEventListener('mousedown', (event) => {
    offsetY = event.clientY - toggleButton.getBoundingClientRect().top;
	// OffsetX based on starting point
	if (starting_point == 'right') {offsetX = toggleButton.getBoundingClientRect().right - event.clientX;}
	else {offsetX = event.clientX - toggleButton.getBoundingClientRect().left;}
	
    document.body.style.userSelect = 'none'; // Stop user selecting text when dragging!
	userDragging = false;

	// Updates popup button + overlay to follow mouse when dragged.
    const onMouseMove = (moveEvent) => {
		const newLeft = moveEvent.clientX - offsetX; // if starts left side
		const newRight = window.innerWidth - moveEvent.clientX - offsetX; // if starts right side
		toggleButton.style.cursor = 'move'; // changes cursor to move
        userDragging = true;
		
		// Update top offset
		const updatedTopOffset = moveEvent.clientY - offsetY;
		toggleButton.style.top = updatedTopOffset + 'px';
		overlayContainer.style.top = updatedTopOffset + overlay_from_top + 'px';
		
        // Update button/overlay position
		switch (starting_point) {
	        case 'left':
			    toggleButton.style.left = newLeft + 'px';
		        overlayContainer.style.left = newLeft + 'px';
		        break;
	        case 'right':
			    toggleButton.style.right = newRight + 'px';
			    overlayContainer.style.right = newRight + 'px';
		        break;
        }
		
    };

    const onLeftClick = (upEvent) => {
		
	  // Stop dragging/selection
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onLeftClick);
	
      document.body.style.userSelect = ''; // Allow user to select again!
	  toggleButton.style.cursor = 'pointer'; // As only hovering

      // Toggle overlay visibility if button clicked and user wasn't dragging
      if (!userDragging) {
		  if (overlayContainer.style.display === 'none') {
			overlayContainer.style.display = 'block';
		  } 
		  else {
		    overlayContainer.style.display = 'none';
	      }
      }
	  
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onLeftClick);
  });
}






async function createOverlay() {

// Add to the DOM the Style of the per word text correction optioning pop up boxes
const textPopupStyle = document.createElement('style');
textPopupStyle.textContent = `
	.fancy-result-h2 {
	  font-size: 18px;   
	  margin-top: 4px;   
	  margin-bottom: 0px; 
	  margin-left: 1px;
	  margin-right: 5px;
	  user-select: none;
	  display: inline;
	  margin:auto;
	  font-family: "Fira Code", monospace, monospace;
	  font-weight: bold;
	}
	.fancy-result-div {
	  border-radius: 12px;
	  background: white;
	  border-color: black;
	  padding: 8px 14px;
	  border-style: solid;
	  border-color: grey;
	  border-width: 2px;
	  user-select: none;
	  text-align:center;
	  display: inline-block;
	}
	.yes-button {
		border-radius: 6px;
		display: inline;
		background-color: #73cb21;
		border-color: #73AD21;
		color: white;
		padding: 2px 4px;
		text-align: center;
	}
	.yes-button:hover {
		background-color: #5a991f;
	}
	.no-button {
		border-radius: 6px;
		display: inline;
		border-color: #d91a1a;
		background-color: #FF0000;
		color: white;
		padding: 2px 4px;
		text-align: center;
	}
	.no-button:hover {
		background-color: #c92828;
	}
`;
document.head.appendChild(textPopupStyle);




// get rid of per word pop ups when any key pressed.


let assignUID = 0;

function alterAllWordPopUps(type) { // 0 to remove, 1 to make invisible, 2 to update positioning
	for (let i = 0; i <= assignUID; i++) {
	  const existingPopups = document.getElementById(`scwp-${i}-popup`);
	  if (existingPopups) {
		  if (type == 0) {existingPopups.remove();}
		  if (type == 1) {existingPopups.style.display = 'none';}
		  if (type == 2) {
			  const wordBounds = document.getElementById(`scwp-${i}`).getBoundingClientRect();
			  existingPopups.style.left = window.scrollX + wordBounds.left + 'px';
			  existingPopups.style.top = window.scrollY + wordBounds.top + wordBounds.height + 'px';
		  }
	  }
	}
};

document.addEventListener('keydown', () => {
  alterAllWordPopUps(0);
});


//import { SpellCorrectionQuery } from = '../backend/templates/Requester.js';
//SpellCorrectionQuery();

function setupTextAreaOverlay(textarea) {
	console.log("setupTextAreaOverlay(textarea)");
	
	// Create Overlay
	const overlay = document.createElement("div");
	overlay.className = "spell-corrector-overlay";
	document.body.appendChild(overlay);
	
	// Div Copy Style of TextArea
	
	overlay.style.position = "absolute";
	overlay.style.pointerEvents = "none";
	overlay.style.background = "transparent";
	overlay.style.color = "transparent";
	overlay.style.zIndex = 12345;

	// Grab textarea specific styles properties
	function styleOverlay() {
		let textAreaStylings = getComputedStyle(textarea); // It gets the in use style!!!
		overlay.style.font = textAreaStylings.font;
		overlay.style.padding = textAreaStylings.padding;
		overlay.style.lineHeight = textAreaStylings.lineHeight;
		overlay.style.border = textAreaStylings.border;
		overlay.style.boxSizing = textAreaStylings.boxSizing;
		overlay.style.overflow = textAreaStylings.overflow;
	}
	styleOverlay();
	
	// Put div visually on top of textarea
	const positionOverlay = () => {
		styleOverlay();
		const areaBounds = textarea.getBoundingClientRect();
		overlay.style.left = window.scrollX + areaBounds.left + 'px';
		overlay.style.width = areaBounds.width + 'px';
		overlay.style.top = window.scrollY + areaBounds.top + 'px';
		overlay.style.height = areaBounds.height + 'px';
		//alterAllWordPopUps(2);
	};
	
	
	// Update DIV text to match textarea text
	const updateDivText = () => { //  = () => { means local to setupTextAreaOverlay!!!
		console.log("updateDivText = ()");
		overlay.innerHTML = "";
		positionOverlay();
		
		if (useAltWords === false) { // don't split here when alt method in use.
			inputWords = textarea.value.match(/\p{L}+(?:'\p{L}+)?|\s*[^\p{L}\s]+\s*|\s+/gu) || [];
		} // splits every time a 
		useAltWords = false;

		console.log("InputWords:",inputWords);
		console.log("OutputWords:",outputWords)
		
		var currentWord = "NULL"
		
		inputWords.forEach((word, index) => {
			const wordSpan = document.createElement("span");
			wordSpan.style.userSelect = '';
			wordSpan.textContent = word;
			wordSpan.style.whiteSpace = "pre"; // fixes "     " becoming " "
			let correctedWord = "";
			
			// per word popup
			const wordClick = () => {
				
				const existingPopUpCheck = document.getElementById(wordSpan.id + "-popup");
				
				if (document.body.contains(existingPopUpCheck)) { // if popup already exists
					let displayState = existingPopUpCheck.style.display;
					alterAllWordPopUps(1);
					if (displayState === 'none') {
						existingPopUpCheck.style.display = 'block';
						currentWord = wordSpan.textContent;
					} 
					else {
						existingPopUpCheck.style.display = 'none';
					}
					
				}
				else {
					
					alterAllWordPopUps(1);
					currentWord = wordSpan.textContent;
					
					const suggestTemp = document.createElement('template');	// get the suggestionPopup template				
					suggestTemp.innerHTML = suggest_html.trim();
					
					const wordCorrectPopUp = suggestTemp.content.querySelector('#lm-suggestion-div');
					
					// Set IDs for searchability
					wordCorrectPopUp.id = "scwp-" + assignUID + "-popup";
					wordSpan.id = "scwp-" + assignUID;
					assignUID += 1;
					// Give buttons IDs.
					suggestTemp.content.querySelector('#yes-button').id = "scwp-" + assignUID + "-yes-button";
					suggestTemp.content.querySelector('#no-button').id = "scwp-" + assignUID + "-no-button";
					
					
					// Update DIV style
					wordCorrectPopUp.style.position = "absolute";
					wordCorrectPopUp.style.zIndex = 12345;
					
					// Set result text
					const wordCorrectResult = suggestTemp.content.querySelector('#lm-result');
					wordCorrectResult.id = 'lm-result-' + (assignUID-1)

					if (correctedWord != "") {

					wordCorrectResult.textContent = correctedWord;}
					
					if (wordCorrectResult.textContent === "Result Placeholder ") {
						getLLMResponse(currentWord).then(response => {
							const result_element = document.getElementById('lm-result-'+(assignUID-1));
						    result_element.textContent = response.data.correctText + " ";
						});

					}
			
					//wordCorrectResult.textContent = wordSpan.textContent + " ";

					// Positioning
					const wordBounds = wordSpan.getBoundingClientRect();
					wordCorrectPopUp.style.left = window.scrollX + wordBounds.left + 'px';
					wordCorrectPopUp.style.top = window.scrollY + wordBounds.top + wordBounds.height + 'px';
					
					// Add to DOM
					document.body.appendChild(suggestTemp.content.cloneNode(true));
					
					// Give buttons click functionality.
					document.getElementById(`scwp-${assignUID}-yes-button`).addEventListener("click", () => {
						
					  // Update text on screen with change.
					  const result_element = document.getElementById('lm-result-'+(assignUID-1));
					  inputWords[index] = result_element.textContent;
					  textarea.value = inputWords.join('');
					  //updateDivText();
					  alterAllWordPopUps(1);
					  injectText(mostRecentlyEditedField);
					  
					});
					document.getElementById(`scwp-${assignUID}-no-button`).addEventListener("click", () => {
					  alterAllWordPopUps(1);
					  outputWords[index] = word;
					  injectText(mostRecentlyEditedField);
					  // replace suggestion with old in output
					});
					
				}
			};
			

			// words likethis break it, so might have to check inputWords outputWords length and, find the difference and join suggestions to be 'like this' in future.
			
			if (word && highlightEnabled) { // if word and not char
					if (outputWords.length > 0) { // won't work if one word becomes multiple.
						if ( word && outputWords[index] )
							{
								if (word !== outputWords[index]) {
									console.log("inputWords[", word, "], outputWords[",outputWords[index], "]");
									if (/\p{L}+(?:'\p{L}+)?/u.test(word)) { wordSpan.style.backgroundColor = '#FFC0CB80'; }
									else { wordSpan.style.backgroundColor = '#FFFB7380'; }
									wordSpan.style.color = getComputedStyle(mostRecentlyEditedField).color; // It gets the in use text color!!!
									wordSpan.style.cursor = "pointer";
									wordSpan.style.pointerEvents = "auto";
									correctedWord = outputWords[index];
									wordSpan.addEventListener("click", wordClick); // make clickable
								}
					}
				}
				
			
			}
			else {
				if (visualiseFetch) {
					wordSpan.style.pointerEvents = "none";
					wordSpan.style.backgroundColor = 'transparent';
					wordSpan.style.color = "pink";
				}
				console.log("Current: [", word, "]");
			}
			
			overlay.appendChild(wordSpan);

			
		});
	}
	
	updateDivText();
	textarea.addEventListener("input", updateDivText);
	textarea.addEventListener("scroll", updateDivText);
	
	positionOverlay();
	// Rerun positioning when window scrolled or resized.
    textarea.addEventListener("resize", positionOverlay);
	window.addEventListener("resize", positionOverlay);
	window.addEventListener("scroll", positionOverlay);
	
}


document.querySelectorAll(valid_field_types).forEach(setupTextAreaOverlay);







// Listen for changes user makes to editable text.
document.addEventListener('input', (event) => {
	if (!event.target.matches(valid_field_types)) return;
	userEditEvent = event;
	onUserTextChange(userEditEvent);
});

}

const existingInputsList = {};

let lastfetchmessage; // might become a problem.

function getLLMResponse(message) {
	console.log("Attempting to fetch to server...");
	highlightEnabled = false;
	injectText(mostRecentlyEditedField,mostRecentlyEditedField.value);
	if (message !== lastfetchmessage) { // Don't fetch llm if last message same as this message.
		lastfetchmessage = message;
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(
		  { type: "getFetchLLM", url: "http://localhost:8000", text : message },
		  (response) => {
			highlightEnabled = true;
			if (chrome.runtime.lastError) {
			  reject(chrome.runtime.lastError.message);
			} else {
				resolve(response);
			}
		  }
		);
	});
	}
	else {
		return Promise.resolve(null);
	}
}

function injectText(textbox, text) {
	injectTextAck = false;
	console.log("injectText(textbox, text)");
    const changed_element = mostRecentlyEditedField;
    const cursorPos = changed_element.selectionStart;
    const original_element_name = changed_element.id.replace(/-sctextbox$/, '');
    const original_changed_element_textbox = existingInputsList[original_element_name];
    changed_element.blur(); // Flush the old input!!!

    setTimeout(() => {
		if (text) {original_changed_element_textbox.value = text;}
        else {original_changed_element_textbox.value = changed_element.value;}
		var event = new Event('input', { bubbles: true }); // bubbles tells other js to update if listening for changes!!
        original_changed_element_textbox.dispatchEvent(event);
        original_changed_element_textbox.setSelectionRange(cursorPos, cursorPos);
        changed_element.focus();
    }, 0);
}

let inactivityRequestLLM;
let inactivityRequestLLMStop = false;
let inputEndWaitTime = 500; // wait 500ms for no more user input getLLMResponse.

function onUserTextChange(event) {
	console.log("onUserTextChange(event)", event);
	
	if (event) {
	
		let changed_element;

		changed_element = event.target;
		
		
	  const field_elements_div = overlayContainer.querySelector('div#field-elements'); // div where overlay.html can be updated.

	  // If matching a defined valid field type.
	  if (changed_element.matches(valid_field_types)) {
		// If field is enabled and editable
		if (!changed_element.disabled && !changed_element.readOnly) {
			
			// if field doesn't have id, set one.
			if (changed_element.id == ""){
				let i = 0;
				while (("textbox"+i.toString()) in existingInputsList) {
					i += 1;
				}
				changed_element.id = "textbox"+i.toString()
			}
		
			// Print Element Id and Text to console
			console.log("Edited Field:", changed_element.id);
			console.log("Field Text:", changed_element.value);


			// clear output if it has been changed			
			if (inputWords.length !== outputWords.length) {
				//console.log("CLEARING BECAUSE:",inputWords.length, " NOT " , outputWords.length);
				outputWords = [];
				inactivityRequestLLMStop = false;
			}
			

			mostRecentlyEditedField = changed_element;
			//changed_element.style.backgroundColor = highlight_colour // Highlights the text.
		  
			// If div is found
			if (field_elements_div) {
				
				// Find if changed_element already added to div
				const changed_element_textbox = field_elements_div.querySelector(('textarea#'+changed_element.id+'-sctextbox'));
				
				// Add changed_element to div if not yet in div
				if (!changed_element_textbox) {
					if (!field_elements_div.querySelector(('textarea#'+changed_element.id))) {
						// Title
						const changed_title = document.createElement('h3');
						changed_title.id = changed_element.id + '-title';
						
						changed_title.style.backgroundColor = "#e6e6e6";
						changed_title.style.width = "100%";
						changed_title.style.textAlign = "center";
						changed_title.style.paddingTop = "5px";
						changed_title.style.paddingBottom = "5px";
						
						
						changed_title.textContent = changed_element.id;
						changed_title.className = "fancy-textbox-name" 
						changed_title.style.userSelect = 'none';
						
						// Textbox
						existingInputsList[changed_element.id] = changed_element;
						const changed_textbox = document.createElement('textarea');
						changed_textbox.id = changed_element.id + '-sctextbox';
						changed_textbox.textContent = changed_element.value;
						changed_textbox.className = "fancy-textbox" 
						changed_textbox.readOnly = true; // make it not editable :/

						// Add Elements to field-elements Div
						field_elements_div.appendChild(changed_title);	
						field_elements_div.appendChild(changed_textbox);
					}
					
					// get text from popup textbox and inject back into original page textbox
					else {
						if (changed_element.id.endsWith('-sctextbox')) {
							injectText(changed_element.selectionStart);
						}
					}
					
					
				}
				else {
					// Just update the value if changed_element already in div
					changed_element_textbox.value = changed_element.value; 
					setTimeout(0);
				}
			
			}
		
		
		} 
	  }
  
	}
 
  /* Timer that counts time since last user input, timeout restarts if another input detected before inputEndWaitTime */
  clearTimeout(inactivityRequestLLM);  
  if (inactivityRequestLLMStop !== true) {
	  inactivityRequestLLMStop = true;
	  inactivityRequestLLM = setTimeout(() => {
		  if (lastFireText !== mostRecentlyEditedField.value || lastFireText === undefined) {
			queryForWholeTextBox();
			lastFireText = mostRecentlyEditedField.value
		  }
		  else {
			inactivityRequestLLMStop = true;
		  }
	  }, inputEndWaitTime);
  }

}


function queryForWholeTextBox() { // Eventually will automatically send text stuffs to the LLM and then add yes no boxes for the changes.
	console.log("Pressed...",userEditEvent);
	let oldType = mostRecentlyEditedField.value;
	getLLMResponse(mostRecentlyEditedField.value).then(response => {
		
		if (response && response.data != null) {
			
			
		textResponse = response.data;
		outputWords = textResponse.correctText.match(/\p{L}+(?:'\p{L}+)?|\s*[^\p{L}\s]+\s*|\s+/gu) || []; // splits every time a 
		
		//mostRecentlyEditedField.value = textResponse;
		
		if (inputWords.length === outputWords.length) {
			useAltWords = false;
			injectText(mostRecentlyEditedField,mostRecentlyEditedField.value);} // to update alerts and stuff}
		else {
			if (outputWords.length > 0 && mostRecentlyEditedField.value === oldType) {
				console.log("Origin",mostRecentlyEditedField.value);
				console.log("Response",textResponse);
				
				// Split using the same method as the website version in cases where one word becomes two.
				
				function theSplitter(originalString, responseString, mode) {
					const sentenceString = originalString.split(" ");
					let origin = [];
					let i = 0;
					while (i < sentenceString.length) {
						const correction = responseString.correctedWords.find(function(corWord) {
						  return corWord.startIndex === i;
						});
						
						if (correction) {
							let crt = "";
							
							if (mode === 1) { crt = correction.original; }
							else { crt = correction.corrected; }
							
							origin.push(crt);
							let originSize = crt.split(" ").length;
							i += originSize;
							
					    } 
						else {
				  		  origin.push(sentenceString[i]);
				  		  i++;
					    }
						
						if (i < sentenceString.length) {origin.push(" ");} 
					}
					
					return origin;
				}
				
				let origin = theSplitter(mostRecentlyEditedField.value,textResponse,1);
				let dest = theSplitter(textResponse.correctText,textResponse,2);

				//console.log("NEWFANGLED ORIGIN", origin);
				//console.log("NEWFANGLED DESTINATION", dest);

				inputWords = origin;
				outputWords = dest;
				useAltWords = true;
				injectText(mostRecentlyEditedField,mostRecentlyEditedField.value);
				
			}
			
		}
		
	}
	

	});
}


chrome.storage.local.get('overlayToggleButton', function(uservar) {
	console.log('Overlay Toggle Button:', uservar.overlayToggleButton);
    if (uservar.overlayToggleButton || uservar.overlayToggleButton === undefined) {
		if (window.location.hostname !== "localhost"  && !window.location.hostname.endsWith("spellpal.compose.co.nz")) {
			createOverlay();
			getSuggestHtml();
		}
    }
});

chrome.storage.local.get('extensionToggleButton', function(uservar) {
	console.log('Pop Up Toggle Button:', uservar.extensionToggleButton);
    if (uservar.extensionToggleButton || uservar.extensionToggleButton === undefined) {
		createMovableOverlay(true);
    }
	else {
		createMovableOverlay(false);
	}
});
