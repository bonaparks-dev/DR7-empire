/**
 * useFlottaCategories — restituisce le categorie veicolo VISIBILI
 * sulla landing pubblica, secondo la selezione fatta in admin >
 * Sito > Flotta.
 *
 * Sorgente:
 *   centralina_pro_config.config.categories          — lista categorie
 *   centralina_pro_config.config.site_copy.flotta.visible_category_ids
 *                                                    — subset selezionato
 *
 * Regola: se l'admin NON ha selezionato nulla in Flotta, mostriamo
 * TUTTE le categorie (comportamento di default coerente con il testo
 * della tab Flotta in admin). Se ha selezionato alcune categorie,
 * filtriamo a quelle.
 *
 * Ogni categoria viene restituita con `id`, `label` e `path = "/<id>"`,
 * il path corrisponde alla route dinamica che App.tsx genera per
 * ciascuna categoria di Centralina Pro.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export interface FlottaCategoryLink {
  id: string;
  label: string;
  path: string;
}

export function useFlottaCategories(): { categories: FlottaCategoryLink[]; loading: boolean } {
  const [categories, setCategories] = useState<FlottaCategoryLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('centralina_pro_config')
          .select('config')
          .eq('id', 'main')
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.error('[useFlottaCategories] supabase error:', error);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg = (data?.config as any) || {};
        const allCats: Array<{ id?: string; label?: string }> = Array.isArray(cfg.categories) ? cfg.categories : [];
        const visibleIds: string[] = Array.isArray(cfg?.site_copy?.flotta?.visible_category_ids)
          ? cfg.site_copy.flotta.visible_category_ids.filter((x: unknown) => typeof x === 'string')
          : [];
        console.log('[useFlottaCategories] cfg keys:', Object.keys(cfg));
        console.log('[useFlottaCategories] allCats:', allCats);
        console.log('[useFlottaCategories] visibleIds (site_copy.flotta):', visibleIds);

        const valid = allCats.filter(c => typeof c?.id === 'string' && c.id);
        const filtered = visibleIds.length === 0
          ? valid
          : valid.filter(c => visibleIds.includes(c.id as string));

        const out: FlottaCategoryLink[] = filtered.map(c => ({
          id: c.id as string,
          label: (c.label as string) || (c.id as string),
          path: `/${c.id}`,
        }));
        console.log('[useFlottaCategories] OUTPUT:', out);
        setCategories(out);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { categories, loading };
}
