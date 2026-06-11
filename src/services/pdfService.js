import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, getMeetingTypeLabel } from '../utils/formatters'

// Identidad corporativa
const PRIMARY = [26, 43, 76]      // #1A2B4C - Azul Marino Oscuro (títulos y barras)
const SECONDARY = [37, 150, 215]  // #2596D7 - Azul Celeste (acentos / divisores)
const ACCENT = [163, 198, 18]     // #A3C612 - Verde Lima (detalle)
const BG_LIGHT = [244, 246, 249]  // #F4F6F9 - fondo de bloques
const TEXT_DARK = [51, 51, 51]    // gris oscuro casi negro (cuerpo de texto)
const GRAY = [100, 116, 139]
const WHITE = [255, 255, 255]

const TINT_SKY = [222, 240, 252]
const TINT_LIME = [240, 246, 214]

const VALUES_LINE =
  '•  INNOVACIÓN     •  CUIDADO     •  EXCELENCIA     •  SERVICIO     •  COLABORACIÓN'

export function exportMeetingPDF(meeting, agreements = []) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  const M = 20
  const CW = pw - M * 2

  // ── Header ──
  const HEADER_H = 56
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pw, HEADER_H, 'F')

  doc.setFillColor(...ACCENT)
  doc.rect(0, HEADER_H, pw, 2, 'F')

  doc.setTextColor(...WHITE)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('ACTA DE REUNIÓN', M, 24)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(meeting.projectName || '', M, 35)

  const typeLabel = getMeetingTypeLabel(meeting.type)
  doc.setFontSize(9)
  doc.text(typeLabel, M, 44)

  const dateStr = meeting.date ? formatDate(meeting.date) : ''
  doc.text(dateStr, pw - M, 24, { align: 'right' })

  // ── Info box ──
  const boxY = HEADER_H + 10
  doc.setFillColor(...BG_LIGHT)
  doc.roundedRect(M, boxY, CW, 34, 3, 3, 'F')

  const infoRows = [
    ['Fecha:', meeting.date ? formatDate(meeting.date) : '-', 'Hora inicio:', meeting.startTime || '-'],
    ['Hora término:', meeting.endTime || '-', 'Responsable acta:', meeting.minutesResponsible || '-'],
    ['Participantes:', meeting.participants || '-', '', ''],
  ]

  doc.setFontSize(8.5)
  infoRows.forEach((row, ri) => {
    const y = boxY + 7 + ri * 8
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PRIMARY)
    doc.text(row[0], M + 4, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...TEXT_DARK)
    doc.text(doc.splitTextToSize(row[1], CW / 2 - 32)[0] || '', M + 32, y)
    if (row[2]) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...PRIMARY)
      doc.text(row[2], M + CW / 2 + 4, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...TEXT_DARK)
      doc.text(doc.splitTextToSize(row[3], CW / 2 - 32)[0] || '', M + CW / 2 + 36, y)
    }
  })

  let y = boxY + 34 + 10

  function addSection(title, content) {
    if (!content || content === 'Sin información para esta sección.') return
    if (y > ph - 50) { doc.addPage(); y = M }

    doc.setFillColor(...ACCENT)
    doc.rect(M, y, 3, 7, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PRIMARY)
    doc.text(title.toUpperCase(), M + 7, y + 5.5)
    y += 9

    doc.setDrawColor(...SECONDARY)
    doc.setLineWidth(0.4)
    doc.line(M, y, pw - M, y)
    y += 6

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...TEXT_DARK)
    const lines = doc.splitTextToSize(content, CW)
    lines.forEach((line) => {
      if (y > ph - 22) { doc.addPage(); y = M }
      doc.text(line, M, y)
      y += 5.5
    })
    y += 6
  }

  if (meeting.minutes) {
    const { executiveSummary, topicsDiscussed, agreements: agText, commitments, nextSteps, observations } = meeting.minutes
    addSection('Resumen Ejecutivo', executiveSummary)
    addSection('Temas Conversados', topicsDiscussed)
    addSection('Acuerdos', agText)
    addSection('Compromisos', commitments)
    addSection('Próximos Pasos', nextSteps)
    addSection('Observaciones', observations)
  } else if (meeting.quickNotes) {
    addSection('Notas de la Reunión', meeting.quickNotes)
  }

  // ── Agreements table ──
  if (agreements.length > 0) {
    if (y > ph - 70) { doc.addPage(); y = M }

    doc.setFillColor(...ACCENT)
    doc.rect(M, y, 3, 7, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PRIMARY)
    doc.text('TABLA DE ACUERDOS Y COMPROMISOS', M + 7, y + 5.5)
    y += 9

    doc.setDrawColor(...SECONDARY)
    doc.setLineWidth(0.4)
    doc.line(M, y, pw - M, y)
    y += 6

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['#', 'Descripción', 'Responsable', 'Fecha límite', 'Estado']],
      body: agreements.map((ag, i) => [
        i + 1,
        ag.description || '',
        ag.responsible || '-',
        ag.dueDate ? formatDate(ag.dueDate) : '-',
        ag.status === 'pending' ? 'Pendiente' : ag.status === 'in_progress' ? 'En Proceso' : 'Cerrado',
      ]),
      headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
      alternateRowStyles: { fillColor: BG_LIGHT },
      columnStyles: { 0: { cellWidth: 8 }, 3: { cellWidth: 24 }, 4: { cellWidth: 22 } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw === 'Cerrado') {
            data.cell.styles.fillColor = TINT_LIME
            data.cell.styles.textColor = PRIMARY
            data.cell.styles.fontStyle = 'bold'
          } else if (data.cell.raw === 'En Proceso') {
            data.cell.styles.fillColor = TINT_SKY
            data.cell.styles.textColor = PRIMARY
            data.cell.styles.fontStyle = 'bold'
          }
        }
      },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  // ── Footer ──
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setDrawColor(...SECONDARY)
    doc.setLineWidth(0.3)
    doc.line(M, ph - 15, pw - M, ph - 15)

    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...GRAY)
    doc.text(VALUES_LINE, pw / 2, ph - 10, { align: 'center' })

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text('Mis Actas de Reunión', M, ph - 5)
    doc.text(`Página ${i} de ${total}`, pw - M, ph - 5, { align: 'right' })
  }

  const safe = (s) => (s || 'reunion').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
  doc.save(`Acta_${safe(meeting.projectName)}_${meeting.date || 'sin-fecha'}.pdf`)
}
