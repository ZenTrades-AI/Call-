
import React, { useState, useEffect } from "react";
import { Calendar, ArrowRight, RefreshCw, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, isValid, addDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AppointmentsTabProps {
  initialCalls: any[];
  initialLoading?: boolean;
  dataLoaded?: boolean;
  refreshCalls?: () => Promise<void>;
  updateCall?: (updatedCall: any) => void;
}

const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  initialCalls = [],
  initialLoading = false,
  dataLoaded = false,
  refreshCalls,
  updateCall
}) => {
  const [loading, setLoading] = useState(initialLoading);
  const [appointmentCalls, setAppointmentCalls] = useState<any[]>([]);
  const { agentId } = useAuth();

  useEffect(() => {
    // Filter for calls with valid appointment data
    const filteredCalls = initialCalls.filter(call => 
      call.appointment_status === "scheduled" && call.appointment_date
    );
    
    // Sort by appointment date, newest first
    const sortedCalls = [...filteredCalls].sort((a, b) => {
      const dateA = new Date(`${a.appointment_date} ${a.appointment_time || '00:00'}`).getTime();
      const dateB = new Date(`${b.appointment_date} ${b.appointment_time || '00:00'}`).getTime();
      return dateA - dateB;
    });
    
    setAppointmentCalls(sortedCalls);
    setLoading(false);
  }, [initialCalls]);

  const formatAppointmentDate = (date: string, time: string) => {
    if (!date) return "N/A";
    
    try {
      // Add the time if available, otherwise use default time
      const dateTimeStr = time ? `${date} ${time}` : `${date} 00:00`;
      const dateObj = new Date(dateTimeStr);
      
      if (!isValid(dateObj)) {
        return date + (time ? ` ${time}` : "");
      }
      
      return format(dateObj, "MMM d, yyyy") + (time ? ` at ${time}` : "");
    } catch (error) {
      return date + (time ? ` ${time}` : "");
    }
  };

  const handleRefresh = async () => {
    if (refreshCalls) {
      setLoading(true);
      await refreshCalls();
      setLoading(false);
    }
  };

  const handleComplete = async (call: any) => {
    try {
      const updateData = {
        appointment_status: "completed",
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('call_logs')
        .update(updateData)
        .eq('call_id', call.call_id)
        .eq('agent_id', agentId);
      
      if (error) throw error;
      
      // Update local state
      setAppointmentCalls(prevCalls => 
        prevCalls.filter(c => c.call_id !== call.call_id)
      );
      
      // Use the updateCall callback if available
      if (updateCall) {
        updateCall({
          ...call,
          appointment_status: "completed"
        });
      }
      
      toast.success("Appointment marked as completed");
      
      // Refresh all calls data
      if (refreshCalls) {
        await refreshCalls();
      }
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast.error("Failed to update appointment status");
    }
  };

  const handleCancel = async (call: any) => {
    try {
      const updateData = {
        appointment_status: "rejected",
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('call_logs')
        .update(updateData)
        .eq('call_id', call.call_id)
        .eq('agent_id', agentId);
      
      if (error) throw error;
      
      // Update local state
      setAppointmentCalls(prevCalls => 
        prevCalls.filter(c => c.call_id !== call.call_id)
      );
      
      // Use the updateCall callback if available
      if (updateCall) {
        updateCall({
          ...call,
          appointment_status: "rejected"
        });
      }
      
      toast.info("Appointment cancelled");
      
      // Refresh all calls data
      if (refreshCalls) {
        await refreshCalls();
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  const getTodayAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointmentCalls.filter(call => {
      try {
        const appointmentDate = new Date(call.appointment_date);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate.getTime() === today.getTime();
      } catch (e) {
        return false;
      }
    });
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = addDays(today, 7);
    
    return appointmentCalls.filter(call => {
      try {
        const appointmentDate = new Date(call.appointment_date);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate > today && appointmentDate <= nextWeek;
      } catch (e) {
        return false;
      }
    });
  };

  const todayAppointments = getTodayAppointments();
  const upcomingAppointments = getUpcomingAppointments();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
        <Button onClick={handleRefresh} disabled={loading} variant="outline" className="flex gap-2 items-center">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh Appointments
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentCalls.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Today's Appointments</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-500">No appointments scheduled for today</h3>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAppointments.map(call => (
                    <TableRow key={call.call_id}>
                      <TableCell className="font-medium">
                        {call.from_number || call.call_id.substring(0, 10)}
                      </TableCell>
                      <TableCell>
                        {call.appointment_time || "No time specified"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {call.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => handleComplete(call)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => handleCancel(call)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">All Scheduled Appointments</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : appointmentCalls.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-500">No appointments scheduled</h3>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointmentCalls.map(call => (
                    <TableRow key={call.call_id}>
                      <TableCell className="font-medium">
                        {call.from_number || call.call_id.substring(0, 10)}
                      </TableCell>
                      <TableCell>
                        {formatAppointmentDate(call.appointment_date, call.appointment_time)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {call.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => handleComplete(call)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => handleCancel(call)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsTab;
