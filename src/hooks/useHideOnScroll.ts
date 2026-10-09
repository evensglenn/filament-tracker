import { useState } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';

/** Returns false while the user scrolls down past the threshold, true otherwise. */
export function useHideOnScroll(threshold = 150) {
  const [visible, setVisible] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    setVisible(!(latest > previous && latest > threshold));
  });

  return visible;
}
