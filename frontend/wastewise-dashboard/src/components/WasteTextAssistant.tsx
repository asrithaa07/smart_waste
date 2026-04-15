import { useState } from "react";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NLP_API_BASE_URL } from "@/lib/api";

interface NlpClassifyResult {
  item: string;
  category: "Organic" | "Plastic" | "Metal";
  disposal_instructions: string;
  confidence: number;
}

interface WasteTextAssistantProps {
  onNlpPrediction?: (category: string, confidence: number) => void;
}

const categoryStyle = (category: string) => {
  switch (category.toLowerCase()) {
    case "organic":
      return "text-organic bg-organic/10 border-organic/30";
    case "plastic":
      return "text-plastic bg-plastic/10 border-plastic/30";
    case "metal":
      return "text-metal bg-metal/10 border-metal/30";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
};

const WasteTextAssistant = ({ onNlpPrediction }: WasteTextAssistantProps) => {
  const [text, setText] = useState("");
  const [chatText, setChatText] = useState("Where to throw plastic?");
  const [result, setResult] = useState<NlpClassifyResult | null>(null);
  const [chatAnswer, setChatAnswer] = useState<string>("");
  const [loadingClassify, setLoadingClassify] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");

  const runClassify = async () => {
    const query = text.trim();
    if (!query) return;
    setLoadingClassify(true);
    setError("");
    try {
      const response = await fetch(`${NLP_API_BASE_URL}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = (await response.json()) as NlpClassifyResult;
      setResult(data);
      onNlpPrediction?.(data.category, data.confidence);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to classify text";
      setError(`Text classification failed: ${message}`);
    } finally {
      setLoadingClassify(false);
    }
  };

  const runChat = async () => {
    const query = chatText.trim();
    if (!query) return;
    setLoadingChat(true);
    setError("");
    try {
      const response = await fetch(`${NLP_API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = (await response.json()) as { answer?: string };
      setChatAnswer(data.answer ?? "No response");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get chat response";
      setError(`Chat request failed: ${message}`);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Text Waste Classifier (NLP)</h2>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Item text
        </label>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. banana peel, plastic bottle, aluminum can"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none ring-0 transition-colors focus:border-primary"
          />
          <Button
            onClick={runClassify}
            disabled={loadingClassify || !text.trim()}
            className="h-11 rounded-xl px-4"
          >
            {loadingClassify ? "Classifying..." : "Classify"}
          </Button>
        </div>
      </div>

      {result && (
        <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Result</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${categoryStyle(result.category)}`}>
              {result.category}
            </span>
            <span className="text-xs text-muted-foreground">
              Confidence: {(Number(result.confidence) * 100).toFixed(1)}%
            </span>
          </div>
          <p className="mt-3 text-sm text-foreground">{result.disposal_instructions}</p>
        </div>
      )}

      <div className="mt-6 space-y-3 border-t border-border pt-5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Waste Chat
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder="Where to throw plastic?"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none ring-0 transition-colors focus:border-primary"
          />
          <Button
            variant="outline"
            onClick={runChat}
            disabled={loadingChat || !chatText.trim()}
            className="h-11 rounded-xl px-4"
          >
            <Send className="mr-1.5 h-4 w-4" />
            {loadingChat ? "..." : "Ask"}
          </Button>
        </div>
        {chatAnswer && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground">
            {chatAnswer}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-100 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
};

export default WasteTextAssistant;
