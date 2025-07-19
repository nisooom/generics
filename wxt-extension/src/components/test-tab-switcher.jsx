import React, { useState, useRef, useEffect } from "react";
import D3ScatterPlot from "./d3-scatter-plot";
import { Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
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

const TestTabSwitcher = ({ originalContent }) => {
  const [activeTab, setActiveTab] = useState(0);
  const originalContentRef = useRef(null);
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

  useEffect(() => {
    if (originalContent && originalContentRef.current) {
      originalContentRef.current.innerHTML = "";
      const clonedContent = originalContent.cloneNode(true);
      originalContentRef.current.appendChild(clonedContent);
    }
  }, [originalContent]);

  const tabs = [
    { id: 0, label: "Ratings", content: "original" },
    { id: 1, label: "Analysis", content: "custom2" },
    { id: 2, label: "Reviews", content: "custom3" },
  ];

  const getScoreColor = (score) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 0.8) return "bg-green-100 text-green-800";
    if (score >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const renderStars = (rating) => {
    const numRating = parseInt(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={i <= numRating ? "text-yellow-400" : "text-gray-300"}
        >
          ★
        </span>,
      );
    }
    return stars;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <div
            ref={originalContentRef}
            className="h-full w-full"
            style={{
              minHeight: "400px",
              display: activeTab === 0 ? "block" : "none",
            }}
          />
        );
      case 1:
        return (
          <div className="flex h-96 w-full items-start justify-start rounded-sm bg-green-400/0">
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
          </div>
        );
      case 2:
        return (
          <div className="p-4">
            <h2 className="mb-4 text-xl font-bold">Tab 3 Content</h2>
            <p>
              This is the content for tab 3. You can customize this as needed.
            </p>
          </div>
        );
      default:
        return <div>Unknown tab</div>;
    }
  };

  return (
    <div
      className="h-full w-full"
      style={{
        marginTop: "20px",
      }}
    >
      <div className="flex w-full border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "10px 20px",
              textAlign: "center",
              cursor: "pointer",
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              activeTab === tab.id
                ? "border-b-2 border-blue-600 bg-white text-blue-600"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="h-full w-full overflow-auto">
        <div
          ref={originalContentRef}
          className="h-full w-full"
          style={{
            minHeight: "400px",
            display: activeTab === 0 ? "block" : "none",
          }}
        />

        {activeTab === 1 && (
          <>
            <div className="flex h-full w-full flex-col items-start justify-start rounded-sm bg-green-400/0">
              <div className="flex w-full">
                <div
                  className="aspect-square h-20"
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
                  className="flex flex-col"
                  style={{
                    paddingLeft: "0rem",
                    paddingTop: "1rem",
                  }}
                >
                  {JSON.parse(apiData) && (
                    <>
                      {(() => {
                        const score = parseFloat(
                          JSON.parse(apiData).SentimentScore,
                        );
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
                      {JSON.stringify(
                        JSON.parse(apiData).ReviewsScraped,
                        null,
                        2,
                      )}{" "}
                      quality reviews scraped
                    </p>
                  )}
                </div>
              </div>

              <div
                className="border-muted flex h-auto w-full -translate-y-8 flex-col rounded-sm border"
                style={{ padding: "0.5rem", marginBottom: "2rem" }}
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
              <div className="w-full -translate-y-12">
                {JSON.parse(apiData) && (
                  <D3ScatterPlot reviews={JSON.parse(apiData).Reviews} />
                )}
              </div>
            </div>
          </>
        )}
        {activeTab === 2 && (
          <div className="h-full w-full" style={{ padding: "1rem" }}>
            <h2 className="text-xl font-bold" style={{ marginBottom: "1rem" }}>
              Top Reviews (Sorted by Quality Score)
            </h2>
            {JSON.parse(apiData) &&
            Array.isArray(JSON.parse(apiData).Reviews) ? (
              JSON.parse(apiData)
                .Reviews.sort((a, b) => b.final_score - a.final_score)
                .slice(0, 5)
                .map((reviewObj, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                    style={{
                      marginBottom: "0.75rem",
                      padding: "1rem",
                    }}
                  >
                    {/* Header */}
                    <div
                      className="flex items-center justify-between"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      <div className="flex items-center gap-1">
                        {renderStars(reviewObj.rating)}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-600">
                          {reviewObj.user}
                        </div>
                        <div className="text-xs text-gray-400">
                          {reviewObj.time}
                        </div>
                      </div>
                    </div>

                    {/* Review text */}
                    <div
                      className="text-gray-700"
                      style={{ marginBottom: "0.75rem" }}
                    >
                      {reviewObj.review}
                    </div>

                    {/* Scores */}
                    <div
                      className="flex flex-wrap gap-1"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      <span
                        className={`rounded-full text-xs font-medium ${getScoreBadgeColor(
                          reviewObj.final_score,
                        )}`}
                        style={{ padding: "0.25rem 0.5rem" }}
                      >
                        Quality: {(reviewObj.final_score * 100).toFixed(0)}%
                      </span>
                      <span
                        className={`rounded-full text-xs font-medium ${getScoreBadgeColor(
                          reviewObj.score.sent,
                        )}`}
                        style={{ padding: "0.25rem 0.5rem" }}
                      >
                        Sentiment: {(reviewObj.score.sent * 100).toFixed(0)}%
                      </span>
                      <span
                        className={`rounded-full text-xs font-medium ${getScoreBadgeColor(
                          reviewObj.score.eng,
                        )}`}
                        style={{ padding: "0.25rem 0.5rem" }}
                      >
                        Engagement: {(reviewObj.score.eng * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <div
                className="text-center text-gray-500"
                style={{ padding: "2rem 0" }}
              >
                No reviews found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestTabSwitcher;
