import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { browser } from "wxt/browser";
import "../entrypoints/popup/style.css";
import CircularProgress from "./circular-progress";

function getRatingsUrl(productUrl) {
  try {
    const url = new URL(productUrl);
    const pathRegex = /(.*)\/p\/([^/?]+)/;
    const match = url.pathname.match(pathRegex);

    if (!match) return "";

    const productPath = match[1];
    const productId = match[2];
    const reviewsPath = `${productPath}/product-reviews/${productId}`;

    const params = new URLSearchParams(url.search);
    const newParams = new URLSearchParams();
    ["pid", "lid", "marketplace"].forEach((key) => {
      if (params.has(key)) {
        newParams.set(key, params.get(key));
      }
    });

    return `${url.origin}${reviewsPath}?${newParams.toString()}`;
  } catch {
    return "";
  }
}

export default function TestComponent({
  summary = "Customers have complained about the CPU heating issues, but adore the color accuracy of the display",
  score = 75,
  scoreText = "Reviews are mostly positive",
  maxScore = 100,
  confidence = 95,
  sentiment = "Overwhelmingly positive",
}) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [ratingsUrl, setRatingsUrl] = useState("");
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([
    {
      title: "Noise ColorFit Icon 2",
      image:
        "https://rukminim1.flixcart.com/image/416/416/l3/smartwatch/8/4/2/colorfit-icon-2-nw-1.jpg",
      url: "https://www.flipkart.com/noise-colorfit-icon-2-1-8-display-bluetooth-calling-ai-voice-assistant-smartwatch/product-reviews/itm9d8957f65c72e?pid=SMWGEH7WC8F4VKKZ&lid=LSTSMWGEH7WC8F4VKKZ6TOWMG&marketplace=FLIPKART",
      price: "₹1,999",
    },
    {
      title: "Fire-Boltt Phoenix",
      image:
        "https://rukminim1.flixcart.com/image/416/416/l3/smartwatch/8/4/2/colorfit-icon-2-nw-1.jpg",
      url: "https://www.flipkart.com/fire-boltt-phoenix-1-43-inch-amoled-display-bluetooth-calling-smartwatch/product-reviews/itm9d8957f65c72e?pid=SMWGEH7WC8F4VKKZ&lid=LSTSMWGEH7WC8F4VKKZ6TOWMG&marketplace=FLIPKART",
      price: "₹2,499",
    },
    {
      title: "boAt Wave Neo",
      image:
        "https://rukminim1.flixcart.com/image/416/416/l3/smartwatch/8/4/2/colorfit-icon-2-nw-1.jpg",
      url: "https://www.flipkart.com/boat-wave-neo-1-39-inch-amoled-display-bluetooth-calling-smartwatch/product-reviews/itm9d8957f65c72e?pid=SMWGEH7WC8F4VKKZ&lid=LSTSMWGEH7WC8F4VKKZ6TOWMG&marketplace=FLIPKART",
      price: "₹3,499",
    },
  ]);
  useEffect(() => {
    const url = window.location.href;
    setCurrentUrl(url);
    setRatingsUrl(getRatingsUrl(url));
  }, []);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!ratingsUrl) return;

      setLoading(true);
      setError(null);

      try {
        const response = await browser.runtime.sendMessage({
          action: "analyse-data",
          data: { url: ratingsUrl },
        });

        console.log("Response from background script:", response);

        if (response && response.success) {
          setApiData(response.data);
        } else if (response && response.error) {
          setError(`Error: ${response.error}`);
        } else {
          setError("No response received");
        }
      } catch (error) {
        setError(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [ratingsUrl]);

  const displayData = apiData || {
    summary,
    score,
    scoreText,
    confidence,
    sentiment,
  };

  return (
    <div
      className="flex h-auto w-full flex-col items-center justify-center gap-2"
      style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
    >
      {/* Show the current URL at the top */}
      {/* <div className="mb-2 w-full text-center text-xs text-gray-500">
        Current URL: <span className="break-all">{currentUrl}</span>
      </div> */}
      {/* Show the ratings/reviews URL */}
      {/* {ratingsUrl && (
        <div className="mb-2 w-full text-center text-xs text-blue-500">
          Ratings URL:{" "}
          <a
            href={ratingsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline"
          >
            {ratingsUrl}
          </a>
        </div>
      )} */}

      {/* Loading state */}
      {loading && (
        <div className="mb-2 w-full text-center text-xs text-yellow-500">
          Loading analysis data...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-2 w-full text-center text-xs text-red-500">
          {error}
        </div>
      )}

      <div className="flex h-full w-full items-start justify-start rounded-sm bg-green-400/0">
        <div
          className="aspect-square h-20 -translate-x-4"
          style={{
            paddingTop: "1rem",
          }}
        >
          {JSON.parse(apiData) && (
            <CircularProgress
              score={
                JSON.parse(apiData).SentimentScore
                  ? parseFloat(JSON.parse(apiData).SentimentScore)
                  : "0"
              }
              size={60}
              strokeWidth={5}
            />
          )}
        </div>
        <div
          className="flex -translate-x-4 flex-col"
          style={{
            paddingLeft: "0rem",
            paddingTop: "1rem",
          }}
        >
          {JSON.parse(apiData) && (
            <>
              {(() => {
                const score = parseFloat(JSON.parse(apiData).SentimentScore);
                let sentimentText = "";
                let textColor = "";

                if (score >= 0.9) {
                  sentimentText = "Overwhelmingly Positive";
                  textColor = "text-green-600";
                } else if (score >= 0.7) {
                  sentimentText = "Very Positive";
                  textColor = "text-green-500";
                } else if (score >= 0.6) {
                  sentimentText = "Mostly Positive";
                  textColor = "text-green-400";
                } else if (score >= 0.5) {
                  sentimentText = "Slightly Positive";
                  textColor = "text-green-300";
                } else if (score >= 0.4) {
                  sentimentText = "Mixed";
                  textColor = "text-yellow-500";
                } else if (score >= 0.3) {
                  sentimentText = "Slightly Negative";
                  textColor = "text-orange-300";
                } else if (score >= 0.2) {
                  sentimentText = "Mostly Negative";
                  textColor = "text-orange-500";
                } else if (score >= 0.1) {
                  sentimentText = "Very Negative";
                  textColor = "text-red-500";
                } else {
                  sentimentText = "Overwhelmingly Negative";
                  textColor = "text-red-600";
                }

                return (
                  <span className={`${textColor} text-lg font-bold`}>
                    Reviews are {sentimentText}
                  </span>
                );
              })()}
            </>
          )}

          {JSON.parse(apiData) && (
            <p>
              {JSON.stringify(JSON.parse(apiData).ReviewsScraped, null, 2)}{" "}
              quality reviews scraped
            </p>
          )}
        </div>
      </div>

      <div
        className="bg-background border-muted flex h-auto w-full flex-col rounded-sm border"
        style={{ padding: "0.5rem" }}
      >
        <section className="flex h-full w-full items-center justify-start gap-2 rounded-sm">
          <div className="mx-auto flex aspect-square h-6 max-w-4 items-center justify-center bg-indigo-500/0 text-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-medium">AI Summary</span>
        </section>
        {JSON.parse(apiData) && (
          <p>{JSON.stringify(JSON.parse(apiData).Summary, null, 2)}</p>
        )}
      </div>
      <span
        className="text-medium bg-background border-muted w-full gap-1 rounded-sm border"
        style={{ padding: "0.5rem" }}
      >
        Customer perception is
        {JSON.parse(apiData) && (
          <span className="text-primary font-bold">
            {" " + JSON.parse(apiData).UserSentiment}
          </span>
        )}
      </span>
      {JSON.parse(apiData) && (
        <div className="w-full">
          <div className="flex gap-4 overflow-x-auto p-4">
            {JSON.parse(apiData).RelatedItems &&
              JSON.parse(apiData).RelatedItems.map((item, index) => (
                <div
                  key={index}
                  className="group max-w-[200px] min-w-[200px] flex-shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-lg"
                >
                  {/* Image Container */}
                  <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-md bg-gray-50">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title || "Product image"}
                        className="h-full w-full object-contain transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIwMCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NEg5M1Y4MEg4N1Y3NFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+CiAgPHBhdGggZD0iTTc1IDUyQzc1IDQ5Ljc5MDkgNzYuNzkwOSA0OCA3OSA0OEgxMjFDMTIzLjIwOSA0OCAxMjUgNDkuNzkwOSAxMjUgNTJWOTZDMTI1IDk4LjIwOTEgMTIzLjIwOSAxMDAgMTIxIDEwMEg3OUM3Ni43OTA5IDEwMCA3NSA5OC4yMDkxIDc1IDk2VjUyWiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8L3BhdGg+Cjwvc3ZnPgo=";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <svg
                          className="h-12 w-12"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Title */}
                  <a
                    href={item.url}
                    className="mb-2 block text-sm font-medium text-gray-800 hover:text-blue-600"
                    target="_blank"
                    style={{
                      paddingLeft: "0.5rem",
                      paddingRight: "0.5rem",
                    }}
                    rel="noopener noreferrer"
                  >
                    <h3 className="line-clamp-2 leading-5">
                      {item.title || "Product Name"}
                    </h3>
                  </a>

                  {/* Price Section */}
                  <div className="space-y-1">
                    {item.price && (
                      <div
                        className="flex items-center gap-2"
                        style={{
                          paddingLeft: "0.5rem",
                          paddingRight: "0.5rem",
                        }}
                      >
                        <span className="text-lg font-bold text-gray-900">
                          ₹ {item.price}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      {/* Debug info - remove in production */}
      {apiData && (
        <div className="mt-2 w-full text-xs text-gray-400">
          <details>
            <summary>Debug: API Response</summary>
            <pre className="mt-1 break-all whitespace-pre-wrap">
              {JSON.stringify(JSON.parse(apiData), null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
