chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
  }
});

// Future: Send the whole message and check for differences or something?

// Get Server Response
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getFetchLLM") {
	  chrome.cookies.getAll({ url: "http://localhost:8000" }, (cookies) => {
	  console.log("Server Cookies: ", cookies);
	  
	  var csrf = null
	  for (cookie in cookies) {
		if (cookies[cookie].name === "csrftoken") {
			 csrf = cookies[cookie].value;
	    }
	  }
	  
	  if (csrf != null) { // if found csrf
		  
		fetch("http://localhost:8000/api/spell-check/", {
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
			language: "en"
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
  }
});
