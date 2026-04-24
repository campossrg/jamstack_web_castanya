const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

function escapePdfText(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(text, maxLength = 78) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) {
        lines.push(current);
      }
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function buildPdf(recipe) {
  const lines = [];

  lines.push(recipe.title || "");
  lines.push(`Per ${recipe.author || ""}, ${recipe.origin || ""}`);
  lines.push("");
  lines.push(recipe.summary || "");
  lines.push("");
  lines.push(`Temps: ${recipe.time || ""}`);
  lines.push(`Dificultat: ${recipe.difficulty || ""}`);
  lines.push("");
  lines.push(recipe.ingredientsLabel || "Ingredients");

  for (const ingredient of recipe.ingredients || []) {
    lines.push(`- ${ingredient}`);
  }

  lines.push("");

  for (const step of recipe.steps || []) {
    lines.push(step.title || "");
    lines.push(step.text || "");
    lines.push("");
  }

  lines.push(recipe.secretTitle || "");
  lines.push(recipe.secretQuote || "");

  const wrapped = [];
  for (const line of lines) {
    if (!line) {
      wrapped.push("");
      continue;
    }

    wrapped.push(...wrapText(line));
  }

  let y = 790;
  const content = ["BT", "/F1 12 Tf", "50 790 Td", "14 TL"];

  wrapped.forEach((line, index) => {
    if (index === 0) {
      content.push(`(${escapePdfText(line)}) Tj`);
      return;
    }

    if (line === "") {
      content.push("T*");
      return;
    }

    y -= 14;
    if (y < 50) {
      return;
    }
    content.push("T*");
    content.push(`(${escapePdfText(line)}) Tj`);
  });

  content.push("ET");

  const stream = content.join("\n");
  const objects = [];

  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");
  objects.push("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj");
  objects.push(
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
  );
  objects.push("4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj");
  objects.push(`5 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream endobj`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const slug = event.queryStringParameters?.slug;

    if (!slug) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing recipe slug" }),
      };
    }

    const recipePath = path.join(
      process.cwd(),
      "src",
      "gastronomic",
      "receptes",
      "recipes",
      `${slug}.md`,
    );

    if (!fs.existsSync(recipePath)) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Recipe not found" }),
      };
    }

    const file = fs.readFileSync(recipePath, "utf8");
    const { data } = matter(file);

    if (!data.pdfEnabled) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "PDF not enabled for this recipe" }),
      };
    }

    const pdf = buildPdf(data);
    const fileName = `${slug}.pdf`;

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
      body: pdf.toString("base64"),
    };
  } catch (error) {
    console.error("Recipe PDF generation error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to generate recipe PDF" }),
    };
  }
};
