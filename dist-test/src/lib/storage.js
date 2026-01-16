"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const supabase_1 = require("./supabase");
/**
 * Faz upload de uma imagem.
 * Se o Supabase estiver configurado, salva no bucket 'images'.
 * Se não, cria uma URL local temporária (blob) para testes.
 */
const uploadImage = async (file, bucket = 'images') => {
    try {
        // 1. Tentar Upload no Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase_1.supabase.storage
            .from(bucket)
            .upload(filePath, file);
        if (uploadError)
            throw uploadError;
        // 2. Obter URL Pública
        const { data } = supabase_1.supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    }
    catch (error) {
        console.warn("⚠️ Upload falhou ou Supabase offline. Usando URL local temporária.");
        // Fallback: Cria um Blob URL local que funciona nesta sessão do navegador
        return URL.createObjectURL(file);
    }
};
exports.uploadImage = uploadImage;
//# sourceMappingURL=storage.js.map