-- Fix #1: Evenings - Restrict UPDATE to owner only
DROP POLICY IF EXISTS "Evenings: public update" ON public.evenings;
CREATE POLICY "Evenings: owner can update"
ON public.evenings FOR UPDATE
USING (owner_id = auth.uid());

-- Fix #2: Evenings - Restrict INSERT to authenticated user as owner
DROP POLICY IF EXISTS "Evenings: public insert" ON public.evenings;
CREATE POLICY "Evenings: authenticated user creates as owner"
ON public.evenings FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Fix #3: Teams - Restrict INSERT to authenticated user as owner
DROP POLICY IF EXISTS "Teams: public insert" ON public.teams;
CREATE POLICY "Teams: authenticated user creates as owner"
ON public.teams FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Fix #4: Teams - Restrict SELECT to owner only (team visibility)
DROP POLICY IF EXISTS "Teams: public read" ON public.teams;
CREATE POLICY "Teams: owner can read"
ON public.teams FOR SELECT
USING (owner_id = auth.uid());

-- Fix #5: Evening_members - Restrict INSERT to RPC only (via SECURITY DEFINER)
-- The existing policy allows anyone to insert, but inserts should only happen through the join_evening_by_code RPC
DROP POLICY IF EXISTS "Members: RPC can insert memberships" ON public.evening_members;
CREATE POLICY "Members: no direct insert"
ON public.evening_members FOR INSERT
WITH CHECK (false);