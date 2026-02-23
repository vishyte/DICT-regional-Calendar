import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

interface ProjectAdmin {
  projectName: string;
  adminName: string;
  adminEmail: string;
  assignedDate: string;
  status: "active" | "inactive";
}

const PROJECTS = [
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

const ADMINS = [
  { id: 1, name: "John Doe", email: "john@dict.gov.ph" },
  { id: 2, name: "Jane Smith", email: "jane@dict.gov.ph" },
  { id: 3, name: "Mark Johnson", email: "mark@dict.gov.ph" },
  { id: 4, name: "Sarah Williams", email: "sarah@dict.gov.ph" }
];

export function AdminAssignment() {
  const [assignments, setAssignments] = useState<ProjectAdmin[]>([
    {
      projectName: "IIDB",
      adminName: "John Doe",
      adminEmail: "john@dict.gov.ph",
      assignedDate: "2025-01-15",
      status: "active"
    },
    {
      projectName: "Free Wi-Fi for All",
      adminName: "Jane Smith",
      adminEmail: "jane@dict.gov.ph",
      assignedDate: "2025-01-20",
      status: "active"
    }
  ]);

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");

  const handleAssignAdmin = () => {
    if (!selectedProject || !selectedAdmin) {
      alert("Please select both project and admin");
      return;
    }

    const admin = ADMINS.find(a => a.id.toString() === selectedAdmin);
    const existingAssignment = assignments.find(a => a.projectName === selectedProject);

    if (existingAssignment) {
      setAssignments(
        assignments.map(a =>
          a.projectName === selectedProject
            ? {
                ...a,
                adminName: admin?.name || "",
                adminEmail: admin?.email || "",
                assignedDate: new Date().toISOString().split('T')[0],
                status: "active"
              }
            : a
        )
      );
    } else {
      setAssignments([
        ...assignments,
        {
          projectName: selectedProject,
          adminName: admin?.name || "",
          adminEmail: admin?.email || "",
          assignedDate: new Date().toISOString().split('T')[0],
          status: "active"
        }
      ]);
    }

    setSelectedProject("");
    setSelectedAdmin("");
  };

  const handleRemoveAssignment = (projectName: string) => {
    if (confirm(`Remove admin from ${projectName}?`)) {
      setAssignments(assignments.filter(a => a.projectName !== projectName));
    }
  };

  const unassignedProjects = PROJECTS.filter(p => !assignments.find(a => a.projectName === p));

  return (
    <div className="space-y-6 p-6">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Assign project administrators to manage specific projects and their activities
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Assign New Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose project..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedProjects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Admin</label>
              <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose admin..." />
                </SelectTrigger>
                <SelectContent>
                  {ADMINS.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id.toString()}>
                      {admin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleAssignAdmin} className="w-full">
                Assign Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Admin Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Admin Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-600">
                      No admin assignments yet
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.projectName}>
                      <TableCell className="font-medium">{assignment.projectName}</TableCell>
                      <TableCell>{assignment.adminName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{assignment.adminEmail}</TableCell>
                      <TableCell className="text-sm">{assignment.assignedDate}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveAssignment(assignment.projectName)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
