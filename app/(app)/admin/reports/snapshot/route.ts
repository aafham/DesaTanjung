import { NextResponse } from "next/server";
import { getAdminReportData } from "@/lib/admin-report-data";
import { formatTimestamp } from "@/lib/utils";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCurrency(value: number) {
  return `RM ${value.toFixed(2)}`;
}

function renderSnapshotHtml(data: Awaited<ReturnType<typeof getAdminReportData>>) {
  const {
    currentMonth,
    currentMonthLabel,
    dueDateLabel,
    residents,
    settings,
    totals,
    warnings,
  } = data;
  const collectionRate =
    totals.totalResidents > 0
      ? Math.round((totals.paidCount / totals.totalResidents) * 100)
      : 0;
  const generatedAt = formatTimestamp(new Date().toISOString());
  const warningItems = warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join("");
  const residentRows = residents
    .map((resident) => {
      const payment = resident.currentPayment;

      return `
        <tr>
          <td>${escapeHtml(resident.house_number)}</td>
          <td>${escapeHtml(resident.name)}</td>
          <td>${escapeHtml(payment?.display_status ?? "unpaid")}</td>
          <td>${escapeHtml(payment?.payment_method ?? "-")}</td>
          <td>${escapeHtml(payment?.updated_at ? formatTimestamp(payment.updated_at) : "No record yet")}</td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(settings.community_name)} Monthly Collection Snapshot ${escapeHtml(currentMonthLabel)}</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #0f172a;
        --muted: #475569;
        --line: #cbd5e1;
        --soft: #f8fafc;
        --brand: #0f766e;
        --brand-soft: #ccfbf1;
        --warn: #92400e;
        --warn-soft: #fef3c7;
        --danger: #9f1239;
        --danger-soft: #ffe4e6;
        --ok: #166534;
        --ok-soft: #dcfce7;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px;
        font-family: "Segoe UI", Arial, sans-serif;
        color: var(--ink);
        background: white;
      }

      .page {
        max-width: 1120px;
        margin: 0 auto;
      }

      .hero {
        border: 1px solid var(--line);
        border-radius: 28px;
        padding: 28px;
        background: linear-gradient(135deg, #07111f 0%, #10263a 45%, #134e4a 100%);
        color: white;
      }

      .eyebrow {
        margin: 0;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: #99f6e4;
      }

      h1, h2, h3, p { margin: 0; }

      .hero h1 {
        margin-top: 14px;
        font-size: 36px;
        line-height: 1.15;
      }

      .hero p {
        margin-top: 12px;
        max-width: 800px;
        color: #e2e8f0;
        line-height: 1.7;
      }

      .grid {
        display: grid;
        gap: 16px;
        margin-top: 24px;
      }

      .grid.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .grid.cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      .grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

      .card {
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 20px;
        background: white;
      }

      .card.soft { background: var(--soft); }
      .card.ok { background: var(--ok-soft); border-color: #86efac; }
      .card.warn { background: var(--warn-soft); border-color: #fcd34d; }
      .card.danger { background: var(--danger-soft); border-color: #fda4af; }
      .card.brand { background: #ecfeff; border-color: #67e8f9; }

      .label {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .value {
        margin-top: 10px;
        font-size: 32px;
        font-weight: 700;
        color: var(--ink);
      }

      .copy {
        margin-top: 10px;
        font-size: 15px;
        line-height: 1.6;
        color: var(--muted);
      }

      .section {
        margin-top: 24px;
      }

      .section-title {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .progress {
        margin-top: 16px;
        height: 14px;
        border-radius: 999px;
        background: #e2e8f0;
        overflow: hidden;
      }

      .progress-bar {
        height: 100%;
        background: var(--brand);
        width: ${collectionRate}%;
      }

      .meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 24px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
      }

      th, td {
        border-bottom: 1px solid var(--line);
        padding: 14px 16px;
        text-align: left;
        vertical-align: top;
      }

      th {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
        background: var(--soft);
      }

      td {
        font-size: 15px;
        color: var(--ink);
      }

      .warning-box {
        margin-top: 24px;
        border: 1px solid #fdba74;
        border-radius: 24px;
        background: #fff7ed;
        padding: 20px;
      }

      .warning-box ul {
        margin: 12px 0 0;
        padding-left: 20px;
      }

      .footer {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
        margin-top: 32px;
      }

      .signature {
        margin-top: 48px;
        border-top: 1px solid var(--line);
        padding-top: 12px;
        color: var(--muted);
      }

      @media (max-width: 960px) {
        body { padding: 20px; }
        .grid.cols-4, .grid.cols-5, .grid.cols-2, .meta, .footer {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <p class="eyebrow">${escapeHtml(settings.community_name)}</p>
        <h1>Monthly Collection Snapshot</h1>
        <p>${escapeHtml(currentMonthLabel)}. Generated on ${escapeHtml(generatedAt)} for committee review without relying on browser print tools.</p>
      </section>

      <section class="meta">
        <div class="card">
          <p class="label">Bank account</p>
          <p class="value" style="font-size: 22px;">${escapeHtml(settings.bank_name)}</p>
          <p class="copy">${escapeHtml(settings.bank_account_name)}<br />${escapeHtml(settings.bank_account_number)}</p>
        </div>
        <div class="card">
          <p class="label">Due date</p>
          <p class="value" style="font-size: 22px;">${escapeHtml(dueDateLabel)}</p>
          <p class="copy">Monthly fee ${escapeHtml(renderCurrency(settings.monthly_fee ?? 0))}</p>
        </div>
        <div class="card">
          <p class="label">Month key</p>
          <p class="value" style="font-size: 22px;">${escapeHtml(currentMonth)}</p>
          <p class="copy">Snapshot file for archiving or sharing.</p>
        </div>
      </section>

      <section class="grid cols-5">
        <div class="card soft">
          <p class="label">Collection rate</p>
          <p class="value">${collectionRate}%</p>
          <p class="copy">Share of houses settled for the selected month.</p>
        </div>
        <div class="card ok">
          <p class="label">Paid</p>
          <p class="value">${totals.paidCount}</p>
          <p class="copy">${renderCurrency(totals.collectedAmount)} collected.</p>
        </div>
        <div class="card warn">
          <p class="label">Pending</p>
          <p class="value">${totals.pendingCount}</p>
          <p class="copy">Receipts waiting for review.</p>
        </div>
        <div class="card danger">
          <p class="label">Need follow-up</p>
          <p class="value">${totals.unsettledCount}</p>
          <p class="copy">Unpaid, overdue, or rejected houses.</p>
        </div>
        <div class="card brand">
          <p class="label">Expected</p>
          <p class="value">${renderCurrency(totals.expectedCollection)}</p>
          <p class="copy">${totals.totalResidents} resident accounts in scope.</p>
        </div>
      </section>

      <section class="card section">
        <p class="label">Committee summary</p>
        <h2 class="section-title">Collection progress for ${escapeHtml(currentMonthLabel)}</h2>
        <p class="copy">${totals.paidCount} houses have settled payment, while ${totals.unsettledCount} still need follow-up before closing this month.</p>
        <div class="progress"><div class="progress-bar"></div></div>
      </section>

      ${
        warnings.length > 0
          ? `<section class="warning-box">
        <p class="label" style="color: var(--warn);">System warnings</p>
        <h2 class="section-title" style="font-size: 22px; margin-top: 8px;">Environment or setup follow-up</h2>
        <ul>${warningItems}</ul>
      </section>`
          : ""
      }

      <section class="card section">
        <p class="label">Resident breakdown</p>
        <h2 class="section-title">Monthly payment detail</h2>
        <table>
          <thead>
            <tr>
              <th>House</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Method</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            ${residentRows}
          </tbody>
        </table>
      </section>

      <section class="footer">
        <div class="card">
          <p class="label">Prepared by</p>
          <div class="signature">Committee / Treasurer Signature</div>
        </div>
        <div class="card">
          <p class="label">Meeting notes</p>
          <div class="signature">Record action items, approvals, and follow-up owners here.</div>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? undefined;
  const data = await getAdminReportData(month);
  const html = renderSnapshotHtml(data);
  const filename = `desa-tanjung-report-${data.currentMonth}.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
