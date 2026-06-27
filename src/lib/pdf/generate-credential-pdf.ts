import jsPDF from "jspdf";

type GenerateCredentialPdfParams = {
  nama: string;
  username: string;
  password: string;
  email: string;
  division: string;
  instansi: string;
};

function formatValue(value: string) {
  return value?.trim() || "-";
}

function drawLabelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  labelWidth = 30
) {
  doc.setFont("helvetica", "bold");
  doc.setTextColor(90, 99, 110);
  doc.setFontSize(9);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 37, 64);
  doc.setFontSize(11.5);
  doc.text(value, x, y + 6.5);
}

export function generateCredentialPdf({
  nama,
  username,
  password,
  email,
  division,
  instansi,
}: GenerateCredentialPdfParams): ArrayBuffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const marginX = 18;
  const contentW = 178;

  // Brand palette
  const blue = [0, 114, 206] as const; // #0072CE
  const blueDark = [0, 95, 171] as const; // #005FAB
  const navy = [10, 37, 64] as const; // #0A2540
  const yellow = [255, 230, 0] as const; // #FFE600
  const yellowInk = [92, 74, 0] as const; // #5C4A00
  const muted = [90, 99, 110] as const; // #5A636E
  const faint = [154, 167, 180] as const; // #9AA7B4
  const border = [220, 232, 244] as const; // light blue border
  const panelBg = [247, 250, 253] as const; // very light blue panel

  // Page background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 297, "F");

  // ── Header band (brand blue) ──
  doc.setFillColor(blue[0], blue[1], blue[2]);
  doc.roundedRect(12, 12, 186, 34, 6, 6, "F");

  // Decorative soft circle accents inside header
  doc.setFillColor(255, 255, 255);
  doc.setGState(doc.GState({ opacity: 0.06 }));
  doc.circle(178, 18, 22, "F");
  doc.circle(190, 40, 12, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SI MAGANG", marginX, 27);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Sistem Absensi & Tugas Peserta Magang", marginX, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("PT PLN (Persero) ULP Rivai Palembang", marginX, 40.5);

  // Badge "CREDENTIAL" — yellow pill
  doc.setFillColor(yellow[0], yellow[1], yellow[2]);
  doc.roundedRect(150, 18, 36, 9, 4.5, 4.5, "F");
  doc.setTextColor(yellowInk[0], yellowInk[1], yellowInk[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("CREDENTIAL", 168, 23.7, { align: "center" });

  // ── Title block ──
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Credential Peserta Magang", marginX, 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text(
    "Dokumen ini berisi data login awal peserta. Simpan dengan baik dan jangan dibagikan.",
    marginX,
    64.5
  );

  // ── Identity panel ──
  const panelY = 72;
  const panelH = 46;
  doc.setFillColor(panelBg[0], panelBg[1], panelBg[2]);
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, panelY, contentW, panelH, 5, 5, "FD");

  // Avatar circle with initial
  const initial = (nama?.trim()?.charAt(0) || "?").toUpperCase();
  doc.setFillColor(blue[0], blue[1], blue[2]);
  doc.circle(marginX + 17, panelY + 23, 11, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(initial, marginX + 17, panelY + 26.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text("NAMA PESERTA", marginX + 34, panelY + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(formatValue(nama), marginX + 34, panelY + 23);

  // Divisi pill under name
  doc.setFillColor(230, 243, 255);
  const divisiText = formatValue(division);
  const divisiWidth = doc.getTextWidth(divisiText) + 8;
  doc.roundedRect(marginX + 34, panelY + 27, divisiWidth, 7.5, 3.5, 3.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(blueDark[0], blueDark[1], blueDark[2]);
  doc.text(divisiText, marginX + 34 + 4, panelY + 32.2);

  // Vertical divider
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.line(marginX + 110, panelY + 8, marginX + 110, panelY + panelH - 8);

  // Email + Instansi on the right side of the panel
  drawLabelValue(doc, "Email", formatValue(email), marginX + 118, panelY + 17);
  drawLabelValue(doc, "Instansi", formatValue(instansi), marginX + 118, panelY + 33);

  // ── Credentials section ──
  const credY = panelY + panelH + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text("Data Login", marginX, credY);

  const boxY = credY + 5;
  const boxH = 24;
  const boxGap = 5;
  const boxW = (contentW - boxGap) / 2;

  // Username box
  doc.setFillColor(panelBg[0], panelBg[1], panelBg[2]);
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.roundedRect(marginX, boxY, boxW, boxH, 4, 4, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text("USERNAME", marginX + 7, boxY + 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(formatValue(username), marginX + 7, boxY + 18);

  // Password box — emphasized in navy
  const pwBoxX = marginX + boxW + boxGap;
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.roundedRect(pwBoxX, boxY, boxW, boxH, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(yellow[0], yellow[1], yellow[2]);
  doc.text("PASSWORD AWAL", pwBoxX + 7, boxY + 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(formatValue(password), pwBoxX + 7, boxY + 18);

  // ── Note callout ──
  const noteY = boxY + boxH + 10;
  const noteH = 26;
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(yellow[0], yellow[1], yellow[2]);
  doc.setLineWidth(0.6);
  doc.line(marginX, noteY, marginX, noteY + noteH);
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 224, 71);
  doc.roundedRect(marginX, noteY, contentW, noteH, 4, 4, "F");
  // redraw left accent bar on top
  doc.setFillColor(yellow[0], yellow[1], yellow[2]);
  doc.rect(marginX, noteY, 3, noteH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(120, 53, 15);
  doc.text("Catatan Penting", marginX + 9, noteY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 53, 15);
  const note =
    "Peserta wajib mengganti password saat login pertama agar akun tetap aman. Jangan membagikan kredensial ini kepada pihak lain.";
  const wrappedNote = doc.splitTextToSize(note, contentW - 18);
  doc.text(wrappedNote, marginX + 9, noteY + 15.5);

  // ── Footer ──
  const footY = noteY + noteH + 14;
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.setLineWidth(0.3);
  doc.line(marginX, footY, marginX + contentW, footY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(faint[0], faint[1], faint[2]);
  doc.text("SI Magang PLN • Dokumen dibuat otomatis oleh sistem", marginX, footY + 7);

  const generatedDate = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(generatedDate, marginX + contentW, footY + 7, { align: "right" });

  return doc.output("arraybuffer");
}
