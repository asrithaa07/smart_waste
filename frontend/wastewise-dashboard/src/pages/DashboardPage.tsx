import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ScanLine, Table2, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import StatsCards from "@/components/StatsCards";
import WasteChart from "@/components/WasteChart";
import { useWaste } from "@/context/WasteContext";

const DashboardPage = () => {
  const { records, fetchRecords } = useWaste();

  useEffect(() => {
    if (records.length === 0) fetchRecords();
  }, [records.length, fetchRecords]);

  const quickLinks = [
    { to: "/classify", label: "Classify Waste", desc: "Upload & identify waste type", icon: ScanLine, color: "bg-primary/10 text-primary" },
    { to: "/records", label: "View Records", desc: "Browse all classification data", icon: Table2, color: "bg-plastic/10 text-plastic" },
    { to: "/analytics", label: "Analytics", desc: "Charts & insights", icon: PieChart, color: "bg-metal/10 text-metal" },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your waste classification system.
        </p>
      </motion.div>

      <StatsCards records={records} />

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickLinks.map((link, i) => (
            <Link key={link.to} to={link.to}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="group flex items-center gap-4 rounded-3xl border border-border bg-surface-elevated p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-medium)] cursor-pointer"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${link.color} transition-transform group-hover:scale-110`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Chart preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <WasteChart records={records} />
      </motion.div>
    </div>
  );
};

export default DashboardPage;
