import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    // Get market mode from query parameter
    const searchParams = request.nextUrl.searchParams;
    const marketMode = (searchParams.get("mode") || "global").toLowerCase();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Create Supabase client for data fetching
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    );

    // Fetch latest signals for all tickers
    const { data: allSignals } = await supabase
      .from("signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!allSignals || allSignals.length === 0) {
      return NextResponse.json(
        { error: "No signal data available" },
        { status: 404 }
      );
    }

    const isIndianTicker = (ticker: string) => ticker.endsWith(".NS");
    const scopedSignals = allSignals.filter((signal) =>
      marketMode === "indian"
        ? isIndianTicker(signal.ticker)
        : !isIndianTicker(signal.ticker)
    );

    if (scopedSignals.length === 0) {
      return NextResponse.json(
        {
          error:
            marketMode === "indian"
              ? "No Indian market signals available yet. Run the signal engine with MARKET_MODE=indian."
              : "No global market signals available yet.",
        },
        { status: 404 }
      );
    }

    // Group by ticker and get latest for each
    const latestByTicker: Record<string, any> = {};
    for (const signal of scopedSignals) {
      if (!latestByTicker[signal.ticker]) {
        latestByTicker[signal.ticker] = signal;
      }
    }

    const topSignals = Object.values(latestByTicker)
      .sort((a: any, b: any) => (b.final_score || 0) - (a.final_score || 0))
      .slice(0, 15);

    // Build signal summary for prompt
    const signalSummary = topSignals
      .map(
        (s: any) =>
          `• ${s.ticker}: ${s.signal} (Score: ${s.final_score?.toFixed(3) || "N/A"}, Price: $${s.price?.toFixed(2) || "N/A"}, RSI: ${s.rsi?.toFixed(1) || "N/A"})`
      )
      .join("\n");

    const marketContext =
      marketMode === "indian"
        ? "Indian Stock Market (NSE)"
        : "Global Stock Market";
    const stockType =
      marketMode === "indian"
        ? "Indian large-cap and mid-cap stocks"
        : "US-listed tech and mega-cap stocks";

    const prompt = `You are a professional stock market analyst providing daily trading recommendations.

MARKET: ${marketContext}
STOCK TYPE: ${stockType}
DATE: Today's trading session

AVAILABLE SIGNALS (Top Candidates):
${signalSummary}

Based on the comprehensive signal data above, provide the TOP 2-3 stocks I should focus on buying TODAY.

For each recommendation, explain:
1. Why it's a good buy today (technical + sentiment)
2. Entry price range
3. Target price for today/this week
4. Key risk factors

Provide response as JSON:
{
    "top_recommendations": [
        {
            "ticker": "SYMBOL",
            "rank": 1,
            "buy_reason": "Brief explanation of why to buy today",
            "technical_reason": "RSI/MA crossover/etc",
            "sentiment_reason": "News/social sentiment",
            "entry_price": 123.45,
            "target_price_today": 125.00,
            "target_price_week": 128.00,
            "risk_factors": ["risk1", "risk2"],
            "confidence": 8
        }
    ],
    "market_outlook": "Brief market sentiment for today",
    "best_time_to_buy": "Market open? Afternoon dip? etc",
    "portfolio_suggestion": "If you had to pick ONE, which would it be?"
}

Be concise, actionable, and confident in your recommendations.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert financial analyst providing daily trading recommendations. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const analysisText = response.choices[0].message.content;

    if (!analysisText) {
      return NextResponse.json(
        { error: "No content in AI response" },
        { status: 500 }
      );
    }

    const analysis = JSON.parse(analysisText);

    return NextResponse.json({
      status: "success",
      market_mode: marketMode,
      analysis,
      signals_analyzed: topSignals.length,
      usage: {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        completion_tokens: response.usage?.completion_tokens,
        prompt_tokens: response.usage?.prompt_tokens,
        total_tokens: response.usage?.total_tokens,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Best buy recommendation error:", error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: "OpenAI API key invalid or expired" },
        { status: 401 }
      );
    }

    if (error.message?.includes("quota")) {
      return NextResponse.json(
        { error: "OpenAI API quota exceeded" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
