import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "/Users/katerinaanisimova/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const outputDir = new URL("../output/", import.meta.url);
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const overview = workbook.worksheets.add("Overview");
const leads = workbook.worksheets.add("Leads");
const webinars = workbook.worksheets.add("Webinars");
const lists = workbook.worksheets.add("Lists");

const navy = "#262C9E";
const navyDeep = "#1C2170";
const cream = "#F4F5F7";
const white = "#FFFFFF";
const line = "#D8DCE8";
const green = "#DCFCE7";
const red = "#FEE2E2";
const amber = "#FEF3C7";

function styleTitle(sheet, range) {
  const title = sheet.getRange(range);
  title.format.fill = navy;
  title.format.font = { bold: true, color: white, size: 18 };
  title.format.rowHeight = 34;
  title.format.verticalAlignment = "center";
}

function styleHeader(sheet, range) {
  const header = sheet.getRange(range);
  header.format.fill = navy;
  header.format.font = { bold: true, color: white };
  header.format.wrapText = true;
  header.format.verticalAlignment = "center";
  header.format.rowHeight = 34;
  header.format.borders = { preset: "all", style: "thin", color: navyDeep };
}

overview.showGridLines = false;
overview.getRange("A1:F1").merge();
overview.getRange("A1").values = [["CSS Webinar Lead & Attendance Tracker"]];
styleTitle(overview, "A1:F1");
overview.getRange("A3:A8").values = [
  ["Registered leads"],
  ["Attended"],
  ["No-show"],
  ["Attendance rate"],
  ["Recording purchases"],
  ["Recording revenue (USD)"],
];
overview.getRange("B3:B8").formulas = [
  ['=COUNTIFS(Leads!$R$2:$R$2000,"Registered")'],
  ['=COUNTIFS(Leads!$R$2:$R$2000,"Registered",Leads!$U$2:$U$2000,"Attended")'],
  ['=COUNTIFS(Leads!$R$2:$R$2000,"Registered",Leads!$U$2:$U$2000,"No-show")'],
  ["=IFERROR(B4/B3,0)"],
  ['=COUNTIFS(Leads!$Y$2:$Y$2000,"Paid")'],
  ['=SUMIFS(Leads!$AB$2:$AB$2000,Leads!$Y$2:$Y$2000,"Paid",Leads!$AC$2:$AC$2000,"USD")'],
];
overview.getRange("A3:B8").format.borders = { preset: "all", style: "thin", color: line };
overview.getRange("A3:A8").format.fill = cream;
overview.getRange("A3:A8").format.font = { bold: true, color: navyDeep };
overview.getRange("B3:B8").format.font = { bold: true, color: navyDeep, size: 14 };
overview.getRange("B6").setNumberFormat("0.0%");
overview.getRange("B8").setNumberFormat("$#,##0.00");
overview.getRange("A11:F11").merge();
overview.getRange("A11").values = [["How to use this workbook"]];
overview.getRange("A11:F11").format.fill = navy;
overview.getRange("A11:F11").format.font = { bold: true, color: white };
overview.getRange("A12:F15").merge(true);
overview.getRange("A12").values = [[
  "1. Create one row in Webinars for every new webinar.\n2. Every form submission creates one row in Leads with the matching Webinar ID.\n3. After the webinar, attendance is matched by email from the Zoom participant report.\n4. Keep Zoom join links private: each registrant must receive their own unique link."
]];
overview.getRange("A12:F15").format.wrapText = true;
overview.getRange("A12:F15").format.verticalAlignment = "top";
overview.getRange("A12:F15").format.fill = "#FFFFFF";
overview.getRange("A12:F15").format.borders = { preset: "outside", style: "thin", color: line };
overview.getRange("A:A").format.columnWidth = 27;
overview.getRange("B:B").format.columnWidth = 18;
overview.getRange("C:F").format.columnWidth = 14;
overview.freezePanes.freezeRows(1);

