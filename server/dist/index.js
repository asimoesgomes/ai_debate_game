"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const game_1 = require("./routes/game");
const forecast_1 = require("./routes/forecast");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
// In-memory state
exports.db = {
    players: new Map(),
    topics: [
        {
            id: "safety",
            category: "debate",
            prompt: {
                en: "How would you improve safety in your community or school?",
                pt: "Como você melhoraria a segurança na sua comunidade ou escola?",
            },
        },
        {
            id: "school-excitement",
            category: "debate",
            prompt: {
                en: "What would you change in your school to make it more exciting and useful?",
                pt: "O que você mudaria na sua escola para torná-la mais empolgante e útil?",
            },
        },
        {
            id: "forecast-school-value",
            category: "forecast",
            prompt: {
                en: "What share (0-100) of kids in your community value school?",
                pt: "Qual a porcentagem (0-100) de jovens na sua comunidade que valorizam a escola?",
            },
            truth: 62,
        },
    ],
    rounds: [],
    forecastRounds: [],
};
app.get("/api/topics", (_req, res) => {
    res.json(exports.db.topics);
});
app.use("/api/game", game_1.router);
app.use("/api/forecast", forecast_1.router);
app.post("/api/player", (req, res) => {
    const { name, language, avatar } = req.body;
    if (!name || !language || !avatar) {
        return res.status(400).json({ error: "Missing fields" });
    }
    const id = Math.random().toString(36).slice(2);
    const player = {
        id,
        name,
        language,
        avatar,
        profiles: {},
        points: 0,
    };
    exports.db.players.set(id, player);
    res.json(player);
});
app.get("/api/players", (_req, res) => {
    res.json(Array.from(exports.db.players.values()));
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
