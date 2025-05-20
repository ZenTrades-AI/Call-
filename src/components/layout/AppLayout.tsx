
import React from "react";
import { Calendar, Table, Headphones, LogOut, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppLayout = ({ children, activeTab, setActiveTab }: AppLayoutProps) => {
  const { logout, userEmail } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sticky Sidebar */}
        <div className="w-full md:w-64 bg-white shadow-sm md:shadow-md md:border-r md:border-gray-100 md:fixed md:h-screen flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4">
            <h1 className="text-xl font-bold">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
          </div>
          
          {/* Sidebar Navigation */}
          <div className="flex-1 p-4 space-y-1.5">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "dashboard"
                  ? "bg-purple-600 text-white hover:bg-purple-700 hover:text-white"
                  : "hover:bg-purple-50"
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <Table className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "call-logs" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "call-logs"
                  ? "bg-purple-600 text-white hover:bg-purple-700 hover:text-white"
                  : "hover:bg-purple-50"
              }`}
              onClick={() => setActiveTab("call-logs")}
            >
              <Headphones className="mr-2 h-4 w-4" />
              Call Logs
            </Button>
            <Button
              variant={activeTab === "appointments" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "appointments"
                  ? "bg-purple-600 text-white hover:bg-purple-700 hover:text-white"
                  : "hover:bg-purple-50"
              }`}
              onClick={() => setActiveTab("appointments")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Appointments
            </Button>
            <Button
              variant={activeTab === "calendar" ? "default" : "ghost"}
              className={`w-full justify-start ${
                activeTab === "calendar"
                  ? "bg-purple-600 text-white hover:bg-purple-700 hover:text-white"
                  : "hover:bg-purple-50"
              }`}
              onClick={() => setActiveTab("calendar")}
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              Calendar
            </Button>
          </div>
          
          {/* Footer with Email and Sign Out */}
          <div className="mt-auto p-4 border-t border-gray-100">
            {userEmail && (
              <div className="rounded-lg bg-gray-50 p-3 mb-3">
                <p className="text-sm font-medium truncate">{userEmail}</p>
              </div>
            )}
            
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
        
        {/* Main content with left margin to accommodate fixed sidebar */}
        <div className="flex-1 p-6 md:p-8 md:ml-64">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
