import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, Edit, Trash2, Search } from "lucide-react";

interface SystemUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  project: string;
  role: "superadmin" | "admin" | "user";
  createdAt: string;
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

export function UserManagement() {
  const [users, setUsers] = useState<SystemUser[]>([
    {
      id: 1,
      username: "superadmin",
      fullName: "System Administrator",
      email: "admin@dict.gov.ph",
      project: "System",
      role: "superadmin",
      createdAt: "2025-01-01",
      status: "active"
    },
    {
      id: 2,
      username: "john_doe",
      fullName: "John Doe",
      email: "john@dict.gov.ph",
      project: "IIDB",
      role: "admin",
      createdAt: "2025-01-15",
      status: "active"
    }
  ]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState({ username: "", fullName: "", email: "", project: "", role: "user", password: "" });

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ username: "", fullName: "", email: "", project: "", role: "user", password: "" });
    setOpenDialog(true);
  };

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      project: user.project,
      role: user.role,
      password: ""
    });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (editingUser) {
      const updatedRole = formData.role as "superadmin" | "admin" | "user";
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData, role: updatedRole } : u));
    } else {
      const newRole = formData.role as "superadmin" | "admin" | "user";
      setUsers([...users, {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        ...formData,
        role: newRole,
        createdAt: new Date().toISOString().split('T')[0],
        status: "active"
      } as SystemUser]);
    }
    setOpenDialog(false);
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleAddUser} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Update user information" : "Create a new system user"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Username *</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Username"
                />
              </div>
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                />
              </div>
              <div>
                <Label>Temporary Password *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter temporary password"
                />
                <p className="text-xs text-gray-500 mt-1">User will be required to change this password on first login</p>
              </div>
              <div>
                <Label>Project *</Label>
                <Select value={formData.project} onValueChange={(value) => setFormData({ ...formData, project: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECTS.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Project Admin</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.fullName}</TableCell>
                <TableCell className="text-sm">{user.email}</TableCell>
                <TableCell>{user.project}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "superadmin" ? "default" : user.role === "admin" ? "secondary" : "outline"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === "active" ? "default" : "outline"}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{user.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
