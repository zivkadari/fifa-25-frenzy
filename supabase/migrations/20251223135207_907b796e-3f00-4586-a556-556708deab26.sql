-- =====================================================
-- FIX #1: Profiles - Users can only read their own profile 
-- or profiles of users in same team/evening
-- =====================================================
DROP POLICY IF EXISTS "Profiles: authenticated can read" ON public.profiles;
CREATE POLICY "Profiles: authenticated can read"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  -- Same team members
  EXISTS (
    SELECT 1 FROM public.team_members my_tm
    JOIN public.team_members their_tm ON my_tm.team_id = their_tm.team_id
    WHERE my_tm.user_id = auth.uid() AND their_tm.user_id = profiles.id
  ) OR
  -- Same evening participants
  EXISTS (
    SELECT 1 FROM public.evening_members my_em
    JOIN public.evening_members their_em ON my_em.evening_id = their_em.evening_id
    WHERE my_em.user_id = auth.uid() AND their_em.user_id = profiles.id
  )
);

-- =====================================================
-- FIX #2: Players - Only team members can read players in their team
-- =====================================================
DROP POLICY IF EXISTS "Players: authenticated can read" ON public.players;
CREATE POLICY "Players: authenticated can read"
ON public.players FOR SELECT
TO authenticated
USING (
  -- Player was created by the current user
  created_by = auth.uid() OR
  -- Player is in a team the user belongs to
  EXISTS (
    SELECT 1 FROM public.team_players tp
    JOIN public.team_members tm ON tp.team_id = tm.team_id
    WHERE tp.player_id = players.id AND tm.user_id = auth.uid()
  )
);

-- =====================================================
-- FIX #3: Players - Only team owners can insert players
-- =====================================================
DROP POLICY IF EXISTS "Players: authenticated can insert" ON public.players;
CREATE POLICY "Players: authenticated can insert"
ON public.players FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);