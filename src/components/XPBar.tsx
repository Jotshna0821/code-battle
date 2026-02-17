import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface XPBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: string;
  levelColor: string;
}

const XPBar = ({ currentXP, nextLevelXP, level, levelColor }: XPBarProps) => {
  const progress = (currentXP / nextLevelXP) * 100;

  return (
    <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-xp" />
          <span className="text-sm font-medium text-muted-foreground">Experience</span>
        </div>
        <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${levelColor}`}>
          {level}
        </span>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{currentXP} XP</span>
          <span>{nextLevelXP} XP</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-gradient-xp"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};

export default XPBar;
