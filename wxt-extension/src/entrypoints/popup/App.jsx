import React, { useState, useEffect } from "react";
import { browser } from "wxt/browser";

const App = () => {
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    const handleMessage = async () => {
      try {
        const response = await browser.runtime.sendMessage({
          action: "post-data",
          data: { name: "Planes are cool" },
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
      {responseText}
    </div>
  );
};

export default App;
