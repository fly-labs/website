import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the ProblemHunt page
    const res = await fetch("https://problemhunt.pro/en");
    if (!res.ok) {
      throw new Error(`Failed to fetch ProblemHunt: ${res.status}`);
    }

    const html = await res.text();

    // Extract problem links: /en/{category}/{slug}
    const linkPattern = /href="(\/en\/[a-z-]+\/[a-z0-9-]+)"/g;
    const seen = new Set<string>();
    const items: Array<{ path: string; title: string }> = [];

    // Extract cards with title text - look for link + heading patterns
    const cardPattern = /<a[^>]*href="(\/en\/[a-z-]+\/[a-z0-9-]+)"[^>]*>[\s\S]*?<(?:h[2-4]|p|span)[^>]*>([^<]+)<\/(?:h[2-4]|p|span)>/g;
    let match;

    while ((match = cardPattern.exec(html)) !== null) {
      const path = match[1];
      const title = match[2].trim();
      if (!seen.has(path) && title.length > 10) {
        seen.add(path);
        items.push({ path, title });
      }
    }

    // Limit to newest 20 items
    const newest = items.slice(0, 20);

    if (newest.length === 0) {
      return new Response(
        JSON.stringify({ synced: 0, message: "No items found. HTML structure may have changed." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rows = newest.map((item) => {
      const pathParts = item.path.split("/");
      const category = pathParts[2] || "Other";
      const slug = pathParts[3] || "";
      const industryMap: Record<string, string> = {
        "marketing-sales": "Marketing Sales",
        "finance": "Finance",
        "medicine-health": "Medicine Health",
        "business": "Business",
        "realty": "Realty",
        "productivity": "Productivity",
        "education": "Education",
        "hr-career": "Hr Career",
        "ai": "Ai",
        "sport-fitness": "Sport Fitness",
        "retail": "Retail",
        "freelance": "Freelance",
        "dev": "Dev",
        "transportation": "Transportation",
        "media": "Media",
        "food-nutrition": "Food Nutrition",
        "legal": "Legal",
        "vc-startups": "Vc Startups",
        "travel": "Travel",
        "logistics-delivery": "Logistics Delivery",
        "psychology": "Psychology",
        "design-creative": "Design Creative",
        "immigration": "Immigration",
        "hardware": "Hardware",
        "dating-community": "Dating Community",
        "seo-geo": "Seo Geo",
        "agtech": "Agtech",
        "no-code": "No Code",
      };

      return {
        idea_title: item.title,
        idea_description: null,
        category: "Tool",
        industry: industryMap[category] || "Other",
        source: "problemhunt",
        source_url: `https://problemhunt.pro${item.path}`,
        external_id: `problemhunt-url-${slug}`,
        approved: true,
        name: "ProblemHunt",
        email: null,
        votes: 0,
      };
    });

    const { error } = await supabase
      .from("ideas")
      .upsert(rows, { onConflict: "external_id", ignoreDuplicates: true });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ synced: rows.length, message: "Sync complete" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
