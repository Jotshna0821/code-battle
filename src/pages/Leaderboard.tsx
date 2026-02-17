import Navbar from "@/components/Navbar";
import LeaderboardTable from "@/components/LeaderboardTable";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const weeklyData = [
  { rank: 1, name: "Priya Sharma", college: "IIT Delhi", level: "Legendary Architect", streak: 45, weeklyXP: 850, trend: "up" as const },
  { rank: 2, name: "Rahul Verma", college: "NIT Trichy", level: "Platinum Hacker", streak: 32, weeklyXP: 720, trend: "up" as const },
  { rank: 3, name: "Sneha Patel", college: "BITS Pilani", level: "Gold Strategist", streak: 28, weeklyXP: 680, trend: "down" as const },
  { rank: 4, name: "Amit Kumar", college: "IIT Bombay", level: "Gold Strategist", streak: 21, weeklyXP: 550, trend: "same" as const },
  { rank: 5, name: "Kavya Reddy", college: "IIIT Hyderabad", level: "Silver Solver", streak: 18, weeklyXP: 475, trend: "up" as const },
  { rank: 6, name: "Vikram Singh", college: "DTU", level: "Silver Solver", streak: 15, weeklyXP: 420, trend: "down" as const },
  { rank: 7, name: "Arjun Menon", college: "VIT Vellore", level: "Gold Strategist", streak: 12, weeklyXP: 375, trend: "up" as const },
  { rank: 8, name: "Neha Gupta", college: "NIT Warangal", level: "Bronze Coder", streak: 9, weeklyXP: 310, trend: "same" as const },
  { rank: 9, name: "Rohan Das", college: "IIIT Bangalore", level: "Bronze Coder", streak: 7, weeklyXP: 250, trend: "down" as const },
  { rank: 10, name: "Ananya Iyer", college: "SRM Chennai", level: "Bronze Coder", streak: 5, weeklyXP: 180, trend: "up" as const },
];

const Leaderboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-rank-gold" />
            <div>
              <h1 className="text-3xl font-bold">Leaderboard</h1>
              <p className="text-muted-foreground">Compete with the best coders across India</p>
            </div>
          </div>

          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="mb-6 bg-secondary">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="alltime">All Time</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly">
              <LeaderboardTable entries={weeklyData} />
            </TabsContent>
            <TabsContent value="alltime">
              <LeaderboardTable entries={weeklyData.map((e, i) => ({ ...e, weeklyXP: e.weeklyXP * 12 + i * 300 }))} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default Leaderboard;
