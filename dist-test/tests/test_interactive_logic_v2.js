"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const useSheetStore_1 = require("../src/store/useSheetStore");
const seed_items_json_1 = __importDefault(require("../src/data/seed_items.json"));
async function testInteractiveLogic() {
    var _a;
    const results = [];
    const log = (msg) => results.push(msg);
    log("🧪 Testing Interactive UX Logic...");
    const store = useSheetStore_1.useSheetStore.getState();
    // 1. Initial State Check
    if (store.character.stats_max.pv !== 20)
        throw new Error(`Initial PV wrong: ${store.character.stats_max.pv}`);
    log("✅ Initial PV Correct");
    // 2. Increase Vigor
    const result = useSheetStore_1.useSheetStore.getState().increaseAttribute('vig');
    if (!result.success)
        throw new Error("Increase Vigor failed");
    if (!((_a = result.impact) === null || _a === void 0 ? void 0 : _a.pv_increase))
        throw new Error("Missing PV Increase Impact flag");
    log("✅ Vigor Increase Feedback Correct");
    // 3. Increase NEX
    const resNex = useSheetStore_1.useSheetStore.getState().increaseNEX(5); // 5 -> 10
    if (resNex.trigger !== 'LEVEL_UP_TRAIL')
        throw new Error(`Missing Trigger. Got ${resNex.trigger}`);
    log("✅ Trigger Correct: LEVEL_UP_TRAIL");
    // 4. Equip Item
    // @ts-ignore
    const item = { ...seed_items_json_1.default[0], character_id: 'temp' };
    useSheetStore_1.useSheetStore.getState().equipItem(item);
    const slotsUsed = useSheetStore_1.useSheetStore.getState().items.reduce((a, b) => a + b.slots * b.quantity, 0);
    if (slotsUsed !== 1)
        throw new Error("Slots calculation wrong");
    log("✅ Slots Calculation Correct");
    fs.writeFileSync('test_result.txt', results.join('\n'));
}
testInteractiveLogic().catch(e => {
    fs.writeFileSync('test_result.txt', `❌ FAILED: ${e.message}`);
    process.exit(1);
});
//# sourceMappingURL=test_interactive_logic_v2.js.map