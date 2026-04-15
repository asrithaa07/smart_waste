import { useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart as PieIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { WasteRecord } from "./WasteDashboard";
import { useState } from "react";

interface WasteChartProps {
  records: WasteRecord[];
}

const COLORS: Record<string, string> = {
  organic: "hsl(158, 64%, 40%)",
  plastic: "hsl(220, 76%, 56%)",
  metal: "hsl(38, 90%, 54%)",
};

const LABELS: Record<string, string> = {
  organic: "🍃 Organic",
  plastic: "♻️ Plastic",
  metal: "⚙️ Metal",
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 30));
    const interval = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(interval); }
      else setDisplay(start);
    }, 20);
    return () => clearInterval(interval);
  }, [value]);
  return <span>{display}</span>;
};

const WasteChart = ({ records }: WasteChartProps) => {
  const counts = records.reduce<Record<string, number>>((acc, r) => {
    const key = r.waste_type.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-soft)]"
    >
      <div className="mb-5 flex items-center gap-2">
        <PieIcon className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Distribution</h2>
      </div>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">No data yet.</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value" strokeWidth={0} animationDuration={800}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || "#888"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(40, 25%, 99%)",
                    border: "1px solid hsl(40, 15%, 88%)",
                    borderRadius: "12px",
                    color: "hsl(220, 25%, 12%)",
                    fontSize: "13px",
                    padding: "8px 14px",
                    boxShadow: "0 8px 30px -6px rgba(0,0,0,0.1)",
                  }}
                  formatter={(v: number, n: string) => [`${v} items`, n.charAt(0).toUpperCase() + n.slice(1)]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground"><AnimatedNumber value={total} /></span>
              <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Total</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {data.map((entry) => {
              const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[entry.name] || "#888" }} />
                    <span className="text-sm font-medium text-foreground">{LABELS[entry.name] || entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{entry.value}</span>
                    <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-semibold text-secondary-foreground">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default WasteChart;
