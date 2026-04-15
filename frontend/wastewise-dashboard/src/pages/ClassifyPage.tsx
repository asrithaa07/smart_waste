import { motion } from "framer-motion";
import WasteUpload from "@/components/WasteUpload";
import WasteTextAssistant from "@/components/WasteTextAssistant";
import { useWaste } from "@/context/WasteContext";
import type { WasteRecord } from "@/components/WasteDashboard";

const ClassifyPage = () => {
  const { addRecord, setRecords } = useWaste();

  const handlePrediction = ({
    wasteType,
    record,
  }: {
    wasteType: string;
    confidence: number;
    record?: WasteRecord;
  }) => {
    if (record?.waste_type && record.timestamp) {
      setRecords((prev) => [record, ...prev]);
      return;
    }

    // Fallback path if backend returns only class.
    const fallbackRecord: WasteRecord = {
      waste_type: wasteType,
      bin_level: 0,
      timestamp: new Date().toISOString(),
    };
    addRecord(fallbackRecord);
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Classify Waste</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an image of waste to identify its type using AI classification.
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <WasteUpload onPrediction={handlePrediction} />
        <WasteTextAssistant />
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mx-auto max-w-lg rounded-3xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-soft)]"
      >
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Classification Tips
        </h3>
        <div className="space-y-3">
          {[
            { emoji: "📸", text: "Use clear, well-lit photos for best accuracy" },
            { emoji: "🎯", text: "Center the waste item in the frame" },
            { emoji: "📐", text: "Avoid cluttered backgrounds when possible" },
            { emoji: "🔄", text: "Try multiple angles if the first result seems off" },
          ].map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="flex items-start gap-3 rounded-xl bg-muted/40 p-3"
            >
              <span className="text-lg">{tip.emoji}</span>
              <p className="text-sm text-foreground">{tip.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ClassifyPage;
