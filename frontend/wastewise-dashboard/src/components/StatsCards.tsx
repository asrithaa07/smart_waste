import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, TrendingUp, AlertTriangle } from "lucide-react";
import type { WasteRecord } from "./WasteDashboard";

interface StatsCardsProps {
  records: WasteRecord[];
}

const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 40));
    const interval = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(interval); }
      else setCount(start);
    }, 18);
    return () => clearInterval(interval);
  }, [value]);
  return <>{count}{suffix}</>;
};

const StatsCards = ({ records }: StatsCardsProps) => {
  const total = records.length;
  const avgBin = total > 0 ? Math.round(records.reduce((s, r) => s + r.bin_level, 0) / total) : 0;
  const critical = records.filter((r) => r.bin_level >= 80).length;

  const stats = [
    {
      label: "Total Records",
      value: total,
      icon: Trash2,
      color: "text-primary",
      bg: "bg-primary/10",
      desc: "Classified items",
    },
    {
      label: "Avg Fill Level",
      value: avgBin,
      suffix: "%",
      icon: TrendingUp,
      color: "text-plastic",
      bg: "bg-plastic/10",
      desc: "Across all bins",
    },
    {
      label: "Critical Bins",
      value: critical,
      icon: AlertTriangle,
      color: "text-accent",
      bg: "bg-accent/10",
      desc: "Above 80% capacity",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="group rounded-3xl border border-border bg-surface-elevated p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-medium)] cursor-default"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${s.bg} ${s.color} transition-transform group-hover:scale-110`}>
              <s.icon className="h-5 w-5" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
