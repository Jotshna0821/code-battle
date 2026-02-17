import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Swords, Target, Zap, Users, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroBg from "@/assets/hero-bg.jpg";

const platforms = ["LeetCode", "CodeChef", "Codeforces", "HackerRank", "GeeksForGeeks", "CodeStudio"];

const features = [
  {
    icon: Flame,
    title: "Daily Streaks",
    description: "Build unstoppable coding habits with streak-based motivation",
    color: "text-streak",
  },
  {
    icon: Target,
    title: "Adaptive Problems",
    description: "Smart difficulty scaling that grows with your confidence",
    color: "text-primary",
  },
  {
    icon: Trophy,
    title: "Live Leaderboards",
    description: "Compete weekly with coders across the country",
    color: "text-rank-gold",
  },
  {
    icon: Zap,
    title: "XP & Levels",
    description: "Earn experience and unlock ranks from Bronze to Legendary",
    color: "text-xp",
  },
  {
    icon: Swords,
    title: "1v1 Battles",
    description: "Head-to-head coding challenges with real-time competition",
    color: "text-destructive",
  },
  {
    icon: Users,
    title: "College Rankings",
    description: "Represent your college and battle for institutional glory",
    color: "text-rank-platinum",
  },
];

const levels = [
  { name: "Bronze Coder", color: "text-rank-bronze", border: "border-rank-bronze/40" },
  { name: "Silver Solver", color: "text-rank-silver", border: "border-rank-silver/40" },
  { name: "Gold Strategist", color: "text-rank-gold", border: "border-rank-gold/40" },
  { name: "Platinum Hacker", color: "text-rank-platinum", border: "border-rank-platinum/40" },
  { name: "Legendary", color: "text-rank-legendary", border: "border-rank-legendary/40" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />

        <div className="container relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Flame className="h-4 w-4 animate-flame" />
              Build Your Coding Streak
            </div>

            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Code Every Day.{" "}
              <span className="glow-text text-gradient-primary">Battle</span> Every Week.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              The competitive platform that transforms daily problem-solving into an
              addictive streak game. Pick your platforms, solve daily challenges, and
              climb the leaderboard.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="bg-gradient-cta text-lg font-semibold shadow-neon-primary px-8" asChild>
                <Link to="/dashboard">
                  Start Your Streak <ChevronRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg border-border" asChild>
                <Link to="/leaderboard">View Leaderboard</Link>
              </Button>
            </div>
          </motion.div>

          {/* Platform logos */}
          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-mono text-muted-foreground"
              >
                {p}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-24">
        <div className="container px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Everything You Need to <span className="text-gradient-primary">Level Up</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Designed for engineering students who want to dominate placements
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group rounded-xl border border-border bg-gradient-card p-6 shadow-card transition-all hover:border-primary/30 hover:shadow-neon-primary"
              >
                <feature.icon className={`h-10 w-10 ${feature.color} mb-4`} />
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="border-t border-border py-24">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Climb the <span className="text-gradient-streak">Ranks</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Earn XP, maintain streaks, and unlock prestigious levels
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {levels.map((level, i) => (
              <motion.div
                key={level.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl border ${level.border} bg-gradient-card px-6 py-4 shadow-card`}
              >
                <span className={`text-lg font-bold ${level.color}`}>{level.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-24">
        <div className="container px-4 text-center">
          <Flame className="mx-auto h-12 w-12 text-streak animate-flame mb-6" />
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to Start Your Streak?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Join thousands of engineering students building unbreakable coding habits.
          </p>
          <Button size="lg" className="mt-8 bg-gradient-cta text-lg font-semibold shadow-neon-primary px-8" asChild>
            <Link to="/dashboard">
              Get Started Free <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex items-center justify-between px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            <span className="font-semibold">CodeBattle Streak</span>
          </div>
          <p>© 2026 CodeBattle Streak. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
