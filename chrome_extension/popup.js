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

// Listen for changes user makes to editable text.
document.addEventListener('input', (event) => {
  const changed_element = event.target;

  // If matching a defined valid field type.
  if (changed_element.matches(valid_field_types)) {
	  // If field is enabled and editable
	  if (!changed_element.disabled && !changed_element.readOnly) {
		  console.log("Edited Field:", changed_element);
		  console.log("Field Text:", changed_element.value);
		  changed_element.style.backgroundColor = highlight_colour // Highlights the text.
	  }
  }
});
