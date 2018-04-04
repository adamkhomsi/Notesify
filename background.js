/**
 * Retrieve the current content of the system clipboard.
 */
function getContentFromClipboard() {
  var result = '';
  var sandbox = document.getElementById('sandbox');
  sandbox.value = '';
  sandbox.select();
  if (document.execCommand('paste')) {
    result = sandbox.value;
    console.log('got value from sandbox: ' + result);
  }
  sandbox.value = '';
  return result;
}

// Send pasted value to the content script.

function sendPasteToContentScript(toBePasted) {
  // find the active tab and window and then send the data along. Based on:
  // https://developer.chrome.com/extensions/messaging
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {data: toBePasted});
  });
}

//function triggered on button click.

function onClickHandler(info, tab) {
  var clipboardContent = getContentFromClipboard();
  console.log('clipboardContent: ' + clipboardContent);
  sendPasteToContentScript(clipboardContent);
}

// Register the  button click.
chrome.runtime.onMessage.addListener(
  function(request) {
    if (request.greeting == "clicked")
      onClickHandler();
  });
