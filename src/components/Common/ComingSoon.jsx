import React from "react";

export default function ComingSoon({ title }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">{title}</h1>
      <p className="text-gray-600">
        This feature is coming soon. We are actively working on it.
      </p>
    </div>
  );
}
