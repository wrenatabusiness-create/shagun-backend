// Signs the full order payload into the "Approve & send" link, so the
// approve step needs zero storage - the token IS the order record.
// Uses Web Crypto (works on Vercel Edge Functions and in browsers),
// not Node's `crypto` module.

const encoder = new TextEncoder();

async function getKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64url(bytes) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// order -> "payload.signature", both base64url
export async function signOrder(order, secret) {
  const json = JSON.stringify(order);
  const payloadB64 = base64url(encoder.encode(json));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  return `${payloadB64}.${base64url(sig)}`;
}

// token -> order, throws if tampered or malformed
export async function verifyOrder(token, secret) {
  const [payloadB64, sigB64] = String(token).split(".");
  if (!payloadB64 || !sigB64) throw new Error("Malformed token");
  const key = await getKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64urlToBytes(sigB64),
    encoder.encode(payloadB64)
  );
  if (!valid) throw new Error("Invalid signature");
  const json = new TextDecoder().decode(base64urlToBytes(payloadB64));
  return JSON.parse(json);
}

// Verifies Tally's own webhook signature (Settings -> Integrations ->
// Webhooks -> "Sign requests"), so forged POSTs to the endpoint are rejected.
export async function verifyTallySignature(rawBody, signatureB64, secret) {
  if (!signatureB64) return false;
  const key = await getKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    key,
    base64urlToBytes(signatureB64),
    encoder.encode(rawBody)
  );
}