const leadHeaders = [
  "Lead ID", "Registered At (UTC)", "Webinar ID", "Webinar Title", "Webinar Date",
  "First Name", "Last Name", "Email", "Phone", "Brand / Company", "Country",
  "UTM Source", "UTM Medium", "UTM Campaign", "UTM Content", "Landing URL",
  "Marketing Consent", "Registration Status", "Zoom Registrant ID", "Zoom Join URL",
  "Attendance Status", "Join Time (UTC)", "Leave Time (UTC)", "Duration (min)",
  "Recording Status", "Payment Provider", "Payment ID", "Amount", "Currency",
  "Brevo Contact ID", "Email Delivery Status", "Notes"
];
leads.getRange("A1:AF1").values = [leadHeaders];
styleHeader(leads, "A1:AF1");
leads.getRange("A2:AF2").values = [[
  "EXAMPLE-DELETE", new Date("2026-07-22T09:00:00Z"), "WEB-TBC-01", "Fashion Brand as a System", null,
  "Test", "Lead", "test@example.com", "+44 0000 000000", "Example Brand", "GB",
  "meta", "paid_social", "webinar_tbc", "example", "https://example.com/webinar",
  true, "Test", "", "", "Unknown", null, null, 0,
  "Not purchased", "", "", 0, "USD", "", "Pending", "Delete this example row after setup"
]];
leads.getRange("A2:AF2000").format.borders = { preset: "inside", style: "thin", color: "#ECEEF5" };
leads.getRange("B2:B2000").setNumberFormat("yyyy-mm-dd hh:mm");
leads.getRange("E2:E2000").setNumberFormat("yyyy-mm-dd");
leads.getRange("V2:W2000").setNumberFormat("yyyy-mm-dd hh:mm");
leads.getRange("X2:X2000").setNumberFormat("0");
leads.getRange("AB2:AB2000").setNumberFormat("0.00");
leads.getRange("A2:AF2000").format.verticalAlignment = "top";
leads.getRange("A2:AF2000").format.wrapText = false;
leads.getRange("Q2:Q2000").dataValidation = { rule: { type: "list", values: ["TRUE", "FALSE"] } };
leads.getRange("R2:R2000").dataValidation = { rule: { type: "list", values: ["Registered", "Cancelled", "Test"] } };
leads.getRange("U2:U2000").dataValidation = { rule: { type: "list", values: ["Unknown", "Attended", "No-show"] } };
leads.getRange("Y2:Y2000").dataValidation = { rule: { type: "list", values: ["Not offered", "Not purchased", "Paid", "Refunded"] } };
leads.getRange("Z2:Z2000").dataValidation = { rule: { type: "list", values: ["Stripe", "PayPal", "Other"] } };
leads.getRange("AC2:AC2000").dataValidation = { rule: { type: "list", values: ["USD", "GBP", "EUR"] } };
leads.getRange("AE2:AE2000").dataValidation = { rule: { type: "list", values: ["Pending", "Sent", "Delivered", "Bounced", "Failed"] } };
leads.getRange("U2:U2000").conditionalFormats.add("containsText", { text: "Attended", format: { fill: green } });
leads.getRange("U2:U2000").conditionalFormats.add("containsText", { text: "No-show", format: { fill: red } });
leads.getRange("U2:U2000").conditionalFormats.add("containsText", { text: "Unknown", format: { fill: amber } });
leads.freezePanes.freezeRows(1);
leads.freezePanes.freezeColumns(3);
leads.getRange("A:A").format.columnWidth = 18;
leads.getRange("B:B").format.columnWidth = 20;
leads.getRange("C:C").format.columnWidth = 16;
leads.getRange("D:D").format.columnWidth = 28;
leads.getRange("E:E").format.columnWidth = 14;
leads.getRange("F:G").format.columnWidth = 15;
leads.getRange("H:H").format.columnWidth = 28;
leads.getRange("I:J").format.columnWidth = 20;
leads.getRange("K:O").format.columnWidth = 16;
leads.getRange("P:P").format.columnWidth = 32;
leads.getRange("Q:R").format.columnWidth = 18;
leads.getRange("S:T").format.columnWidth = 28;
leads.getRange("U:W").format.columnWidth = 19;
leads.getRange("X:AF").format.columnWidth = 18;

