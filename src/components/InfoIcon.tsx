import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function InfoIcon({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block ml-2 group">
      <button 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="p-0.5 rounded-full hover:bg-black/5 transition-colors"
      >
        <Info className="w-3.5 h-3.5 text-ink/40 group-hover:text-editor-red transition-colors" />
      </button>
      
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-[100] top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-newsprint border border-ink/10 rounded-sm shadow-xl text-[10px] font-serif italic text-ink/80 leading-relaxed pointer-events-none"
          >
            {text}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-newsprint" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
