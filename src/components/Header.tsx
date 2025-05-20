
import { Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="fixed w-full z-50 bg-black/20 backdrop-blur-xl border-b border-purple-500/10 py-3">
      <div className="container mx-auto flex justify-between items-center px-4 md:px-6">
        <Link to="/voice" className="flex items-center">
          <Headphones className="h-6 w-6 mr-2 text-purple-400" />
          <span className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
            Lisa AI
          </span>
        </Link>
        
        <Button 
          asChild
          className="rounded-full bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 text-white px-6"
        >
          {isAuthenticated ? (
            <Link to="/voice/dashboard">Dashboard</Link>
          ) : (
            <Link to="/voice/login">Log In</Link>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Header;
