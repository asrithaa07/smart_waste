import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImagePlus, Loader2, Scan, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import type { WasteRecord } from "@/components/WasteDashboard";

interface WasteUploadProps {
  onPrediction?: (result: { wasteType: string; confidence: number; record?: WasteRecord }) => void;
}

const WASTE_ICONS: Record<string, string> = {
  organic: "🍃",
  plastic: "♻️",
  metal: "⚙️",
};

const WasteUpload = ({ onPrediction }: WasteUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file);
    setPrediction(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handlePredict = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(`${API_BASE_URL}/classify`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Classification failed');
      }

      const result = await response.json();
      const wasteType = result.classification?.class;
      const confidence = Number(result.classification?.confidence ?? 0);
      const record = result.data as WasteRecord | undefined;

      if (!wasteType) {
        throw new Error('Invalid classification response');
      }

      setPrediction(wasteType);
      onPrediction?.({ wasteType, confidence, record });
    } catch (error) {
      console.error('Classification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unable to classify image';
      setError(`Image classification failed: ${errorMessage}`);
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setPrediction(null);
  };

  const typeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "organic": return "border-organic/30 bg-organic/8";
      case "plastic": return "border-plastic/30 bg-plastic/8";
      case "metal": return "border-metal/30 bg-metal/8";
      default: return "border-border bg-muted";
    }
  };

  const typeTextColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "organic": return "text-organic";
      case "plastic": return "text-plastic";
      case "metal": return "text-metal";
      default: return "text-muted-foreground";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-soft)]"
    >
      <div className="mb-5 flex items-center gap-2">
        <Scan className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Classify Waste</h2>
      </div>

      {/* Drop Zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !preview && fileInputRef.current?.click()}
        animate={dragActive ? { scale: 1.02, borderColor: "hsl(158, 64%, 40%)" } : { scale: 1 }}
        className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${dragActive ? "border-primary bg-primary/5" : preview ? "border-border" : "border-border hover:border-primary/40 hover:bg-muted/50"
          } ${preview ? "p-0" : "p-10"}`}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full"
            >
              <img src={preview} alt="Preview" className="aspect-video w-full rounded-xl object-cover" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/70 text-background backdrop-blur-sm transition-colors hover:bg-foreground/90"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground"
              >
                <ImagePlus className="h-7 w-7" />
              </motion.div>
              <p className="text-sm font-semibold text-foreground">
                Drop image here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                or click to browse • PNG, JPG up to 10MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
      </motion.div>

      {/* Predict Button */}
      <motion.div className="mt-4">
        <Button
          onClick={handlePredict}
          disabled={!selectedFile || loading}
          className="w-full rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-40 h-12 text-sm font-semibold"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {loading ? "Analyzing..." : "Predict Waste Type"}
        </Button>
      </motion.div>

      {/* Prediction Result */}
      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className={`flex items-center gap-4 rounded-2xl border p-4 ${typeColor(prediction)}`}>
              <span className="text-3xl">{WASTE_ICONS[prediction.toLowerCase()] || "🗑️"}</span>
              <div className="flex-1">
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Classification Result
                </p>
                <p className={`text-lg font-bold capitalize ${typeTextColor(prediction)}`}>
                  {prediction}
                </p>
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Check className="h-4 w-4" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-red-300 bg-red-100 p-4 text-sm text-red-800"
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};

export default WasteUpload;
