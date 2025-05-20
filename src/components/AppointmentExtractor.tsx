
import { useState } from "react";
import { format, parse } from "date-fns";
import { extractAppointmentDetails } from "@/lib/openai";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, Calendar, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AppointmentExtractorProps {
  transcript: string;
  callId: string;
  callDate?: Date; // Add reference date prop
  onExtracted?: (data: any) => void;
  autoExtract?: boolean;
}

const AppointmentExtractor: React.FC<AppointmentExtractorProps> = ({ 
  transcript, 
  callId,
  callDate,
  onExtracted,
  autoExtract = false
}) => {
  const [loading, setLoading] = useState(false);
  const [extractedDate, setExtractedDate] = useState<string | null>(null);
  const [extractedTime, setExtractedTime] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [suggestedResponse, setSuggestedResponse] = useState<string | null>(null);

  // Auto-extract on component mount if enabled
  if (autoExtract && !loading && !extractedDate && !extractedTime) {
    handleExtract();
  }

  async function handleExtract() {
    if (!transcript) {
      toast.error("No transcript available to analyze");
      return;
    }

    setLoading(true);
    
    try {
      // Use call date as reference if provided
      const result = await extractAppointmentDetails(transcript, callDate);
      
      setExtractedDate(result.appointmentDate);
      setExtractedTime(result.appointmentTime);
      setConfidence(result.confidence);
      setSuggestedResponse(result.suggestedResponse);
      
      if (onExtracted) {
        onExtracted(result);
      }
      
      if (!result.appointmentDate && !result.appointmentTime) {
        toast.info("No appointment details found in the transcript");
      }
    } catch (error) {
      console.error("Error in appointment extraction:", error);
      toast.error("Failed to extract appointment details");
    } finally {
      setLoading(false);
    }
  }

  const getFormattedDate = () => {
    if (!extractedDate) return null;
    
    try {
      const date = parse(extractedDate, 'yyyy-MM-dd', new Date());
      return format(date, 'MMMM d, yyyy');
    } catch (e) {
      return extractedDate;
    }
  };

  const getFormattedTime = () => {
    if (!extractedTime) return null;
    
    try {
      const time = parse(extractedTime, 'HH:mm', new Date());
      return format(time, 'h:mm a');
    } catch (e) {
      return extractedTime;
    }
  };

  const getConfidenceColor = () => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 50) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Card className="w-full bg-white border-indigo-100 hover:border-indigo-200 transition-all">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Appointment Analysis
        </CardTitle>
        <CardDescription>
          Detected appointment details from transcript
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        )}
        
        {!loading && (extractedDate || extractedTime) && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="mr-1 h-4 w-4" /> Date
                </div>
                <div className="font-semibold">
                  {getFormattedDate() || "Not specified"}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="mr-1 h-4 w-4" /> Time
                </div>
                <div className="font-semibold">
                  {getFormattedTime() || "Not specified"}
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="text-sm font-medium text-gray-500 mb-1">
                AI Confidence: <span className={getConfidenceColor()}>{confidence}%</span>
              </div>
              
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full",
                    confidence >= 80 ? "bg-green-500" :
                    confidence >= 50 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
            
            {suggestedResponse && (
              <div className="mt-3 bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                <div className="font-medium mb-1">Suggested Response:</div>
                <p className="italic">{suggestedResponse}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentExtractor;
