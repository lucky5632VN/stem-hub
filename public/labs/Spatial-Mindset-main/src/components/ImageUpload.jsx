import React, { useCallback, useEffect } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

const ImageUpload = ({ image, setImage }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onloadend = () => {
            setImage(reader.result);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  }, [setImage]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <div className="mt-4 flex flex-col gap-3">
      {!image ? (
        <label className="flex items-center gap-3 px-4 py-3 bg-black/20 border border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-black/30 transition-all text-slate-400 hover:text-cyan-400">
          <ImageIcon size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Tải ảnh hoặc dán ảnh (Ctrl+V)</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      ) : (
        <div className="relative group rounded-xl overflow-hidden border border-cyan-500/30 shadow-lg shadow-cyan-500/10 bg-black/40">
          <img src={image} alt="Preview" className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
             <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">Sẵn sàng phân tích</span>
          </div>
          <button 
            onClick={() => setImage(null)}
            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
