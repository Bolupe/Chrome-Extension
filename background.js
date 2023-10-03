// Add an event listener for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the tab's status is "complete" (page finished loading) and if the URL starts with "http"
    if (changeInfo.status === "complete" && /^http/.test(tab.url)) {
      // Inject a content script into the tab
      chrome.scripting.executeScript({
        // Specify the target tab using its ID
        target: { tabId },
        // Specify the script file to inject (content.js)
        files: ["./content.js"]
      })
      .then(() => {
        // Log a success message to the console if the script injection is successful
        console.log("Content script has been injected successfully!");
      })
      .catch((err) => {
        // Log any errors that occur during script injection
        console.error(err, "Error in background script line 10");
      });
    }
  });
  