chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
	chrome.cookies.getAll({ url: "http://localhost:8000" }, (cookies) => {
	  console.log("Server Cookies: ", cookies);
	});
  }
});