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

function isFlipkartDomain(url) {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === "www.flipkart.com" ||
      urlObj.hostname === "flipkart.com"
    );
  } catch (error) {
    console.error("Invalid URL:", error);
    return false;
  }
}

// New function to hit /analyse endpoint
async function analyseData(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/analyse`, {
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
    console.log("Analyse response data:", responseData);
    return responseData;
  } catch (error) {
    console.error("Failed to analyse data:", error);
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

    // Handle /analyse endpoint
    if (message.action === "analyse-data") {
      (async () => {
        try {
          const responseData = await analyseData(message.data);
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
