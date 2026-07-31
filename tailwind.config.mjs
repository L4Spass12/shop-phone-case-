import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        /**
         * ─── PALETTE NEUTRE CLAIRE ──────────────────────────────────
         * Les noms sont SÉMANTIQUES : pour rebrander le site, il suffit de
         * changer les valeurs ici, sans toucher aux composants.
         *
         *   dark    = fond de page            (le plus clair)
         *   panel   = cards / sections        (légèrement contrasté)
         *   teal    = variante de panel
         *   beige   = bordures / tags / hover
         *   cream   = couleur du TEXTE principal + surfaces inversées
         *   n-400   = texte courant (gris moyen)
         *   n-500   = texte secondaire (gris clair)
         *
         * ⚠️ Convention héritée : `cream` est la « couleur de contenu » et
         * `dark` la « couleur de fond » dans tout le CSS. En thème clair on
         * les inverse donc : dark = blanc, cream = presque noir.
         * Pour repasser en thème sombre, il suffit d'échanger ces deux valeurs.
         */
        /**
         * Remap de `white` : les composants utilisent des utilitaires
         * `border-white/[0.08]`, `bg-white/[0.03]`, etc. comme « voiles de
         * contraste » par-dessus le fond. En thème clair, le voile doit être
         * SOMBRE (encre translucide) pour rester visible sur fond blanc.
         * En repassant en thème sombre, remets `white: '#FFFFFF'`.
         */
        /**
         * ⚠️ Les valeurs sont désormais pilotées par des variables CSS
         * (`--c-*` dans src/styles/global.css) au format « canaux RVB » pour
         * permettre le THEME-SWITCH via `data-theme` sur <html> ET garder les
         * utilitaires d'opacité (`bg-white/[0.03]`, `border-white/[0.08]`…).
         * Le thème par défaut reproduit à l'identique les anciennes valeurs.
         */
        white:      'rgb(var(--c-white) / <alpha-value>)',
        dark:       'rgb(var(--c-dark) / <alpha-value>)',   // fond de page
        panel:      'rgb(var(--c-panel) / <alpha-value>)',  // cards / sections
        teal:       'rgb(var(--c-teal) / <alpha-value>)',   // variante panel
        beige:      'rgb(var(--c-beige) / <alpha-value>)',  // bordures / tags
        cream:      'rgb(var(--c-cream) / <alpha-value>)',  // texte principal
        terracotta: 'rgb(var(--c-terracotta) / <alpha-value>)',
        sage:       'rgb(var(--c-sage) / <alpha-value>)',   // statut succès
        /* Neutres complémentaires */
        'n-500':    'rgb(var(--c-n500) / <alpha-value>)',
        'n-400':    'rgb(var(--c-n400) / <alpha-value>)',
        /**
         * ─── ACCENT DE MARQUE ───────────────────────────────────────
         * Les valeurs viennent des variables `--accent-*-rgb` définies
         * dans src/styles/global.css (source unique de vérité) : on les
         * change LÀ-BAS, jamais ici. La syntaxe rgb(var(...) / <alpha>)
         * permet les opacités Tailwind : bg-accent/10, ring-accent/40…
         */
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          light:   'rgb(var(--accent-light-rgb) / <alpha-value>)',
          dark:    'rgb(var(--accent-dark-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        // Pilotées par variables CSS (voir global.css) pour permettre au
        // thème « heritage » de basculer sur un serif Didone + un script,
        // sans toucher aux composants. Le thème par défaut reste Inter.
        display: ['var(--font-display)', 'Inter', 'system-ui', 'sans-serif'],
        body:    ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        script:  ['var(--font-script)', 'cursive'],
      },
      letterSpacing: {
        'tightest': '-0.04em',
      },
    },
  },
  plugins: [typography],
};
