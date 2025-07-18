import React, { useState, useRef, useEffect } from "react";

const TestTabSwitcher = ({ originalContent }) => {
  const [activeTab, setActiveTab] = useState(0);
  const originalContentRef = useRef(null);

  useEffect(() => {
    if (originalContent && originalContentRef.current) {
      originalContentRef.current.innerHTML = "";
      const clonedContent = originalContent.cloneNode(true);
      originalContentRef.current.appendChild(clonedContent);
    }
  }, [originalContent]);

  const tabs = [
    { id: 0, label: "Original", content: "original" },
    { id: 1, label: "Tab 2", content: "custom2" },
    { id: 2, label: "Tab 3", content: "custom3" },
  ];

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
          <div className="p-4">
            <h2 className="mb-4 text-xl font-bold">Tab 2 Content</h2>
            <p>
              This is the content for tab 2. You can customize this as needed.
            </p>
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
    <div className="h-full w-full bg-white">
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
          <div className="p-4">
            <h2 className="mb-4 text-xl font-bold">Tab 2 Content</h2>
            <p>
              This is the content for tab 2. You can customize this as needed.
            </p>
          </div>
        )}

        {activeTab === 2 && (
          <div className="p-4">
            <h2 className="mb-4 text-xl font-bold">Tab 3 Content</h2>
            <p>
              This is the content for tab 3. You can customize this as needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestTabSwitcher;
