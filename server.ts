import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./server/app";

const app = createApp();
const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Research Intelligence Server running on http://localhost:${PORT}`);
});