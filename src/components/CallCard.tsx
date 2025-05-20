import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Clock, Sparkles, User, Phone, Search, Play, Info, CheckCircle, XCircle, ThumbsUp, ThumbsDown, Calendar, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentExtractor from "@/components/AppointmentExtractor";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { extractAppointmentDetails } from "@/lib/openai";

interface CallCardProps {
  call: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateCall?: (updatedCall: any) => void;
}

const CallCard: React.FC<CallCardProps> = ({ 
  call, 
  isExpanded, 
  onToggleExpand,
  onUpdateCall
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [extractedAppointment, setExtractedAppointment] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const { agentId } = useAuth();

  // Parse transcript into lines
  const transcriptLines = call.transcript 
    ? call.transcript.split(/(?<=[.!?])\s+/)
      .filter((line: string) => line.trim().length > 0)
      .map((line: string, index: number) => ({ id: index, text: line.trim() }))
    : [];

  const formatDate = (timestamp: string) => {
    if (!timestamp) return "N/A";
    return format(new Date(timestamp), "MMM d, yyyy h:mm a");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSentimentColor = (sentiment: string | undefined) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-green-100 text-green-800 border-green-200";
      case "negative":
        return "bg-red-100 text-red-800 border-red-200";
      case "neutral":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDuration = () => {
    if (!call.start_timestamp || !call.end_timestamp) return "N/A";
    
    const start = new Date(call.start_timestamp).getTime();
    const end = new Date(call.end_timestamp).getTime();
    const durationMs = end - start;
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayLine = (index: number) => {
    if (!audioElement) return;
    
    // Rough estimation of timing based on word count and average speaking rate
    const lines = transcriptLines;
    let startTime = 0;
    
    for (let i = 0; i < index; i++) {
      const wordCount = lines[i].text.split(/\s+/).length;
      // Assuming average of 150 words per minute (2.5 words per second)
      startTime += wordCount / 2.5;
    }
    
    setPlayingIndex(index);
    audioElement.currentTime = startTime;
    audioElement.play();
  };

  const handleAudioTimeUpdate = () => {
    if (!audioElement) return;
    
    // Rough estimation of current line based on time
    const currentTime = audioElement.currentTime;
    let accumulatedTime = 0;
    
    for (let i = 0; i < transcriptLines.length; i++) {
      const wordCount = transcriptLines[i].text.split(/\s+/).length;
      accumulatedTime += wordCount / 2.5;
      
      if (accumulatedTime > currentTime) {
        setPlayingIndex(i);
        break;
      }
    }
  };

  const handleAudioEnded = () => {
    setPlayingIndex(null);
  };

  // Create audio element when dialog opens
  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open);
    
    if (open && call.recording_url) {
      const audio = new Audio(call.recording_url);
      audio.addEventListener("timeupdate", handleAudioTimeUpdate);
      audio.addEventListener("ended", handleAudioEnded);
      setAudioElement(audio);
    } else {
      if (audioElement) {
        audioElement.pause();
        audioElement.removeEventListener("timeupdate", handleAudioTimeUpdate);
        audioElement.removeEventListener("ended", handleAudioEnded);
        setAudioElement(null);
      }
      setPlayingIndex(null);
    }
  };

  // Generate a summary if one doesn't exist
  const getSummary = () => {
    // First check if we have a call_analysis with call_summary
    if (call.call_analysis?.call_summary) {
      return call.call_analysis.call_summary;
    }
    
    if (call.summary) return call.summary;
    
    if (call.transcript) {
      // Generate a simple summary based on first few words
      const words = call.transcript.split(' ').slice(0, 30);
      return `${words.join(' ')}... [Automatically generated summary]`;
    }
    
    return "No summary available for this call.";
  };

  // Extract appointment data
  const handleExtractAppointment = async () => {
    if (!call.transcript || !agentId) {
      toast.error("Cannot extract: Missing transcript or agent ID");
      return;
    }
    
    setIsExtracting(true);
    
    try {
      // Create call date from timestamp
      const callDate = call.start_timestamp 
        ? new Date(typeof call.start_timestamp === 'number' ? call.start_timestamp : Number(call.start_timestamp))
        : new Date();
      
      const extractedData = await extractAppointmentDetails(call.transcript, callDate);
      setExtractedAppointment(extractedData);
      
      // Show feedback based on extraction result
      if (extractedData.appointmentDate || extractedData.appointmentTime) {
        toast.info("Appointment details detected");
      } else {
        toast.info("No appointment details found in transcript");
      }
      
      return extractedData;
    } catch (error) {
      console.error("Error extracting appointment:", error);
      toast.error("Failed to extract appointment details");
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle appointment actions
  const handleAcceptAppointment = async () => {
    // Use either extracted appointment or trigger extraction
    const appointmentData = extractedAppointment || await handleExtractAppointment();
    
    if (!appointmentData || (!appointmentData.appointmentDate && !appointmentData.appointmentTime)) {
      toast.error("No appointment details to schedule");
      return;
    }
    
    if (!agentId || !call.call_id) {
      toast.error("Missing agent ID or call ID");
      return;
    }
    
    try {
      // First check if we need to create a new record or update existing
      const { data: existingData } = await supabase
        .from('call_logs')
        .select('id')
        .eq('call_id', call.call_id)
        .eq('agent_id', agentId)
        .single();
      
      let result;
      const updateData = {
        call_id: call.call_id,
        agent_id: agentId,
        appointment_status: 'scheduled',
        appointment_date: appointmentData.appointmentDate,
        appointment_time: appointmentData.appointmentTime,
        from_number: call.from_number || "",
        updated_at: new Date().toISOString()
      };
      
      if (existingData?.id) {
        // Update existing record
        result = await supabase
          .from('call_logs')
          .update(updateData)
          .eq('id', existingData.id)
          .select();
      } else {
        // Create new record
        result = await supabase
          .from('call_logs')
          .insert([updateData])
          .select();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // Update local state through parent component if callback is provided
      if (onUpdateCall) {
        onUpdateCall({
          ...call,
          appointment_status: 'scheduled',
          appointment_date: appointmentData.appointmentDate,
          appointment_time: appointmentData.appointmentTime
        });
      }
      
      toast.success('Appointment scheduled successfully');
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Failed to schedule appointment');
    }
  };

  const handleRejectAppointment = async () => {
    if (!agentId || !call.call_id) {
      toast.error("Missing agent ID or call ID");
      return;
    }
    
    try {
      // First check if we need to create a new record or update existing
      const { data: existingData } = await supabase
        .from('call_logs')
        .select('id')
        .eq('call_id', call.call_id)
        .eq('agent_id', agentId)
        .single();
      
      let result;
      const updateData = {
        call_id: call.call_id,
        agent_id: agentId,
        appointment_status: 'rejected',
        from_number: call.from_number || "",
        updated_at: new Date().toISOString()
      };
      
      if (existingData?.id) {
        // Update existing record
        result = await supabase
          .from('call_logs')
          .update(updateData)
          .eq('id', existingData.id)
          .select();
      } else {
        // Create new record
        result = await supabase
          .from('call_logs')
          .insert([updateData])
          .select();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // Update local state through parent component if callback is provided
      if (onUpdateCall) {
        onUpdateCall({
          ...call,
          appointment_status: 'rejected',
          appointment_date: null,
          appointment_time: null
        });
      }
      
      toast.info('Appointment suggestion rejected');
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      toast.error('Failed to update appointment status');
    }
  };

  // Determine if we should show appointment actions
  const shouldShowAppointmentActions = () => {
    // Show actions if there's no appointment status yet
    return !call.appointment_status || call.appointment_status === 'in-process';
  };

  // Helper function to format phone numbers
  const formatPhoneNumber = (phoneNumber: string | undefined): string => {
    if (!phoneNumber) return "Unknown";
    
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid US number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    // If not a standard format, return as is but add a + if it seems international
    return cleaned.length > 10 ? `+${cleaned}` : phoneNumber;
  };

  return (
    <>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 pb-2">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-purple-500" />
              <CardTitle className="text-lg font-medium">
                {formatPhoneNumber(call.from_number) || "Unknown Caller"}
              </CardTitle>
              <Badge className={cn("ml-2", getStatusColor(call.call_status))}>
                {call.call_status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{getDuration()}</span>
              <Badge variant="outline" className="ml-2">
                {call.call_type || "voice"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          {/* Call Summary Preview */}
          {getSummary() && (
            <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <p className="line-clamp-2">{getSummary()}</p>
            </div>
          )}
          
          {/* Call Analysis */}
          {call.call_analysis && (
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {call.call_analysis.user_sentiment && (
                <div className="flex items-center gap-2">
                  {call.call_analysis.user_sentiment?.toLowerCase() === 'positive' ? 
                    <ThumbsUp className="w-4 h-4 text-green-500" /> : 
                    (call.call_analysis.user_sentiment?.toLowerCase() === 'negative' ? 
                      <ThumbsDown className="w-4 h-4 text-red-500" /> : 
                      <Info className="w-4 h-4 text-blue-500" />)
                  }
                  <span className="text-sm text-gray-500">Sentiment:</span>
                  <Badge className={getSentimentColor(call.call_analysis.user_sentiment)}>
                    {call.call_analysis.user_sentiment}
                  </Badge>
                </div>
              )}
              
              {typeof call.call_analysis.call_successful === 'boolean' && (
                <div className="flex items-center gap-2">
                  {call.call_analysis.call_successful ? 
                    <CheckCircle className="w-4 h-4 text-green-500" /> : 
                    <XCircle className="w-4 h-4 text-red-500" />
                  }
                  <span className="text-sm text-gray-500">Outcome:</span>
                  <Badge className={call.call_analysis.call_successful ? 
                    "bg-green-100 text-green-800 border-green-200" : 
                    "bg-red-100 text-red-800 border-red-200"}>
                    {call.call_analysis.call_successful ? "Successful" : "Unsuccessful"}
                  </Badge>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Started:</span>
              <span className="font-medium">{formatDate(call.start_timestamp)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Ended:</span>
              <span className="font-medium">{formatDate(call.end_timestamp)}</span>
            </div>
          </div>
          
          {/* Appointment status display */}
          {call.appointment_status && (
            <div className="mb-4 p-3 rounded-md bg-gray-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-500">Appointment:</span>
                <Badge className={cn(
                  call.appointment_status === 'scheduled' ? "bg-green-100 text-green-800" :
                  call.appointment_status === 'rejected' ? "bg-red-100 text-red-800" :
                  "bg-blue-100 text-blue-800"
                )}>
                  {call.appointment_status}
                </Badge>
                
                {call.appointment_date && call.appointment_time && (
                  <span className="text-sm font-medium">
                    {call.appointment_date} at {call.appointment_time}
                  </span>
                )}
              </div>
              
              {/* Action buttons for in-process appointments */}
              {call.appointment_status === 'in-process' && (
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={handleRejectAppointment}
                  >
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleAcceptAppointment}
                  >
                    <Check className="mr-2 h-4 w-4" /> Schedule
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="ghost" 
              onClick={onToggleExpand}
              className="flex-grow flex items-center justify-center gap-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 py-1"
            >
              {isExpanded ? (
                <>
                  <span>Hide Details</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Show Details</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="flex-grow flex items-center justify-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 py-1"
                >
                  <Search className="w-4 h-4" />
                  <span>View Full Details</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-purple-500" />
                    <span>Call Details</span>
                    <Badge className={cn("ml-2", getStatusColor(call.call_status))}>
                      {call.call_status}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Call ID:</span>
                      <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded">{call.call_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium">{getDuration()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="summary">
                        <Info className="w-4 h-4 mr-2" />
                        Summary
                      </TabsTrigger>
                      <TabsTrigger value="transcript">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Transcript
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="summary" className="overflow-auto max-h-[50vh] px-1">
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="font-medium mb-2 text-gray-700">Call Summary</h3>
                          <p className="text-gray-600">{getSummary()}</p>
                        </div>
                        
                        {/* Call Analysis Details */}
                        {call.call_analysis && (
                          <div className="bg-gray-50 p-4 rounded-md">
                            <h3 className="font-medium mb-3 text-gray-700">Call Analysis</h3>
                            <div className="space-y-3">
                              {call.call_analysis.user_sentiment && (
                                <div className="flex items-center gap-2">
                                  {call.call_analysis.user_sentiment?.toLowerCase() === 'positive' ? 
                                    <ThumbsUp className="w-4 h-4 text-green-500" /> : 
                                    (call.call_analysis.user_sentiment?.toLowerCase() === 'negative' ? 
                                      <ThumbsDown className="w-4 h-4 text-red-500" /> : 
                                      <Info className="w-4 h-4 text-blue-500" />)
                                  }
                                  <span className="text-sm text-gray-600">User Sentiment:</span>
                                  <Badge className={getSentimentColor(call.call_analysis.user_sentiment)}>
                                    {call.call_analysis.user_sentiment}
                                  </Badge>
                                </div>
                              )}
                              
                              {typeof call.call_analysis.call_successful === 'boolean' && (
                                <div className="flex items-center gap-2">
                                  {call.call_analysis.call_successful ? 
                                    <CheckCircle className="w-4 h-4 text-green-500" /> : 
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  }
                                  <span className="text-sm text-gray-600">Call Outcome:</span>
                                  <span className="text-sm font-medium">
                                    {call.call_analysis.call_successful ? "Successful" : "Unsuccessful"}
                                  </span>
                                </div>
                              )}
                              
                              {typeof call.call_analysis.in_voicemail === 'boolean' && (
                                <div className="flex items-center gap-2">
                                  <Info className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">Voicemail:</span>
                                  <span className="text-sm font-medium">
                                    {call.call_analysis.in_voicemail ? "Yes" : "No"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h3 className="font-medium mb-2 text-gray-700">Call Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                            <div>
                              <span className="text-gray-500">Agent ID:</span>
                              <span className="ml-2">{call.agent_id || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Call Type:</span>
                              <span className="ml-2">{call.call_type || "voice"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Start Time:</span>
                              <span className="ml-2">{formatDate(call.start_timestamp)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">End Time:</span>
                              <span className="ml-2">{formatDate(call.end_timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="transcript" className="space-y-4">
                      {call.recording_url && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <h3 className="font-medium mb-2 text-gray-700 flex items-center gap-2">
                            <Play className="w-4 h-4 text-purple-500" />
                            Audio Recording
                          </h3>
                          <audio 
                            controls 
                            src={call.recording_url}
                            className="w-full"
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                      
                      <div className="overflow-auto max-h-[40vh]">
                        <h3 className="font-medium mb-2 text-gray-700 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          Transcript
                        </h3>
                        
                        {transcriptLines.length > 0 ? (
                          <div className="space-y-2">
                            {transcriptLines.map((line: any, idx: number) => (
                              <div 
                                key={line.id}
                                className={cn(
                                  "p-2 rounded-md flex items-start gap-2 transition-colors",
                                  playingIndex === idx ? "bg-purple-100" : "hover:bg-gray-50"
                                )}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-0.5 h-5 w-5 p-0 rounded-full"
                                  onClick={() => handlePlayLine(idx)}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                                <p className="text-sm text-gray-700">{line.text}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No transcript available for this call.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {isExpanded && (
            <div className="mt-4 space-y-4 border-t pt-4">
              {/* Show appointment extraction UI only when appropriate */}
              {call.transcript && shouldShowAppointmentActions() && !call.processed && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button 
                      onClick={handleExtractAppointment} 
                      disabled={isExtracting}
                      className="flex items-center gap-1"
                    >
                      <Sparkles className="h-4 w-4" /> 
                      Extract Appointment Details
                    </Button>
                    {extractedAppointment && (extractedAppointment.appointmentDate || extractedAppointment.appointmentTime) && (
                      <>
                        <Button 
                          variant="outline" 
                          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                          onClick={handleRejectAppointment}
                        >
                          <X className="mr-2 h-4 w-4" /> Reject
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handleAcceptAppointment}
                        >
                          <Check className="mr-2 h-4 w-4" /> Schedule
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {extractedAppointment && (
                    <div className="mb-4">
                      {(extractedAppointment.appointmentDate || extractedAppointment.appointmentTime) ? (
                        <AppointmentExtractor 
                          transcript={call.transcript}
                          callId={call.call_id}
                          callDate={call.start_timestamp ? new Date(Number(call.start_timestamp)) : undefined}
                          autoExtract={false}
                          onExtracted={() => {}}
                        />
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-md text-gray-600">
                          No appointment details found in the transcript.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Call Analysis Section for expanded view */}
              {call.call_analysis && (
                <div>
                  <h4 className="font-medium mb-2 text-gray-700 flex items-center gap-2">
                    <Info className="w-4 h-4 text-purple-500" />
                    Call Analysis
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    {call.call_analysis.call_summary && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-600">Summary:</span>
                        <p className="text-sm text-gray-600 mt-1">{call.call_analysis.call_summary}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {call.call_analysis.user_sentiment && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Sentiment:</span>
                          <Badge className={getSentimentColor(call.call_analysis.user_sentiment)}>
                            {call.call_analysis.user_sentiment}
                          </Badge>
                        </div>
                      )}
                      
                      {typeof call.call_analysis.call_successful === 'boolean' && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Outcome:</span>
                          <span>{call.call_analysis.call_successful ? "Successful" : "Unsuccessful"}</span>
                        </div>
                      )}
                      
                      {typeof call.call_analysis.in_voicemail === 'boolean' && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Voicemail:</span>
                          <span>{call.call_analysis.in_voicemail ? "Yes" : "No"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {call.transcript && (
                <div>
                  <h4 className="font-medium mb-2 text-gray-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Transcript Preview
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md text-gray-700 max-h-32 overflow-y-auto text-sm">
                    {call.transcript.length > 150 
                      ? `${call.transcript.substring(0, 150)}...` 
                      : call.transcript}
                  </div>
                </div>
              )}
              
              {call.recording_url && (
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">Recording</h4>
                  <audio 
                    controls 
                    src={call.recording_url}
                    className="w-full"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              
              {call.public_log_url && (
                <div className="mt-3">
                  <a 
                    href={call.public_log_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors"
                  >
                    View Complete Log
                  </a>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default CallCard;
