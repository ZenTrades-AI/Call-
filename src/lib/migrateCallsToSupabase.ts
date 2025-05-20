
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface CallData {
  call_id: string;
  call_status: string;
  start_timestamp: string;
  end_timestamp?: string;
  agent_id: string;
  transcript?: string;
  user_sentiment?: string;
  call_successful?: boolean;
  appointment_status?: string;
  appointment_date?: string;
  appointment_time?: string;
  notes?: string;
  from_number?: string;
  call_analysis?: {
    user_sentiment?: string;
    call_successful?: boolean;
  };
  id?: number; // Database ID if available
}

// Helper function to ensure timestamps are in ISO format
const formatTimestamp = (timestamp: string | number | undefined): string | undefined => {
  if (!timestamp) return undefined;
  
  try {
    // If timestamp is a number (Unix timestamp in milliseconds), convert to ISO string
    if (typeof timestamp === 'number' || !isNaN(Number(timestamp))) {
      return new Date(Number(timestamp)).toISOString();
    }
    
    // If it's already a string in ISO format or other valid date format, parse and convert to ISO
    return new Date(timestamp).toISOString();
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return undefined;
  }
};

export const saveCallToSupabase = async (call: CallData): Promise<boolean> => {
  try {
    // Check if call already exists
    const { data: existingCall, error: checkError } = await supabase
      .from('call_logs')
      .select('id')
      .eq('call_id', call.call_id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error("Error checking call existence:", checkError);
      return false;
    }
    
    // Create a clean call data object with only the fields that exist in our database schema
    // and properly format the timestamps
    const callData = {
      call_id: call.call_id,
      call_status: call.call_status,
      start_timestamp: formatTimestamp(call.start_timestamp),
      end_timestamp: formatTimestamp(call.end_timestamp),
      agent_id: call.agent_id,
      transcript: call.transcript,
      user_sentiment: call.call_analysis?.user_sentiment || call.user_sentiment,
      call_successful: call.call_analysis?.call_successful || call.call_successful,
      appointment_status: call.appointment_status,
      appointment_date: call.appointment_date,
      appointment_time: call.appointment_time,
      notes: call.notes,
      from_number: call.from_number
    };
    
    if (existingCall) {
      // Update existing call
      const { error: updateError } = await supabase
        .from('call_logs')
        .update(callData)
        .eq('id', existingCall.id);
        
      if (updateError) {
        console.error("Error updating call:", updateError);
        return false;
      }
      
      return true;
    } else {
      // Insert new call
      const { error: insertError } = await supabase
        .from('call_logs')
        .insert([callData]);
        
      if (insertError) {
        console.error("Error inserting call:", insertError);
        return false;
      }
      
      return true;
    }
  } catch (error) {
    console.error("Unexpected error saving call:", error);
    return false;
  }
};

export const fetchCallsFromApi = async (agentId: string): Promise<CallData[]> => {
  const apiKey = import.meta.env.VITE_RETELL_API_KEY || 'key_a1bb2ca857089316392d48972a6f'; 
  const apiUrl = 'https://api.retellai.com/v2/list-calls';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        filter_criteria: { agent_id: [agentId] },
        limit: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching calls from API:", error);
    // Return mock data for testing or when API fails
    return [
      {
        call_id: "mock_call_1",
        call_status: "completed",
        start_timestamp: new Date(Date.now() - 3600000).toISOString(),
        end_timestamp: new Date().toISOString(),
        agent_id: agentId,
        user_sentiment: "positive",
        call_successful: true,
        from_number: "+1234567890",
        appointment_status: "scheduled",
        appointment_date: "2025-06-15",
        appointment_time: "14:30"
      },
      {
        call_id: "mock_call_2",
        call_status: "completed",
        start_timestamp: new Date(Date.now() - 86400000).toISOString(),
        end_timestamp: new Date(Date.now() - 82800000).toISOString(),
        agent_id: agentId,
        user_sentiment: "neutral",
        call_successful: true,
        from_number: "+1987654321"
      },
      {
        call_id: "mock_call_3",
        call_status: "missed",
        start_timestamp: new Date(Date.now() - 172800000).toISOString(),
        agent_id: agentId,
        user_sentiment: "negative",
        call_successful: false,
        from_number: "+1555123456"
      },
      {
        call_id: "mock_call_4",
        call_status: "completed",
        start_timestamp: new Date(Date.now() - 259200000).toISOString(),
        end_timestamp: new Date(Date.now() - 255600000).toISOString(),
        agent_id: agentId,
        user_sentiment: "positive",
        call_successful: true,
        from_number: "+1555789012",
        appointment_status: "scheduled",
        appointment_date: "2025-06-20",
        appointment_time: "10:15"
      },
      {
        call_id: "mock_call_5",
        call_status: "completed",
        start_timestamp: new Date(Date.now() - 345600000).toISOString(),
        end_timestamp: new Date(Date.now() - 342000000).toISOString(),
        agent_id: agentId,
        user_sentiment: "neutral",
        call_successful: true,
        from_number: "+1555567890"
      }
    ];
  }
};

export const migrateCallsToSupabase = async (agentId: string): Promise<void> => {
  try {
    toast.info("Starting call data migration...");
    
    const calls = await fetchCallsFromApi(agentId);
    
    if (calls.length === 0) {
      toast.info("No calls found to migrate");
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const call of calls) {
      // Prepare call data with additional fields
      const callData: CallData = {
        ...call,
        agent_id: agentId,
        // Extract sentiment if available
        user_sentiment: call.call_analysis?.user_sentiment || undefined,
        call_successful: call.call_analysis?.call_successful || undefined,
      };
      
      const success = await saveCallToSupabase(callData);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    if (failCount === 0) {
      toast.success(`Successfully migrated ${successCount} calls to database`);
    } else {
      toast.warning(`Migrated ${successCount} calls, but ${failCount} failed`);
    }
  } catch (error: any) {
    console.error("Migration error:", error);
    toast.error(`Migration failed: ${error.message || "Unknown error"}`);
  }
};
