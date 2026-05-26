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
  labelWidth = 42
) {
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(10.5);
  doc.text(label, x, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(31, 41, 55);
  doc.text(`: ${value}`, x + labelWidth, y);
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

  const blue = [37, 99, 235] as const;
  const dark = [17, 24, 39] as const;
  const muted = [107, 114, 128] as const;
  const lightBg = [248, 250, 252] as const;
  const border = [226, 232, 240] as const;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 297, "F");

  doc.setFillColor(dark[0], dark[1], dark[2]);
  doc.roundedRect(12, 12, 186, 38, 4, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("SI MAGANG", marginX, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text("Sistem Absensi & Tugas Peserta Magang", marginX, 35);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(145, 20, 40, 10, 3, 3, "F");

  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CREDENTIAL", 152, 26.8);

  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Credential Peserta", marginX, 62);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text("Dokumen ini berisi data login awal peserta magang.", marginX, 69);

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.roundedRect(16, 78, 178, 92, 5, 5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.setFontSize(13);
  doc.text("Nama Peserta", 24, 91);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(blue[0], blue[1], blue[2]);
  doc.setFontSize(14);
  doc.text(formatValue(nama), 24, 99);

  doc.setDrawColor(border[0], border[1], border[2]);
  doc.line(24, 106, 186, 106);

  const startY = 116;
  const lineGap = 12;

  drawLabelValue(doc, "Username", formatValue(username), 24, startY);
  drawLabelValue(doc, "Email", formatValue(email), 24, startY + lineGap);
  drawLabelValue(doc, "Divisi", formatValue(division), 24, startY + lineGap * 2);
  drawLabelValue(doc, "Instansi", formatValue(instansi), 24, startY + lineGap * 3);

  doc.setFillColor(17, 24, 39);
  doc.roundedRect(16, 182, 178, 30, 5, 5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PASSWORD AWAL", 24, 192);

  doc.setFontSize(16);
  doc.text(formatValue(password), 24, 203);

  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 224, 71);
  doc.roundedRect(16, 222, 178, 28, 5, 5, "FD");

  doc.setTextColor(146, 64, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Catatan", 24, 232);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(120, 53, 15);
  const note =
    "Peserta wajib mengganti password saat login pertama agar akun tetap aman.";
  const wrappedNote = doc.splitTextToSize(note, 160);
  doc.text(wrappedNote, 24, 239);

  doc.setDrawColor(border[0], border[1], border[2]);
  doc.line(16, 262, 194, 262);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text("SI Magang PLN • Dokumen dibuat otomatis oleh sistem", 16, 270);

  return doc.output("arraybuffer");
}