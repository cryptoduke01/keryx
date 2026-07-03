"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      className="pitch-print-btn"
      onClick={() => window.print()}
    >
      Save as PDF
    </button>
  );
}
