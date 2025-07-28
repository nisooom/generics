import React from "react";
import { createRoot } from "react-dom/client";
import TestComponent from "../components/header-component";
import "../entrypoints/popup/style.css";
import TestTabSwitcher from "@/components/tab-switcher";

export default defineContentScript({
  matches: ["<all_urls>"],
  main: async () => {
    // Remove badges immediately on script load
    function removeFlixcartBadge() {
      const badges = document.querySelectorAll(
        'img.LctmNn[src*="fa_9e47c1.png"]',
      );
      for (const badge of badges) {
        badge.remove();
      }
    }

    // Remove badges immediately
    removeFlixcartBadge();

    if (document.readyState === "loading") {
      await new Promise((resolve) =>
        document.addEventListener("DOMContentLoaded", resolve),
      );
    }

    // Remove badges again after DOM is ready
    removeFlixcartBadge();

    if (!document.getElementById("tailwind-cdn")) {
      const link = document.createElement("link");
      link.id = "tailwind-cdn";
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/tailwindcss@3.3.2/dist/tailwind.min.css";
      document.head.appendChild(link);

      await new Promise((resolve) => {
        link.onload = resolve;
        setTimeout(resolve, 1000);
      });
    }

    // Remove badges again after tailwind loads
    removeFlixcartBadge();

    const tryReplace = () => {
      // Remove badges before trying to replace
      removeFlixcartBadge();

      // Try to replace the first target div (keep as is - using TestComponent)
      const targetDiv1 = document.querySelector(".ISksQ2");
      if (targetDiv1) {
        const reactDiv1 = document.createElement("div");
        reactDiv1.id = "my-react-root-1";
        reactDiv1.style.width = "100%";
        reactDiv1.style.height = "100%";

        targetDiv1.replaceWith(reactDiv1);

        if (reactDiv1.parentElement) {
          reactDiv1.parentElement.classList.add("h-full", "w-full");
        }

        const root1 = createRoot(reactDiv1);
        root1.render(React.createElement(TestComponent));

        removeFlixcartBadge();
      }

      // Try to replace the second target div (modified to use TestTabSwitcher)
      const targetDiv2 = document.querySelector(".col.pPAw9M");
      if (targetDiv2) {
        // Store the original content
        const originalContent2 = targetDiv2.cloneNode(true);

        const reactDiv2 = document.createElement("div");
        reactDiv2.id = "my-react-root-2";
        reactDiv2.style.width = "100%";
        reactDiv2.style.height = "100%";

        targetDiv2.replaceWith(reactDiv2);

        if (reactDiv2.parentElement) {
          reactDiv2.parentElement.classList.add("h-full", "w-full");
        }

        const root2 = createRoot(reactDiv2);
        root2.render(
          React.createElement(TestTabSwitcher, {
            originalContent: originalContent2,
          }),
        );

        removeFlixcartBadge();
      }

      // Return true if either div was found and replaced
      return targetDiv1 || targetDiv2;
    };

    if (tryReplace()) {
      removeFlixcartBadge();
      return;
    }

    const observer = new MutationObserver((mutations) => {
      // Remove badges on every mutation
      removeFlixcartBadge();

      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          if (tryReplace()) {
            observer.disconnect();
            return;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Set up a continuous badge removal interval for persistent badges
    const badgeRemovalInterval = setInterval(removeFlixcartBadge, 100);

    setTimeout(() => {
      observer.disconnect();
      clearInterval(badgeRemovalInterval);
    }, 10000);
  },
});
