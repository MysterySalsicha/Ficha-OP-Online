import fs from 'fs';
import path from 'path';

// Função auxiliar para carregar JSON
const loadJSON = (filename: string) => {
    const filepath = path.join(__dirname, 'data/rules', filename);
    try {
        const data = fs.readFileSync(filepath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ Erro ao carregar ${filename}:`, error);
        return null;
    }
};

const main = () => {
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
    if (classes) console.log(`✅ Classes Carregadas: ${Object.keys(classes.classes).length} classes base encontradas.`);
    if (origins) console.log(`✅ Origens Carregadas: ${origins.origins.length} origens encontradas.`);
    if (items) {
        console.log(`✅ Itens Carregados:`);
        console.log(`   - Armas Simples: ${items.armas_simples?.length || 0}`);
        console.log(`   - Armas Táticas: ${items.armas_taticas?.length || 0}`);
        console.log(`   - Itens Amaldiçoados: ${items.itens_amaldiçoados?.length || 0}`);
    }
    if (powers) console.log(`✅ Poderes Carregados: Combate, Gerais e Paranormais.`);
    
    console.log(`\n📚 Rituais Carregados:`);
    Object.entries(rituais).forEach(([elemento, lista]) => {
        if (lista) console.log(`   - ${elemento.charAt(0).toUpperCase() + elemento.slice(1)}: ${lista.length} rituais.`);
    });

    if (gameRules) console.log(`\n⚙️  Regras de Jogo (Estresse, Perseguição, Furtividade) carregadas.`);

    console.log("\n✨ Sistema pronto para uso!");
};

main();
