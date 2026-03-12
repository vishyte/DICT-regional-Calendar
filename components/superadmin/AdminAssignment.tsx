import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AlertCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { toast } from "sonner";
import { usersAPI } from "../../utils/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

type ProjectAdminRole = "admin" | "provincial_officer";

interface ProjectAdmin {
  projectName: string;
  adminName: string;
  adminEmail: string;
  assignedDate: string;
  status: "active" | "inactive";
  role: ProjectAdminRole;
}

const ROLE_OPTIONS: Array<{ value: ProjectAdminRole; label: string }> = [
  { value: "admin", label: "Project Admin" },
  { value: "provincial_officer", label: "Provincial Officer" },
];

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

// Get registered users from localStorage
function getRegisteredAdmins() {
  try {
    const usersJson = localStorage.getItem('local_users');
    if (usersJson) {
      const users = JSON.parse(usersJson);
      return users.map((user: any, index: number) => ({
        id: user.id || index + 1,
        name: `${user.first_name}${user.middle_name ? ' ' + user.middle_name : ''} ${user.last_name}`,
        email: user.email
      }));
    }
  } catch (e) {
    console.error('Failed to load registered users:', e);
  }
  return [];
}

const STORAGE_KEY = 'project_admin_assignments';

// Load assignments from localStorage
function loadAssignments(): ProjectAdmin[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load assignments from localStorage:', e);
  }
  // Return empty array - no default assignments
  return [];
}

// Save assignments to localStorage
function saveAssignments(assignments: ProjectAdmin[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch (e) {
    console.error('Failed to save assignments to localStorage:', e);
    toast.error('Failed to save assignment. Please try again.');
  }
}

export function AdminAssignment() {
  const [assignments, setAssignments] = useState<ProjectAdmin[]>([]);
  const [admins, setAdmins] = useState<Array<{ id: number; name: string; email: string }>>([]);

  // Load assignments and registered users on mount
  useEffect(() => {
    // Load assignments from backend first, fall back to localStorage
    (async () => {
      try {
        const resp = await usersAPI.getAll();
        const serverUsers = resp.data || [];
        const mapped = serverUsers.map((u: any) => ({
          id: u.id,
          name: u.fullName || u.username,
          email: u.email || ''
        }));
        setAdmins(mapped);

        // Build assignments from server users with admin or provincial officer role
        const adminAssignments = serverUsers
          .filter((u: any) => u.role === "admin" || u.role === "provincial_officer")
          .map((u: any) => ({
            projectName: u.project || "Unassigned",
            adminName: u.fullName || u.username,
            adminEmail: u.email || '',
            assignedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: "active" as const,
            role: u.role || "admin"
          }));

        setAssignments(adminAssignments);
        saveAssignments(adminAssignments);
      } catch (err) {
        console.error('Failed to load users from backend:', err);
        // Fallback to localStorage
        const registeredAdmins = getRegisteredAdmins();
        setAdmins(registeredAdmins);
        const loadedAssignments = loadAssignments();
        setAssignments(loadedAssignments);
      }
    })();
  }, []);

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<ProjectAdminRole>("admin");

  const handleAssignAdmin = async () => {
    const needsProject = selectedRole === "admin";
    if ((needsProject && !selectedProject) || !selectedAdmin) {
      toast.error("Please select both project and admin");
      return;
    }

    const admin = admins.find((a) => a.id.toString() === selectedAdmin);
    if (!admin) {
      toast.error("Admin not found");
      return;
    }

    try {
      // Update user role in backend; only send project when assigning a Project Admin
      const updatePayload: any = { role: selectedRole };
      if (selectedRole === "admin") {
        updatePayload.project = selectedProject;
      }
      await usersAPI.update(parseInt(selectedAdmin), updatePayload);

      const projectName = selectedRole === "admin" ? selectedProject : "—";
      const existingAssignment = assignments.find(
        (a) => a.adminEmail === admin.email && a.role === selectedRole
      );
      let newAssignments: ProjectAdmin[];

      if (existingAssignment) {
        newAssignments = assignments.map((a) =>
          a.adminEmail === admin.email && a.role === selectedRole
            ? {
                ...a,
                projectName,
                adminName: admin.name,
                assignedDate: new Date().toISOString().split('T')[0],
                status: "active"
              }
            : a
        );
      } else {
        newAssignments = [
          ...assignments,
          {
            projectName,
            adminName: admin.name,
            adminEmail: admin.email,
            assignedDate: new Date().toISOString().split('T')[0],
            status: "active",
            role: selectedRole
          }
        ];
      }

      setAssignments(newAssignments);
      saveAssignments(newAssignments);
      setSelectedProject("");
      setSelectedAdmin("");
      toast.success(
        `${admin.name} assigned as ${selectedRole === "admin" ? "Project Admin" : "Provincial Officer"}`
      );
    } catch (error) {
      console.error("Failed to assign admin:", error);
      toast.error("Failed to assign admin. Please ensure the user exists and try again.");
    }
  };

  const handleRemoveAssignment = async (adminEmail: string, role: ProjectAdminRole) => {
    const assignment = assignments.find((a) => a.adminEmail === adminEmail && a.role === role);
    if (!assignment) return;

    try {
      // Find the admin by email and revert their role to user
      const adminUser = admins.find(a => a.email === assignment.adminEmail);
      if (adminUser) {
        await usersAPI.update(adminUser.id, { role: "user" });
      }

      const newAssignments = assignments.filter(
        (a) => !(a.adminEmail === adminEmail && a.role === role)
      );
      setAssignments(newAssignments);
      saveAssignments(newAssignments);
      toast.success(
        `Admin ${assignment.adminName} removed from ${assignment.role === "admin" ? assignment.projectName : "Provincial Officer"}`
      );
    } catch (error) {
      console.error("Failed to remove assignment:", error);
      toast.error("Failed to remove admin assignment. Please try again.");
    }
  };

  // Allow re-using projects for different roles (e.g., Project Admin + Provincial Officer)
  const availableProjects = PROJECTS;

  return (
    <div className="space-y-6 p-6">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
            Assign project administrators or provincial officers to manage specific projects and their activities
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Assign New Admin / Provincial Officer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedRole === "admin" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Assign As</label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as ProjectAdminRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                  {admins.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      No registered users found
                    </div>
                  ) : (
                    admins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id.toString()}>
                        {admin.name}
                      </SelectItem>
                    ))
                  )}
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
                <TableHead>Role</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-600">
                      No admin assignments yet
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={`${assignment.adminEmail}-${assignment.role}`}>
                      <TableCell className="font-medium">{assignment.projectName}</TableCell>
                      <TableCell>{assignment.adminName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{assignment.adminEmail}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-xs">
                          {assignment.role === "provincial_officer" ? "Provincial Officer" : "Project Admin"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{assignment.assignedDate}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove {assignment.role === "provincial_officer" ? "Provincial Officer" : "Project Admin"}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove <strong>{assignment.adminName}</strong>
                                {assignment.role === "provincial_officer" ? " as Provincial Officer" : ` from ${assignment.projectName}`}?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRemoveAssignment(assignment.adminEmail, assignment.role)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove Admin
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
