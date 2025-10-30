import { useState } from "react";
import { Calendar } from "./ui/calendar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { CalendarIcon, Clock, MapPin, Users, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { useActivities } from "./ActivitiesContext";
import { toast } from "sonner";

export function ActivityForm({ onSubmitted, onViewRecords }: { onSubmitted?: () => void; onViewRecords?: () => void }) {
  const { addActivity } = useActivities();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedTargetSectors, setSelectedTargetSectors] = useState<string[]>([]);

  const projects = [
    "IIDB",
    "Free Wi-Fi for All",
    "Cybersecurity",
    "PNPKI",
    "ILCDB",
    "DTC ILCDB Core",
    "ILCDB SPARK",
    "eGOV",
    "Admin and Finance Related Activities",
    "Provincial Activity",
    "RD's Office",
    "Technical Operations Division"
  ];

  const targetSectors = [
    "LGU",
    "NGA",
    "Teachers",
    "Students",
    "OFW",
    "PWD",
    "PDL",
    "Women",
    "Senior Citizen",
    "LGBTQA+",
    "Out-of-School Youth",
    "Indigenous People",
    "Other"
  ];

  const provinces = [
    "Davao De Oro",
    "Davao Del Sur",
    "Davao Del Norte",
    "Davao Occidental",
    "Davao Oriental"
  ];

  const handleTargetSectorToggle = (sector: string) => {
    setSelectedTargetSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startDate) return alert("Please select a start date");

    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("activityName") || "Untitled Activity");
    const project = String(data.get("project") || "");
    const timeStart = String(data.get("timeStart") || "");
    const timeEnd = String(data.get("timeEnd") || "");
    const location = String(data.get("province") || "");
    const venue = String(data.get("barangay") || "");
    const facilitator = String(data.get("resourcePerson") || "");

    const dateKey = format(startDate, "yyyy-MM-dd");
    const id = String(Date.now());

    addActivity({
      id,
      name,
      date: dateKey,
      time: timeStart,
      endTime: timeEnd,
      location,
      venue,
      sector: selectedTargetSectors[0] || "LGU",
      project,
      description: String(data.get("description") || ""),
      participants: undefined,
      facilitator,
      status: "Scheduled",
    });

    toast.success("Activity added", {
      description: `${name} scheduled on ${format(startDate, "PPP")}`,
      action: {
        label: "View records",
        onClick: () => onViewRecords?.(),
      },
    });
    onSubmitted?.();
  };

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="text-center">Activity Registration Form</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Schedule Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-blue-900">Schedule Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Start */}
              <div className="space-y-2">
                <Label htmlFor="timeStart">
                  Time Start <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="timeStart"
                    name="timeStart"
                    type="time"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Time End */}
              <div className="space-y-2">
                <Label htmlFor="timeEnd">
                  Time End <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="timeEnd"
                    name="timeEnd"
                    type="time"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duration <span className="text-red-500">*</span>
                </Label>
                <Select name="duration" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(h => (
                      <SelectItem key={h} value={`${h} hours`}>{h} hour{h > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Project Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h3 className="text-blue-900">Project Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project/Program */}
              <div className="space-y-2">
                <Label htmlFor="project">
                  Project/Program <span className="text-red-500">*</span>
                </Label>
                <Select required name="project">
                  <SelectTrigger>
                    <SelectValue placeholder="Select project/program" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Activity Name */}
              <div className="space-y-2">
                <Label htmlFor="activityName">
                  Activity Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="activityName"
                  name="activityName"
                  type="text"
                  placeholder="Enter activity name"
                  required
                />
              </div>

              {/* Mode of Implementation */}
              <div className="space-y-2">
                <Label htmlFor="modeOfImplementation">
                  Mode of Implementation <span className="text-red-500">*</span>
                </Label>
                <Select required name="modeOfImplementation">
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Partner Institution */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="partnerInstitution">
                  Partner Institution <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="partnerInstitution"
                  name="partnerInstitution"
                  type="text"
                  placeholder="Enter partner institution"
                  required
                />
              </div>
            </div>
          </div>

          {/* Target Sector Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-blue-900">Target Sector</h3>
            </div>

            <div className="space-y-2">
              <Label>
                Target Sector <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {targetSectors.map((sector) => (
                  <div key={sector} className="flex items-center space-x-2">
                    <Checkbox
                      id={sector}
                      checked={selectedTargetSectors.includes(sector)}
                      onCheckedChange={() => handleTargetSectorToggle(sector)}
                    />
                    <label
                      htmlFor={sector}
                      className="text-sm cursor-pointer select-none"
                    >
                      {sector}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-blue-900">Location Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Province/City */}
              <div className="space-y-2">
                <Label htmlFor="province">
                  Province/City <span className="text-red-500">*</span>
                </Label>
                <Select required name="province">
                  <SelectTrigger>
                    <SelectValue placeholder="Select province/city" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Congressional District */}
              <div className="space-y-2">
                <Label htmlFor="district">
                  Congressional District <span className="text-red-500">*</span>
                </Label>
                <Select required name="district">
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st District</SelectItem>
                    <SelectItem value="2nd">2nd District</SelectItem>
                    <SelectItem value="3rd">3rd District</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Barangay */}
              <div className="space-y-2">
                <Label htmlFor="barangay">
                  Barangay <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="barangay"
                  name="barangay"
                  type="text"
                  placeholder="Enter barangay"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-700">
              Submit Activity
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
