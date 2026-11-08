import { assetUrl } from '../services/words';

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogv', 'mov'];

export function isVideo(path: string): boolean {
  const ext = path.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';
  return VIDEO_EXTENSIONS.includes(ext);
}

/**
 * Renderiza la seña como <img> o <video> según la extensión del archivo,
 * así se puede migrar de imágenes a videos cambiando solo words.json.
 */
export function createSignMedia(path: string, alt: string): HTMLElement {
  if (isVideo(path)) {
    const video = document.createElement('video');
    video.src = assetUrl(path);
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('aria-label', alt);
    video.className = 'sign-media';
    return video;
  }
  const img = document.createElement('img');
  img.src = assetUrl(path);
  img.alt = alt;
  img.className = 'sign-media';
  return img;
}
