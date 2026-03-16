import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Check, X, AlertTriangle, Trash2, Square } from 'lucide-react';
import { Pair, Club } from '@/types/tournament';
import { parseVoiceResults, VoiceResultCandidate } from '@/lib/voiceResultParser';
import { useToast } from '@/hooks/use-toast';

interface VoiceResultEntryProps {
  currentPairs: Pair[];
  availableClubs: Club[];
  allClubs: Club[];
  onApplyResults: (results: VoiceResultCandidate[]) => void;
  disabled?: boolean;
}

function isSpeechRecognitionSupported(): boolean {
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

export function VoiceResultEntry({
  currentPairs,
  availableClubs,
  allClubs,
  onApplyResults,
  disabled = false,
}: VoiceResultEntryProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [candidates, setCandidates] = useState<VoiceResultCandidate[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  const supported = isSpeechRecognitionSupported();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
  }, []);

  const processTranscript = useCallback((text: string) => {
    if (!text.trim()) {
      setError('לא נקלט דיבור. נסה שוב.');
      return;
    }
    setTranscript(text);
    const parsed = parseVoiceResults(text, currentPairs, availableClubs, allClubs);
    if (parsed.length > 0) {
      setCandidates(parsed);
      setShowConfirmDialog(true);
    } else {
      setError('לא הצלחנו לזהות תוצאות מהדיבור. נסה שוב.');
    }
  }, [currentPairs, availableClubs, allClubs]);

  const startListening = useCallback(() => {
    if (!supported) {
      toast({
        title: 'לא נתמך',
        description: 'זיהוי קולי לא נתמך בדפדפן הזה. נסה בכרום על מובייל.',
        variant: 'destructive',
      });
      return;
    }

    setError(null);
    setTranscript('');
    setCandidates([]);
    finalTranscriptRef.current = '';

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'he-IL';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('[Voice] Recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }
        finalTranscriptRef.current = final;
        setTranscript((final + interim).trim());
      };

      recognition.onerror = (event: any) => {
        console.error('[Voice] Recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          setError('לא נקלט דיבור. נסה שוב.');
        } else if (event.error === 'not-allowed') {
          setError('גישה למיקרופון נדחתה. אנא אפשר גישה בהגדרות הדפדפן.');
        } else if (event.error === 'aborted') {
          // User stopped - not an error
        } else {
          setError(`שגיאה בזיהוי קולי: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log('[Voice] Recognition ended, transcript:', finalTranscriptRef.current);
        setIsListening(false);
        const text = finalTranscriptRef.current.trim();
        if (text) {
          processTranscript(text);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[Voice] Failed to start recognition:', err);
      setError('לא הצליח להפעיל זיהוי קולי. נסה דפדפן Chrome.');
      setIsListening(false);
    }
  }, [supported, processTranscript, toast]);

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const handleConfirm = () => {
    const validCandidates = candidates.filter(
      c => c.pairAClub && c.pairBClub && c.scoreA !== null && c.scoreB !== null
    );
    if (validCandidates.length === 0) {
      toast({
        title: 'אין תוצאות תקינות',
        description: 'כל התוצאות חסרות מידע. נסה שוב או הכנס ידנית.',
        variant: 'destructive',
      });
      return;
    }
    onApplyResults(validCandidates);
    setShowConfirmDialog(false);
    setCandidates([]);
    setTranscript('');
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setCandidates([]);
    setTranscript('');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'גבוהה';
    if (confidence >= 0.5) return 'בינונית';
    return 'נמוכה';
  };

  if (!supported) {
    return null;
  }

  return (
    <>
      {/* Main Voice Button - full width, prominent */}
      {!isListening ? (
        <Button
          variant="outline"
          onClick={startListening}
          disabled={disabled}
          className="w-full justify-center gap-2 border-dashed"
        >
          <Mic className="h-4 w-4" />
          <span>דווח תוצאות בקול</span>
        </Button>
      ) : (
        <Card className="p-3 border-destructive bg-destructive/10 animate-pulse">
          <div className="flex items-center justify-between gap-2" dir="rtl">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Mic className="h-5 w-5 text-destructive shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-destructive">מקשיב...</p>
                {transcript && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{transcript}</p>
                )}
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={stopListening}
              className="shrink-0 gap-1"
            >
              <Square className="h-3 w-3" />
              סיים
            </Button>
          </div>
        </Card>
      )}

      {/* Error message */}
      {error && !isListening && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 px-2">
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              אישור תוצאות
            </DialogTitle>
            <DialogDescription>
              בדקו את התוצאות שזוהו ואשרו להחלה
            </DialogDescription>
          </DialogHeader>

          {/* Transcript */}
          <div className="bg-muted rounded-md p-3 text-sm" dir="rtl">
            <p className="text-xs text-muted-foreground mb-1">תמלול:</p>
            <p className="text-foreground">{transcript}</p>
          </div>

          {/* Parsed Results */}
          <div className="space-y-3">
            {candidates.map((candidate) => {
              const isValid = candidate.pairAClub && candidate.pairBClub && candidate.scoreA !== null && candidate.scoreB !== null;
              return (
                <Card key={candidate.id} className={`p-3 ${isValid ? 'border-border' : 'border-destructive/50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getConfidenceColor(candidate.confidence)}`}
                      >
                        ביטחון: {getConfidenceLabel(candidate.confidence)}
                      </Badge>
                      {!isValid && (
                        <Badge variant="destructive" className="text-xs">חסר מידע</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeCandidate(candidate.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-1 text-sm" dir="rtl">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-medium">{candidate.pairAPlayers}</span>
                      <Badge variant="secondary" className="text-xs">
                        {candidate.pairAClub?.name ?? '❓'}
                      </Badge>
                    </div>
                    <div className="text-center text-lg font-bold text-neon-green">
                      {candidate.scoreA ?? '?'} - {candidate.scoreB ?? '?'}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-medium">{candidate.pairBPlayers}</span>
                      <Badge variant="secondary" className="text-xs">
                        {candidate.pairBClub?.name ?? '❓'}
                      </Badge>
                    </div>
                    {candidate.winnerSide && (
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        {candidate.winnerSide === 'A' && `🏆 ${candidate.pairAPlayers}`}
                        {candidate.winnerSide === 'B' && `🏆 ${candidate.pairBPlayers}`}
                        {candidate.winnerSide === 'draw' && '🤝 תיקו'}
                      </p>
                    )}
                  </div>

                  {candidate.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {candidate.warnings.map((warning, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs text-yellow-400">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-1" dir="rtl">
                    "{candidate.transcriptFragment}"
                  </p>
                </Card>
              );
            })}
          </div>

          {candidates.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              כל התוצאות הוסרו. ניתן לסגור ולנסות שוב.
            </p>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              <X className="h-4 w-4 mr-1" />
              ביטול
            </Button>
            <Button
              variant="gaming"
              onClick={handleConfirm}
              disabled={candidates.filter(c => c.pairAClub && c.pairBClub && c.scoreA !== null && c.scoreB !== null).length === 0}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-1" />
              אישור ({candidates.filter(c => c.pairAClub && c.pairBClub && c.scoreA !== null && c.scoreB !== null).length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
