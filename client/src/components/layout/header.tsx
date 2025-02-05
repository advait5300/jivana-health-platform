import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { toast } = useToast();

  const handleLogout = () => {
    // Implement logout logic
    toast({
      title: "Logged out successfully",
      duration: 2000,
    });
  };

  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Jivana
          </h1>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/upload">Upload Test</Link>
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}
