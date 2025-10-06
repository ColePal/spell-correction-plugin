const ROOT_URL = "http://localhost:8000";
const SPELL_CHECK_URL = ROOT_URL+"/api/spell-check/";
const ACCEPT_CHANGE_URL = ROOT_URL+"/api/accept-change/";
const FETCH_CSRF_TOKEN_URL = ROOT_URL+"/api/fetch-csrf-token/";

document.addEventListener('DOMContentLoaded', function() {
	const leftSideButton = document.getElementById('leftSideButton');
	const rightSideButton = document.getElementById('rightSideButton');
	const extensionToggleButton = document.getElementById('extensionToggleButton');
	const overlayToggleButton = document.getElementById('overlayToggleButton');

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
		chrome.storage.local.get('extensionToggleButton', function(userVar) {
			
			if (userVar.extensionToggleButton === undefined) {userVar.extensionToggleButton = true;}
			// if value has been set before
			if (userVar.extensionToggleButton) {
				userVar.extensionToggleButton = !userVar.extensionToggleButton
				extensionToggleButton.textContent = 'Popup Enabled:' + userVar.extensionToggleButton;
				chrome.storage.local.set({ extensionToggleButton: userVar.extensionToggleButton }, function() {
					console.log('Extension Toggled!', userVar.extensionToggleButton);
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
	
	overlayToggleButton.addEventListener('click', function() {
		chrome.storage.local.get('overlayToggleButton', function(userVar) {
			
			if (userVar.overlayToggleButton === undefined) {userVar.overlayToggleButton = true;}
			// if value has been set before
			if (userVar.overlayToggleButton) {
				userVar.overlayToggleButton = !userVar.overlayToggleButton
				overlayToggleButton.textContent = 'Overlay Enabled:' + userVar.overlayToggleButton;
				chrome.storage.local.set({ overlayToggleButton: userVar.overlayToggleButton }, function() {
					console.log('Overlay Toggled!', userVar.overlayToggleButton);
				});
			}
			else {
				chrome.storage.local.set({ overlayToggleButton: 'true' }, function() {
					console.log('Overlay First Time Toggled!');
					overlayToggleButton.textContent = ('Overlay Enabled: true');
				});
			}
		});
	});
	
	// Figure out if logged in to server or not, if not show login button.
	chrome.cookies.getAll({ url: ROOT_URL }, (cookies) => {
		
	  console.log("Server Cookies: ", cookies);
	  let sessionIDExists = false;
	  
	  for (cookie in cookies) {
		if (cookies[cookie].name === "sessionid") {
			sessionIDExists = true;
	    }
	  }
	  
	  if (sessionIDExists == false) {
		  const login_button = document.createElement('button');
		  login_button.id = "serverLoginButton"
	  	  login_button.textContent = "Login";
  		  document.getElementById('loginButtonDiv').appendChild(login_button);	
			
		  document.getElementById('serverLoginButton').addEventListener('click', () => {
		      chrome.tabs.create({ url: ROOT_URL+'/login' });
		  });
	  }
	  
	});
	
});
