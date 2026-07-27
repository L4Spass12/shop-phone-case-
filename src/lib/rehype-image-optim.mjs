/**
 * Rehype plugin : optimise toutes les <img> rendues depuis le markdown.
 *  - loading="lazy" (sauf si data-eager)
 *  - decoding="async"
 *  - width/height lus depuis le fichier local (évite le CLS)
 *
 * Les images locales doivent exister dans /public/ (path = URL, ex: /images/foo.webp → public/images/foo.webp).
 * Les URLs externes (http(s)://) sont juste enrichies avec lazy/async, sans dimensions.
 */
import { visit } from 'unist-util-visit';
import { imageSize } from 'image-size';
import fs from 'fs';
import path from 'path';

const cache = new Map();

function getLocalDims(src) {
  if (!src || src.startsWith('http')) return null;
  if (cache.has(src)) return cache.get(src);
  try {
    const abs = path.join(process.cwd(), 'public', src.startsWith('/') ? src.slice(1) : src);
    if (!fs.existsSync(abs)) {
      cache.set(src, null);
      return null;
    }
    const buf = fs.readFileSync(abs);
    const dims = imageSize(buf);
    const res = dims?.width && dims?.height ? { width: dims.width, height: dims.height } : null;
    cache.set(src, res);
    return res;
  } catch {
    cache.set(src, null);
    return null;
  }
}

export default function rehypeImageOptim() {
  return (tree) => {
    let firstImg = true;
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const props = node.properties ?? (node.properties = {});

      // decoding async toujours
      if (!props.decoding) props.decoding = 'async';

      // lazy sauf pour la toute première image (souvent le LCP)
      if (!props.loading) {
        if (firstImg) {
          props.loading = 'eager';
          props.fetchpriority = 'high';
          firstImg = false;
        } else {
          props.loading = 'lazy';
        }
      }

      // width/height depuis le fichier local
      if (props.src && !props.width && !props.height) {
        const dims = getLocalDims(String(props.src));
        if (dims) {
          props.width = dims.width;
          props.height = dims.height;
        }
      }
    });
  };
}
