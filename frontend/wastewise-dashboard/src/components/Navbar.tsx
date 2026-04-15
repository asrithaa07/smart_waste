import { motion } from "framer-motion";
import { Leaf, Activity } from "lucide-react";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-border/60 bg-surface-elevated/80 backdrop-blur-2xl"
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md"
          >
            <Leaf className="h-5 w-5" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground leading-tight">
              EcoSort
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Smart Waste Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-2 rounded-full bg-primary"
          />
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3.5 py-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-secondary-foreground">Live</span>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
