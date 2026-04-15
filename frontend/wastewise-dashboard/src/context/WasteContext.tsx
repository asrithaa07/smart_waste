import { createContext, useContext, useState, useCallback } from "react";
import type { WasteRecord } from "@/components/WasteDashboard";
import { API_BASE_URL } from "@/lib/api";

interface WasteContextType {
  records: WasteRecord[];
  setRecords: React.Dispatch<React.SetStateAction<WasteRecord[]>>;
  loading: boolean;
  fetchRecords: () => Promise<void>;
  addRecord: (record: WasteRecord) => Promise<void>;
}

const WasteContext = createContext<WasteContextType | null>(null);

export const useWaste = () => {
  const ctx = useContext(WasteContext);
  if (!ctx) throw new Error("useWaste must be used within WasteProvider");
  return ctx;
};

export const WasteProvider = ({ children }: { children: React.ReactNode }) => {
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/data`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([
        { waste_type: "organic", bin_level: 72, timestamp: new Date().toISOString() },
        { waste_type: "plastic", bin_level: 45, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { waste_type: "metal", bin_level: 88, timestamp: new Date(Date.now() - 7200000).toISOString() },
        { waste_type: "organic", bin_level: 30, timestamp: new Date(Date.now() - 10800000).toISOString() },
        { waste_type: "plastic", bin_level: 95, timestamp: new Date(Date.now() - 14400000).toISOString() },
        { waste_type: "metal", bin_level: 62, timestamp: new Date(Date.now() - 18000000).toISOString() },
        { waste_type: "organic", bin_level: 15, timestamp: new Date(Date.now() - 21600000).toISOString() },
        { waste_type: "plastic", bin_level: 55, timestamp: new Date(Date.now() - 25200000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRecord = useCallback(async (record: WasteRecord) => {
    setRecords((prev) => [record, ...prev]);

    try {
      const payload = {
        wasteType: record.waste_type,
        binLevel: record.bin_level,
      };

      const response = await fetch(`${API_BASE_URL}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend /data POST failed:", response.status, errorText);
      }
    } catch (err) {
      console.error("Failed to send record to backend", err);
    }
  }, []);

  return (
    <WasteContext.Provider value={{ records, setRecords, loading, fetchRecords, addRecord }}>
      {children}
    </WasteContext.Provider>
  );
};
