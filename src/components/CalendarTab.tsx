
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2, CalendarCheck, CalendarClock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CalendarTabProps {
  initialCalls?: any[];
  initialLoading?: boolean;
  dataLoaded?: boolean;
  refreshCalls?: () => Promise<void>;  // Added this prop
  updateCall?: (updatedCall: any) => void; // Optional prop for consistency
}

const CalendarTab = ({
  initialCalls = [],
  initialLoading = false,
  dataLoaded = false,
  refreshCalls, // Added this prop
}: CalendarTabProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const { agentId } = useAuth();

  // Get all appointments to display as events
  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      
      if (!agentId) {
        toast.error("No agent ID found");
        setIsLoading(false);
        return;
      }
      
      // Fetch all calls that have appointment data
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('agent_id', agentId)
        .not('appointment_date', 'is', null);
      
      if (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Failed to load calendar events");
        setIsLoading(false);
        return;
      }
      
      if (data && data.length > 0) {
        // Convert to events for the calendar
        const eventsData = data.map(appointment => ({
          id: appointment.id || appointment.call_id,
          title: `Call ${appointment.call_id?.substring(0, 8)}`,
          date: appointment.appointment_date,
          time: appointment.appointment_time || "00:00",
          status: appointment.appointment_status || "scheduled"
        }));
        
        setEvents(eventsData);
        console.log("Loaded calendar events:", eventsData);
      } else {
        console.log("No calendar events found");
        setEvents([]);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
      toast.error("Failed to load calendar events");
      setIsLoading(false);
    }
  };

  // Process calls data to extract only scheduled appointments as events
  useEffect(() => {
    if (initialCalls && initialCalls.length > 0) {
      const appointmentsData = initialCalls.filter(call => call.appointment_date);
      
      // Convert to events for the calendar
      const eventsData = appointmentsData.map(appointment => ({
        id: appointment.id || appointment.call_id,
        title: `Call ${appointment.call_id?.substring(0, 8)}`,
        date: appointment.appointment_date,
        time: appointment.appointment_time || "00:00",
        status: appointment.appointment_status || "scheduled"
      }));
      
      setEvents(eventsData);
      setIsLoading(false);
    } else if (dataLoaded) {
      // If no initial calls but data is loaded, fetch directly
      fetchAppointments();
    } else {
      setIsLoading(initialLoading);
    }
  }, [initialCalls, initialLoading, dataLoaded]);

  // Filter events for the selected date
  const getEventsForDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];
    
    const dateString = selectedDate.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const connectGoogleCalendar = () => {
    // In a real implementation, this would use the Google Calendar API OAuth flow
    toast.info("Google Calendar connection feature is in development");
    // For demonstration, simulate a successful connection
    setTimeout(() => {
      setCalendarConnected(true);
      toast.success("Google Calendar connected successfully!");
    }, 1500);
  };

  const selectedDateEvents = getEventsForDate(date);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>
            View and manage your appointments in calendar view
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="month" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="month">Month View</TabsTrigger>
              <TabsTrigger value="day">Day View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="month" className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow-sm"
                />
              </div>
              
              <div className="md:w-1/2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {date ? date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Select a date'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                      </div>
                    ) : selectedDateEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDateEvents.map(event => (
                          <div key={event.id} className="p-3 rounded-md border">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{event.title}</h4>
                                <p className="text-sm text-gray-500">{event.time}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.status === "completed" ? "bg-green-100 text-green-800" :
                                event.status === "in-process" ? "bg-blue-100 text-blue-800" :
                                event.status === "rejected" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}>
                                {event.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-center">
                        <CalendarClock className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-500">No appointments scheduled for this date</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="day">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-10">
                    <CalendarCheck className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-600">Day View Coming Soon</h3>
                    <p className="text-gray-500 mt-2 text-center max-w-md">
                      We're working on an enhanced day view with time slots and additional features.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            {events.length} total appointments
          </div>
          <Button 
            onClick={connectGoogleCalendar}
            disabled={calendarConnected}
            variant={calendarConnected ? "outline" : "default"}
          >
            {calendarConnected ? "Google Calendar Connected" : "Connect Google Calendar"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CalendarTab;
