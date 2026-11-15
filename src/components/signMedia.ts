import { assetUrl } from '../services/words';

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogv', 'mov'];

export function isVideo(path: string): boolean {
  const ext = path.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';
  return VIDEO_EXTENSIONS.includes(ext);
}

/**
 * Renderiza la seña como <img> (png/webp/gif...) o <video> según la extensión.
 * Los videos van con loop, muted, autoplay y playsinline: sin muted +
 * playsinline los navegadores móviles no reproducen automáticamente.
 */
export function createSignMedia(path: string, alt: string): HTMLImageElement | HTMLVideoElement {
  if (isVideo(path)) {
    const video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    for (const attr of ['muted', 'loop', 'autoplay', 'playsinline']) video.setAttribute(attr, '');
    video.preload = 'auto';
    video.src = assetUrl(path);
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
