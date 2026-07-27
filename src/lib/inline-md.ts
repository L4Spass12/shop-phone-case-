/**
 * Mini-parseur markdown inline (sans dépendance) pour les champs courts
 * de frontmatter qui ne passent PAS par le pipeline remark/rehype d'Astro
 * (ex: FAQ.q / FAQ.a sur les pages product-category, intro produit, etc.).
 *
 * Gère uniquement le sous-ensemble inline strictement nécessaire :
 *   - **gras**           → <strong>
 *   - *italique*         → <em>
 *   - [texte](url)       → <a href="url">
 *   - `code`             → <code>
 *
 * Toute entrée est HTML-escapée avant transformation, le résultat est
 * donc safe à injecter via set:html. Les patterns markdown sont matchés
 * dans cet ordre précis pour éviter les collisions (** doit passer
 * avant *).
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function inlineMd(input: string): string {
  if (!input) return '';
  let s = escapeHtml(input);

  // Liens : [text](url) — on capture avant les autres pour ne pas casser
  // les crochets/paren. L'URL est ré-escapée pour l'attribut.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) => {
    return `<a href="${escapeAttr(url)}">${text}</a>`;
  });

  // Gras : **text** (priorité sur l'italique pour éviter *<em>x</em>*)
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');

  // Italique : *text* — on ne matche pas un * isolé entouré d'espaces.
  s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');

  // Code inline : `text`
  s = s.replace(/`([^`\n]+?)`/g, '<code>$1</code>');

  return s;
}
