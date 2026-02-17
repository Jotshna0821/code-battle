import { Link, useLocation } from "react-router-dom";
import { Flame, Trophy, User, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Swords className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight">
            Code<span className="text-gradient-primary">Battle</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Flame className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            to="/leaderboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isLanding ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">Log In</Link>
              </Button>
              <Button size="sm" className="bg-gradient-cta font-semibold shadow-neon-primary" asChild>
                <Link to="/dashboard">Get Started</Link>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1">
                <Flame className="h-4 w-4 text-streak animate-flame" />
                <span className="text-sm font-bold text-streak">12</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-cta flex items-center justify-center text-sm font-bold text-primary-foreground">
                A
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
