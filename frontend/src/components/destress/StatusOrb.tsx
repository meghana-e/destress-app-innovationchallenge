import { motion } from "framer-motion";

const StatusOrb = () => (
  <div className="relative flex h-10 w-10 items-center justify-center">
    <motion.div
      className="absolute h-10 w-10 rounded-full bg-calm/20"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <div className="h-4 w-4 rounded-full bg-calm glow-calm" />
  </div>
);

export default StatusOrb;
