"use client";

export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center", padding: "0 1rem" }}
    >
      <p style={{ color: "#555", marginBottom: "1rem" }}>
        La collection ne peut pas être chargée pour le moment.
      </p>
      <button
        onClick={reset}
        style={{
          padding: "0.75rem 1.5rem",
          border: "1px solid #333",
          background: "transparent",
          cursor: "pointer",
          fontSize: "0.875rem",
        }}
      >
        Réessayer
      </button>
    </div>
  );
}
