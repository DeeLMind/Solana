const http = require("http");
const https = require("https");

function getRiskLevel(score) {
  if (score >= 70) {
    return "HIGH";
  }

  if (score >= 35) {
    return "MEDIUM";
  }

  return "LOW";
}

function logEvent(event) {
  const riskLevel = getRiskLevel(event.riskScore);
  const printable = {
    ...event,
    riskLevel,
  };

  console.log(
    `[${printable.detectedAt}] ${riskLevel} score=${printable.riskScore} signature=${printable.signature}`
  );

  printable.findings.forEach((finding, index) => {
    console.log(
      `  [${index + 1}] ${finding.rule} | +${finding.scoreDelta} | ${finding.summary}`
    );
  });

  console.log(JSON.stringify(printable, null, 2));
}

function postJson(urlString, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const transport = url.protocol === "https:" ? https : http;
    const body = JSON.stringify(payload);

    const req = transport.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        res.on("data", () => {});
        res.on("end", resolve);
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function notify(event, webhookUrl) {
  if (!webhookUrl) {
    return;
  }

  try {
    await postJson(webhookUrl, event);
  } catch (error) {
    console.error("webhook notify failed:", error.message || error);
  }
}

module.exports = {
  getRiskLevel,
  logEvent,
  notify,
};
