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
          // Check if response.data is a string that needs parsing
          let parsedData = response.data;
          if (typeof response.data === "string") {
            try {
              parsedData = JSON.parse(response.data);
            } catch (parseError) {
              console.error("Failed to parse response data:", parseError);
              setError("Failed to parse response data");
              return;
            }
          }
          setApiData(parsedData);
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

  // Loading state component
  if (loading) {
    return (
      <div className="flex h-auto w-full flex-col items-center justify-center gap-4 p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              Analyzing Reviews
            </p>
            <p className="text-xs text-gray-500">
              This may take a few moments...
            </p>
          </div>
        </div>
        <div className="h-1 w-full max-w-xs rounded-full bg-gray-200">
          <div className="h-1 w-1/3 animate-pulse rounded-full bg-blue-600"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-auto w-full flex-col items-center justify-center gap-4 p-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Analysis Failed
          </h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // No data yet (initial state)
  if (!apiData) {
    return (
      <div className="flex h-auto w-full flex-col items-center justify-center gap-4 p-8">
        <div className="text-center">
          <p className="text-sm text-gray-500">No analysis data available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-auto w-full flex-col items-center justify-center gap-2"
      style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
    >
      <div className="flex h-full w-full items-start justify-start rounded-sm bg-green-400/0">
        <div
          className="aspect-square h-20 -translate-x-4"
          style={{
            paddingTop: "1rem",
          }}
        >
          {apiData && apiData.SentimentScore && (
            <CircularProgress
              score={parseFloat(apiData.SentimentScore)}
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
          {apiData && apiData.SentimentScore && (
            <>
              {(() => {
                const score = parseFloat(apiData.SentimentScore);
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

          {apiData && apiData.ReviewsScraped && (
            <p>{apiData.ReviewsScraped} quality reviews scraped</p>
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
        {apiData && apiData.Summary && <p>{apiData.Summary}</p>}
      </div>

      <span
        className="text-medium bg-background border-muted w-full gap-1 rounded-sm border"
        style={{ padding: "0.5rem" }}
      >
        Customer perception is
        {apiData && apiData.UserSentiment && (
          <span className="text-primary font-bold">
            {" " + apiData.UserSentiment}
          </span>
        )}
      </span>

      {apiData && apiData.RelatedItems && (
        <div className="w-full">
          <div className="flex gap-4 overflow-x-auto p-4">
            {apiData.RelatedItems.map((item, index) => (
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
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
