import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { connectDB } from "./config/db.js";
import recipeRoutes from "./routes/recipe.routes.js";
import dotenv from "dotenv";
import cors from "cors";
import orderRoutes from "./routes/order.routes.js";
import router from "./routes/config.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use("/api/orders", orderRoutes);
app.use(cors({
    // origin: "http://192.168.0.185:5173", // your frontend origin
    origin: "http://localhost:5173", // your frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"], // allowed HTTP methods
    credentials: true // if you plan to send cookies/auth headers
}));
app.use(express.json());
app.use("/api/recipes", recipeRoutes); // allows us to accept JSON data in req.body (to get recipe data from user)
app.use("/api/config", router); // Register the config routes


// wrap express in a raw http server so ws can share the same port
const server = http.createServer(app);

// websocket server for order pushes — the ESP32 connects here instead of polling
const wss = new WebSocketServer({ server, path: "/ws/orders" });

wss.on("connection", (ws) => {
    console.log("ESP32 (or client) connected to /ws/orders");

    ws.on("message", (rawMessage) => {
        try {
            const payload = JSON.parse(rawMessage.toString());
            const pumpCounts = Array.isArray(payload)
                ? payload
                : Array.isArray(payload.pumps)
                    ? payload.pumps
                    : [];

            const name = typeof payload?.name === 'string' ? payload.name : 'recipe';
            const order = {
                name,
                pumpCounts,
                createdAt: new Date().toISOString(),
            };

            if (!Array.isArray(pumpCounts) || pumpCounts.length === 0) {
                ws.send(JSON.stringify({
                    type: "order_ack",
                    success: false,
                    message: "Invalid order payload.",
                }));
                return;
            }

            wss.clients.forEach((client) => {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify({
                        type: "order_received",
                        success: true,
                        message: "Order received by machine.",
                        order,
                    }));
                }
            });

            ws.send(JSON.stringify({
                type: "order_ack",
                success: true,
                message: `Order sent for ${name}.`,
                order,
            }));
        } catch (error) {
            console.error("Invalid websocket payload:", error);
            ws.send(JSON.stringify({
                type: "order_ack",
                success: false,
                message: "Invalid order payload.",
            }));
        }
    });

    ws.on("close", () => console.log("WS client disconnected"));
});

// expose wss so order.routes.js (or wherever you broadcast from) can reach it
app.set("wss", wss);

server.listen(PORT, "0.0.0.0", () => {
    connectDB();
    console.log('Server started at http://localhost or http://192.168.0.185:' + PORT);
});