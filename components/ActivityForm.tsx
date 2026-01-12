import { useState, useMemo } from "react";
import { Calendar } from "./ui/calendar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { CalendarIcon, Clock, MapPin, Users, Briefcase, X, UserPlus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useActivities } from "./ActivitiesContext";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { sendActivityEmail } from "./utils/emailService";

export function ActivityForm({ onSubmitted, onViewRecords, prefillDate }: { onSubmitted?: () => void; onViewRecords?: () => void; prefillDate?: string }) {
  const { addActivity } = useActivities();
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date>(() => {
    if (prefillDate) {
      const d = new Date(prefillDate);
      if (!isNaN(d.getTime())) return d;
    }
    return undefined as unknown as Date;
  });
  const [endDate, setEndDate] = useState<Date>();
  const [selectedTargetSectors, setSelectedTargetSectors] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");
  const [computedDuration, setComputedDuration] = useState<string>("");
  const [expectedParticipants, setExpectedParticipants] = useState<string>("");
  const [assignedPersonnel, setAssignedPersonnel] = useState<Array<{ idNumber: string; fullName: string; task: string }>>([]);
  const [priority, setPriority] = useState<"Normal" | "Urgent">("Normal");
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | undefined>(undefined);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [activityNameBeforeFor, setActivityNameBeforeFor] = useState<string>("");
  const [activityNameAfterFor, setActivityNameAfterFor] = useState<string>("");

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
    "Davao City",
    "Davao De Oro",
    "Davao Del Sur",
    "Davao Del Norte",
    "Davao Occidental",
    "Davao Oriental"
  ];

  // Cities by province
  const citiesByProvince: Record<string, string[]> = {
    "Davao De Oro": [
      "Montevista",
      "Laak",
      "Mawab",
      "Nabunturan",
      "Maco",
      "Maragusan",
      "Pantukan",
      "Compostela",
      "New Bataan"
    ],
    "Davao Del Sur": [
      "Digos City",
      "Bansalan",
      "Hagonoy",
      "Kiblawan",
      "Magsaysay",
      "Malalag",
      "Matanao",
      "Padada",
      "Santa Cruz",
      "Sulop"
    ],
    "Davao Del Norte": [
      "Tagum City",
      "Panabo City",
      "Island Garden City of Samal",
      "Kapalong",
      "Sto. Tomas",
      "Carmen",
      "Asuncion",
      "Braulio E. Dujali",
      "Talaingod",
      "San Isidro"
    ],
    "Davao Occidental": [
      "Don Marcelino",
      "Jose Abad Santos",
      "Malita",
      "Santa Maria",
      "Sarangani"
    ],
    "Davao Oriental": [
      "Mati",
      "Lupon",
      "Banaybanay",
      "San Isidro",
      "Governor Generoso",
      "Tarragona",
      "Manay",
      "Caraga",
      "Baganga",
      "Cateel",
      "Boston"
    ]
  };

  // Get cities for selected province (always include "Other" option)
  const availableCities = selectedProvince 
    ? [...(citiesByProvince[selectedProvince] || []), "Other"]
    : [];

  // Full personnel list
  const allPersonnel = [
    { idNumber: "DICT-25-001", fullName: "Engr. Ma. Jessa Garsuta", email: "user@dict.gov.ph" },
    { idNumber: "DICT-25-002", fullName: "Maria Santos", email: "staff@dict.gov.ph" },
    { idNumber: "DICT-25-003", fullName: "John Michael Dela Cruz", email: "staff.member@dict.gov.ph" },
  ];

  // Available personnel for assignment (excluding the current user)
  const availablePersonnel = allPersonnel.filter(p => p.idNumber !== user?.idNumber);

  // Memoize unassigned personnel to prevent unnecessary re-renders
  const unassignedPersonnel = useMemo(() => {
    return availablePersonnel.filter(p => !assignedPersonnel.find(ap => ap.idNumber === p.idNumber));
  }, [availablePersonnel, assignedPersonnel]);

  // Ensure selectedPersonnelId is valid
  const validSelectedPersonnelId = useMemo(() => {
    if (!selectedPersonnelId) return undefined;
    const isValid = unassignedPersonnel.some(p => p.idNumber === selectedPersonnelId);
    return isValid ? selectedPersonnelId : undefined;
  }, [selectedPersonnelId, unassignedPersonnel]);

  const handleAddPersonnel = (personnelId: string) => {
    if (!personnelId || personnelId === "" || personnelId === "__disabled__") {
      setSelectedPersonnelId(undefined);
      return;
    }
    
    try {
      const person = allPersonnel.find(p => p.idNumber === personnelId);
      const isAlreadyAssigned = assignedPersonnel.some(p => p.idNumber === personnelId);
      
      if (person && !isAlreadyAssigned) {
        // Add personnel and reset select in the same update cycle
        setAssignedPersonnel(prev => [...prev, { idNumber: person.idNumber, fullName: person.fullName, task: "" }]);
        setSelectedPersonnelId(undefined);
      } else {
        setSelectedPersonnelId(undefined);
      }
    } catch (error) {
      console.error("Error adding personnel:", error);
      setSelectedPersonnelId(undefined);
    }
  };

  const handleRemovePersonnel = (idNumber: string) => {
    try {
      setAssignedPersonnel(prev => prev.filter(p => p.idNumber !== idNumber));
    } catch (error) {
      console.error("Error removing personnel:", error);
    }
  };

  const handleUpdateTask = (idNumber: string, task: string) => {
    try {
      setAssignedPersonnel(prev => prev.map(p => 
        p.idNumber === idNumber ? { ...p, task } : p
      ));
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Compute duration when times change
  const toMinutes = (t: string) => {
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  };
  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h} hr ${m} min`;
    if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
    return `${m} min`;
  };
  
  if (computedDuration === undefined) {
    // no-op to satisfy TS in some editors
  }

  // Update computedDuration reactively
  if (timeStart || timeEnd) {
    const s = toMinutes(timeStart ?? "");
    const e = toMinutes(timeEnd ?? "");
    if (s != null && e != null && e > s) {
      const diff = e - s;
      if (computedDuration !== formatDuration(diff)) {
        setComputedDuration(formatDuration(diff));
      }
    } else if (computedDuration !== "") {
      setComputedDuration("");
    }
  }

  const handleTargetSectorToggle = (sector: string) => {
    setSelectedTargetSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const handleProjectToggle = (project: string) => {
    setSelectedProjects(prev =>
      prev.includes(project)
        ? prev.filter(p => p !== project)
        : [...prev, project]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startDate) return alert("Please select a start date");

    // Disallow past dates
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (startDate < todayStart) {
      toast.error("Start date cannot be in the past", {
        description: "Please choose today or a future date.",
      });
      return;
    }

    const form = e.currentTarget;
    const data = new FormData(form);

    // Activity name with "FOR" in the middle - format: "Part 1 FOR Part 2"
    const beforeFor = activityNameBeforeFor.trim();
    const afterFor = activityNameAfterFor.trim();
    if (!beforeFor || !afterFor) {
      toast.error("Activity Name required", {
        description: "Please enter both parts of the activity name (Part 1 FOR Part 2)",
      });
      return;
    }
    const name = `${beforeFor} FOR ${afterFor}`;
    // Validate that at least one project is selected
    if (selectedProjects.length === 0) {
      toast.error("Project/Program required", {
        description: "Please select at least one project/program",
      });
      return;
    }
    const project = selectedProjects.join(", "); // Join multiple projects with comma
    const province = String(data.get("province") || "");
    const city = String(data.get("city") || "");
    // If province is "Davao City", use it as location without city
    const location = province === "Davao City" 
      ? province 
      : `${province}${city ? `, ${city}` : ''}`.trim();
    const venue = String(data.get("barangay") || "");
    const facilitator = String(data.get("resourcePerson") || "");
    const partnerInstitution = String(data.get("partnerInstitution") || "");
    const participantsCount = expectedParticipants ? parseInt(expectedParticipants, 10) : undefined;
    // Validate times
    const parseTime = (t: string) => {
      const m = t.match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return null;
      return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    };
    const startMin = parseTime(timeStart);
    const endMin = parseTime(timeEnd);
    if (startMin == null || endMin == null) {
      toast.error("Please provide valid start and end times");
      return;
    }
    if (endMin <= startMin) {
      toast.error("End time must be after start time");
      return;
    }

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
      participants: participantsCount || undefined,
      facilitator,
      status: "Scheduled",
      createdBy: user
        ? {
            idNumber: user.idNumber,
            fullName: user.fullName,
            email: user.email,
          }
        : undefined,
      assignedPersonnel: assignedPersonnel.length > 0 ? assignedPersonnel : undefined,
      priority: priority,
      partnerInstitution: partnerInstitution || undefined,
    });

    // Send email notification (non-blocking - don't wait for it)
    const recipientEmail = "vishy.te@dict.gov.ph"; // Test email provided by user
    sendActivityEmail(recipientEmail, {
      name,
      date: dateKey,
      time: timeStart,
      endTime: timeEnd,
      location,
      venue,
      project,
      description: String(data.get("description") || ""),
      participants: participantsCount || undefined,
      facilitator,
      createdBy: user ? `${user.fullName} (${user.idNumber})` : undefined,
      sector: selectedTargetSectors[0] || "LGU",
      partnerInstitution: partnerInstitution || undefined,
    }).then((result) => {
      if (result.success) {
        toast.success("Email notification sent", {
          description: `Activity notification sent to ${recipientEmail}`,
        });
      } else {
        // Show info message but don't block activity creation
        console.info("Email notification:", result.error || result.message);
        // Show toast notification about email setup
        if (result.error && result.error.includes('not configured')) {
          toast.warning("Email not configured", {
            description: "Email service not set up. Activity created successfully. See QUICK_EMAIL_SETUP.md for setup instructions (5 minutes).",
            duration: 6000,
          });
        } else if (result.error) {
          toast.error("Email failed", {
            description: result.error,
            duration: 5000,
          });
        }
      }
    }).catch((error) => {
      // Silently log error - don't show toast to avoid interrupting user
      console.error("Error sending email:", error);
      // Activity creation should still succeed even if email fails
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
          {/* Creator/User banner */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <Users className="h-5 w-5 text-blue-700" />
            <div>
              <p className="text-xs text-blue-800">Created by</p>
              <p className="text-sm font-medium text-blue-900">
                {user ? `${user.fullName} (${user.idNumber})` : "Guest"}
              </p>
              {user && (
                <p className="text-xs text-blue-800">{user.email}</p>
              )}
            </div>
          </div>
          
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
                      disabled={(date) => {
                        const t = new Date();
                        t.setHours(0, 0, 0, 0);
                        return date < t;
                      }}
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
                      disabled={(date) => {
                        const t = new Date();
                        t.setHours(0, 0, 0, 0);
                        return date < t;
                      }}
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
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
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
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* Duration (auto-calculated) */}
              <div className="space-y-2">
                <Label>Duration (auto)</Label>
                <Input
                  readOnly
                  value={computedDuration || "—"}
                  className="bg-gray-50"
                />
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
              <div className="space-y-2 md:col-span-2">
                <Label>
                  Project/Program <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  {projects.map((project) => (
                    <div key={project} className="flex items-center space-x-2">
                      <Checkbox
                        id={`project-${project}`}
                        checked={selectedProjects.includes(project)}
                        onCheckedChange={() => handleProjectToggle(project)}
                        required={selectedProjects.length === 0}
                      />
                      <label
                        htmlFor={`project-${project}`}
                        className="text-sm cursor-pointer select-none"
                      >
                        {project}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedProjects.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Please select at least one project/program</p>
                )}
                <input 
                  type="hidden" 
                  name="project" 
                  value={selectedProjects.join(", ")} 
                  required={selectedProjects.length === 0}
                />
              </div>

              {/* Activity Name */}
              <div className="space-y-2">
                <Label>
                  Activity Name <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="activityNameBefore"
                    name="activityNameBefore"
                    type="text"
                    placeholder="e.g., Cybersecurity Awareness"
                    value={activityNameBeforeFor}
                    onChange={(e) => setActivityNameBeforeFor(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <span className="px-3 py-2 bg-gray-100 text-gray-700 font-medium rounded-md border border-gray-300 whitespace-nowrap select-none">
                    FOR
                  </span>
                  <Input
                    id="activityNameAfter"
                    name="activityNameAfter"
                    type="text"
                    placeholder="e.g., Rebel Returnees"
                    value={activityNameAfterFor}
                    onChange={(e) => setActivityNameAfterFor(e.target.value)}
                    required
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">Format:</span> [Part 1] FOR [Part 2] | 
                  <span className="ml-1 font-medium">Example:</span> "Cybersecurity Awareness" FOR "Rebel Returnees" | 
                  <span className="ml-1 text-red-500 font-medium">* Both parts are required</span>
                </p>
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
              
              {/* Expected Participants */}
              <div className="space-y-2">
                <Label htmlFor="expectedParticipants">
                  Expected Number of Participants
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="expectedParticipants"
                    type="number"
                    min="0"
                    placeholder="Enter expected number of participants"
                    value={expectedParticipants}
                    onChange={(e) => setExpectedParticipants(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">Optional: Estimate how many participants will attend</p>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-blue-900">Location Information</h3>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 ${selectedProvince === "Davao City" ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-6`}>
              {/* Province */}
              <div className="space-y-2">
                <Label htmlFor="province">
                  Province <span className="text-red-500">*</span>
                </Label>
                <Select 
                  required 
                  name="province"
                  value={selectedProvince}
                  onValueChange={(value) => {
                    setSelectedProvince(value);
                    setSelectedCity(""); // Reset city when province changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
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

              {/* City - Hide when "Davao City" is selected as province */}
              {selectedProvince !== "Davao City" && (
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    required={selectedProvince !== "Davao City"}
                    name="city"
                    value={selectedCity || ""}
                    onValueChange={setSelectedCity}
                    disabled={!selectedProvince}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedProvince ? "Select province first" : "Select city"} />
                    </SelectTrigger>
                    {selectedProvince && availableCities.length > 0 && (
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    )}
                  </Select>
                  {!selectedProvince && (
                    <p className="text-xs text-gray-500">Select a province first to see available cities</p>
                  )}
                </div>
              )}

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

          {/* Assigned Personnel & Priority Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-blue-900">Assignment & Priority</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assigned Personnel */}
              <div className="space-y-2">
                <Label htmlFor="assignPersonnel">Assigned Personnel</Label>
                <Select 
                  value={validSelectedPersonnelId || ""} 
                  onValueChange={handleAddPersonnel}
                >
                  <SelectTrigger id="assignPersonnel">
                    <SelectValue placeholder="Select personnel to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedPersonnel.length === 0 ? (
                      <SelectItem value="__disabled__" disabled>All personnel assigned</SelectItem>
                    ) : (
                      unassignedPersonnel.map((person) => (
                        <SelectItem key={person.idNumber} value={person.idNumber}>
                          {person.fullName} ({person.idNumber})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {assignedPersonnel.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {assignedPersonnel.map((person) => (
                      <div key={person.idNumber} className="flex items-start gap-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{person.fullName}</p>
                              <p className="text-xs text-gray-500">{person.idNumber}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePersonnel(person.idNumber)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Enter task/role for this personnel"
                            value={person.task}
                            onChange={(e) => handleUpdateTask(person.idNumber, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value: "Normal" | "Urgent") => setPriority(value)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Normal
                      </div>
                    </SelectItem>
                    <SelectItem value="Urgent">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Urgent
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {priority === "Urgent" && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-xs text-red-800">This activity is marked as urgent</p>
                  </div>
                )}
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
