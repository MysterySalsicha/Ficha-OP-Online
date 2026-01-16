"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const Login_1 = require("./pages/Login");
const Lobby_1 = require("./pages/Lobby");
const GameRoom_1 = require("./pages/GameRoom");
const CharacterCreationWizard_1 = require("./pages/CharacterCreationWizard");
function App() {
    return (react_1.default.createElement(react_router_dom_1.BrowserRouter, null,
        react_1.default.createElement(react_router_dom_1.Routes, null,
            react_1.default.createElement(react_router_dom_1.Route, { path: "/login", element: react_1.default.createElement(Login_1.Login, null) }),
            react_1.default.createElement(react_router_dom_1.Route, { path: "/lobby", element: react_1.default.createElement(Lobby_1.Lobby, null) }),
            react_1.default.createElement(react_router_dom_1.Route, { path: "/mesa/:id", element: react_1.default.createElement(GameRoom_1.GameRoom, null) }),
            react_1.default.createElement(react_router_dom_1.Route, { path: "/criar-personagem/:mesaId", element: react_1.default.createElement(CharacterCreationWizard_1.CharacterCreationWizard, null) }),
            react_1.default.createElement(react_router_dom_1.Route, { path: "*", element: react_1.default.createElement(react_router_dom_1.Navigate, { to: "/login", replace: true }) }))));
}
exports.default = App;
//# sourceMappingURL=App.js.map