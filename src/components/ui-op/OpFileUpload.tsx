import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { uploadImage } from '../../lib/storage';

interface OpFileUploadProps {
    label?: string;
    onUpload: (url: string) => void;
    defaultUrl?: string;
    className?: string;
}

export const OpFileUpload: React.FC<OpFileUploadProps> = ({ label, onUpload, defaultUrl, className }) => {
    const [preview, setPreview] = useState<string | undefined>(defaultUrl);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        // Cria preview instantâneo para UX
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        try {
            const uploadedUrl = await uploadImage(file);
            onUpload(uploadedUrl);
        } catch (error) {
            alert("Erro no upload");
        } finally {
            setLoading(false);
        }
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(undefined);
        onUpload('');
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className={cn("w-full", className)}>
            {label && <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-1 block">{label}</label>}
            
            <div 
                onClick={() => inputRef.current?.click()}
                className={cn(
                    "relative border border-dashed border-zinc-700 bg-black/20 rounded cursor-pointer transition-all group overflow-hidden",
                    "hover:border-op-red hover:bg-op-red/5 min-h-[100px] flex items-center justify-center",
                    preview ? "border-solid border-zinc-800" : ""
                )}
            >
                <input 
                    type="file" 
                    ref={inputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />

                {loading ? (
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                        <div className="w-5 h-5 border-2 border-op-red border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs">Enviando...</span>
                    </div>
                ) : preview ? (
                    <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover max-h-[200px]" />
                        <button 
                            onClick={clearImage}
                            className="absolute top-2 right-2 bg-black/80 text-white p-1 rounded hover:bg-op-red transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-600 group-hover:text-op-red transition-colors py-4">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase">Clique para enviar imagem</span>
                    </div>
                )}
            </div>
        </div>
    );
};
