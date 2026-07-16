"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";

export type ExportTugasRow = {
  no: number;
  tanggal: string;
  uraian: string;
};

type Props = {
  namaPeserta: string;
  nim?: string;
  jurusan?: string;
  instansi?: string;
  unitBagian?: string;
  alamatInstansi?: string;
  periode?: string;
  rows: ExportTugasRow[];
};

export function ExportTugasPdfButton({
  namaPeserta,
  nim,
  jurusan,
  instansi,
  unitBagian,
  alamatInstansi,
  periode,
  rows,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      // A4 potrait
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 14;

      // Judul (tanpa kop/logo instansi)
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("CATATAN KEGIATAN HARIAN", pageWidth / 2, 16, { align: "center" });
      doc.text("PESERTA MAGANG / KERJA PRAKTEK", pageWidth / 2, 22, { align: "center" });

      doc.setLineWidth(0.4);
      doc.line(marginX, 26, pageWidth - marginX, 26);

      // Blok identitas
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const identitas: Array<[string, string]> = [
        ["Nama Peserta", namaPeserta || "-"],
        ...(nim ? ([["NIM", nim]] as Array<[string, string]>) : []),
        ...(jurusan ? ([["Jurusan / Program Studi", jurusan]] as Array<[string, string]>) : []),
        ...(instansi ? ([["Nama Perusahaan / Instansi", instansi]] as Array<[string, string]>) : []),
        ...(unitBagian ? ([["Unit / Bagian / Seksi", unitBagian]] as Array<[string, string]>) : []),
        ...(alamatInstansi
          ? ([["Alamat Perusahaan / Instansi", alamatInstansi]] as Array<[string, string]>)
          : []),
        ...(periode
          ? ([["Tanggal Pelaksanaan", periode]] as Array<[string, string]>)
          : []),
      ];

      let y = 33;
      const labelWidth = 55;
      identitas.forEach(([label, value]) => {
        const valueLines = doc.splitTextToSize(value, pageWidth - marginX * 2 - labelWidth - 4);
        doc.setFont("helvetica", "bold");
        doc.text(label, marginX, y);
        doc.setFont("helvetica", "normal");
        doc.text(":", marginX + labelWidth - 3, y);
        doc.text(valueLines, marginX + labelWidth, y);
        y += 5.5 * valueLines.length;
      });

      y += 2;

      autoTable(doc, {
        startY: y,
        head: [["No", "Tanggal", "Uraian Kegiatan Harian", "Paraf\nPembimbing"]],
        body: rows.map((r) => [r.no, r.tanggal, r.uraian, ""]),
        styles: { fontSize: 9.5, cellPadding: 2.5, valign: "middle", lineColor: [0, 0, 0], lineWidth: 0.2 },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
        },
        bodyStyles: { textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: 28, halign: "center" },
          2: { cellWidth: "auto" },
          3: { cellWidth: 28, halign: "center" },
        },
        theme: "grid",
        margin: { left: marginX, right: marginX },
        didParseCell: (data) => {
          // beri tinggi minimum baris supaya ada ruang tanda tangan
          if (data.section === "body") {
            data.cell.styles.minCellHeight = 14;
          }
        },
      });

      doc.save(`catatan-kegiatan-${namaPeserta.replace(/\s+/g, "_").toLowerCase()}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading || rows.length === 0}
      className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FileDown className="h-3.5 w-3.5" />
      {loading ? "Membuat PDF..." : "Export PDF"}
    </button>
  );
}