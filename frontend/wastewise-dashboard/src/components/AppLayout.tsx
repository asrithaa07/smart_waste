import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-background grain">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default AppLayout;
