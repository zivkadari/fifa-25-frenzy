import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Utility to aggressively clean local auth state and prevent limbo
const cleanupAuthState = () => {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("supabase.auth") || key.includes("sb-")) localStorage.removeItem(key);
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith("supabase.auth") || key.includes("sb-")) sessionStorage.removeItem(key);
    });
  } catch {}
};

const Auth = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
      // Defer any follow-up fetches if needed
      if (session?.user) {
        setTimeout(() => {}, 0);
      }
    });
    supabase.auth.getSession().then(({ data }) => setIsAuthed(!!data.session?.user));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: "global" }); } catch {}

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/";
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast({ title: "נרשמת בהצלחה", description: "בדוק את האימייל לאישור, ואז התחבר." });
      }
    } catch (err: any) {
      toast({ title: "שגיאת התחברות", description: err?.message || "נסה שוב", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: "global" }); } catch {}
    } finally {
      window.location.href = "/auth";
    }
  };

  return (
    <div className="min-h-screen bg-gaming-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gradient-card border-neon-green/20 p-8 shadow-card">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">חשבון</h1>

          {isAuthed ? (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">את/ה מחובר/ת. אפשר להתחיל ולשמור היסטוריה בענן.</p>
              <Button variant="secondary" onClick={() => (window.location.href = "/")}>חזרה לדף הראשי</Button>
              <Button variant="destructive" onClick={handleSignOut}>התנתקות</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {mode === "signin" ? "התחברות" : "הרשמה"}
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >{mode === "signin" ? "אין חשבון? להרשמה" : "כבר יש חשבון? להתחברות"}</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;
