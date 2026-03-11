"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, ArrowLeft, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientOverview } from "@/components/clients/client-overview";
import { ClientSettingsModal } from "@/components/clients/client-settings-modal";
import { CreateUserDialog } from "@/components/clients/user-management/create-user-dialog";
import { EditRoleDialog } from "@/components/clients/user-management/edit-role-dialog";
import { useAdminClient, useDeleteClientUser } from "@/hooks/use-admin-client";
import { toast } from "sonner";
import type { ClientUser, ClientStatus } from "@/lib/types/client";

function getStatusBadgeClass(status: ClientStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "TRIAL":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "SUSPENDED":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    default:
      return "";
  }
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const { data: client, isLoading, error } = useAdminClient(clientId);
  const deleteUser = useDeleteClientUser(clientId);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState<ClientUser | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<ClientUser | null>(null);

  async function handleDeleteUser() {
    if (!deleteUserTarget) return;

    try {
      await deleteUser.mutateAsync(deleteUserTarget.id);
      toast.success("User deleted");
      setDeleteUserTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground mb-4">
          {error?.message || "Client not found"}
        </p>
        <Button variant="outline" onClick={() => router.push("/clients")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarFallback
              className="text-xl font-medium"
              style={{
                backgroundColor: client.brandColor || `hsl(${client.name.charCodeAt(0) * 10}, 70%, 50%)`,
                color: "white",
              }}
            >
              {client.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <Badge className={getStatusBadgeClass(client.status)}>
              {client.status}
            </Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => setSettingsOpen(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Client Settings
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations" asChild>
            <Link href={`/clients/${clientId}/integrations`}>Client Configuration</Link>
          </TabsTrigger>
          <TabsTrigger value="report-template" asChild>
            <Link href={`/clients/${clientId}/report-template`}>Report Template</Link>
          </TabsTrigger>
          <TabsTrigger value="billing" asChild>
            <Link href={`/clients/${clientId}/billing`}>Billing & Usage</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ClientOverview
            client={client}
            onCreateUser={() => setCreateUserOpen(true)}
            onEditUserRole={(user) => setEditRoleUser(user)}
            onDeleteUser={(user) => setDeleteUserTarget(user)}
          />
        </TabsContent>
      </Tabs>

      <ClientSettingsModal
        client={client}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <CreateUserDialog
        clientId={clientId}
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
      />

      <EditRoleDialog
        clientId={clientId}
        user={editRoleUser}
        open={!!editRoleUser}
        onOpenChange={(open) => !open && setEditRoleUser(null)}
      />

      <AlertDialog open={!!deleteUserTarget} onOpenChange={(open) => !open && setDeleteUserTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteUserTarget?.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
