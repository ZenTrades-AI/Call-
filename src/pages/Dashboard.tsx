import { useState, useEffect, useCallback } from "react";
import DashboardTab from "@/components/DashboardTab";
import CallLogsTab from "@/components/CallLogsTab";
import AppointmentsTab from "@/components/AppointmentsTab";
import CalendarTab from "@/components/CalendarTab";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCallsFromApi } from "@/lib/migrateCallsToSupabase";
import { toast } from "sonner";
import { Loader2, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { processCallTranscript } from "@/lib/openai";

// Define the Call type to prevent any[] usage
interface Call {
  call_id: string;
  agent_id?: string;
  call_status?: string;
  start_timestamp?: string;
  end_timestamp?: string;
  transcript?: string;
  recording_url?: string;
  call_type?: string;
  from_number?: string;
  appointment_status?: string;
  appointment_date?: string;
  appointment_time?: string;
  notes?: string;
  call_analysis?: {
    call_summary?: string;
    user_sentiment?: string;
    call_successful?: boolean;
    in_voicemail?: boolean;
  };
  id?: number;
  processed?: boolean; // Track if a call has been processed
  [key: string]: any; // Allow additional fields
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [processedCalls, setProcessedCalls] = useState<Set<string>>(new Set());
  const { agentId, isAuthenticated } = useAuth();
  const [lastKnownCallIds, setLastKnownCallIds] = useState<Set<string>>(new Set());
  // Add lastFetchTime to prevent too frequent API calls
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Create a fetchCalls function that can be used for initial load and refreshes
  const fetchCalls = useCallback(async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }
    
    // Prevent too frequent API calls (minimum 5 seconds between calls)
    const now = Date.now();
    if (now - lastFetchTime < 5000) {
      console.log("Skipping fetch - too soon since last fetch");
      return;
    }
    
    setLastFetchTime(now);
    setLoading(true);
    
    try {
      // Get calls from API
      const apiCalls = await fetchCallsFromApi(agentId);
      
      // Get ALL calls from database
      const { data: dbCalls, error: dbError } = await supabase
        .from('call_logs')
        .select('*')
        .eq('agent_id', agentId);
      
      if (dbError) throw dbError;
      
      // Create a map of database calls by call_id
      const dbCallsMap = new Map();
      if (dbCalls && dbCalls.length > 0) {
        dbCalls.forEach(dbCall => {
          dbCallsMap.set(dbCall.call_id, dbCall);
        });
      }
      
      // Merge API calls with database data
      const mergedCalls = apiCalls.map(apiCall => {
        const dbCall = dbCallsMap.get(apiCall.call_id);
        if (dbCall) {
          return {
            ...apiCall,
            appointment_status: dbCall.appointment_status || apiCall.appointment_status,
            appointment_date: dbCall.appointment_date || apiCall.appointment_date,
            appointment_time: dbCall.appointment_time || apiCall.appointment_time,
            notes: dbCall.notes || apiCall.notes,
            from_number: dbCall.from_number || apiCall.from_number || "",
            id: dbCall.id,
            processed: true // Mark calls from DB as processed
          };
        }
        return {
          ...apiCall,
          processed: false // Mark new calls as not processed
        };
      });
      
      // Check for new calls
      const currentCallIds = new Set(mergedCalls.map(call => call.call_id));
      const hasInitialData = initialDataLoaded && lastKnownCallIds.size > 0;
      
      // Find new calls that weren't in the previous set
      const newCallIds = hasInitialData 
        ? [...currentCallIds].filter(id => !lastKnownCallIds.has(id))
        : [];
      
      // Update the known call IDs
      setLastKnownCallIds(currentCallIds);
      
      // Notify about new calls if this isn't the initial load
      if (hasInitialData && newCallIds.length > 0) {
        const newCalls = mergedCalls.filter(call => newCallIds.includes(call.call_id));
        
        if (newCalls.length === 1) {
          const call = newCalls[0];
          toast.success(`New call from ${call.from_number || 'unknown number'}`, {
            icon: <Bell />,
            description: `Call received at ${new Date(call.start_timestamp || Date.now()).toLocaleTimeString()}`
          });
        } else if (newCalls.length > 1) {
          toast.success(`${newCalls.length} new calls received!`, {
            icon: <Bell />,
            description: "Click to view details"
          });
        }
      }
      
      setCalls(mergedCalls);
      setInitialDataLoaded(true);
      
      // Process transcripts with OpenAI in the background - only for unprocessed calls
      // Use setTimeout to avoid blocking the UI thread
      setTimeout(() => {
        processCallTranscripts(mergedCalls.filter(call => !call.processed));
      }, 1000);
      
      if (mergedCalls.length === 0) {
        toast.info("No calls found for this agent");
      }
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Could not load call data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [agentId, initialDataLoaded, lastKnownCallIds, lastFetchTime]);

  // Process call transcripts to extract appointment details
  const processCallTranscripts = async (callsToProcess: Call[]) => {
    if (!agentId) return;
    
    // Find calls that have transcripts but no appointment data yet and haven't been processed
    const callsNeedingProcessing = callsToProcess.filter(call => 
      call.transcript && 
      !processedCalls.has(call.call_id) && 
      (!call.appointment_date || !call.appointment_time) &&
      !call.processed
    );
    
    if (callsNeedingProcessing.length === 0) return;
    
    // Process calls one by one
    for (const call of callsNeedingProcessing) {
      try {
        const updatedCall = await processCallTranscript(call, agentId);
        
        // Mark as processed regardless of result
        setProcessedCalls(prev => new Set(prev).add(call.call_id));
        
        // Update calls with processed flag
        setCalls(prevCalls => prevCalls.map(c => 
          c.call_id === call.call_id ? { ...c, processed: true } : c
        ));
        
        // If we got updated data, update our state
        if (updatedCall) {
          setCalls(prevCalls => prevCalls.map(c => 
            c.call_id === updatedCall.call_id ? { ...updatedCall, processed: true } : c
          ));
          
          // Show toast notification only for high confidence results
          if (updatedCall.confidence > 70) {
            toast.success(`Appointment detected for ${updatedCall.from_number || 'a call'}`, {
              description: `${updatedCall.appointment_date} at ${updatedCall.appointment_time}`
            });
          }
        }
      } catch (err) {
        console.error("Error processing transcript for call:", call.call_id, err);
      }
    }
  };

  // Load initial data when dashboard mounts and we have an agentId
  useEffect(() => {
    if (agentId && isAuthenticated) {
      fetchCalls();
    }
  }, [agentId, isAuthenticated, fetchCalls]);

  // Function to update a specific call in the calls array
  const updateCall = useCallback((updatedCall: Call) => {
    if (!updatedCall || !updatedCall.call_id) return;
    
    setCalls(prevCalls => prevCalls.map(call => 
      call.call_id === updatedCall.call_id ? { ...call, ...updatedCall, processed: true } : call
    ));
    
    // Show a feedback toast
    toast.success("Call data updated successfully");
  }, []);

  if (loading && !initialDataLoaded) {
    return (
      <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
          <p className="mt-4 text-gray-600">Loading your calls...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === "dashboard" && 
          <DashboardTab 
            initialCalls={calls} 
            initialLoading={loading} 
            dataLoaded={initialDataLoaded}
            refreshCalls={fetchCalls}
            updateCall={updateCall}
          />
        }
        {activeTab === "call-logs" && 
          <CallLogsTab 
            initialCalls={calls} 
            initialLoading={loading} 
            dataLoaded={initialDataLoaded}
            refreshCalls={fetchCalls}
            updateCall={updateCall}
          />
        }
        {activeTab === "appointments" && 
          <AppointmentsTab 
            initialCalls={calls} 
            initialLoading={loading} 
            dataLoaded={initialDataLoaded}
            refreshCalls={fetchCalls}
            updateCall={updateCall}
          />
        }
        {activeTab === "calendar" && 
          <CalendarTab 
            initialCalls={calls} 
            initialLoading={loading} 
            dataLoaded={initialDataLoaded}
            refreshCalls={fetchCalls}
            updateCall={updateCall}
          />
        }
      </div>
    </AppLayout>
  );
};

export default Dashboard;
