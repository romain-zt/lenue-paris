export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div
        style={{
          aspectRatio: "3/4",
          background: "#eeebe6",
          marginBottom: "0.75rem",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div style={{ height: "1rem", background: "#e8e5e0", marginBottom: "0.375rem", width: "70%" }} />
      <div style={{ height: "0.875rem", background: "#edeae5", width: "40%" }} />
    </div>
  );
}
