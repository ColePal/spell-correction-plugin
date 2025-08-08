document.addEventListener('DOMContentLoaded', function() {
	const leftSideButton = document.getElementById('leftSideButton');
	const rightSideButton = document.getElementById('rightSideButton');

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
});
