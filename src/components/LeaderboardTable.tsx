import { Crown, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  college: string;
  level: string;
  streak: number;
  weeklyXP: number;
  trend: "up" | "down" | "same";
}

const rankStyles: Record<number, string> = {
  1: "text-rank-gold",
  2: "text-rank-silver",
  3: "text-rank-bronze",
};

const levelStyles: Record<string, string> = {
  "Bronze Coder": "text-rank-bronze border-rank-bronze/30",
  "Silver Solver": "text-rank-silver border-rank-silver/30",
  "Gold Strategist": "text-rank-gold border-rank-gold/30",
  "Platinum Hacker": "text-rank-platinum border-rank-platinum/30",
  "Legendary Architect": "text-rank-legendary border-rank-legendary/30",
};

const LeaderboardTable = ({ entries }: { entries: LeaderboardEntry[] }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Rank</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Player</th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">Level</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">🔥 Streak</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Weekly XP</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Trend</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.rank}
              className="border-b border-border/50 transition-colors hover:bg-secondary/30"
            >
              <td className="px-4 py-3">
                <span className={`text-sm font-bold ${rankStyles[entry.rank] || "text-muted-foreground"}`}>
                  {entry.rank <= 3 ? (
                    <span className="flex items-center gap-1">
                      {entry.rank === 1 && <Crown className="h-4 w-4" />}
                      #{entry.rank}
                    </span>
                  ) : (
                    `#${entry.rank}`
                  )}
                </span>
              </td>
              <td className="px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.college}</p>
                </div>
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${levelStyles[entry.level] || "text-muted-foreground border-border"}`}>
                  {entry.level}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-sm font-bold text-streak">{entry.streak}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-mono font-medium text-xp">{entry.weeklyXP.toLocaleString()}</span>
              </td>
              <td className="px-4 py-3 text-center">
                {entry.trend === "up" && <TrendingUp className="mx-auto h-4 w-4 text-success" />}
                {entry.trend === "down" && <TrendingDown className="mx-auto h-4 w-4 text-destructive" />}
                {entry.trend === "same" && <Minus className="mx-auto h-4 w-4 text-muted-foreground" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
