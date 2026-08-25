// The one click that turns a draft into a real delivery. The order data
// lives inside the signed token from the QC email - no database lookup,
// which also means this link can't be reused to leak someone else's order:
// tampering with the token invalidates the signature.

export const config = { runtime: "edge" };

import { renderInvite } from "../lib/render-invite.js";
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

  let base64;
  try {
    const imageResponse = renderInvite(order);
    const buf = await imageResponse.arrayBuffer();
    base64 = arrayBufferToBase64(buf);
  } catch (err) {
    return new Response(`Render failed: ${err.message}`, { status: 500 });
  }

  await sendEmail({
    to: order.email,
    subject: `Your invite is ready - ${order.bride} & ${order.groom}`,
    html: `
      <p>Here's your personalised invite, ready to share on WhatsApp.</p>
      <p>Thank you for using Shagun!</p>
    `,
    attachments: [{ filename: "invite.png", content: base64 }],
  });

  return new Response("Sent to the customer. You can close this tab.", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
