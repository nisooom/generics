import React, { useState, useEffect } from "react";
import { browser } from "wxt/browser";

const App = () => {
  const [responseText, setResponseText] = useState("");
  const FLIPKART_URL =
    "https://www.flipkart.com/noise-colorfit-icon-2-1-8-display-bluetooth-calling-ai-voice-assistant-smartwatch/product-reviews/itm9d8957f65c72e?pid=SMWGEH7WC8F4VKKZ&lid=LSTSMWGEH7WC8F4VKKZ6TOWMG&marketplace=FLIPKART";
  useEffect(() => {
    const handleMessage = async () => {
      try {
        const response = await browser.runtime.sendMessage({
          action: "analyse-data",
          data: { name: FLIPKART_URL },
        });

        console.log("Response from background script:", response);

        if (response && response.success) {
          setResponseText(JSON.stringify(response.data));
        } else if (response && response.error) {
          setResponseText(`Error: ${response.error}`);
        } else {
          setResponseText("No response received");
        }
      } catch (error) {
        setResponseText(`Error: ${error.message}`);
      }
    };

    handleMessage();
  }, []);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-sm font-bold">
      {JSON.stringify(responseText, null, 2)}
    </div>
  );
};

export default App;
