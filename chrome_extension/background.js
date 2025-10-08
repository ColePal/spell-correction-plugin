chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
  }
});

let csrfToken = null;

// background.js (Manifest V3)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        if (!csrfToken) {
            let csrfTokenResponse = await getCSRFToken(message.csrfTokenUrl);
			if (csrfTokenResponse) {
				csrfToken = csrfTokenResponse.csrfToken;
			}
        }
        let result = null
        if (message.type === "SPELL_CHECK") {
            result = await SpellCorrectionQuery(message.data, message.warning, message.url, csrfToken);
        } else if (message.type === "ACCEPT_CHANGE") {
            result = await acceptChangeRequest(message.data, message.url, csrfToken);
        } else if (message.type === "ANALYZE") {
            return null;
        } else {
            return null;
        }
        sendResponse(result);
    })();
    return true
});

async function getCSRFToken(getCSRFTokenUrl) {
    //get the csrftoken from the server
    try {
        let response = await fetch(getCSRFTokenUrl, {
            method: 'GET',
        })
        if (!response.ok) {
            const text = await response.text();
            console.error("Server error:", response.status, text);
            return null;
        }
        return await response.json();
    } catch(error) {
        console.log(error);
    }
    return null;
}

async function acceptChangeRequest(data, acceptChangeUrl, csrfToken) {
        try {
            let response = await fetch(acceptChangeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: data
            })
            if (!response.ok) {
                const text = await response.text();
                console.error("Server error:", response.status, text);
                return;
            }

            const queryResponse = await response.json();
            //let misspelledWords = findMisspelledWords(queryResponse);
            console.log("Feedback response:", queryResponse);
            return queryResponse;
        } catch (error) {
            console.log(error);
        }
}

async function SpellCorrectionQuery(JSONQuery, loginWarning, spellCheckUrl, csrfToken) {
    //get the csrftoken from cookies.

    console.log("Sending to server", JSONQuery);
    //const spellCheckUrl = "{% url 'spell_check' %}";
    //const csrfToken = getCookie("csrftoken");
    try {
        let response = await fetch(spellCheckUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(JSONQuery)
        })
        if (!response.ok) {
            const text = await response.text();
            console.error("Server error:", response.status, text);

            if (response.status === 401) {
                if (loginWarning === true ) {
                    //pop up
                    alert("You need to log in to use spell correction")
                    loginWarning = false
                }
            }
            return null;
        }


        const queryResponse = await response.json();
        //let misspelledWords = findMisspelledWords(queryResponse);
        console.log("queryResponse after unpacking:",queryResponse);
        return queryResponse;
    } catch(error) {
        console.log(error);
    }
    return null;
}

// Future: Send the whole message and check for differences or something?

// Get Server Response
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getFetchLLM") {
	  chrome.cookies.getAll({ url: "http://localhost:8000" }, (cookies) => {
	  console.log("Server Cookies: ", cookies);
	  
	  var csrf = null
	  for (let cookie in cookies) {
		if (cookies[cookie].name === "csrftoken") {
			 csrf = cookies[cookie].value;
	    }
	  }
	  
	  if (csrf != null) { // if found csrf
		  
		fetch("http://localhost:8000/spell-check/", {
		  method: "POST",
		  headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": csrf,
			"sec-fetch-site": "same-origin",
		  },
		  referrer: "http://localhost:8000/experimental/",
		  referrerPolicy: "strict-origin-when-cross-origin",
		  credentials: "include",
		  body: JSON.stringify({
			text: message.text,
			sentenceIndex: 0,
			index: 0,
			language: "en",
            premium: true
		  })
		})
		.then(response => {
		  if (!response.ok) {
			throw new Error(`Response Failure: ${response.status}`);
		  }
		  return response.json();
		})
		.then(data => {
		  console.log("Data Received:", data);
		  sendResponse({ data });
		  return true;
		})
		.catch(error => {
		  console.error("Error:", error);
		});

	  }
	  
	  
	  
	});
    return true;
  } else if (message.type === "FETCH_CSRF_TOKEN") {
    getCSRFToken(message.csrfTokenUrl)
  }
  else if (message.type === "logOut") {
	  
	  chrome.cookies.getAll({ url: "http://localhost:8000" }, (cookies) => {
	  
	  var csrf = null
	  for (let cookie in cookies) {
		if (cookies[cookie].name === "csrftoken") {
			 csrf = cookies[cookie].value;
	    }
	  }
	  
	  if (csrf != null) { // if found csrf
	  
	  fetch("http://localhost:8000/logout_extension/", {
		  method: "GET",
		  headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": csrf,
			"sec-fetch-site": "same-origin",
		  },
		  referrer: "http://localhost:8000/experimental/",
		  referrerPolicy: "strict-origin-when-cross-origin",
		  credentials: "include",
		})
	  
	  }
	  
	  });
	  return true;
	  
	  
	  
  }
});
