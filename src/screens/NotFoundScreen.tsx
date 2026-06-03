import { useNavigate } from "react-router-dom";

export default function NotFoundScreen() {
  const navigate = useNavigate();

  return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f6f8",
        padding: "2rem",
        fontFamily: "'Segoe UI', sans-serif",
      }}>
        <div style={{ textAlign: "center", maxWidth: 520 }}>

          {/* Decorative code block */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "#e8a020",
            borderRadius: 8,
            padding: "6px 16px",
            marginBottom: "1.5rem",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              backgroundColor: "#1a2a4a", opacity: 0.6,
              display: "inline-block",
            }} />
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#1a2a4a",
              textTransform: "uppercase" as const,
            }}>
              Error · BNPL Admin
            </span>
          </div>

          {/* Giant 404 */}
          <div style={{ position: "relative", marginBottom: "1.5rem" }}>
            <span style={{
              fontSize: "clamp(96px, 20vw, 160px)",
              fontWeight: 900,
              color: "#1a2a4a",
              lineHeight: 1,
              letterSpacing: "-4px",
              display: "block",
              userSelect: "none",
            }}>
              404
            </span>
            {/* Accent underline */}
            <span style={{
              display: "block",
              width: 64,
              height: 4,
              backgroundColor: "#e8a020",
              borderRadius: 2,
              margin: "0 auto",
            }} />
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#1a2a4a",
            marginBottom: "0.75rem",
            margin: "0 0 0.75rem",
          }}>
            Page Not Found
          </h1>

          {/* Description */}
          <p style={{
            fontSize: 15,
            color: "#6b7280",
            lineHeight: 1.7,
            marginBottom: "2rem",
            margin: "0 0 2rem",
          }}>
            The page you're looking for doesn't exist or has been moved.
            It may have been removed or the link might be incorrect.
          </p>

          {/* Action buttons */}
          <div style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap" as const,
          }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 8,
                border: "2px solid #1a2a4a",
                backgroundColor: "transparent",
                color: "#1a2a4a",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1a2a4a";
                (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#1a2a4a";
              }}
            >
              ← Go Back
            </button>
          </div>

        </div>
      </div>
  );
}