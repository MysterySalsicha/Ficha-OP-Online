"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// Casting para ignorar erro de tipagem do Vite no build
const env = import.meta.env;
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
//# sourceMappingURL=supabase.js.map