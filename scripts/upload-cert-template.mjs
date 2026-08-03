// One-off: uploads the certificate template PDF to the `certificates` storage bucket.
// Run once after migration_phase8.sql has created the bucket:
//   node --env-file=.env scripts/upload-cert-template.mjs <path-to-template.pdf>
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const templatePath = process.argv[2];
if (!templatePath) {
  console.error("Usage: node scripts/upload-cert-template.mjs <path-to-template.pdf>");
  process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const bytes = readFileSync(templatePath);

const { error } = await supabase.storage.from("certificates").upload("templates/certificate-of-attendance.pdf", bytes, {
  contentType: "application/pdf",
  upsert: true,
});
if (error) {
  console.error("Upload failed:", error);
  process.exit(1);
}
console.log("Uploaded certificate template to certificates/templates/certificate-of-attendance.pdf");
