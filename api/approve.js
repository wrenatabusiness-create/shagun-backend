// The one click that turns a draft into a real delivery. The order data
// lives inside the signed token from the QC email — no database lookup,
// which also means this link can't be reused to leak someone else's order:
// tampering with the token invalidates the signature.

export const config = { runtime: "edge" };

import { renderInvite, kindsForTier } from "../lib/render-invite.js";
import { verifyOrder } from "../lib/token.js";
import { sendEmail, arrayBufferToBase64 } from "../lib/email.js";

export default async function handler(req) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response("Missing token", { status: 400 });

  let order;
  try {
    order = await verifyOrder(token, process.env.ORDER_SECRET);
  } catch {
    return new Response("This link is invalid or was already used.", { status: 401 });
  }

  let attachments;
  try {
    const kinds = kindsForTier(order.tier);
    attachments = await Promise.all(
      kinds.map(async (kind) => {
        const imageResponse = renderInvite(order, kind);
        const buf = await imageResponse.arrayBuffer();
        const name = kind === "invite" ? "invite" : kind;
        return { filename: `${name}.png`, content: arrayBufferToBase64(buf) };
      })
    );
  } catch (err) {
    return new Response(`Render failed: ${err.message}`, { status: 500 });
  }

  await sendEmail({
    to: order.email,
    subject: `Your invite is ready — ${order.bride} & ${order.groom}`,
    html: `
      <p>${attachments.length > 1 ? "Here's your personalised set — invite, save-the-date, and thank-you card — ready to share on WhatsApp." : "Here's your personalised invite, ready to share on WhatsApp."}</p>
      <p>Thank you for using Shubh by Wrenata!</p>
    `,
    attachments,
  });

  return new Response("Sent to the customer. You can close this tab.", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