const webinarHeaders = [
  "Webinar ID", "Title", "Date", "Start Time", "Time Zone", "Duration (min)",
  "Zoom Meeting ID", "Registration Required", "Landing URL", "Live Price",
  "Recording Price", "Currency", "Status", "Registrations", "Attended", "No-show",
  "Attendance Rate", "Recording Sales", "Recording Revenue", "Notes"
];
webinars.getRange("A1:T1").values = [webinarHeaders];
styleHeader(webinars, "A1:T1");
webinars.getRange("A2:M2").values = [[
  "WEB-TBC-01", "Fashion Brand as a System", null, "TBC", "Europe/London", 60,
  "", "Yes", "", 0, 30, "USD", "Planning"
]];
webinars.getRange("N2:S2").formulas = [[
  '=COUNTIFS(Leads!$C$2:$C$2000,A2,Leads!$R$2:$R$2000,"Registered")',
  '=COUNTIFS(Leads!$C$2:$C$2000,A2,Leads!$R$2:$R$2000,"Registered",Leads!$U$2:$U$2000,"Attended")',
  '=COUNTIFS(Leads!$C$2:$C$2000,A2,Leads!$R$2:$R$2000,"Registered",Leads!$U$2:$U$2000,"No-show")',
  "=IFERROR(O2/N2,0)",
  '=COUNTIFS(Leads!$C$2:$C$2000,A2,Leads!$Y$2:$Y$2000,"Paid")',
  '=SUMIFS(Leads!$AB$2:$AB$2000,Leads!$C$2:$C$2000,A2,Leads!$Y$2:$Y$2000,"Paid",Leads!$AC$2:$AC$2000,L2)'
]];
webinars.getRange("T2").values = [["Date and time intentionally left TBC"]];
webinars.getRange("C2:C500").setNumberFormat("yyyy-mm-dd");
webinars.getRange("J2:K500").setNumberFormat("0.00");
webinars.getRange("Q2:Q500").setNumberFormat("0.0%");
webinars.getRange("S2:S500").setNumberFormat("0.00");
webinars.getRange("H2:H500").dataValidation = { rule: { type: "list", values: ["Yes", "No"] } };
webinars.getRange("L2:L500").dataValidation = { rule: { type: "list", values: ["USD", "GBP", "EUR"] } };
webinars.getRange("M2:M500").dataValidation = { rule: { type: "list", values: ["Planning", "Registration open", "Completed", "Cancelled"] } };
webinars.getRange("A2:T500").format.borders = { preset: "inside", style: "thin", color: "#ECEEF5" };
webinars.freezePanes.freezeRows(1);
webinars.freezePanes.freezeColumns(2);
webinars.getRange("A:A").format.columnWidth = 17;
webinars.getRange("B:B").format.columnWidth = 30;
webinars.getRange("C:D").format.columnWidth = 14;
webinars.getRange("E:E").format.columnWidth = 19;
webinars.getRange("F:H").format.columnWidth = 18;
webinars.getRange("I:I").format.columnWidth = 30;
webinars.getRange("J:S").format.columnWidth = 16;
webinars.getRange("T:T").format.columnWidth = 30;

lists.showGridLines = false;
lists.getRange("A1:G1").values = [[
  "Registration Status", "Attendance Status", "Recording Status", "Email Status",
  "Webinar Status", "Payment Provider", "Currency"
]];
styleHeader(lists, "A1:G1");
lists.getRange("A2:G6").values = [
  ["Registered", "Unknown", "Not offered", "Pending", "Planning", "Stripe", "USD"],
  ["Cancelled", "Attended", "Not purchased", "Sent", "Registration open", "PayPal", "GBP"],
  ["Test", "No-show", "Paid", "Delivered", "Completed", "Other", "EUR"],
  [null, null, "Refunded", "Bounced", "Cancelled", null, null],
  [null, null, null, "Failed", null, null, null],
];
lists.getRange("A1:G6").format.borders = { preset: "all", style: "thin", color: line };
lists.getRange("A:G").format.columnWidth = 23;
lists.freezePanes.freezeRows(1);

const inspect = await workbook.inspect({
  kind: "workbook,sheet,formula",
  maxChars: 6000,
  tableMaxRows: 4,
  tableMaxCols: 8,
  options: { maxResults: 50 },
});
console.log(inspect.ndjson);

for (const sheetName of ["Overview", "Leads", "Webinars", "Lists"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(new URL(`../output/${sheetName}.png`, import.meta.url), new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(new URL("../output/CSS_Webinar_Leads_Tracker.xlsx", import.meta.url).pathname);
console.log("Workbook exported");
