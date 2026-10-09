import { useEffect, useState } from 'react';
import { Filament } from '../types';
import { drawOverview, overviewHeight, W } from '../utils/overviewImage';

const REDRAW_DELAY_MS = 300;

/**
 * The overview image of these filaments as a PNG file, redrawn in the background whenever they
 * change. Having it ready matters: iOS only opens the share sheet right after a tap, so there is
 * no time to draw the image after the button is pressed.
 */
export function useOverviewImage(filaments: Filament[]) {
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    let stale = false;

    const timer = window.setTimeout(async () => {
      try {
        await document.fonts?.ready;
      } catch {
        // Without the web font the canvas uses the system font
      }
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = overviewHeight(filaments);
      drawOverview(canvas.getContext('2d')!, filaments, { date: new Date(), version: __APP_VERSION__ });
      canvas.toBlob(blob => {
        if (stale || !blob) return;
        const fileName = `filament-voorraad-${new Date().toISOString().slice(0, 10)}.png`;
        setFile(new File([blob], fileName, { type: 'image/png' }));
      }, 'image/png');
    }, REDRAW_DELAY_MS);

    return () => {
      stale = true;
      window.clearTimeout(timer);
    };
  }, [filaments]);

  return file;
}

// Probes with an empty PNG, so the answer is known before the real image is drawn
const SAMPLE_IMAGE = new File([new Uint8Array()], 'voorbeeld.png', { type: 'image/png' });

/** Whether this browser can share image files (phones), as opposed to only downloading them. */
export const canShareFiles = (file: File | null = SAMPLE_IMAGE) => !!navigator.canShare?.({ files: [file ?? SAMPLE_IMAGE] });

/** Opens the share sheet, or downloads the image where sharing files isn't supported. */
export async function shareOrSave(file: File) {
  if (canShareFiles(file)) {
    try {
      await navigator.share({ files: [file], title: 'Filamentvoorraad' });
    } catch {
      // Share sheet dismissed: nothing to do
    }
    return;
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
