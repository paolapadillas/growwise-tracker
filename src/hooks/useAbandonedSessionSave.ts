import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from './useSessionId';

interface SaveData {
  assessmentId: string | undefined;
  areas: Array<{ area_id: number; skills: Array<{ milestones: Array<{ milestone_id: number }> }> }>;
  responses: { [key: number]: string };
  viewState: { type: string; areaIndex?: number; skillIndex?: number };
}

interface SaveOverrides {
  areaIndex?: number;
  skillIndex?: number;
  responses?: { [key: number]: string };
}

export const useAbandonedSessionSave = ({ assessmentId, areas, responses, viewState }: SaveData) => {
  const lastSaveRef = useRef<string>('');
  // Keep refs for latest values so beforeunload always has fresh data
  const latestRef = useRef({ areas, responses, viewState });
  latestRef.current = { areas, responses, viewState };

  const buildPayload = useCallback((overrides?: SaveOverrides) => {
    const currentAreas = latestRef.current.areas;
    const currentResponses = overrides?.responses ?? latestRef.current.responses;
    const currentViewState = latestRef.current.viewState;

    if (!currentAreas.length) return null;

    const totalSkills = currentAreas.reduce((sum, a) => sum + a.skills.length, 0);
    const areaIndex = overrides?.areaIndex ?? 
      ((currentViewState.type === 'skill' || currentViewState.type === 'areaSummary')
        ? (currentViewState.areaIndex ?? 0) : 0);
    const skillIndex = overrides?.skillIndex ?? 
      (currentViewState.type === 'skill' ? (currentViewState.skillIndex ?? 0) : 0);
    
    const completedSkills = currentAreas.slice(0, areaIndex).reduce((sum, a) => sum + a.skills.length, 0) + skillIndex;
    const progress = Math.round(22 + (completedSkills / totalSkills) * 78);
    const completedAreas = currentAreas.slice(0, areaIndex).map(a => a.area_id);
    const currentArea = currentAreas[areaIndex];

    return {
      current_area_id: currentArea?.area_id ?? 2,
      current_skill_index: skillIndex,
      milestone_answers: currentResponses,
      progress_percentage: progress,
      completed_areas: completedAreas,
      abandoned_at: new Date().toISOString(),
    };
  }, []);

  const saveProgress = useCallback(async (overrides?: SaveOverrides) => {
    if (!assessmentId || !latestRef.current.areas.length) return;

    const payload = buildPayload(overrides);
    if (!payload) return;

    const key = JSON.stringify(payload);
    if (key === lastSaveRef.current) return;
    lastSaveRef.current = key;

    const sessionId = getSessionId();
    try {
      await (supabase.from('abandoned_sessions' as any) as any)
        .update(payload)
        .eq('session_id', sessionId)
        .eq('assessment_id', assessmentId);
    } catch (err) {
      console.error('Error saving abandoned session:', err);
    }
  }, [assessmentId, buildPayload]);

  // Save on page unload / visibility change
  useEffect(() => {
    if (!assessmentId) return;

    const handleBeforeUnload = () => {
      const payload = buildPayload();
      if (!payload) return;

      const sessionId = getSessionId();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/abandoned_sessions?session_id=eq.${sessionId}&assessment_id=eq.${assessmentId}`;
      
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveProgress();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [assessmentId, saveProgress, buildPayload]);

  return { saveProgress };
};
