import { useEffect } from "react";
import { motion } from "framer-motion";
import WasteDashboard from "@/components/WasteDashboard";
import { useWaste } from "@/context/WasteContext";

const RecordsPage = () => {
  const { records, loading, fetchRecords } = useWaste();

  useEffect(() => {
    if (records.length === 0) fetchRecords();
  }, [records.length, fetchRecords]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Records</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and manage all waste classification records.
        </p>
      </motion.div>

      <WasteDashboard records={records} loading={loading} onRefresh={fetchRecords} />
    </div>
  );
};

export default RecordsPage;
