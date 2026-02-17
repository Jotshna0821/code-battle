import Navbar from "@/components/Navbar";
import StreakCard from "@/components/StreakCard";
import XPBar from "@/components/XPBar";
import ProblemCard from "@/components/ProblemCard";
import { motion } from "framer-motion";
import { Calendar, Target, Trophy } from "lucide-react";

const todayProblems = [
  { title: "Two Sum", difficulty: "Easy" as const, platform: "LeetCode", completed: true, xpReward: 25 },
  { title: "Valid Parentheses", difficulty: "Easy" as const, platform: "CodeChef", completed: true, xpReward: 25 },
  { title: "Longest Substring Without Repeating Characters", difficulty: "Medium" as const, platform: "Codeforces", completed: false, xpReward: 50 },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome back, <span className="text-gradient-primary">Arjun</span></h1>
            <p className="mt-1 text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Monday, February 17, 2026
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <StreakCard streak={12} bestStreak={24} />
            <XPBar
              currentXP={1250}
              nextLevelXP={2000}
              level="Gold Strategist"
              levelColor="text-rank-gold border-rank-gold/30 bg-rank-gold/10"
            />
            <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-rank-gold" />
                <span className="text-sm font-medium text-muted-foreground">Weekly Rank</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-foreground">#7</span>
                <span className="text-sm text-success font-medium">↑3</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">175 XP earned this week</p>
            </div>
          </div>

          {/* Today's Problems */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Today's Problems</h2>
              <span className="ml-auto text-sm text-muted-foreground">
                {todayProblems.filter((p) => p.completed).length}/{todayProblems.length} completed
              </span>
            </div>
            <div className="grid gap-3">
              {todayProblems.map((problem) => (
                <ProblemCard key={problem.title} {...problem} />
              ))}
            </div>
          </div>

          {/* Connected Platforms */}
          <div>
            <h2 className="text-xl font-bold mb-4">Connected Platforms</h2>
            <div className="flex flex-wrap gap-3">
              {["LeetCode", "CodeChef", "Codeforces"].map((p) => (
                <div key={p} className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm font-mono">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
