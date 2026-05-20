// Supabase Edge Function: send-approval-email
// Instructions:
// 1. Go to Supabase Dashboard → Edge Functions → New Function
// 2. Name: send-approval-email
// 3. Replace the entire contents of index.ts with this code
// 4. Add secret: RESEND_API_KEY (from https://resend.com/api-keys)
// 5. Deploy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = "https://lemurianos.vercel.app";

serve(async (req) => {
    try {
        const { reviewId, empresa, estrellas, descripcion } = await req.json();

        if (!reviewId || !empresa || estrellas === undefined || !descripcion) {
            return new Response(
                JSON.stringify({ error: "reviewId, empresa, estrellas, and descripcion are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Generate stars
        const stars = "★".repeat(estrellas) + "☆".repeat(5 - estrellas);

        // Send approval email via Resend
        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Lemuria <onboarding@resend.dev>",
                to: ["elmatike@gmail.com"],
                subject: `Nueva reseña de "${empresa}" - Requiere aprobación`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #06B6D4;">Nueva reseña recibida</h2>
                        <div style="background: #1E293B; padding: 20px; border-radius: 12px; margin: 20px 0;">
                            <p style="color: #F8FAFC; font-size: 18px; margin: 0 0 10px 0;"><strong>${empresa}</strong></p>
                            <p style="color: #FBBF24; font-size: 20px; margin: 0 0 10px 0;">${stars}</p>
                            <p style="color: #94A3B8; margin: 0;">"${descripcion}"</p>
                        </div>
                        <a href="${SITE_URL}/aprobar.html?id=${reviewId}" 
                           style="display: inline-block; background: #06B6D4; color: #0F172A; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                            Aprobar reseña
                        </a>
                        <p style="color: #64748B; font-size: 12px; margin-top: 20px;">
                            Hacé click en el botón para aprobar y publicar esta reseña automáticamente.
                        </p>
                    </div>
                `,
            }),
        });

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
            console.error("Resend error:", emailData);
            return new Response(
                JSON.stringify({ error: "Failed to send email", details: emailData }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, emailId: emailData.id }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});
