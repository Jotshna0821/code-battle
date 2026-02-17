import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Flame, Trophy, Target, Zap, Calendar, Code } from "lucide-react";

const stats = [
  { label: "Problems Solved", value: "147", icon: Code },
  { label: "Current Streak", value: "12 days", icon: Flame },
  { label: "Best Streak", value: "24 days", icon: Trophy },
  { label: "Total XP", value: "4,250", icon: Zap },
];

const recentActivity = [
  { date: "Feb 17", problems: 3, completed: 2 },
  { date: "Feb 16", problems: 3, completed: 3 },
  { date: "Feb 15", problems: 3, completed: 3 },
  { date: "Feb 14", problems: 3, completed: 3 },
  { date: "Feb 13", problems: 3, completed: 1 },
  { date: "Feb 12", problems: 3, completed: 3 },
  { date: "Feb 11", problems: 3, completed: 3 },
];

const Profile = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-gradient-card p-8 shadow-card">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-streak/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-cta text-3xl font-bold text-primary-foreground shadow-neon-primary">
                A
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Arjun Menon</h1>
                <p className="text-muted-foreground">VIT Vellore • 2nd Year BTech CSE</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-rank-gold/30 bg-rank-gold/10 px-3 py-0.5 text-xs font-bold text-rank-gold">
                    Gold Strategist
                  </span>
                  <span className="rounded-full border border-border bg-secondary px-3 py-0.5 text-xs text-muted-foreground">
                    Rank #7
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-streak/30 bg-streak/10 px-5 py-3">
                <Flame className="h-8 w-8 text-streak animate-flame" />
                <div>
                  <p className="text-2xl font-bold text-streak">12</p>
                  <p className="text-xs text-muted-foreground">day streak</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-gradient-card p-5 shadow-card">
                <stat.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Activity Heatmap (simplified) */}
          <div className="rounded-xl border border-border bg-gradient-card p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Recent Activity</h2>
            </div>
            <div className="grid gap-2">
              {recentActivity.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-muted-foreground font-mono">{day.date}</span>
                  <div className="flex-1 flex gap-1.5">
                    {Array.from({ length: day.problems }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-6 flex-1 rounded ${
                          i < day.completed ? "bg-gradient-xp" : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {day.completed}/{day.problems}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
