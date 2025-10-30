import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, CalendarPlus, BarChart3, Users, MapPin, FileText, Clock, TrendingUp } from "lucide-react";

interface HomePageProps {
  onNavigateToActivity: () => void;
  onNavigateToProvinces: () => void;
  onNavigateToRecords: () => void;
  participantsThisMonth?: number;
  participantsThisYear?: number;
  totalActivities?: number;
  activitiesThisMonth?: number;
}

export function HomePage({ 
  onNavigateToActivity, 
  onNavigateToProvinces, 
  onNavigateToRecords,
  participantsThisMonth = 0,
  participantsThisYear = 0,
  totalActivities = 0,
  activitiesThisMonth = 0
}: HomePageProps) {
  const quickStats = [
    { label: "Total Activities", value: totalActivities.toString(), icon: Calendar, color: "bg-blue-500" },
    { label: "This Month", value: activitiesThisMonth.toString(), icon: Clock, color: "bg-green-500" },
    { label: "Participants (This Month)", value: participantsThisMonth.toLocaleString(), icon: Users, color: "bg-purple-500" },
    { label: "Participants (This Year)", value: participantsThisYear.toLocaleString(), icon: TrendingUp, color: "bg-orange-500" },
  ];

  const quickActions = [
    {
      title: "Create New Activity",
      description: "Register a new activity or event",
      icon: CalendarPlus,
      color: "from-blue-500 to-blue-600",
      action: onNavigateToActivity,
    },
    {
      title: "Activities Per Province",
      description: "Browse activities by province",
      icon: MapPin,
      color: "from-indigo-500 to-indigo-600",
      action: onNavigateToProvinces,
    },
    {
      title: "Reports & Analytics",
      description: "View activity reports and statistics",
      icon: BarChart3,
      color: "from-purple-500 to-purple-600",
      action: () => console.log("Reports"),
    },
    {
      title: "Activity Records",
      description: "Browse and manage past activities",
      icon: FileText,
      color: "from-green-500 to-green-600",
      action: onNavigateToRecords,
    },
  ];

  const recentActivities = [
    {
      name: "Free Wi-Fi Installation Training",
      date: "Oct 28, 2025",
      location: "Davao City",
      sector: "LGU",
      status: "Upcoming",
    },
    {
      name: "Cybersecurity Awareness Seminar",
      date: "Oct 25, 2025",
      location: "Davao Del Norte",
      sector: "Teachers",
      status: "Completed",
    },
    {
      name: "eGOV Implementation Workshop",
      date: "Oct 22, 2025",
      location: "Davao Del Sur",
      sector: "NGA",
      status: "Completed",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h2 className="text-blue-900">Welcome to DICT Region 11</h2>
        <p className="text-gray-600">Activity Management System Dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-blue-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group overflow-hidden"
              onClick={action.action}
            >
              <div className={`h-2 bg-gradient-to-r ${action.color}`} />
              <CardHeader>
                <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-gray-900">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-blue-900">Recent Activities</h3>
          <Button variant="link" className="text-blue-600">
            View All <TrendingUp className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-700">Activity Name</th>
                    <th className="px-6 py-4 text-left text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-gray-700">Location</th>
                    <th className="px-6 py-4 text-left text-gray-700">Target Sector</th>
                    <th className="px-6 py-4 text-left text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentActivities.map((activity, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900">{activity.name}</td>
                      <td className="px-6 py-4 text-gray-600">{activity.date}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {activity.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {activity.sector}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            activity.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="text-white mb-2">Ready to Create a New Activity?</h3>
          <p className="mb-6 text-blue-100">Start planning and scheduling your next DICT Region 11 activity</p>
          <Button
            size="lg"
            variant="secondary"
            onClick={onNavigateToActivity}
            className="gap-2"
          >
            <CalendarPlus className="h-5 w-5" />
            Create New Activity
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
