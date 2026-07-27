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
        white:      '#111113',
        dark:       '#FFFFFF',  // fond de page
        panel:      '#F7F7F8',  // cards / sections
        teal:       '#F0F0F2',  // variante panel
        beige:      '#E5E5E8',  // bordures / tags
        cream:      '#111113',  // texte principal / surfaces inversées
        terracotta: '#111113',  // conservé pour compat : accent "encre" (boutons neutres)
        sage:       '#16A34A',  // accent de statut (succès / en stock)
        /* Neutres complémentaires */
        'n-500':    '#8A8A93',
        'n-400':    '#52525B',
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
        // Une seule police pour tout le site. `display` existe pour la compat
        // avec les classes déjà en place et pointe aussi sur Inter.
        display: ['Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'tightest': '-0.04em',
      },
    },
  },
  plugins: [typography],
};
