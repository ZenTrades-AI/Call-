
import { useState } from "react";
import CallCard from "./CallCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, X } from "lucide-react";
import { Button } from "./ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "./ui/popover";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { Badge } from "./ui/badge";

interface CallListProps {
  calls: any[];
  loading: boolean;
  updateCall?: (updatedCall: any) => void;
}

const CallList: React.FC<CallListProps> = ({ calls, loading, updateCall }) => {
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    callStatus: "all",
    appointmentStatus: "all",
    dateFrom: "",
    dateTo: "",
    minDuration: "",
    maxDuration: ""
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleExpand = (callId: string) => {
    setExpandedCallId(expandedCallId === callId ? null : callId);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({
      ...filters,
      [key]: value
    });
    
    // Update active filters
    if (value && value !== "all") {
      if (!activeFilters.includes(key)) {
        setActiveFilters([...activeFilters, key]);
      }
    } else {
      setActiveFilters(activeFilters.filter(filter => filter !== key));
    }
  };

  const clearFilter = (key: string) => {
    setFilters({
      ...filters,
      [key]: key === "callStatus" || key === "appointmentStatus" ? "all" : ""
    });
    setActiveFilters(activeFilters.filter(filter => filter !== key));
  };

  const clearAllFilters = () => {
    setFilters({
      callStatus: "all",
      appointmentStatus: "all",
      dateFrom: "",
      dateTo: "",
      minDuration: "",
      maxDuration: ""
    });
    setActiveFilters([]);
  };

  // Filter calls based on all criteria
  const filteredCalls = calls.filter(call => {
    // Text search
    if (searchQuery && !JSON.stringify(call).toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Call status filter
    if (filters.callStatus !== "all" && call.call_status !== filters.callStatus) {
      return false;
    }

    // Appointment status filter
    if (filters.appointmentStatus !== "all" && call.appointment_status !== filters.appointmentStatus) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      const callDate = new Date(call.start_timestamp);
      if (callDate < fromDate) {
        return false;
      }
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59); // End of the day
      const callDate = new Date(call.start_timestamp);
      if (callDate > toDate) {
        return false;
      }
    }

    // Duration filter (if we can calculate it)
    if (call.start_timestamp && call.end_timestamp) {
      const start = new Date(call.start_timestamp).getTime();
      const end = new Date(call.end_timestamp).getTime();
      const durationSec = (end - start) / 1000;
      
      if (filters.minDuration && durationSec < parseInt(filters.minDuration) * 60) {
        return false;
      }
      
      if (filters.maxDuration && durationSec > parseInt(filters.maxDuration) * 60) {
        return false;
      }
    }

    return true;
  });

  const getFilterLabel = (key: string): string => {
    switch(key) {
      case "callStatus": return "Call Status";
      case "appointmentStatus": return "Appointment Status";
      case "dateFrom": return "Date From";
      case "dateTo": return "Date To";
      case "minDuration": return "Min Duration";
      case "maxDuration": return "Max Duration";
      default: return key;
    }
  };

  const getFilterDisplayValue = (key: string): string => {
    switch(key) {
      case "dateFrom": 
      case "dateTo":
        if (!filters[key]) return "";
        return new Date(filters[key]).toLocaleDateString();
      case "minDuration":
      case "maxDuration":
        return `${filters[key]} min`;
      default:
        return filters[key] === "all" ? "Any" : filters[key];
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 my-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3 mb-2" />
            <Skeleton className="h-12 w-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <h3 className="text-xl font-medium text-gray-500">No calls found</h3>
        <p className="text-gray-400 mt-2">Click "Fetch Calls" to load your recent conversations</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 space-y-4">
        {/* Search and filter bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search calls..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filter button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Advanced Filters</h3>
                <Separator />
                
                {/* Call Status filter - Fixed to use "all" instead of empty string */}
                <div className="space-y-2">
                  <Label htmlFor="call-status">Call Status</Label>
                  <Select 
                    value={filters.callStatus} 
                    onValueChange={(value) => handleFilterChange("callStatus", value)}
                  >
                    <SelectTrigger id="call-status">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Appointment Status filter - Fixed to use "all" instead of empty string */}
                <div className="space-y-2">
                  <Label htmlFor="appointment-status">Appointment Status</Label>
                  <Select 
                    value={filters.appointmentStatus} 
                    onValueChange={(value) => handleFilterChange("appointmentStatus", value)}
                  >
                    <SelectTrigger id="appointment-status">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-process">In Process</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Date range filter */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="date-from">From Date</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date-to">To Date</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Duration filter */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="min-duration">Min Duration (min)</Label>
                    <Input
                      id="min-duration"
                      type="number"
                      min="0"
                      value={filters.minDuration}
                      onChange={(e) => handleFilterChange("minDuration", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-duration">Max Duration (min)</Label>
                    <Input
                      id="max-duration"
                      type="number"
                      min="0"
                      value={filters.maxDuration}
                      onChange={(e) => handleFilterChange("maxDuration", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                  <Button size="sm">Apply Filters</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(filter => (
              <Badge key={filter} variant="outline" className="px-2 py-1 flex items-center gap-1">
                <span className="text-xs font-medium">{getFilterLabel(filter)}: {getFilterDisplayValue(filter)}</span>
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter(filter)} 
                />
              </Badge>
            ))}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-xs ml-1"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>
      
      {/* Results count */}
      <div className="text-sm text-gray-500 mb-4">
        Showing {filteredCalls.length} of {calls.length} calls
      </div>

      <div className="grid grid-cols-1 gap-6 my-6">
        {filteredCalls.map(call => (
          <CallCard 
            key={call.call_id} 
            call={call} 
            isExpanded={expandedCallId === call.call_id}
            onToggleExpand={() => toggleExpand(call.call_id)}
            onUpdateCall={updateCall}
          />
        ))}
        
        {filteredCalls.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-medium text-gray-500">No matching calls</h3>
            <p className="text-gray-400 mt-2">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </>
  );
};

export default CallList;
