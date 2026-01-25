import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, Plus, Loader2 } from "lucide-react";
import { RemoteStorageService } from "@/services/remoteStorageService";

interface LinkToTeamDialogProps {
  eveningId: string;
  currentTeamId?: string;
  currentTeamName?: string;
  onLinked: () => void;
  trigger?: React.ReactNode;
}

export const LinkToTeamDialog = ({
  eveningId,
  currentTeamId,
  currentTeamName,
  onLinked,
  trigger,
}: LinkToTeamDialogProps) => {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(currentTeamId || "");
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadTeams();
    }
  }, [open]);

  const loadTeams = async () => {
    const list = await RemoteStorageService.listTeams();
    setTeams(list);
    if (currentTeamId) {
      setSelectedTeamId(currentTeamId);
    }
  };

  const handleLink = async () => {
    if (!selectedTeamId) return;
    setLoading(true);
    const success = await RemoteStorageService.linkEveningToTeam(eveningId, selectedTeamId);
    setLoading(false);
    if (success) {
      setOpen(false);
      onLinked();
    }
  };

  const handleCreateAndLink = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const team = await RemoteStorageService.createTeam(newTeamName.trim());
      if (team) {
        const success = await RemoteStorageService.linkEveningToTeam(eveningId, team.id);
        if (success) {
          setOpen(false);
          onLinked();
        }
      }
    } catch (error) {
      console.error("Error creating team:", error);
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-neon-green"
          >
            <Link2 className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gaming-surface border-border">
        <DialogHeader>
          <DialogTitle>שיוך טורניר לקבוצה</DialogTitle>
          <DialogDescription>
            {currentTeamName 
              ? `הטורניר משויך כרגע ל: ${currentTeamName}. ניתן לשנות את השיוך.`
              : "בחר קבוצה קיימת או צור קבוצה חדשה לשיוך הטורניר."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Existing teams */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">בחר קבוצה קיימת:</label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-full bg-gaming-bg border-border">
                <SelectValue placeholder="בחר קבוצה..." />
              </SelectTrigger>
              <SelectContent className="bg-gaming-surface border-border">
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gaming-surface px-2 text-muted-foreground">או</span>
            </div>
          </div>

          {/* Create new team */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">צור קבוצה חדשה:</label>
            <div className="flex gap-2">
              <Input
                placeholder="שם הקבוצה החדשה"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="flex-1 bg-gaming-bg border-border"
              />
              <Button
                variant="outline"
                onClick={handleCreateAndLink}
                disabled={!newTeamName.trim() || creating}
                className="shrink-0"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    צור ושייך
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button
            variant="gaming"
            onClick={handleLink}
            disabled={!selectedTeamId || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "שייך לקבוצה"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
