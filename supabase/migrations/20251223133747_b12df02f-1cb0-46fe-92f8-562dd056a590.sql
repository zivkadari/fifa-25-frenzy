-- =====================================================
-- FIX #1: Profiles - Restrict to authenticated users only
-- =====================================================
DROP POLICY IF EXISTS "Profiles: public read" ON public.profiles;
CREATE POLICY "Profiles: authenticated can read"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- FIX #2: Players - Restrict INSERT to authenticated users
-- =====================================================
DROP POLICY IF EXISTS "Players: public insert" ON public.players;
CREATE POLICY "Players: authenticated can insert"
ON public.players FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Players: public read" ON public.players;
CREATE POLICY "Players: authenticated can read"
ON public.players FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- FIX #3: Team Players - Restrict INSERT to team owners only
-- =====================================================
DROP POLICY IF EXISTS "TeamPlayers: public insert" ON public.team_players;
CREATE POLICY "TeamPlayers: team owner can insert"
ON public.team_players FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id AND t.owner_id = auth.uid()
  )
);

-- Restrict SELECT to team members
DROP POLICY IF EXISTS "TeamPlayers: public read" ON public.team_players;
CREATE POLICY "TeamPlayers: team members can read"
ON public.team_players FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_players.team_id AND tm.user_id = auth.uid()
  )
);

-- =====================================================
-- FIX #4: Teams - Allow team members to read their teams
-- =====================================================
DROP POLICY IF EXISTS "Teams: owner can read" ON public.teams;
CREATE POLICY "Teams: members can read"
ON public.teams FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
  )
);

-- =====================================================
-- FIX #5: Team Members - Allow viewing teammates
-- =====================================================
DROP POLICY IF EXISTS "TeamMembers: user can see own memberships" ON public.team_members;
CREATE POLICY "TeamMembers: can see own and teammates"
ON public.team_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members my
    WHERE my.team_id = team_members.team_id AND my.user_id = auth.uid()
  )
);

-- =====================================================
-- FIX #6: Evening Members - Allow viewing other participants
-- =====================================================
DROP POLICY IF EXISTS "Members: users can view their own memberships" ON public.evening_members;
CREATE POLICY "EveningMembers: can see own and co-participants"
ON public.evening_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.evening_members my
    WHERE my.evening_id = evening_members.evening_id AND my.user_id = auth.uid()
  )
);