import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Filament } from '../../types';
import { drawOverview, overviewHeight, W } from '../../utils/overviewImage';
import { Modal, ModalFooter, ModalHeader, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../ui/Modal';

interface OverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filaments: Filament[];
}

/** The (filtered) inventory as an image to share or save, like the scoreboard summary. */
export function OverviewModal({ isOpen, onClose, filaments }: OverviewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-3xl">
      <OverviewContent onClose={onClose} filaments={filaments} />
    </Modal>
  );
}

function OverviewContent({ onClose, filaments }: Omit<OverviewModalProps, 'isOpen'>) {
  const [url, setUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [failed, setFailed] = useState(false);
  const fileName = `filament-voorraad-${new Date().toISOString().slice(0, 10)}.png`;

  useEffect(() => {
    let stale = false;

    const make = async () => {
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
        if (stale) return;
        if (!blob) {
          setFailed(true);
          return;
        }
        setUrl(URL.createObjectURL(blob));
        setFile(new File([blob], fileName, { type: 'image/png' }));
      }, 'image/png');
    };

    make();
    return () => { stale = true; };
    // Drawn once when the modal opens; live updates while it is open would only make it flicker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  // The share sheet (phone) when it accepts images, otherwise a plain download
  const canShare = file !== null && navigator.canShare?.({ files: [file] });

  const share = async () => {
    try {
      await navigator.share({ files: [file!], title: 'Filamentvoorraad' });
    } catch {
      // Share sheet dismissed: nothing to do
    }
  };

  const save = () => {
    const link = document.createElement('a');
    link.href = url!;
    link.download = fileName;
    link.click();
  };

  return (
    <>
      <ModalHeader
        title="Overzicht"
        subtitle="Je voorraad als afbeelding om te delen"
        icon={<ImageIcon size={20} />}
        onClose={onClose}
      />

      <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-100 flex justify-center">
        {failed ? (
          <p className="py-10 text-sm text-gray-500">De afbeelding kon niet gemaakt worden. Probeer het opnieuw.</p>
        ) : url ? (
          <img src={url} alt="Overzicht van je filamentvoorraad" className="w-full h-auto self-start rounded-xl shadow-sm border border-gray-200" />
        ) : (
          <p className="py-10 text-sm text-gray-500">Het overzicht wordt getekend…</p>
        )}
      </div>

      <ModalFooter>
        <button onClick={onClose} className={SECONDARY_BUTTON}>Sluit</button>
        {canShare ? (
          <button onClick={share} className={PRIMARY_BUTTON}>Deel</button>
        ) : (
          <button onClick={save} disabled={!url} className={PRIMARY_BUTTON}>Bewaar</button>
        )}
      </ModalFooter>
    </>
  );
}
