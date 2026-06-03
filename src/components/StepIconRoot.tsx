import { styled } from "@mui/material/styles";

export const StepIconRoot = styled("div")<{ ownerState: { active?: boolean; completed?: boolean } }>(
  ({ ownerState }) => ({
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
    transition: "all .2s",
    ...(ownerState.completed && {
      background: 'var(--color-red)',
      color: "#fff",
      border: "none",
    }),
    ...(ownerState.active && {
      background: 'var(--color-primary)',
      color: "#fff",
      border: "none",
      boxShadow: `0 0 0 4px rgba(26,42,74,0.12)`,
    }),
    ...(!ownerState.active && !ownerState.completed && {
      background: "#fff",
      color: "#9CA3AF",
      border: "2px solid #E5E7EB",
    }),
  })
);