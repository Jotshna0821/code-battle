import { Flame } from "lucide-react";
import { motion } from "framer-motion";

interface StreakCardProps {
  streak: number;
  bestStreak: number;
}

const StreakCard = ({ streak, bestStreak }: StreakCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-card p-6 shadow-card">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-streak/10 blur-2xl" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Current Streak</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gradient-streak">{streak}</span>
            <span className="text-lg text-muted-foreground">days</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Best: <span className="text-streak">{bestStreak} days</span>
          </p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Flame className="h-16 w-16 text-streak drop-shadow-lg" style={{ filter: "drop-shadow(0 0 12px hsl(25 95% 55% / 0.5))" }} />
        </motion.div>
      </div>
    </div>
  );
};

export default StreakCard;
