import { NextRequest, NextResponse } from "next/server";
import { fetchFinancialLedgerAction } from "@/app/actions/finance";
import { fetchDashboardMetricsAction } from "@/app/actions/dashboard";
import { fetchProductsAction } from "@/app/actions/products";
import { fetchOrdersAction } from "@/app/actions/orders";
import { fetchAuditLogsAction } from "@/app/actions/audit-logs";

// Tool Declarations for Gemini Tool Calling
const ADMIN_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_financial_ledger",
        description: "Retrieves complete business financial metrics: gross revenue, supplier restock expenses, net profit, estimated 15% tax provision, and recent income/expense ledger transactions in Philippine Peso (₱).",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "get_dashboard_kpis",
        description: "Retrieves macro business KPIs: total sales, sales growth trend %, total active products, low-stock count, active staff count, and category distribution.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "get_inventory_status",
        description: "Retrieves the product catalog including SKU, product name, category, stock on-hand, reorder threshold, wholesale procurement cost, retail price, and stock status.",
        parameters: {
          type: "OBJECT",
          properties: {
            filter: {
              type: "STRING",
              description: "Optional filter: 'all', 'low_stock', or 'out_of_stock'",
            },
          },
        },
      },
      {
        name: "get_recent_orders",
        description: "Retrieves recent customer sales orders, item counts, total amounts in ₱, payment methods, and fulfillment statuses (Pending, Fulfilled, Cancelled).",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: {
              type: "INTEGER",
              description: "Number of orders to retrieve (default: 10)",
            },
          },
        },
      },
      {
        name: "get_audit_security_logs",
        description: "Retrieves administrative and operational audit trail logs, including actor names, action types, timestamps, and severity levels (INFO, WARNING, SECURITY).",
        parameters: {
          type: "OBJECT",
          properties: {
            module: {
              type: "STRING",
              description: "Optional module filter like 'Sales & Orders', 'Inventory & Stock', or 'Authentication'",
            },
          },
        },
      },
      {
        name: "propose_stock_adjustment",
        description: "Prepares a formal stock restock (addition) or adjustment deduction proposal for human confirmation. Returns a structured action card.",
        parameters: {
          type: "OBJECT",
          properties: {
            productName: { type: "STRING", description: "Name of the product" },
            productSku: { type: "STRING", description: "SKU of the product" },
            quantity: { type: "NUMBER", description: "Quantity to add (positive) or deduct (negative)" },
            reason: { type: "STRING", description: "Business reason or note for this stock shift" },
          },
          required: ["productName", "quantity", "reason"],
        },
      },
    ],
  },
];

