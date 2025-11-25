const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

app.get("/api/test", (req, res) => {
  res.json({ ok: true, message: "Backend 動作OK" });
});

app.listen(4000, () => console.log("API running on 
http://localhost:4000"));

