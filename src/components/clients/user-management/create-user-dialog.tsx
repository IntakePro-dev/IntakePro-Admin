"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useCreateClientUser } from "@/hooks/use-admin-client";
import { toast } from "sonner";
import type { UserRole } from "@/lib/types/client";

interface CreateUserDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ clientId, open, onOpenChange }: CreateUserDialogProps) {
  const createUser = useCreateClientUser(clientId);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CLIENT_VIEWER");
  const [enableViewerSignup, setEnableViewerSignup] = useState(false);
  const [allowedSignupDomains, setAllowedSignupDomains] = useState("");

  function resetForm() {
    setEmail("");
    setName("");
    setPassword("");
    setRole("CLIENT_VIEWER");
    setEnableViewerSignup(false);
    setAllowedSignupDomains("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await createUser.mutateAsync({
        email,
        name: name || undefined,
        password,
        role,
        enableViewerSignup: role === "CLIENT_ADMIN" ? enableViewerSignup : undefined,
        allowedSignupDomains: role === "CLIENT_ADMIN" && enableViewerSignup ? allowedSignupDomains : undefined,
      });
      toast.success("User created successfully");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Initial Password *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLIENT_VIEWER">Viewer</SelectItem>
                <SelectItem value="CLIENT_ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "CLIENT_ADMIN" && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="enableViewerSignup">Enable viewer self-signup</Label>
                <Switch
                  id="enableViewerSignup"
                  checked={enableViewerSignup}
                  onCheckedChange={setEnableViewerSignup}
                />
              </div>

              {enableViewerSignup && (
                <div className="space-y-2">
                  <Label htmlFor="allowedSignupDomains">Allowed signup domains</Label>
                  <Input
                    id="allowedSignupDomains"
                    value={allowedSignupDomains}
                    onChange={(e) => setAllowedSignupDomains(e.target.value)}
                    placeholder="acme.com, example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of allowed email domains
                  </p>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
