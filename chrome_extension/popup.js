// Movable Button + Overlay Container
const toggleButton = document.createElement('div');
const logo = document.createElement('img');
const overlayContainer = document.createElement('div');

async function main() {
  
  // Where the button first appears on the page
  let starting_point = 'left'
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
  
  // Add index.html into overlay container
  const overlay = await fetch(chrome.runtime.getURL('index.html')); // fetch overlay, get response
  const overlay_html = await overlay.text();
  overlayContainer.innerHTML = overlay_html;
  
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

main()


// Finds all valid textboxes and logs user changes.

// Editable fields to look for user changes in.
const valid_field_types = `
  input[type="text"],
  input[type="search"],
  input:not([type]),
  textarea
`;

// Highlight Colours
const highlight_colour = 'yellow'
const found_highlight_colour = 'green' // To show that the extension has found the textbox.

// Lists
const editable_fields_list = document.querySelectorAll(valid_field_types); // List of found valid fields.

// Highlight found fields/textboxes upon page load.
function highlight_found_fields() {
  editable_fields_list.forEach(field => {
    field.style.backgroundColor = found_highlight_colour;
  });
}

highlight_found_fields()

const existingInputsList = {};

// Listen for changes user makes to editable text.
document.addEventListener('input', (event) => {
  const changed_element = event.target;
  const field_elements_div = overlayContainer.querySelector('div#field-elements'); // div where index.html can be updated.

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
	    changed_element.style.backgroundColor = highlight_colour // Highlights the text.
	  
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
					changed_title.textContent = changed_element.id;
					
					// Textbox
					existingInputsList[changed_element.id] = changed_element;
					const changed_textbox = document.createElement('textarea');
					changed_textbox.id = changed_element.id + '-sctextbox';
					changed_textbox.textContent = changed_element.value;
					changed_textbox.className = "fancy-textbox" 

					// Add Elements to field-elements Div
					field_elements_div.appendChild(changed_title);	
					field_elements_div.appendChild(changed_textbox);
				}
				
				// get text from popup textbox and inject back into original page textbox
				else {
					if (changed_element.id.endsWith('-sctextbox')) {
						var cursorPos = changed_element.selectionStart
						let original_element_name = changed_element.id.replace(/-sctextbox$/, '');
						const original_changed_element_textbox = existingInputsList[original_element_name];
						original_changed_element_textbox.focus();
						original_changed_element_textbox.value = changed_element.value;
						// Tell the textbox to update its values.
						var event = new Event('input');
						original_changed_element_textbox.dispatchEvent(event);
						// When focus changes, make sure cursor index remains same
						original_changed_element_textbox.setSelectionRange(cursorPos, cursorPos);
						// Steal back focus
						changed_element.focus();
						setTimeout(0);
					}
				}
				
				
		    }
			else {
				
				console.log("Why are you broken");
				// Just update the value if changed_element already in div
			    changed_element_textbox.value = changed_element.value; 
				setTimeout(0);
		    }
		
        }
	
	
    } 
  }
});
