// Thin wrapper over Resend's HTTP API (resend.com) - plain fetch, no SDK,
// so it runs on the Edge runtime without extra dependencies.

export function arrayBufferToBase64(buffer) {
  let binary = "";
    const bytes = new Uint8Array(buffer);
      const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
              }
                return btoa(binary);
                }

                // attachments: [{ filename, content: base64string }]
                export async function sendEmail({ to, subject, html, attachments }) {
                  const res = await fetch("https://api.resend.com/emails", {
                      method: "POST",
                          headers: {
                                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                                      "Content-Type": "application/json",
                                          },
                                              body: JSON.stringify({
                                                    from: process.env.FROM_EMAIL,
                                                          to,
                                                                subject,
                                                                      html,
                                                                            attachments,
                                                                                }),
                                                                                  });

                                                                                    if (!res.ok) {
                                                                                        const text = await res.text();
                                                                                            throw new Error(`Resend error ${res.status}: ${text}`);
                                                                                              }
                                                                                                return res.json();
                                                                                                }
                                                                                                
