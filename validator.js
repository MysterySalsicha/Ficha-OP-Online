const fs = require('fs');
const path = require('path');

// --- Funções de Carregamento ---
function loadRule(subpath) {
    // Tenta carregar da pasta rules/subpasta/arquivo
    let p = path.join(__dirname, 'rules', subpath);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
    
    // Fallback: Tenta carregar direto da pasta rules/arquivo
    // (Isso ajuda caso a estrutura de pastas tenha mudado levemente)
    const fileName = path.basename(subpath);
    p = path.join(__dirname, 'rules', fileName);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));

    // Fallback 2: Tenta pastas específicas baseadas no contexto
    // Se pediu 'core/classes.json', e não achou, tenta 'classes.json' na raiz rules
    if (subpath.includes('/')) {
         p = path.join(__dirname, 'rules', subpath.split('/')[1]);
         if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }

    throw new Error(`Regra não encontrada: ${subpath}`);
}

// --- O Auditor ---
async function validateCharacter(file) {
    console.log(`\n🔎 INICIANDO AUDITORIA: ${file}`);
    const char = JSON.parse(fs.readFileSync(file, 'utf-8'));

    // 1. Carregar Regras Necessárias
    // Usando nomes genéricos que sabemos que existem
    const classesRules = loadRule('classes.json');
    // Para items, como dividimos em schema e list, vamos usar a lista para ver se o item existe, 
    // mas aqui vou focar na regra de carga que estava em items.schema.json
    const itemsSchema = loadRule('items.schema.json');

    // Buscar dados base da classe para NEX 5
    // O arquivo classes.json tem estrutura { "Classe": { "nex5": { ... } } }
    const classData = classesRules[char.class]?.nex5;
    
    if (!classData) {
        console.error(`❌ CLASSE INVÁLIDA: ${char.class} não tem dados para NEX 5.`);
        return;
    }

    console.log(`✅ Classe: ${char.class} (Base carregada)`);

    // 2. Validar Atributos (Soma total)
    // Regra: Base 1 em tudo (5 atributos) + 4 pontos livres = Total 9 pontos.
    const totalAtributos = Object.values(char.attributes).reduce((a, b) => a + b, 0);
    if (totalAtributos !== 9) {
        console.warn(`⚠️ ALERTA DE ATRIBUTOS: Soma total é ${totalAtributos}. Esperado para NEX 5 é 9 (1 base + 4 dist).`);
    } else {
        console.log(`✅ Distribuição de Atributos: OK (9 pontos)`);
    }

    // 3. Validar Status Vitais (PV, PE, SAN) - O CÁLCULO REAL
    const expectedPV = classData.pvBase + char.attributes.vigor;
    const expectedPE = classData.peBase + char.attributes.presenca;
    const expectedSAN = 20 + char.attributes.presenca; // Fórmula padrão de Sanidade Inicial

    console.log("\n📊 CONFERÊNCIA VITAL:");
    
    // PV
    if (char.vitalStats.pv !== expectedPV) {
        console.error(`❌ ERRO DE PV: Ficha diz ${char.vitalStats.pv}, mas a regra diz ${expectedPV} (${classData.pvBase} base + ${char.attributes.vigor} vigor)`);
    } else {
        console.log(`✅ PV: ${char.vitalStats.pv} (Correto)`);
    }

    // PE
    if (char.vitalStats.pe !== expectedPE) {
        console.error(`❌ ERRO DE PE: Ficha diz ${char.vitalStats.pe}, mas a regra diz ${expectedPE} (${classData.peBase} base + ${char.attributes.presenca} presença)`);
    } else {
        console.log(`✅ PE: ${char.vitalStats.pe} (Correto)`);
    }

    // SAN
    if (char.vitalStats.san !== expectedSAN) {
        console.error(`❌ ERRO DE SAN: Ficha diz ${char.vitalStats.san}, mas a regra diz ${expectedSAN} (20 base + ${char.attributes.presenca} presença)`);
    } else {
        console.log(`✅ SAN: ${char.vitalStats.san} (Correto)`);
    }

    // 4. Validar Inventário (Peso)
    // Regra items.schema.json: "carryCapacity": { "formula": "5 + vigor" }
    // Vamos assumir 5 + Vigor se não conseguir parsear a string da fórmula agora
    const maxLoad = 5 + char.attributes.vigor;
    const currentLoad = char.inventory.reduce((sum, item) => sum + item.weight, 0);

    console.log("\n🎒 CONFERÊNCIA DE CARGA:");
    if (currentLoad > maxLoad) {
        console.error(`❌ SOBRECARGA: Carregando ${currentLoad}, limite é ${maxLoad} (5 + Vigor ${char.attributes.vigor})`);
    } else {
        console.log(`✅ Peso: ${currentLoad}/${maxLoad} (Dentro do limite)`);
    }

    // 5. Validar Perícias
    const maxSkills = classData.trainedSkills;
    if (char.skills.length > maxSkills) {
        console.error(`❌ PERÍCIAS EXCEDENTES: ${char.skills.length} treinadas. Limite da classe é ${maxSkills}.`);
    } else {
        console.log(`✅ Perícias: ${char.skills.length}/${maxSkills} (Dentro do limite)`);
    }

    console.log("\n🏁 FIM DA AUDITORIA.");
}

// Executar
validateCharacter('elias.json');
