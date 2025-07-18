import React from "react";
import { Sparkles } from "lucide-react";
import "../entrypoints/popup/style.css";
import CircularProgress from "./circular-progress";
export default function TestComponent() {
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
          <CircularProgress score={75} size={50} strokeWidth={5} />
        </div>
        <div
          className="flex -translate-x-4 flex-col"
          style={{
            paddingLeft: "0rem",
            paddingTop: "1rem",
          }}
        >
          <span className="text-primary text-lg font-bold">
            Reviews are mostly positive
          </span>
          <span className="text-md">confidence %</span>
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
        <p>
          Customers have complained about the CPU heating issues, but adore the
          color accuracy of the display
        </p>
      </div>
      <span
        className="text-medium bg-background border-muted w-full gap-1 rounded-sm border"
        style={{ padding: "0.5rem" }}
      >
        Customer perception is
        <span className="text-primary font-bold">
          {" "}
          Overwhelmingly positive{" "}
        </span>
      </span>
    </div>
  );
}
