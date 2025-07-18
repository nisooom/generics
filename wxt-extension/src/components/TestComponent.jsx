import React from "react";

export default function TestComponent() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-red-400">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Hello from TestComponent!</h1>
        <p className="text-lg">
          This is a test component rendered in the content script.
        </p>
      </div>
    </div>
  );
}
