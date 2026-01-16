"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Função auxiliar para carregar JSON
const loadJSON = (filename) => {
    const filepath = path_1.default.join(__dirname, 'data/rules', filename);
    try {
        const data = fs_1.default.readFileSync(filepath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error(`❌ Erro ao carregar ${filename}:`, error);
        return null;
    }
};
const main = () => {
    var _a, _b, _c;
    console.log("🔥 INICIANDO SISTEMA DE REGRAS ORDEM PARANORMAL 🔥\n");
    // Carregar Módulos
    const classes = loadJSON('classes.json');
    const items = loadJSON('items.json');
    const origins = loadJSON('origins.json');
    const powers = loadJSON('powers.json');
    const gameRules = loadJSON('game_rules.json');
    // Rituais (por elemento)
    const rituais = {
        conhecimento: loadJSON('rituals/conhecimento.json'),
        energia: loadJSON('rituals/energia.json'),
        morte: loadJSON('rituals/morte.json'),
        sangue: loadJSON('rituals/sangue.json'),
        medo: loadJSON('rituals/medo.json'),
    };
    // Relatório
    if (classes)
        console.log(`✅ Classes Carregadas: ${Object.keys(classes.classes).length} classes base encontradas.`);
    if (origins)
        console.log(`✅ Origens Carregadas: ${origins.origins.length} origens encontradas.`);
    if (items) {
        console.log(`✅ Itens Carregados:`);
        console.log(`   - Armas Simples: ${((_a = items.armas_simples) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
        console.log(`   - Armas Táticas: ${((_b = items.armas_taticas) === null || _b === void 0 ? void 0 : _b.length) || 0}`);
        console.log(`   - Itens Amaldiçoados: ${((_c = items.itens_amaldiçoados) === null || _c === void 0 ? void 0 : _c.length) || 0}`);
    }
    if (powers)
        console.log(`✅ Poderes Carregados: Combate, Gerais e Paranormais.`);
    console.log(`\n📚 Rituais Carregados:`);
    Object.entries(rituais).forEach(([elemento, lista]) => {
        if (lista)
            console.log(`   - ${elemento.charAt(0).toUpperCase() + elemento.slice(1)}: ${lista.length} rituais.`);
    });
    if (gameRules)
        console.log(`\n⚙️  Regras de Jogo (Estresse, Perseguição, Furtividade) carregadas.`);
    console.log("\n✨ Sistema pronto para uso!");
};
main();
//# sourceMappingURL=index.js.map