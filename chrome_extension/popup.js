const ROOT_URL = "http://localhost:8000";
const SPELL_CHECK_URL = ROOT_URL+"/api/spell-check/";
const ACCEPT_CHANGE_URL = ROOT_URL+"/api/accept-change/";
const FETCH_CSRF_TOKEN_URL = ROOT_URL+"/api/fetch-csrf-token/";

document.addEventListener('DOMContentLoaded', function() {
	const leftSideButton = document.getElementById('leftSideButton');
	const rightSideButton = document.getElementById('rightSideButton');
	const extensionToggleButton = document.getElementById('extensionToggleButton');
	const overlayToggleButton = document.getElementById('overlayToggleButton');
	
	popUpUpdate(false);
	overlayUpdate(false);
	chrome.storage.local.get('overlaySide', function(userVar) {
		overlaySideSet(userVar.overlaySide);
    });
	
	chrome.storage.local.get('extensionToggleButton', function(userVar) {
	if (userVar.extensionToggleButton === undefined) {userVar.extensionToggleButton = true;}
	});
	chrome.storage.local.get('overlayToggleButton', function(userVar) {
		if (userVar.overlayToggleButton === undefined) {userVar.overlayToggleButton = true;}
	});
	
	function overlaySideSet(side) {
		chrome.storage.local.set({ overlaySide: side }, function() {
			console.log('Left Button Clicked!');
			let otherSide = leftSideButton;
			let sideB = rightSideButton;
			if (side === 'left') {otherSide = rightSideButton; sideB = leftSideButton;}
			
			sideB.style.backgroundColor = "#95B309";
			otherSide.style.backgroundColor = "#AB3232";
		});
		
		
	}

	leftSideButton.addEventListener('click', function() {
		overlaySideSet('left');
	});
	rightSideButton.addEventListener('click', function() {
		overlaySideSet('right');
	});
	
	function popUpUpdate(toggle) {
		chrome.storage.local.get('extensionToggleButton', function(userVar) {
			
			// if value has been set before
			if (typeof userVar.extensionToggleButton !== 'undefined') {
				if (toggle) {userVar.extensionToggleButton = !userVar.extensionToggleButton}
				extensionToggleButton.textContent = 'Pop Up Enabled';
				extensionToggleButton.style.color = "white";
				extensionToggleButton.style.fontWeight = "bold";
				if (userVar.extensionToggleButton === false) {extensionToggleButton.style.backgroundColor = "#AB3232";}
				else {extensionToggleButton.style.backgroundColor = "#95B309";}
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
	}

	extensionToggleButton.addEventListener('click', function() {
		let toggle = true;
		popUpUpdate(toggle);
	});
	
	
	function overlayUpdate(toggle) {
		chrome.storage.local.get('overlayToggleButton', function(userVar) {
			
			// if value has been set before
			if (typeof userVar.overlayToggleButton !== 'undefined') {
				if (toggle) {userVar.overlayToggleButton = !userVar.overlayToggleButton;}
				overlayToggleButton.textContent = 'Overlay Enabled';
				overlayToggleButton.style.color = "white";
				overlayToggleButton.style.fontWeight = "bold";
				if (userVar.overlayToggleButton === false) {overlayToggleButton.style.backgroundColor = "#AB3232";}
				else {overlayToggleButton.style.backgroundColor = "#95B309";}
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
	}
	
	overlayToggleButton.addEventListener('click', function() {
		let toggle = true;
		overlayUpdate(toggle);
	});
	
	// Figure out if logged in to server or not, if not show login button.
	chrome.cookies.getAll({ url: ROOT_URL }, (cookies) => {
		
	  console.log("Server Cookies: ", cookies);
	  let sessionIDExists = false;
	  let sessionID;
	  
	  for (cookie in cookies) {
		if (cookies[cookie].name === "sessionid") {
			sessionIDExists = true;
			sessionID = cookies[cookie];
	    }
	  }
	  
	  const login_button = document.createElement('button');
	  login_button.id = "serverLoginButton"
	  login_button.className = 'login-button';
	  login_button.style.color = 'white';
	  login_button.style.fontWeight = 'bold';
	  
	  if (sessionIDExists == false) {
		login_button.textContent = "Login";
		login_button.addEventListener('click', () => {
		      chrome.tabs.create({ url: ROOT_URL+'/login' });
		});
	  }
	  else {
		login_button.textContent = "Logout";
		login_button.addEventListener('click', () => {
		chrome.runtime.sendMessage(
		  { type: "logOut", url: "http://localhost:8000" }
		);
		
		setTimeout(() => {
			location.reload();
		}, 750);
		
		});
	  }
	  document.getElementById('loginButtonDiv').appendChild(login_button);	
	  
	});
	
});
