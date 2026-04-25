import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const { ticker } = await request.json();

    if (!ticker) {
      return NextResponse.json(
        { error: "Ticker is required" },
        { status: 400 }
      );
    }

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

    // Fetch latest signal data for the ticker
    const { data: latestSignal } = await supabase
      .from("signals")
      .select(
        "ticker, signal, price, rsi, ma50, ma200, sentiment_score, technical_score, event_score, fundamental_score, final_score, created_at"
      )
      .eq("ticker", ticker.toUpperCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!latestSignal) {
      return NextResponse.json(
        { error: "No signal data found for this ticker" },
        { status: 404 }
      );
    }

    // Fetch recent news for the ticker
    const { data: recentNews } = await supabase
      .from("news_items")
      .select("title, sentiment_label, impact_weight, source, url")
      .eq("ticker", ticker.toUpperCase())
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch market data
    const { data: marketData } = await supabase
      .from("market_data")
      .select("*")
      .eq("ticker", ticker.toUpperCase())
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    // Construct analysis prompt
    const newsText = recentNews && recentNews.length > 0
      ? recentNews
          .slice(0, 5)
          .map((n: any) => `  • ${n.title} (${n.sentiment_label})`)
          .join("\n")
      : "  • No recent news available";

    const prompt = `You are an expert financial analyst. Analyze the following stock trading data and provide actionable recommendations.

STOCK: ${ticker.toUpperCase()}
Current Price: $${latestSignal.price?.toFixed(2) || "N/A"}

TECHNICAL ANALYSIS:
- RSI (14): ${latestSignal.rsi?.toFixed(2) || "N/A"} ${latestSignal.rsi > 70 ? "[overbought]" : latestSignal.rsi < 30 ? "[oversold]" : "[neutral]"}
- MA50: $${latestSignal.ma50?.toFixed(2) || "N/A"}
- MA200: $${latestSignal.ma200?.toFixed(2) || "N/A"}
- Trend: ${latestSignal.ma50 > latestSignal.ma200 ? "UPTREND" : "DOWNTREND"}

SIGNAL SCORES:
- Technical Score: ${latestSignal.technical_score?.toFixed(3) || "N/A"}
- Sentiment Score: ${latestSignal.sentiment_score?.toFixed(3) || "N/A"}
- Event Score: ${latestSignal.event_score?.toFixed(3) || "N/A"}
- Fundamental Score: ${latestSignal.fundamental_score?.toFixed(3) || "N/A"}
- Final Score: ${latestSignal.final_score?.toFixed(3) || "N/A"}

AUTO-GENERATED SIGNAL: ${latestSignal.signal}

RECENT NEWS:
${newsText}

MARKET DATA:
- 52-Week High: $${marketData?.high_52w?.toFixed(2) || "N/A"}
- 52-Week Low: $${marketData?.low_52w?.toFixed(2) || "N/A"}
- Volume: ${marketData?.volume?.toLocaleString() || "N/A"}
- Market Cap: $${(marketData?.market_cap_billions)?.toFixed(2) || "N/A"}B

Provide a professional trading analysis in this JSON format:
{
    "recommendation": "BUY|SELL|HOLD",
    "confidence": <1-10>,
    "key_insights": ["insight1", "insight2", "insight3"],
    "price_target_low": <float>,
    "price_target_high": <float>,
    "risk_level": "LOW|MEDIUM|HIGH",
    "action_items": ["action1", "action2"],
    "rationale": "detailed explanation of the recommendation"
}

Be specific, analytical, and professional. Base your recommendation on the comprehensive data provided.`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert financial analyst providing professional trading recommendations. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
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
      ticker: ticker.toUpperCase(),
      current_price: latestSignal.price,
      current_signal: latestSignal.signal,
      analysis,
      market_data: {
        rsi: latestSignal.rsi,
        ma50: latestSignal.ma50,
        ma200: latestSignal.ma200,
      },
      usage: {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        completion_tokens: response.usage?.completion_tokens,
        prompt_tokens: response.usage?.prompt_tokens,
        total_tokens: response.usage?.total_tokens,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Analysis error:", error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: "OpenAI API key invalid or expired" },
        { status: 401 }
      );
    }

    if (error.message?.includes("quota")) {
      return NextResponse.json(
        { error: "OpenAI API quota exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate analysis",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Use POST method with { ticker: \"SYMBOL\" }" },
    { status: 400 }
  );
}
