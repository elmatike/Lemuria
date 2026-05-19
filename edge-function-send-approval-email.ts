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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://iuhcdfvzgyrowbaqdagg.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
    try {
        const { reviewId } = await req.json();

        if (!reviewId) {
            return new Response(JSON.stringify({ error: "reviewId is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch the review from Supabase
        const reviewResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/reviews?id=eq.${reviewId}`,
            {
                headers: {
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const reviews = await reviewResponse.json();

        if (!reviews || reviews.length === 0) {
            return new Response(JSON.stringify({ error: "Review not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        const review = reviews[0];

        // Generate stars
        const stars = "★".repeat(review.estrellas) + "☆".repeat(5 - review.estrellas);

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
                subject: `Nueva reseña de "${review.empresa}" - Requiere aprobación`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #06B6D4;">Nueva reseña recibida</h2>
                        <div style="background: #1E293B; padding: 20px; border-radius: 12px; margin: 20px 0;">
                            <p style="color: #F8FAFC; font-size: 18px; margin: 0 0 10px 0;"><strong>${review.empresa}</strong></p>
                            <p style="color: #FBBF24; font-size: 20px; margin: 0 0 10px 0;">${stars}</p>
                            <p style="color: #94A3B8; margin: 0;">"${review.descripcion}"</p>
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
