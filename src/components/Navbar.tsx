import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flame, Swords, LogOut, Bell, History, Zap, Trophy, User, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const [showNotificationDot, setShowNotificationDot] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Simple notifications for now
      const messages = [
        "🔥 Complete today's tasks to maintain your streak!",
        "💪 Keep coding to improve your skills!",
        "🎯 Consistency is key to mastering coding!",
      ];
      setNotifications(messages);
      setShowNotificationDot(true);
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationOpen = (open: boolean) => {
    if (open) {
      setShowNotificationDot(false);
    }
  };

  // Get user initials for avatar
  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Swords className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight">
            Code<span className="text-gradient-primary">Battle</span>
          </span>
        </Link>

        {isAuthenticated && (
          <div className="hidden items-center gap-6 md:flex">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Flame className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/streaks"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Zap className="h-4 w-4" />
              Streaks
            </Link>
            <Link
              to="/history"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <History className="h-4 w-4" />
              History
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
          </div>
        )}

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button size="sm" className="bg-gradient-cta font-semibold shadow-neon-primary" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          ) : (
            <>
              <Popover onOpenChange={handleNotificationOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative"
                  >
                    <Bell className="h-5 w-5" />
                    {showNotificationDot && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                      <span className="text-xs text-muted-foreground">{notifications.length} new</span>
                    </div>
                    {notifications.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {notifications.map((notification, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm hover:bg-primary/10 transition-colors"
                          >
                            {notification}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No new notifications</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="h-8 w-8 rounded-full bg-gradient-cta flex items-center justify-center text-sm font-bold text-primary-foreground">
                      {getUserInitial()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)} className="flex items-center gap-2 cursor-pointer">
                    <KeyRound className="h-4 w-4" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={showChangePasswordModal} 
        onOpenChange={setShowChangePasswordModal} 
      />
    </nav>
  );
};

export default Navbar;
