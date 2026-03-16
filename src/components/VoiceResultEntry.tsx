import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Check, X, AlertTriangle, Trash2, Square, ChevronDown, Pencil } from 'lucide-react';
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

/** Searchable club selector as a simple filterable dropdown */
function ClubSelector({
  value,
  clubs,
  onChange,
  placeholder = 'בחר קבוצה',
}: {
  value: Club | null;
  clubs: Club[];
  onChange: (club: Club | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return clubs;
    const q = search.toLowerCase();
    return clubs.filter(c => c.name.toLowerCase().includes(q) || c.id.includes(q));
  }, [clubs, search]);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="w-full justify-between text-xs h-7 px-2"
      >
        <span className="truncate">{value?.name ?? placeholder}</span>
        <ChevronDown className="h-3 w-3 shrink-0 ml-1" />
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-48 overflow-hidden flex flex-col">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש..."
            className="h-7 text-xs border-0 border-b rounded-none focus-visible:ring-0"
            autoFocus
          />
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground p-2 text-center">לא נמצא</p>
            )}
            {filtered.map(club => (
              <button
                key={club.id}
                className={`w-full text-right text-xs px-2 py-1.5 hover:bg-accent transition-colors flex items-center justify-between ${value?.id === club.id ? 'bg-accent' : ''}`}
                onClick={() => {
                  onChange(club);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <span className="truncate">{club.name}</span>
                <span className="text-muted-foreground shrink-0 ml-1">
                  {club.isPrime ? 'Pr' : `${club.stars}★`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
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

  // === Candidate editing functions ===
  const updateCandidate = (id: string, updates: Partial<VoiceResultCandidate>) => {
    setCandidates(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...updates };
      // Auto-infer winner from score
      if (updates.scoreA !== undefined || updates.scoreB !== undefined) {
        const sA = updates.scoreA ?? c.scoreA;
        const sB = updates.scoreB ?? c.scoreB;
        if (sA !== null && sB !== null) {
          if (sA > sB) updated.winnerSide = 'A';
          else if (sB > sA) updated.winnerSide = 'B';
          else updated.winnerSide = 'draw';
        }
      }
      return updated;
    }));
  };

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const updateCandidateClub = (id: string, side: 'A' | 'B', club: Club | null) => {
    setCandidates(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (side === 'A') return { ...c, pairAClub: club };
      return { ...c, pairBClub: club };
    }));
  };

  const updateCandidatePair = (id: string, pairId: string) => {
    const pair = currentPairs.find(p => p.id === pairId);
    const otherPair = currentPairs.find(p => p.id !== pairId);
    if (!pair) return;
    setCandidates(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        pairAId: pair.id,
        pairAPlayers: pair.players.map(p => p.name).join(' + '),
        pairBId: otherPair?.id,
        pairBPlayers: otherPair ? otherPair.players.map(p => p.name).join(' + ') : '?',
      };
    }));
  };

  const handleConfirm = () => {
    const validCandidates = candidates.filter(
      c => c.pairAClub && c.pairBClub && c.scoreA !== null && c.scoreB !== null
    );
    if (validCandidates.length === 0) {
      toast({
        title: 'אין תוצאות תקינות',
        description: 'כל התוצאות חסרות מידע. השלם את השדות החסרים או נסה שוב.',
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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">גבוהה</Badge>;
    if (confidence >= 0.5) return <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/30">בינונית</Badge>;
    return <Badge variant="outline" className="text-xs text-red-400 border-red-400/30">נמוכה</Badge>;
  };

  if (!supported) {
    return null;
  }

  const validCount = candidates.filter(c => c.pairAClub && c.pairBClub && c.scoreA !== null && c.scoreB !== null).length;

  return (
    <>
      {/* Main Voice Button */}
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              אישור תוצאות ({candidates.length})
            </DialogTitle>
            <DialogDescription>
              בדקו ותקנו את התוצאות לפני אישור
            </DialogDescription>
          </DialogHeader>

          {/* Transcript */}
          <div className="bg-muted rounded-md p-2 text-sm">
            <p className="text-xs text-muted-foreground mb-1">תמלול:</p>
            <p className="text-foreground text-xs">{transcript}</p>
          </div>

          {/* Parsed Results - Editable */}
          <div className="space-y-3">
            {candidates.map((candidate) => {
              const isValid = candidate.pairAClub && candidate.pairBClub && candidate.scoreA !== null && candidate.scoreB !== null;
              return (
                <CandidateEditor
                  key={candidate.id}
                  candidate={candidate}
                  isValid={!!isValid}
                  currentPairs={currentPairs}
                  availableClubs={availableClubs}
                  allClubs={allClubs}
                  onUpdateClub={updateCandidateClub}
                  onUpdateScore={(id, side, val) => updateCandidate(id, side === 'A' ? { scoreA: val } : { scoreB: val })}
                  onUpdatePair={updateCandidatePair}
                  onRemove={removeCandidate}
                  getConfidenceBadge={getConfidenceBadge}
                />
              );
            })}
          </div>

          {candidates.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              כל התוצאות הוסרו. ניתן לסגור ולנסות שוב.
            </p>
          )}

          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              <X className="h-4 w-4 ml-1" />
              ביטול
            </Button>
            <Button
              variant="gaming"
              onClick={handleConfirm}
              disabled={validCount === 0}
              className="flex-1"
            >
              <Check className="h-4 w-4 ml-1" />
              אישור ({validCount})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Editable candidate card */
function CandidateEditor({
  candidate,
  isValid,
  currentPairs,
  availableClubs,
  allClubs,
  onUpdateClub,
  onUpdateScore,
  onUpdatePair,
  onRemove,
  getConfidenceBadge,
}: {
  candidate: VoiceResultCandidate;
  isValid: boolean;
  currentPairs: Pair[];
  availableClubs: Club[];
  allClubs: Club[];
  onUpdateClub: (id: string, side: 'A' | 'B', club: Club | null) => void;
  onUpdateScore: (id: string, side: 'A' | 'B', val: number | null) => void;
  onUpdatePair: (id: string, pairId: string) => void;
  onRemove: (id: string) => void;
  getConfidenceBadge: (confidence: number) => React.ReactNode;
}) {
  return (
    <Card className={`p-3 ${isValid ? 'border-border' : 'border-destructive/50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getConfidenceBadge(candidate.confidence)}
          {!isValid && (
            <Badge variant="destructive" className="text-xs">השלם שדות</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive"
          onClick={() => onRemove(candidate.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Pair selector */}
      {currentPairs.length > 0 && (
        <div className="mb-2">
          <Select
            value={candidate.pairAId || ''}
            onValueChange={(val) => onUpdatePair(candidate.id, val)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="בחר זוג" />
            </SelectTrigger>
            <SelectContent>
              {currentPairs.map(pair => (
                <SelectItem key={pair.id} value={pair.id} className="text-xs">
                  {pair.players.map(p => p.name).join(' + ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Team A */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16 shrink-0">{candidate.pairAPlayers.split(' + ')[0] || 'זוג א'}</span>
          <div className="flex-1">
            <ClubSelector
              value={candidate.pairAClub}
              clubs={availableClubs.length > 0 ? availableClubs : allClubs}
              onChange={(club) => onUpdateClub(candidate.id, 'A', club)}
              placeholder="קבוצה א'"
            />
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-2">
          <Input
            type="number"
            min={0}
            max={99}
            value={candidate.scoreA ?? ''}
            onChange={(e) => onUpdateScore(candidate.id, 'A', e.target.value === '' ? null : parseInt(e.target.value))}
            className="w-14 h-8 text-center text-lg font-bold"
          />
          <span className="text-muted-foreground font-bold">-</span>
          <Input
            type="number"
            min={0}
            max={99}
            value={candidate.scoreB ?? ''}
            onChange={(e) => onUpdateScore(candidate.id, 'B', e.target.value === '' ? null : parseInt(e.target.value))}
            className="w-14 h-8 text-center text-lg font-bold"
          />
        </div>

        {/* Team B */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16 shrink-0">{candidate.pairBPlayers.split(' + ')[0] || 'זוג ב'}</span>
          <div className="flex-1">
            <ClubSelector
              value={candidate.pairBClub}
              clubs={availableClubs.length > 0 ? availableClubs : allClubs}
              onChange={(club) => onUpdateClub(candidate.id, 'B', club)}
              placeholder="קבוצה ב'"
            />
          </div>
        </div>

        {/* Winner indicator */}
        {candidate.winnerSide && candidate.scoreA !== null && candidate.scoreB !== null && (
          <p className="text-xs text-center text-muted-foreground">
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
      <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-1">
        "{candidate.transcriptFragment}"
      </p>
    </Card>
  );
}
