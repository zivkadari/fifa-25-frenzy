import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Check, X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Pair, Club } from '@/types/tournament';
import { parseVoiceResults, VoiceResultCandidate } from '@/lib/voiceResultParser';
import { useToast } from '@/hooks/use-toast';

interface VoiceResultEntryProps {
  currentPairs: Pair[];
  availableClubs: Club[]; // clubs in current round pools (both pairs)
  allClubs: Club[]; // full club list for alias resolution
  onApplyResults: (results: VoiceResultCandidate[]) => void;
  disabled?: boolean;
}

// Check if Web Speech API is available
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

  const supported = isSpeechRecognitionSupported();

  const startListening = useCallback(() => {
    if (!supported) {
      toast({
        title: 'לא נתמך',
        description: 'זיהוי קולי לא נתמך בדפדפן הזה',
        variant: 'destructive',
      });
      return;
    }

    setError(null);
    setTranscript('');
    setCandidates([]);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'he-IL';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript((finalTranscript + interim).trim());
    };

    recognition.onerror = (event: any) => {
      console.error('[Voice] Recognition error:', event.error);
      if (event.error === 'no-speech') {
        setError('לא נקלט דיבור. נסה שוב.');
      } else if (event.error === 'not-allowed') {
        setError('גישה למיקרופון נדחתה. אנא אפשר גישה בהגדרות הדפדפן.');
      } else {
        setError(`שגיאה בזיהוי: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Parse the final transcript
      const text = finalTranscript.trim();
      if (text) {
        setTranscript(text);
        const parsed = parseVoiceResults(text, currentPairs, availableClubs, allClubs);
        if (parsed.length > 0) {
          setCandidates(parsed);
          setShowConfirmDialog(true);
        } else {
          setError('לא הצלחנו לזהות תוצאות מהדיבור. נסה שוב.');
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [supported, currentPairs, availableClubs, allClubs, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

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
    return (
      <Button variant="ghost" size="icon" disabled className="opacity-50" title="זיהוי קולי לא נתמך">
        <MicOff className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <>
      {/* Microphone Button */}
      <Button
        variant={isListening ? 'destructive' : 'ghost'}
        size="icon"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className={isListening ? 'animate-pulse' : ''}
        title={isListening ? 'עצור הקלטה' : 'דווח תוצאות בקול'}
      >
        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>

      {/* Listening indicator */}
      {isListening && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <Mic className="h-4 w-4" />
          <span className="text-sm font-medium">מקשיב...</span>
          {transcript && <span className="text-xs opacity-80 max-w-[200px] truncate">{transcript}</span>}
          <Button variant="ghost" size="sm" onClick={stopListening} className="h-6 px-2 text-xs">
            סיים
          </Button>
        </div>
      )}

      {/* Error */}
      {error && !isListening && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <Alert variant="destructive" className="max-w-sm">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
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
          <div className="bg-muted rounded-md p-3 text-sm text-muted-foreground" dir="rtl">
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

                  {/* Match details */}
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

                  {/* Warnings */}
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

                  {/* Fragment */}
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
