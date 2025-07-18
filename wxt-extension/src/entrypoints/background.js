const API_BASE_URL = import.meta.env.WXT_API_BASE_URL;
async function postData(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("Response data:", responseData);
    return responseData;
  } catch (error) {
    console.error("Failed to post data:", error);
    throw error;
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "post-data") {
      (async () => {
        try {
          const responseData = await postData(
            `${API_BASE_URL}/say_hello`,
            message.data,
          );
          sendResponse({ success: true, data: responseData });
        } catch (error) {
          console.log(error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }
  });
});
