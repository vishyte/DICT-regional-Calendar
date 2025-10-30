import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Search, MapPin, Calendar, Users, Briefcase, Filter } from "lucide-react";
import { Button } from "./ui/button";

interface Activity {
  id: string;
  name: string;
  project: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  targetSector: string[];
  province: string;
  district: string;
  barangay: string;
  partnerInstitution: string;
  resourcePerson: string;
  mode: string;
  status: "Upcoming" | "Ongoing" | "Completed";
}

export function ActivitiesPerProvince() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const provinces = [
    "Davao De Oro",
    "Davao Del Sur",
    "Davao Del Norte",
    "Davao Occidental",
    "Davao Oriental"
  ];

  // Mock data for activities
  const activities: Activity[] = [
    {
      id: "1",
      name: "Free Wi-Fi Installation Training",
      project: "Free Wi-Fi for All",
      date: "2025-11-15",
      timeStart: "09:00",
      timeEnd: "17:00",
      targetSector: ["LGU", "Teachers"],
      province: "Davao Del Norte",
      district: "1st District",
      barangay: "Poblacion",
      partnerInstitution: "City Government of Davao",
      resourcePerson: "ICT Division",
      mode: "On-site",
      status: "Upcoming"
    },
    {
      id: "2",
      name: "Cybersecurity Awareness Seminar",
      project: "Cybersecurity",
      date: "2025-10-25",
      timeStart: "13:00",
      timeEnd: "16:00",
      targetSector: ["Teachers", "Students"],
      province: "Davao Del Norte",
      district: "2nd District",
      barangay: "New Visayas",
      partnerInstitution: "DepEd Division Office",
      resourcePerson: "Technical Operations Division",
      mode: "Hybrid",
      status: "Completed"
    },
    {
      id: "3",
      name: "eGOV Implementation Workshop",
      project: "eGOV",
      date: "2025-10-22",
      timeStart: "08:00",
      timeEnd: "17:00",
      targetSector: ["NGA", "LGU"],
      province: "Davao Del Sur",
      district: "1st District",
      barangay: "Rizal",
      partnerInstitution: "Provincial Government",
      resourcePerson: "RD's Office",
      mode: "On-site",
      status: "Completed"
    },
    {
      id: "4",
      name: "ILCDB Data Management Training",
      project: "ILCDB",
      date: "2025-11-20",
      timeStart: "09:00",
      timeEnd: "16:00",
      targetSector: ["LGU"],
      province: "Davao De Oro",
      district: "1st District",
      barangay: "Poblacion",
      partnerInstitution: "Provincial ICT Office",
      resourcePerson: "ILCDB Team",
      mode: "Online",
      status: "Upcoming"
    },
    {
      id: "5",
      name: "Digital Literacy Program for Senior Citizens",
      project: "ILCDB SPARK",
      date: "2025-11-05",
      timeStart: "14:00",
      timeEnd: "16:00",
      targetSector: ["Senior Citizen"],
      province: "Davao Oriental",
      district: "2nd District",
      barangay: "San Isidro",
      partnerInstitution: "Municipal Social Welfare",
      resourcePerson: "Community Relations",
      mode: "On-site",
      status: "Upcoming"
    },
    {
      id: "6",
      name: "Tech Training for Indigenous People",
      project: "ILCDB SPARK",
      date: "2025-11-10",
      timeStart: "09:00",
      timeEnd: "15:00",
      targetSector: ["Indigenous People"],
      province: "Davao Occidental",
      district: "1st District",
      barangay: "Kiblat",
      partnerInstitution: "NCIP Regional Office",
      resourcePerson: "Outreach Team",
      mode: "On-site",
      status: "Upcoming"
    },
    {
      id: "7",
      name: "PNPKI System Integration Workshop",
      project: "PNPKI",
      date: "2025-10-28",
      timeStart: "10:00",
      timeEnd: "15:00",
      targetSector: ["NGA"],
      province: "Davao Del Sur",
      district: "2nd District",
      barangay: "Matina",
      partnerInstitution: "Regional Government Center",
      resourcePerson: "Security Team",
      mode: "Hybrid",
      status: "Ongoing"
    },
    {
      id: "8",
      name: "Women in Tech Summit",
      project: "Provincial Activity",
      date: "2025-11-25",
      timeStart: "08:00",
      timeEnd: "17:00",
      targetSector: ["Women", "Students"],
      province: "Davao Del Norte",
      district: "1st District",
      barangay: "Sto. Tomas",
      partnerInstitution: "Women's Federation",
      resourcePerson: "Gender and Development Unit",
      mode: "On-site",
      status: "Upcoming"
    },
  ];

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.barangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.partnerInstitution.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvince = selectedProvince === "all" || activity.province === selectedProvince;
    const matchesProject = selectedProject === "all" || activity.project === selectedProject;
    const matchesStatus = selectedStatus === "all" || activity.status === selectedStatus;
    
    return matchesSearch && matchesProvince && matchesProject && matchesStatus;
  });

  // Group activities by province
  const activitiesByProvince = provinces.reduce((acc, province) => {
    acc[province] = filteredActivities.filter(activity => activity.province === province);
    return acc;
  }, {} as Record<string, Activity[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Ongoing":
        return "bg-blue-100 text-blue-700";
      case "Upcoming":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-4 border-b-2 border-blue-200">
        <MapPin className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-blue-900">Activities Per Province</h2>
          <p className="text-gray-600">Browse and filter activities across all provinces in Region 11</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-blue-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Province</label>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchQuery || selectedProvince !== "all" || selectedProject !== "all" || selectedStatus !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing {filteredActivities.length} of {activities.length} activities
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedProvince("all");
                  setSelectedProject("all");
                  setSelectedStatus("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Provinces */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          {provinces.map((province) => (
            <TabsTrigger key={province} value={province} className="text-xs md:text-sm">
              {province}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-6">
            {provinces.map((province) => {
              const provinceActivities = activitiesByProvince[province];
              if (provinceActivities.length === 0) return null;

              return (
                <div key={province}>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-blue-900">{province}</h3>
                    <Badge variant="secondary">{provinceActivities.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {provinceActivities.map((activity) => (
                      <Card key={activity.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-gray-900">{activity.name}</CardTitle>
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{activity.project}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {new Date(activity.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                              {" • "}
                              {activity.timeStart} - {activity.timeEnd}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {activity.barangay}, {activity.district}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {activity.targetSector.map((sector) => (
                                <Badge key={sector} variant="outline" className="text-xs">
                                  {sector}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="pt-2 border-t text-sm text-gray-600">
                            <p>Partner: {activity.partnerInstitution}</p>
                            <p>Resource Person: {activity.resourcePerson}</p>
                            <p>Mode: {activity.mode}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {provinces.map((province) => (
          <TabsContent key={province} value={province}>
            {activitiesByProvince[province].length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No activities found for {province}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activitiesByProvince[province].map((activity) => (
                  <Card key={activity.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-gray-900">{activity.name}</CardTitle>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{activity.project}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(activity.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                          {" • "}
                          {activity.timeStart} - {activity.timeEnd}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {activity.barangay}, {activity.district}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {activity.targetSector.map((sector) => (
                            <Badge key={sector} variant="outline" className="text-xs">
                              {sector}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t text-sm text-gray-600">
                        <p>Partner: {activity.partnerInstitution}</p>
                        <p>Resource Person: {activity.resourcePerson}</p>
                        <p>Mode: {activity.mode}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {filteredActivities.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No activities found matching your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
