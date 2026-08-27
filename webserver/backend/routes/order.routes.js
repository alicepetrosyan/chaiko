import express from "express";
const router = express.Router();

// POST — now used by an internal helper below, but exposed here too as a fallback
router.post("/", (req, res) => {
    const { name, syrups } = req.body;
    if (!syrups || !Array.isArray(syrups)) {
        return res.status(400).json({ message: "Invalid syrup data" });
    }

    const order = { name, syrups, createdAt: new Date() };
    const wss = req.app.get("wss");

    let delivered = 0;
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(order));
            delivered++;
        }
    });

    if (delivered === 0) {
        return res.status(503).json({ message: "No device connected to receive the order" });
    }

    res.status(200).json({ message: "Order sent", order });
});

export default router;