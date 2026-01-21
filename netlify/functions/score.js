const scoreFromPayload = (payload) => {
  const feedback = [];
  let score = 50;

  const missingContact = [
    ["email", payload.email],
    ["phone", payload.phone],
    ["location", payload.location],
  ]
    .filter(([, value]) => !String(value || "").trim())
    .map(([label]) => label);

  if (missingContact.length) {
    feedback.push(`Add missing contact details: ${missingContact.join(", ")}.`);
  } else {
    score += 5;
  }

  if (String(payload.summary || "").trim().length >= 80) {
    score += 10;
  } else {
    feedback.push("Expand your summary to 2-3 concise sentences.");
  }

  const skills = Array.isArray(payload.skills) ? payload.skills : [];
  if (skills.length >= 6) {
    score += 10;
  } else {
    feedback.push("Add at least 6 relevant skills.");
  }

  const experience = Array.isArray(payload.experience) ? payload.experience : [];
  if (experience.length >= 4) {
    score += 15;
  } else {
    feedback.push("Add more experience bullet points with impact metrics.");
  }

  const impactKeywords = ["increased", "reduced", "improved", "delivered", "launched", "owned"];
  const expText = experience.join(" ").toLowerCase();
  if (impactKeywords.some((word) => expText.includes(word))) {
    score += 5;
  } else {
    feedback.push("Add impact verbs (e.g., increased, improved, delivered) in experience.");
  }

  if (Array.isArray(payload.education) ? payload.education.length : 0) {
    score += 5;
  } else {
    feedback.push("Include education details.");
  }

  if (Array.isArray(payload.projects) ? payload.projects.length : 0) {
    score += 5;
  } else {
    feedback.push("List 1-2 projects to showcase applied skills.");
  }

  score = Math.min(score, 100);
  if (!feedback.length) {
    feedback.push("Strong resume. Consider tailoring keywords to each job description.");
  }

  return { score, feedback };
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

  const result = scoreFromPayload(payload);
  return jsonResponse(200, result);
};
