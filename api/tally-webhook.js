// Receives the Tally form submission, drafts the invite, and emails it
// to the founder for a quick manual check before anything reaches the
// customer - same rule as everywhere else in this project.

export const config = { runtime: "edge" };

import { renderInvite } from "../lib/render-invite.js";
import { signOrder, verifyTallySignature } from "../lib/token.js";
import { sendEmail, arrayBufferToBase64 } from "../lib/email.js";

// Tally sends { data: { fields: [ { label, value }, ... ] } }.
// Field labels here must match exactly what you name the questions
// when you build the form in Tally.
function mapTallyFields(payload) {
    const byLabel = {};
    for (const f of payload?.data?.fields || []) {
          byLabel[f.label] = f.value;
    }
    return {
          bride: byLabel["Bride's name"] || "",
          groom: byLabel["Groom's name"] || "",
          date: byLabel["Wedding date"] || "",
          venue: byLabel["Venue"] || "",
          events: byLabel["Other events"] || "",
          style: String(byLabel["Style"] || "modern").toLowerCase(),
          tier: String(byLabel["Tier"] || "basic").toLowerCase(),
          email: byLabel["Your email"] || "",
    };
}

export default async function handler(req) {
    if (req.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
    }

  const rawBody = await req.text();

  if (process.env.TALLY_WEBHOOK_SECRET) {
        const signature = req.headers.get("tally-signature");
        const valid = await verifyTallySignature(rawBody, signature, process.env.TALLY_WEBHOOK_SECRET);
        if (!valid) return new Response("Invalid signature", { status: 401 });
  }

  let payload;
    try {
          payload = JSON.parse(rawBody);
    } catch {
          return new Response("Invalid JSON", { status: 400 });
    }

  const order = mapTallyFields(payload);

  if (!order.bride || !order.groom || !order.email) {
        return new Response("Missing required fields - check Tally field labels match mapTallyFields()", { status: 400 });
  }

  let base64;
    try {
          const imageResponse = renderInvite(order);
          const buf = await imageResponse.arrayBuffer();
          base64 = arrayBufferToBase64(buf);
    } catch (err) {
          return new Response(`Render failed: ${err.message}`, { status: 500 });
    }

  const token = await signOrder(order, process.env.ORDER_SECRET);
    const approveUrl = `${process.env.PUBLIC_BASE_URL}/api/approve?token=${encodeURIComponent(token)}`;

  await sendEmail({
        to: process.env.FOUNDER_EMAIL,
        subject: `New order - ${order.bride} & ${order.groom} (${order.tier}, ${order.style})`,
        html: `
              <p>New Shagun order.</p>
                    <ul>
                            <li><strong>Style:</strong> ${order.style}</li>
                                    <li><strong>Tier:</strong> ${order.tier}</li>
                                            <li><strong>Date:</strong> ${order.date}</li>
                                                    <li><strong>Venue:</strong> ${order.venue}</li>
                                                            <li><strong>Customer email:</strong> ${order.email}</li>
                                                                  </ul>
                                                                        <p>Draft is attached. If it looks right:</p>
                                                                              <p><a href="${approveUrl}">Approve &amp; send to customer</a></p>
                                                                                    <p>If something's off, don't click approve - fix it and send manually for now.</p>
                                                                                        `,
        attachments: [{ filename: "draft.png", content: base64 }],
  });

  return new Response("ok", { status: 200 });
}
