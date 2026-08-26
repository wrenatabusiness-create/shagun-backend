import { ImageResponse } from "@vercel/og";
import { STYLES } from "./styles.js";

// Plain element builder — deliberately not JSX, so this file runs as-is
// on Vercel Edge Functions without a build/transpile step.
function el(type, style = {}, children) {
  return { type, props: { style, children } };
}

function initial(name) {
  const c = (name || "").trim().charAt(0).toUpperCase();
  return c || "?";
}

// Wedding Suite is the invite plus two matching pieces. Basic/Premium only
// ever get the invite itself.
export function kindsForTier(tier) {
  return tier === "wedding suite" ? ["invite", "save-the-date", "thank-you"] : ["invite"];
}

// kind: "invite" | "save-the-date" | "thank-you" — the three pieces of the
// Wedding Suite tier. Basic/Premium only ever render "invite".
export function renderInvite(order, kind = "invite") {
  const cfg = STYLES[order.style] || STYLES.modern;
  const showCrest = order.tier === "premium" || order.tier === "wedding suite";

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

  // Premium touch: a personalised monogram crest, not a stand-in for a real
  // portrait — built entirely from the couple's initials so it never needs
  // an external image-generation call or a reference photo.
  if (showCrest) {
    children.push(
      el("div", {
        width: "150px",
        height: "150px",
        borderRadius: "999px",
        border: `2.5px solid ${cfg.medallionColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: cfg.medallionColor,
        fontFamily: "serif",
        fontSize: "46px",
        fontWeight: 700,
        letterSpacing: "2px",
        marginBottom: "22px",
      }, `${initial(order.bride)} ${cfg.joinWord === "&" ? "&" : "·"} ${initial(order.groom)}`)
    );
  }

  const headerText =
    kind === "save-the-date" ? "SAVE THE DATE" :
    kind === "thank-you" ? "WITH GRATITUDE" :
    cfg.headerText;

  children.push(
    el("div", {
      display: "flex",
      fontSize: "24px",
      fontWeight: 700,
      letterSpacing: "6px",
      color: cfg.headerColor,
      marginBottom: "18px",
    }, headerText)
  );

  children.push(el("div", { display: "flex", fontSize: "62px", fontWeight: 700, color: cfg.nameColor, textAlign: "center" }, order.bride || "Bride"));
  children.push(el("div", { display: "flex", fontSize: "26px", fontStyle: "italic", color: cfg.ampColor, margin: "6px 0" }, cfg.joinWord));
  children.push(el("div", { display: "flex", fontSize: "62px", fontWeight: 700, color: cfg.nameColor, textAlign: "center", marginBottom: "24px" }, order.groom || "Groom"));

  if (kind === "thank-you") {
    children.push(
      el("div", { display: "flex", fontSize: "20px", color: cfg.detailColor, textAlign: "center", maxWidth: "560px" },
        "Thank you for being part of our celebration.")
    );
  } else {
    children.push(el("div", { display: "flex", fontSize: "26px", fontWeight: 600, color: cfg.dateColor }, order.date || "Wedding date"));
    if (kind === "save-the-date") {
      children.push(el("div", { display: "flex", fontSize: "18px", color: cfg.detailColor, marginTop: "6px" }, "Formal invite to follow"));
    } else {
      children.push(el("div", { display: "flex", fontSize: "21px", color: cfg.detailColor, marginTop: "6px" }, order.venue || "Venue"));
      if (order.events) {
        children.push(
          el("div", { display: "flex", fontSize: "17px", color: cfg.detailColor, opacity: 0.85, marginTop: "6px" }, order.events)
        );
      }
    }
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
