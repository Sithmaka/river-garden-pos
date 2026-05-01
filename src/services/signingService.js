/**
 * QZ Tray Signing Service
 * Signs requests with your private certificate for QZ Tray authentication
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createSign } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPrivateKey() {
  try {
    const keyPath = path.join(__dirname, "../../certs/site-key.pem");
    return fs.readFileSync(keyPath, "utf8");
  } catch (error) {
    console.error("❌ [Signing] Failed to load private key:", error.message);
    throw new Error("Private key not found. Run setup-override-crt.sh first.");
  }
}

export function signRequest(toSign) {
  try {
    if (typeof toSign !== "string" || !toSign.trim()) {
      throw new Error("Invalid request payload");
    }

    const privateKey = getPrivateKey();
    const signer = createSign("RSA-SHA512");
    signer.update(toSign);
    signer.end();

    const signature = signer.sign(privateKey, "base64");
    console.log("✅ [Signing] Request signed successfully");
    return signature;
  } catch (error) {
    console.error("❌ [Signing] Failed to sign request:", error.message);
    throw error;
  }
}

export function signingEndpoint(req, res) {
  try {
    const { request } = req.body || {};

    if (!request || typeof request !== "string") {
      console.error("❌ [Signing] No valid request data provided");
      return res.status(400).json({ error: "request field is required" });
    }

    const signature = signRequest(request);
    console.log("✅ [Signing] Signature sent to client");

    res.type("text/plain").send(signature);
  } catch (error) {
    console.error("❌ [Signing] Endpoint error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

export default {
  signRequest,
  signingEndpoint,
};