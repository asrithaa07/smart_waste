import { useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useWaste } from "@/context/WasteContext";
import type { WasteRecord } from "@/components/WasteDashboard";

const COLORS: Record<string, string> = {
  organic: "hsl(158, 64%, 40%)",
  plastic: "hsl(220, 76%, 56%)",
  metal: "hsl(38, 90%, 54%)",
};

const tooltipStyle = {
  backgroundColor: "hsl(40, 25%, 99%)",
  border: "1px solid hsl(40, 15%, 88%)",
  borderRadius: "12px",
  color: "hsl(220, 25%, 12%)",
  fontSize: "13px",
  fontFamily: "'DM Sans', system-ui",
  padding: "8px 14px",
  boxShadow: "0 8px 30px -6px rgba(0,0,0,0.1)",
};

const AnalyticsPage = () => {
  const { records, fetchRecords } = useWaste();

  useEffect(() => {
    if (records.length === 0) fetchRecords();
  }, [records.length, fetchRecords]);

  // Distribution data
  const counts = records.reduce<Record<string, number>>((acc, r) => {
    const key = r.waste_type.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(counts).map(([name, value]) => ({ name, value }));
  const total = pieData.reduce((s, d) => s + d.value, 0);

  // Bin level by type
  const binByType = Object.entries(
    records.reduce<Record<string, { sum: number; count: number }>>((acc, r) => {
      const key = r.waste_type.toLowerCase();
      if (!acc[key]) acc[key] = { sum: 0, count: 0 };
      acc[key].sum += r.bin_level;
      acc[key].count += 1;
      return acc;
    }, {})
  ).map(([name, { sum, count }]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), avg: Math.round(sum / count) }));

  // Bin level distribution histogram
  const binRanges = [
    { range: "0-20%", min: 0, max: 20 },
    { range: "21-40%", min: 21, max: 40 },
    { range: "41-60%", min: 41, max: 60 },
    { range: "61-80%", min: 61, max: 80 },
    { range: "81-100%", min: 81, max: 100 },
  ];
  const histogramData = binRanges.map((r) => ({
    range: r.range,
    count: records.filter((rec) => rec.bin_level >= r.min && rec.bin_level <= r.max).length,
  }));

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visual insights into waste classification patterns and bin utilization.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart - Waste Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-soft)]"
        >
          <h3 className="mb-1 text-base font-bold text-foreground">Waste Distribution</h3>
          <p className="mb-6 text-xs text-muted-foreground">Breakdown by waste category</p>
          {pieData.length > 0 ? (
            <div className="relative">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value" strokeWidth={0} animationDuration={800}>
                    {pieData.map((e) => <Cell key={e.name} fill={COLORS[e.name] || "#888"} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${v} items`, n.charAt(0).toUpperCase() + n.slice(1)]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{total}</span>
                <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Total</span>
              </div>
            </div>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">No data</div>
          )}
          {/* Legend */}
          <div className="mt-4 flex justify-center gap-6">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[entry.name] }} />
                <span className="text-xs font-medium capitalize text-foreground">{entry.name}</span>
                <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-secondary-foreground">
                  {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bar Chart - Average Bin Level by Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-soft)]"
        >
          <h3 className="mb-1 text-base font-bold text-foreground">Average Bin Level</h3>
          <p className="mb-6 text-xs text-muted-foreground">Mean fill percentage per waste type</p>
          {binByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={binByType} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Avg Level"]} />
                <Bar dataKey="avg" radius={[8, 8, 0, 0]} animationDuration={800}>
                  {binByType.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()] || "#888"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No data</div>
          )}
        </motion.div>

        {/* Histogram - Bin Level Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-[var(--shadow-soft)] lg:col-span-2"
        >
          <h3 className="mb-1 text-base font-bold text-foreground">Bin Fill Distribution</h3>
          <p className="mb-6 text-xs text-muted-foreground">Number of records across fill-level ranges</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={histogramData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} records`, "Count"]} />
              <Bar dataKey="count" fill="hsl(158, 64%, 40%)" radius={[8, 8, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
