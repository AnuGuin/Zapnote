// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join } from "path";

import { connectToDatabase } from './config/db.js';
import router from './router/index.js';


dotenv.config({ path: join(process.cwd(), '.env') });

const app = express();
const port = process.env.PORT || 4000;

connectToDatabase();

app.use(cors());
app.use(express.json());

app.use('/api/v1', router);

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});