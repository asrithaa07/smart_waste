import { motion } from "framer-motion";
import { RefreshCw, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface WasteRecord {
  waste_type: string;
  bin_level: number;
  timestamp: string;
}

interface WasteDashboardProps {
  records: WasteRecord[];
  loading: boolean;
  onRefresh: () => void;
}

const typeStyle = (type: string) => {
  switch (type.toLowerCase()) {
    case "organic": return { dot: "bg-organic", text: "text-organic", bg: "bg-organic/10", bar: "bg-organic" };
    case "plastic": return { dot: "bg-plastic", text: "text-plastic", bg: "bg-plastic/10", bar: "bg-plastic" };
    case "metal": return { dot: "bg-metal", text: "text-metal", bg: "bg-metal/10", bar: "bg-metal" };
    default: return { dot: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted", bar: "bg-muted-foreground" };
  }
};

const WasteDashboard = ({ records, loading, onRefresh }: WasteDashboardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="rounded-3xl border border-border bg-surface-elevated shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-center justify-between border-b border-border p-6 pb-5">
        <div className="flex items-center gap-2">
          <Table2 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Waste Records</h2>
          <span className="ml-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
            {records.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border-border bg-secondary text-secondary-foreground transition-all hover:bg-muted"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="pl-6 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">#</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Type</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Bin Level</TableHead>
              <TableHead className="pr-6 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  No records yet — upload an image to start classifying.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record, index) => {
                const style = typeStyle(record.waste_type);
                return (
                  <motion.tr
                    key={`${record.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="group border-b border-border/60 transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-lg ${style.bg} px-2.5 py-1 text-xs font-semibold capitalize ${style.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {record.waste_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-secondary">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${record.bin_level}%` }}
                            transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
                            className={`h-full rounded-full ${style.bar}`}
                          />
                        </div>
                        <span className={`font-mono text-xs font-medium ${record.bin_level >= 80 ? "text-accent" : "text-muted-foreground"}`}>
                          {record.bin_level}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-xs text-muted-foreground">
                      {new Date(record.timestamp).toLocaleString(undefined, {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default WasteDashboard;
