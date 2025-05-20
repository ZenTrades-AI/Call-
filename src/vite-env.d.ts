
/// <reference types="vite/client" />

declare module "@/lib/migrateCallsToSupabase" {
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
    id?: number;
  }
  
  export function saveCallToSupabase(call: CallData): Promise<boolean>;
  export function fetchCallsFromApi(agentId: string): Promise<CallData[]>;
  export function migrateCallsToSupabase(agentId: string): Promise<void>;
}
