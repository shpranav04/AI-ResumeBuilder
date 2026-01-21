const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const scoreFromText = (text) => {
  const feedback = [];
  let score = 50;
  const normalized = text.toLowerCase();

  if (text.length >= 800) {
    score += 10;
  } else {
    feedback.push("Add more detail (aim for 350-500 words).");
  }

  if (normalized.includes("skills")) {
    score += 8;
  } else {
    feedback.push("Include a dedicated skills section.");
  }

  if (
    ["experience", "work history", "employment"].some((keyword) =>
      normalized.includes(keyword)
    )
  ) {
    score += 12;
  } else {
    feedback.push("Add an experience section with impact-focused bullets.");
  }

  if (
    ["education", "degree", "university", "college"].some((keyword) =>
      normalized.includes(keyword)
    )
  ) {
    score += 6;
  } else {
    feedback.push("Add education details.");
  }

  const bulletLines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("•"));
  if (bulletLines.length >= 5) {
    score += 10;
  } else {
    feedback.push("Use more bullet points to highlight achievements.");
  }

  if (normalized.includes("@")) {
    score += 5;
  } else {
    feedback.push("Add an email address for contact info.");
  }

  score = Math.min(score, 100);
  if (!feedback.length) {
    feedback.push("Resume looks solid. Customize it for the target role and keywords.");
  }

  return { score, feedback };
};

const extractTextFromUpload = async (filename, content) => {
  const extension = filename.includes(".")
    ? filename.split(".").pop().toLowerCase()
    : "";

  if (extension === "txt" || extension === "md") {
    return content.toString("utf8");
  }

  if (extension === "pdf") {
    const data = await pdfParse(content);
    return data.text || "";
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer: content });
    return result.value || "";
  }

  throw new Error("Unsupported file type.");
};

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(payload),
});

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return jsonResponse(400, { error: "Invalid JSON payload." });
  }

  const { filename, contentBase64 } = payload || {};
  if (!filename || !contentBase64) {
    return jsonResponse(400, { error: "Missing filename or file content." });
  }

  let text;
  try {
    const buffer = Buffer.from(contentBase64, "base64");
    text = await extractTextFromUpload(filename, buffer);
  } catch (error) {
    return jsonResponse(400, { error: "Unable to read file." });
  }

  const result = scoreFromText(text);
  return jsonResponse(200, result);
};
