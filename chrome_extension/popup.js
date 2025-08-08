document.addEventListener('DOMContentLoaded', function() {
	const leftSideButton = document.getElementById('leftSideButton');
	const rightSideButton = document.getElementById('rightSideButton');
	const extensionToggleButton = document.getElementById('extensionToggleButton');

	leftSideButton.addEventListener('click', function() {
		chrome.storage.local.set({ overlaySide: 'left' }, function() {
			console.log('Left Button Clicked!');
		});
	});
	rightSideButton.addEventListener('click', function() {
		chrome.storage.local.set({ overlaySide: 'right' }, function() {
			console.log('Right Button Clicked!');
		});
	});
	extensionToggleButton.addEventListener('click', function() {
		chrome.storage.local.get('extensionToggleButton', function(uservar) {
			// if value has been set before
			if (uservar.extensionToggleButton) {
				uservar.extensionToggleButton = !uservar.extensionToggleButton
				extensionToggleButton.textContent = 'Popup Enabled:' + uservar.extensionToggleButton;
				chrome.storage.local.set({ extensionToggleButton: uservar.extensionToggleButton }, function() {
					console.log('Extension Toggled!', uservar.extensionToggleButton);
				});
			}
			else {
				chrome.storage.local.set({ extensionToggleButton: 'true' }, function() {
					console.log('Extension First Time Toggled!');
					extensionToggleButton.textContent = ('Popup Enabled: true');
				});
			}
		});
	});
});
