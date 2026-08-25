import { ImageResponse } from "@vercel/og";
import { STYLES } from "./styles.js";

// Plain element builder - deliberately not JSX, so this file runs as-is
// on Vercel Edge Functions without a build/transpile step.
function el(type, style = {}, children) {
  return { type, props: { style, children } };
}

// order: { bride, groom, date, venue, events, style, tier }
export function renderInvite(order) {
  const cfg = STYLES[order.style] || STYLES.modern;
  const showPortrait = order.tier === "premium";

  const background =
    cfg.bgType === "radial"
      ? `radial-gradient(circle at 50% 0%, ${cfg.bgFrom} 0%, ${cfg.bgTo} 70%)`
      : `linear-gradient(180deg, ${cfg.bgFrom} 0%, ${cfg.bgTo} 100%)`;

  const children = [
    el("div", {
      position: "absolute",
      inset: "38px",
      border: `${cfg.borderStyle === "double" ? 3 : 2}px solid ${cfg.borderColor}`,
      display: "flex",
    }, []),
  ];

  if (cfg.innerFrame) {
    children.push(
      el("div", {
        position: "absolute",
        inset: "54px",
        border: `1.2px solid ${cfg.borderColor}`,
        opacity: 0.6,
        display: "flex",
      }, [])
    );
  }

  if (showPortrait) {
    children.push(
      el("div", {
        width: "156px",
        height: "156px",
        borderRadius: "999px",
        border: `3px solid ${cfg.medallionColor}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: cfg.medallionColor,
        fontSize: "15px",
        textAlign: "center",
        marginBottom: "18px",
      }, [
        el("div", { display: "flex" }, "AI PORTRAIT"),
        el("div", { display: "flex" }, "not yet wired"),
      ])
    );
  }

  children.push(
    el("div", {
      display: "flex",
      fontSize: "24px",
      fontWeight: 700,
      letterSpacing: "6px",
      color: cfg.headerColor,
      marginBottom: "18px",
    }, cfg.headerText)
  );

  children.push(el("div", { display: "flex", fontSize: "62px", fontWeight: 700, color: cfg.nameColor, textAlign: "center" }, order.bride || "Bride"));
  children.push(el("div", { display: "flex", fontSize: "26px", fontStyle: "italic", color: cfg.ampColor, margin: "6px 0" }, cfg.joinWord));
  children.push(el("div", { display: "flex", fontSize: "62px", fontWeight: 700, color: cfg.nameColor, textAlign: "center", marginBottom: "24px" }, order.groom || "Groom"));
  children.push(el("div", { display: "flex", fontSize: "26px", fontWeight: 600, color: cfg.dateColor }, order.date || "Wedding date"));
  children.push(el("div", { display: "flex", fontSize: "21px", color: cfg.detailColor, marginTop: "6px" }, order.venue || "Venue"));

  if (order.events) {
    children.push(
      el("div", { display: "flex", fontSize: "17px", color: cfg.detailColor, opacity: 0.85, marginTop: "6px" }, order.events)
    );
  }

  return new ImageResponse(
    el("div", {
      width: "900px",
      height: "1260px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background,
      position: "relative",
      fontFamily: "sans-serif",
    }, children),
    { width: 900, height: 1260 }
  );
}
