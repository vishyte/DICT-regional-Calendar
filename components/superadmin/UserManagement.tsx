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
import { usersAPI } from "../../utils/api";
import { toast } from "sonner";

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

// Local fallback shape matches AuthContext's local user store
interface LocalUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  project: string;
  role?: "superadmin" | "admin" | "user";
}

function getLocalUsersAsSystemUsers(): SystemUser[] {
  try {
    const stored = localStorage.getItem("local_users");
    if (!stored) return [];
    const localUsers: LocalUser[] = JSON.parse(stored);

    return localUsers.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: `${u.first_name} ${u.middle_name ? u.middle_name + " " : ""}${u.last_name}`,
      email: u.email,
      project: u.project,
      role: (u as any).role || "user",
      createdAt: "Local only",
      status: "active",
    }));
  } catch (e) {
    console.error("Failed to load local users for superadmin view:", e);
    return [];
  }
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
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState({ username: "", fullName: "", email: "", project: "", role: "user", password: "" });
  const [saving, setSaving] = useState(false);

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data);
      // If there are any locally-saved users (offline changes), try syncing them now
      try {
        await syncLocalUsers(response.data);
      } catch (e) {
        console.warn('Local sync failed:', e);
      }
      if (response.data.length === 0) {
        toast.info('No users found in the database.');
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to connect to server';
      const statusCode = error.response?.status;
      
      // If backend is not available, show helpful message
      if (error.code === 'ERR_NETWORK' || error.message?.includes('fetch') || error.message?.includes('Network')) {
        toast.error('Cannot connect to backend server. Please make sure the backend is running on port 3001. Start it with: cd backend && npm run dev');
      } else if (statusCode === 401 || statusCode === 403) {
        toast.error('Authentication failed. Please log in again as superadmin.');
      } else {
        toast.error(`Failed to load users: ${errorMessage} (Status: ${statusCode || 'N/A'})`);
      }
      
      // Fallback: show any locally registered accounts so superadmin still sees all known users
      const localUsers = getLocalUsersAsSystemUsers();
      if (localUsers.length > 0) {
        toast.info(`Showing ${localUsers.length} locally-registered user(s) while backend is unavailable.`);
        setUsers(localUsers);
      } else {
        // Set empty array so UI doesn't break
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sync any locally-stored users (from `local_users`) to the backend when it becomes available.
  const syncLocalUsers = async (serverUsers: SystemUser[]) => {
    try {
      const stored = localStorage.getItem('local_users');
      if (!stored) return;
      const localUsers: any[] = JSON.parse(stored);
      if (!Array.isArray(localUsers) || localUsers.length === 0) return;

      let changed = false;

      // Iterate backwards so we can remove synced entries
      for (let i = localUsers.length - 1; i >= 0; i--) {
        const lu = localUsers[i];
        const match = serverUsers.find((s) => s.username === lu.username || s.email === lu.email);
        const fullName = `${lu.first_name || ''} ${lu.last_name || ''}`.trim() || lu.username;

        try {
          if (match) {
            // Update existing server user if role differs
            if (lu.role && lu.role !== match.role) {
              await usersAPI.update(match.id, { role: lu.role });
            }
            // Remove locally-synced copy
            localUsers.splice(i, 1);
            changed = true;
          } else {
            // Create on server with a temporary password
            const tempPassword = Math.random().toString(36).slice(-8);
            await usersAPI.create({
              username: lu.username,
              fullName,
              email: lu.email,
              project: lu.project || 'Unknown',
              password: tempPassword,
              role: lu.role || 'user'
            });
            localUsers.splice(i, 1);
            changed = true;
          }
        } catch (err) {
          console.warn('Failed to sync local user', lu.username, err);
          // leave user in local store to retry later
        }
      }

      if (changed) {
        localStorage.setItem('local_users', JSON.stringify(localUsers));
        // Refresh server users list after syncing
        const refreshed = await usersAPI.getAll();
        setUsers(refreshed.data);
        toast.success('Local users synchronized to server');
      }
    } catch (err) {
      console.warn('syncLocalUsers error:', err);
    }
  };

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

  const handleSave = async () => {
    // Validate required fields
    if (!formData.username || !formData.fullName || !formData.email || !formData.project) {
      toast.error('Please fill in all required fields');
      return;
    }

    // For new users, password is required
    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    try {
      setSaving(true);
      
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          project: formData.project,
          role: formData.role
        };
        
        // Only include password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        const updated = await usersAPI.update(editingUser.id, updateData);
        // Optimistically update local UI so role changes reflect immediately
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, username: updateData.username || u.username, fullName: updateData.fullName || u.fullName, email: updateData.email || u.email, project: updateData.project || u.project, role: updateData.role || u.role } : u)));
        toast.success('User updated successfully');
      } else {
        // Create new user
        const created = await usersAPI.create({
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          project: formData.project,
          password: formData.password,
          role: formData.role
        });
        // Add newly created user to local UI immediately
        if (created?.data) {
          setUsers((prev) => [created.data, ...prev]);
        }
        toast.success('User created successfully');
      }

      // Refresh users list
      await fetchUsers();
      setOpenDialog(false);
      setFormData({ username: "", fullName: "", email: "", project: "", role: "user", password: "" });
    } catch (error: any) {
      console.error('Failed to save user:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save user. Please try again.';
      // If backend is unreachable, fall back to localStorage so superadmin can manage local users
      const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || String(error.message).toLowerCase().includes('network');
      if (isNetworkError) {
        try {
          const stored = localStorage.getItem('local_users');
          const localUsers: any[] = stored ? JSON.parse(stored) : [];

          if (editingUser) {
            // Update existing local user if present
            const idx = localUsers.findIndex((u) => u.id === editingUser.id);
            const nameParts = formData.fullName.trim().split(/\s+/);
            const last_name = nameParts.length > 1 ? nameParts.pop() as string : '';
            const first_name = nameParts.join(' ');

            if (idx >= 0) {
              localUsers[idx] = {
                ...localUsers[idx],
                username: formData.username,
                email: formData.email,
                project: formData.project,
                first_name,
                last_name,
                role: formData.role,
              };
            } else {
              // Not found locally, create a local copy with same id
              localUsers.push({
                id: editingUser.id,
                username: formData.username,
                email: formData.email,
                project: formData.project,
                first_name,
                last_name,
                role: formData.role,
              });
            }

            localStorage.setItem('local_users', JSON.stringify(localUsers));
            toast.success('User updated locally (offline)');
          } else {
            // Create new local user
            const nameParts = formData.fullName.trim().split(/\s+/);
            const last_name = nameParts.length > 1 ? nameParts.pop() as string : '';
            const first_name = nameParts.join(' ');
            const nextId = localUsers.length ? Math.max(...localUsers.map((u) => u.id)) + 1 : 1;
            localUsers.push({
              id: nextId,
              username: formData.username,
              email: formData.email,
              project: formData.project,
              first_name,
              last_name,
              role: formData.role,
            });
            localStorage.setItem('local_users', JSON.stringify(localUsers));
            toast.success('User created locally (offline)');
          }

          // Refresh from local store
          await fetchUsers();
          setOpenDialog(false);
          setFormData({ username: '', fullName: '', email: '', project: '', role: 'user', password: '' });
        } catch (e) {
          console.error('Failed to update local users store:', e);
          toast.error(errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      await usersAPI.delete(id);
      toast.success('User deleted successfully');
      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete user. Please try again.';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

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
              {!editingUser && (
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
              )}
              {editingUser && (
                <div>
                  <Label>New Password (leave blank to keep current)</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter new password (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank to keep the current password</p>
                </div>
              )}
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
              <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
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
