"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatBlock = void 0;
const react_1 = __importDefault(require("react"));
const useSheetStore_1 = require("../store/useSheetStore");
const StatBlock = ({ attribute, label }) => {
    const { character, increaseAttribute } = (0, useSheetStore_1.useSheetStore)();
    const value = character.attributes[attribute];
    const handleIncrease = () => {
        const result = increaseAttribute(attribute);
        if (result.success) {
            // Success Feedback
            console.log(result.message);
            if (result.impact) {
                console.log("Impact:", result.impact);
            }
        }
        else {
            // Error Feedback
            alert(`${result.message}\n${result.explanation || ''}`);
        }
    };
    return (react_1.default.createElement("div", { className: "flex items-center justify-between p-2 bg-zinc-950 rounded border border-zinc-800" },
        react_1.default.createElement("div", { className: "flex flex-col" },
            react_1.default.createElement("span", { className: "text-2xl font-bold text-zinc-100" }, value),
            react_1.default.createElement("span", { className: "text-xs uppercase text-zinc-500" }, label)),
        react_1.default.createElement("button", { onClick: handleIncrease, className: "w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 flex items-center justify-center font-bold" }, "+")));
};
exports.StatBlock = StatBlock;
//# sourceMappingURL=StatBlock.js.map