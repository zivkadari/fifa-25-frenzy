import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Users, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { RemoteStorageService } from "@/services/remoteStorageService";
import { useToast } from "@/hooks/use-toast";

const JoinTournament = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'checking' | 'joining' | 'error' | 'redirect-auth'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setErrorMessage('קוד הצטרפות חסר');
      return;
    }

    const checkAuthAndJoin = async () => {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Not logged in - redirect to auth with return URL
        setStatus('redirect-auth');
        setTimeout(() => {
          navigate(`/auth?redirect=/join/${code}`);
        }, 1500);
        return;
      }

      // User is logged in - attempt to join
      setStatus('joining');
      try {
        const eveningId = await RemoteStorageService.joinEveningByCode(code);
        if (eveningId) {
          toast({
            title: "הצטרפת בהצלחה!",
            description: "מעביר אותך לטורניר...",
          });
          // Navigate to home with state indicating we should open this tournament
          navigate('/', { state: { joinedEveningId: eveningId } });
        } else {
          setStatus('error');
          setErrorMessage('קוד לא תקין או שהטורניר לא נמצא');
        }
      } catch (error: any) {
        setStatus('error');
        if (error?.message?.includes('rate limit')) {
          setErrorMessage('יותר מדי ניסיונות הצטרפות. נסה שוב מאוחר יותר.');
        } else {
          setErrorMessage('שגיאה בהצטרפות לטורניר');
        }
      }
    };

    checkAuthAndJoin();
  }, [code, navigate, toast]);

  return (
    <div className="min-h-screen bg-gaming-bg flex items-center justify-center p-4">
      <Card className="bg-gradient-card border-neon-green/20 p-8 max-w-md w-full text-center">
        {status === 'checking' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-neon-green mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">בודק פרטי הצטרפות...</h2>
          </>
        )}

        {status === 'joining' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-neon-green mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">מצטרף לטורניר...</h2>
            <p className="text-muted-foreground">קוד: {code}</p>
          </>
        )}

        {status === 'redirect-auth' && (
          <>
            <Users className="h-12 w-12 text-neon-green mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">נדרשת התחברות</h2>
            <p className="text-muted-foreground mb-4">מעביר אותך לדף ההתחברות...</p>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">שגיאה</h2>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <div className="space-y-2">
              <Button variant="gaming" onClick={() => navigate('/')} className="w-full">
                חזור לדף הבית
              </Button>
              {code && (
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setStatus('checking');
                    setErrorMessage('');
                    window.location.reload();
                  }}
                  className="w-full"
                >
                  נסה שוב
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default JoinTournament;