const SYSTEM_INSTRUCTION = `
You are the Mini-ERP AI Copilot for the Administrator Portal.
Your primary role is to assist store executives and administrators with real-time business intelligence, financial accounting, inventory valuations, order summaries, and audit oversight.

Important Guidelines:
1. Keep responses short, direct, and concise (aim for 2 to 4 focused bullet points or 1-2 compact paragraphs maximum). Get straight to the key figures and conclusions without filler or lengthy disclaimers.
2. Always format financial values in Philippine Peso with the '₱' symbol (e.g. ₱2,149.65, ₱20,000.00).
3. When answering questions regarding revenue, inventory stock, orders, or logs, ALWAYS use the provided tools to query fresh live database records.
4. When presenting multiple data points, use compact bullet points or brief tables rather than lengthy prose.
5. When the user asks to restock or adjust an item, use 'propose_stock_adjustment' so a confirmation card is generated for human review. Never claim an action is permanently committed until the user confirms.
6. Do NOT use emojis. Use clean, professional formatting.
`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in server environment." },
        { status: 500 }
      );
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    // Format conversation history for Gemini API
    const geminiContents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content || "" }],
    }));

    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // 1. Initial Request to Gemini with Function Tools
    let response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: geminiContents,
        tools: ADMIN_TOOLS,
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    });

    let data = await response.json();

    // If model name returns 404/not available, fallback to gemini-3.5-flash or gemini-3.6-flash
    if (data.error && (data.error.code === 404 || data.error.message?.includes("no longer available"))) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
      response = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiContents,
          tools: ADMIN_TOOLS,
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      });
      data = await response.json();
    }

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return NextResponse.json(
        { error: data.error.message || "Failed to communicate with Gemini AI." },
        { status: 500 }
      );
    }

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // 2. Check if Gemini requested Tool / Function Calls (supporting parallel tool calls)
    const functionCallParts = parts.filter((p: any) => p.functionCall);

    if (functionCallParts.length > 0) {
      let proposedAction: any = null;
      const toolNames: string[] = [];

      const functionResponses = await Promise.all(
        functionCallParts.map(async (part: any) => {
          const fnName = part.functionCall.name;
          const fnArgs = part.functionCall.args || {};
          toolNames.push(fnName);
          let toolResult: any = {};

          if (fnName === "get_financial_ledger") {
            const res = await fetchFinancialLedgerAction();
            toolResult = res.data || { error: res.error };
          } else if (fnName === "get_dashboard_kpis") {
            const res = await fetchDashboardMetricsAction();
            toolResult = res.data || { error: res.error };
          } else if (fnName === "get_inventory_status") {
            const res = await fetchProductsAction();
            let prods = res.data || [];
            if (fnArgs.filter === "low_stock") {
              prods = prods.filter((p: any) => (p.stock_quantity ?? 0) <= (p.reorder_level ?? 10));
            } else if (fnArgs.filter === "out_of_stock") {
              prods = prods.filter((p: any) => (p.stock_quantity ?? 0) === 0);
            }
            toolResult = {
              totalProducts: prods.length,
              products: prods.slice(0, 15),
            };
          } else if (fnName === "get_recent_orders") {
            const res = await fetchOrdersAction();
            const limit = fnArgs.limit || 10;
            toolResult = {
              orders: (res.data || []).slice(0, limit),
            };
          } else if (fnName === "get_audit_security_logs") {
            const res = await fetchAuditLogsAction();
            let logs = res.data || [];
            if (fnArgs.module) {
              logs = logs.filter((l: any) => l.module?.toLowerCase().includes(fnArgs.module.toLowerCase()));
            }
            toolResult = {
              logs: logs.slice(0, 10),
            };
          } else if (fnName === "propose_stock_adjustment") {
            const prodsRes = await fetchProductsAction();
            const matched = (prodsRes.data || []).find(
              (p: any) =>
                p.name?.toLowerCase().includes(fnArgs.productName?.toLowerCase()) ||
                p.sku?.toLowerCase() === fnArgs.productSku?.toLowerCase()
            );

            proposedAction = {
              type: "STOCK_ADJUSTMENT",
              productId: matched?.id || "unknown",
              productName: matched?.name || fnArgs.productName,
              productSku: matched?.sku || fnArgs.productSku || "SKU-AUTO",
              currentStock: matched?.stock_quantity ?? 0,
              shiftAmount: Number(fnArgs.quantity || 0),
              reason: fnArgs.reason || "AI Recommended Adjustment",
            };

            toolResult = {
              status: "PROPOSAL_READY_FOR_CONFIRMATION",
              proposal: proposedAction,
            };
          }

          return {
            functionResponse: {
              name: fnName,
              response: { output: toolResult },
            },
          };
        })
      );

      // 3. Second Turn: Send all Function Responses back to Gemini for final synthesis
      const secondTurnContents = [
        ...geminiContents,
        candidate.content,
        {
          role: "user",
          parts: functionResponses,
        },
      ];

      const secondResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: secondTurnContents,
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      });

      const secondData = await secondResponse.json();
      const finalCandidate = secondData.candidates?.[0];
      const finalText =
        finalCandidate?.content?.parts?.find((p: any) => p.text)?.text ||
        finalCandidate?.content?.parts?.[0]?.text ||
        "Analysis completed with retrieved enterprise records.";

      return NextResponse.json({
        content: finalText,
        toolCalled: toolNames.join(", "),
        proposedAction,
      });
    }

    // Direct text response if no tool call was needed
    const textOutput =
      parts.map((p: any) => p.text || "").join("") ||
      "I am ready to assist you with administrator operations.";

    return NextResponse.json({
      content: textOutput,
    });
  } catch (err: any) {
    console.error("Admin AI Chat Exception:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process AI chat request." },
      { status: 500 }
    );
  }
}
