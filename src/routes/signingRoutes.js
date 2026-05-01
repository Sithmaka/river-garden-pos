/**
 * QZ Tray Signing Routes
 * Provides server-side signing for QZ Tray authentication
 */

import express from "express";
import { signingEndpoint } from "../services/signingService.js";

const router = express.Router();

router.post("/sign", express.json(), async (req, res) => {
  console.log("📝 [API] Signing endpoint called");
  return signingEndpoint(req, res);
});

export default router;