import { Check, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProblemCardProps {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  platform: string;
  completed: boolean;
  xpReward: number;
}

const difficultyStyles = {
  Easy: "bg-success/15 text-success border-success/30",
  Medium: "bg-accent/15 text-accent border-accent/30",
  Hard: "bg-destructive/15 text-destructive border-destructive/30",
};

const ProblemCard = ({ title, difficulty, platform, completed, xpReward }: ProblemCardProps) => {
  return (
    <div
      className={`group relative rounded-xl border p-4 transition-all ${
        completed
          ? "border-success/30 bg-success/5"
          : "border-border bg-gradient-card hover:border-primary/30 hover:shadow-neon-primary"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${difficultyStyles[difficulty]}`}>
              {difficulty}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{platform}</span>
          </div>
          <h4 className="font-medium truncate">{title}</h4>
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3 text-xp" />
            +{xpReward} XP
          </p>
        </div>
        {completed ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/20">
            <Check className="h-5 w-5 text-success" />
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="shrink-0 gap-1 text-muted-foreground hover:text-primary">
            <ExternalLink className="h-4 w-4" />
            Solve
          </Button>
        )}
      </div>
    </div>
  );
};

// Need to import Zap
import { Zap } from "lucide-react";

export default ProblemCard;
