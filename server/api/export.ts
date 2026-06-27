import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType
} from "docx";
import { logger } from "../utils/logger";

/**
 * Utility to clean filenames.
 */
function getSafeFilename(title: string, ext: string): string {
  const safe = title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return `${safe}_study_guide.${ext}`;
}

/**
 * PDF Export Handler using PDFKit
 */
export async function handleExportPdf(req: Request, res: Response) {
  try {
    const { guide, documentName } = req.body;
    if (!guide) {
      return res.status(400).json({ error: "Missing study guide content to export." });
    }

    const filename = getSafeFilename(guide.title || documentName || "study_guide", "pdf");
    logger.info(`Generating PDF study guide export for filename: ${filename}`);

    const doc = new PDFDocument({
      margin: 50,
      bufferPages: true,
      size: "A4"
    });

    // Pipe directly to the response stream
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    doc.pipe(res);

    // ==========================================
    // COVER / TITLE PAGE
    // ==========================================
    doc.y = 150;
    
    // Header Tag
    doc.fontSize(10)
       .font("Helvetica-Bold")
       .fillColor("#4f46e5")
       .text("MENTEEA REVISION SYSTEM", { align: "center", characterSpacing: 2 });
    
    doc.moveDown(2);

    // Document Title
    doc.fontSize(24)
       .font("Helvetica-Bold")
       .fillColor("#1e1b4b")
       .text(guide.title || "COMPREHENSIVE STUDY GUIDE", { align: "center" });

    doc.moveDown(1);

    // Divider Line
    doc.moveTo(150, doc.y)
       .lineTo(doc.page.width - 150, doc.y)
       .strokeColor("#e2e8f0")
       .lineWidth(2)
       .stroke();

    doc.moveDown(2);

    // Document Subtitle / Metadata
    doc.fontSize(11)
       .font("Helvetica")
       .fillColor("#4b5563")
       .text(`Source Chapter: ${documentName || "Class Material"}`, { align: "center" });
    
    doc.moveDown(0.5);
    
    doc.fontSize(10)
       .fillColor("#94a3b8")
       .text(`Generated on ${new Date().toLocaleDateString()}`, { align: "center" });

    // Decorative Watermark/Graphic at bottom of cover
    doc.y = doc.page.height - 150;
    doc.fontSize(9)
       .font("Helvetica-Bold")
       .fillColor("#818cf8")
       .text("PREMIUM STUDY WORKSPACE COMPANION", { align: "center", characterSpacing: 1 });

    doc.moveDown(1);
    doc.fontSize(8)
       .font("Helvetica")
       .fillColor("#cbd5e1")
       .text("Do not distribute without permission. For educational study use only.", { align: "center" });

    // Add Body Page
    doc.addPage();

    // ==========================================
    // CORE STYLING HELPERS
    // ==========================================
    const renderSectionHeader = (title: string, icon: string) => {
      doc.moveDown(1.5);
      // Nice background rect for section header
      const startY = doc.y;
      doc.rect(50, startY - 4, doc.page.width - 100, 24)
         .fill("#f8fafc");
      
      doc.fontSize(12)
         .font("Helvetica-Bold")
         .fillColor("#312e81")
         .text(`${icon}  ${title.toUpperCase()}`, 60, startY, { align: "left" });
      
      doc.moveDown(1.2);
    };

    // ==========================================
    // SECTION 1: CHAPTER OVERVIEW
    // ==========================================
    renderSectionHeader("Chapter Overview", "📚");
    doc.fontSize(10)
       .font("Helvetica")
       .fillColor("#1f2937")
       .text(guide.overview || "No overview provided.", {
         align: "justify",
         lineGap: 4
       });

    // ==========================================
    // SECTION 2: KEY CONCEPTS
    // ==========================================
    if (Array.isArray(guide.keyConcepts) && guide.keyConcepts.length > 0) {
      renderSectionHeader("Key Concepts & Pillars", "💡");
      guide.keyConcepts.forEach((item: any, idx: number) => {
        // Guard if page overflow
        if (doc.y > doc.page.height - 120) {
          doc.addPage();
        }

        doc.fontSize(11)
           .font("Helvetica-Bold")
           .fillColor("#4f46e5")
           .text(`${idx + 1}. ${item.concept}`);
        
        doc.moveDown(0.3);

        doc.fontSize(9.5)
           .font("Helvetica")
           .fillColor("#1f2937")
           .text(item.explanation, { lineGap: 3 });

        doc.moveDown(0.4);

        // Highlight "Why It Matters" box
        const startY = doc.y;
        doc.rect(60, startY, doc.page.width - 120, 32)
           .fill("#f0fdf4");

        doc.fontSize(9)
           .font("Helvetica-Bold")
           .fillColor("#15803d")
           .text("Importance / Exam Context:", 70, startY + 4);

        doc.fontSize(9)
           .font("Helvetica")
           .fillColor("#166534")
           .text(item.whyItMatters, 70, startY + 16, { width: doc.page.width - 140 });

        doc.moveDown(1.5);
      });
    }

    // ==========================================
    // SECTION 3: IMPORTANT DEFINITIONS
    // ==========================================
    if (Array.isArray(guide.importantDefinitions) && guide.importantDefinitions.length > 0) {
      if (doc.y > doc.page.height - 150) doc.addPage();
      renderSectionHeader("Important Glossary Definitions", "📝");
      guide.importantDefinitions.forEach((item: any) => {
        if (doc.y > doc.page.height - 80) doc.addPage();
        
        doc.fontSize(10)
           .font("Helvetica-Bold")
           .fillColor("#111827")
           .text(`• ${item.term}: `, { continued: true })
           .font("Helvetica")
           .fillColor("#4b5563")
           .text(item.definition, { lineGap: 2 });
        
        doc.moveDown(0.6);
      });
    }

    // ==========================================
    // SECTION 4: FORMULAE & KEY EQUATIONS
    // ==========================================
    if (Array.isArray(guide.formulae) && guide.formulae.length > 0) {
      if (doc.y > doc.page.height - 150) doc.addPage();
      renderSectionHeader("Formulae & Analytical Equations", "📐");
      guide.formulae.forEach((item: any, idx: number) => {
        if (doc.y > doc.page.height - 120) doc.addPage();

        // Nice formula display container
        const boxHeight = 70;
        const startY = doc.y;
        doc.rect(50, startY, doc.page.width - 100, boxHeight)
           .fill("#eef2ff");

        // Equation Number label
        doc.fontSize(8)
           .font("Helvetica-Bold")
           .fillColor("#4f46e5")
           .text(`EQUATION ${idx + 1}`, 65, startY + 6);

        // Core Formula
        doc.fontSize(11)
           .font("Helvetica-Bold")
           .fillColor("#312e81")
           .text(item.formula, 65, startY + 18);

        // Sub explanation
        doc.fontSize(8.5)
           .font("Helvetica")
           .fillColor("#4b5563")
           .text(`Meaning: ${item.meaning}  |  Variables: ${item.variables}`, 65, startY + 34, { width: doc.page.width - 130 });

        doc.fontSize(8.5)
           .font("Helvetica-Oblique")
           .fillColor("#312e81")
           .text(`Usage: ${item.usage}`, 65, startY + 48, { width: doc.page.width - 130 });

        doc.moveDown(2);
      });
    }

    // ==========================================
    // SECTION 5: PROCESSES & WORKFLOWS
    // ==========================================
    if (Array.isArray(guide.processes) && guide.processes.length > 0) {
      if (doc.y > doc.page.height - 150) doc.addPage();
      renderSectionHeader("Processes & Step-by-Step Workflows", "⚙️");
      guide.processes.forEach((proc: any) => {
        if (doc.y > doc.page.height - 120) doc.addPage();

        doc.fontSize(11)
           .font("Helvetica-Bold")
           .fillColor("#111827")
           .text(`🔄 Process: ${proc.name}`);
        
        doc.moveDown(0.4);

        if (Array.isArray(proc.steps)) {
          proc.steps.forEach((step: string, sIdx: number) => {
            if (doc.y > doc.page.height - 60) doc.addPage();
            doc.fontSize(9.5)
               .font("Helvetica-Bold")
               .fillColor("#4f46e5")
               .text(`  Step ${sIdx + 1}: `, { continued: true })
               .font("Helvetica")
               .fillColor("#374151")
               .text(step, { lineGap: 2 });
            doc.moveDown(0.3);
          });
        }
        doc.moveDown(1);
      });
    }

    // ==========================================
    // SECTION 6: COMMON EXAM MISTAKES
    // ==========================================
    if (Array.isArray(guide.commonMistakes) && guide.commonMistakes.length > 0) {
      if (doc.y > doc.page.height - 150) doc.addPage();
      renderSectionHeader("Common Exam Mistakes & Pitfalls", "⚠️");
      guide.commonMistakes.forEach((item: any, idx: number) => {
        if (doc.y > doc.page.height - 140) doc.addPage();

        const startY = doc.y;
        doc.rect(50, startY, doc.page.width - 100, 100)
           .fill("#fffbeb");

        // Mistake Heading
        doc.fontSize(10)
           .font("Helvetica-Bold")
           .fillColor("#b45309")
           .text(`⚠️ Common Confusion point #${idx + 1}:`, 65, startY + 8);

        // Mistake text
        doc.fontSize(9)
           .font("Helvetica")
           .fillColor("#92400e")
           .text(`Mistake: ${item.mistake}`, 65, startY + 22, { width: doc.page.width - 130 });

        // Correction
        doc.fontSize(9)
           .font("Helvetica-Bold")
           .fillColor("#166534")
           .text(`Correction: ${item.correction}`, 65, startY + 45, { width: doc.page.width - 130 });

        // Explanation
        doc.fontSize(8.5)
           .font("Helvetica")
           .fillColor("#4b5563")
           .text(`Reasoning: ${item.explanation}`, 65, startY + 65, { width: doc.page.width - 130 });

        doc.moveDown(3);
      });
    }

    // ==========================================
    // SECTION 7: EXAM TIPS
    // ==========================================
    if (Array.isArray(guide.examTips) && guide.examTips.length > 0) {
      if (doc.y > doc.page.height - 150) doc.addPage();
      renderSectionHeader("Focal Exam Tips & Advice", "🎯");
      guide.examTips.forEach((tip: string) => {
        if (doc.y > doc.page.height - 60) doc.addPage();
        doc.fontSize(10)
           .font("Helvetica")
           .fillColor("#374151")
           .text(`🎯  ${tip}`, { lineGap: 3 });
        doc.moveDown(0.6);
      });
    }

    // ==========================================
    // SECTION 8: REVISION CHECKLIST
    // ==========================================
    if (Array.isArray(guide.revisionChecklist) && guide.revisionChecklist.length > 0) {
      if (doc.y > doc.page.height - 150) doc.addPage();
      renderSectionHeader("Revision Milestones Checklist", "📋");
      guide.revisionChecklist.forEach((item: string) => {
        if (doc.y > doc.page.height - 60) doc.addPage();
        doc.fontSize(10)
           .font("Helvetica")
           .fillColor("#374151")
           .text(`[  ]  ${item}`, { lineGap: 2 });
        doc.moveDown(0.5);
      });
    }

    // ==========================================
    // SECTION 9: FLASHCARDS
    // ==========================================
    if (Array.isArray(guide.flashcards) && guide.flashcards.length > 0) {
      if (doc.y > doc.page.height - 200) doc.addPage();
      renderSectionHeader("Flashcards Revision Deck", "📇");
      guide.flashcards.forEach((card: any, idx: number) => {
        if (doc.y > doc.page.height - 110) doc.addPage();

        const startY = doc.y;
        doc.rect(50, startY, doc.page.width - 100, 52)
           .strokeColor("#e2e8f0")
           .lineWidth(1)
           .stroke();

        doc.fontSize(8.5)
           .font("Helvetica-Bold")
           .fillColor("#4f46e5")
           .text(`FLASHCARD #${idx + 1}`, 60, startY + 6);

        doc.fontSize(9.5)
           .font("Helvetica-Bold")
           .fillColor("#111827")
           .text(`Q: ${card.question}`, 60, startY + 18, { width: doc.page.width - 120 });

        doc.fontSize(9)
           .font("Helvetica")
           .fillColor("#4b5563")
           .text(`A: ${card.answer}`, 60, startY + 34, { width: doc.page.width - 120 });

        doc.moveDown(2);
      });
    }

    // ==========================================
    // GLOBAL HEADER & FOOTER GENERATION (Using bufferPages)
    // ==========================================
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      
      // We skip header and footer on the cover (page 0)
      if (i > 0) {
        // Subtle footer line
        doc.moveTo(50, doc.page.height - 45)
           .lineTo(doc.page.width - 50, doc.page.height - 45)
           .strokeColor("#f1f5f9")
           .lineWidth(1)
           .stroke();

        doc.fontSize(8)
           .font("Helvetica")
           .fillColor("#94a3b8")
           .text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 35, { align: "right" });

        doc.text("Menteea Personal Study Workspace  |  Premium Revision Pack", 50, doc.page.height - 35, { align: "left" });
      }
    }

    doc.end();
  } catch (error: any) {
    logger.error("Error generating PDF Export:", error);
    return res.status(500).json({ error: "Failed to generate study guide PDF. Please try again." });
  }
}

/**
 * Word (.docx) Export Handler using docx package
 */
export async function handleExportDocx(req: Request, res: Response) {
  try {
    const { guide, documentName } = req.body;
    if (!guide) {
      return res.status(400).json({ error: "Missing study guide content to export." });
    }

    const filename = getSafeFilename(guide.title || documentName || "study_guide", "docx");
    logger.info(`Generating DOCX study guide export for filename: ${filename}`);

    const docChildren: any[] = [];

    // Title / Header Card
    docChildren.push(
      new Paragraph({
        text: "MENTEEA PERSONALIZED STUDY GUIDE",
        heading: HeadingLevel.HEADING_5,
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        text: guide.title || "STUDY COMPANION",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Source Document: ${documentName || "Class Material"}`,
            italics: true,
            color: "555555"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: `Exported on ${new Date().toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
      })
    );

    const addSectionHeader = (title: string, emoji: string) => {
      docChildren.push(
        new Paragraph({
          text: "",
          spacing: { before: 400 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${emoji} ${title.toUpperCase()}`,
              bold: true,
              size: 26,
              color: "1e1b4b"
            })
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 150 }
        })
      );
    };

    // 1. Overview
    addSectionHeader("Chapter Overview", "📚");
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: guide.overview,
            size: 22,
            color: "222222"
          })
        ],
        spacing: { line: 360, after: 200 }
      })
    );

    // 2. Key Concepts
    if (Array.isArray(guide.keyConcepts) && guide.keyConcepts.length > 0) {
      addSectionHeader("Key Concepts & Pillars", "💡");
      guide.keyConcepts.forEach((item: any, idx: number) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${idx + 1}. ${item.concept}`,
                bold: true,
                size: 24,
                color: "4f46e5"
              })
            ],
            spacing: { before: 150, after: 80 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: item.explanation,
                size: 22,
                color: "333333"
              })
            ],
            spacing: { line: 300, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Importance/Context: ",
                bold: true,
                size: 20,
                color: "15803d"
              }),
              new TextRun({
                text: item.whyItMatters,
                size: 20,
                italics: true,
                color: "166534"
              })
            ],
            spacing: { after: 250 }
          })
        );
      });
    }

    // 3. Definitions
    if (Array.isArray(guide.importantDefinitions) && guide.importantDefinitions.length > 0) {
      addSectionHeader("Important Definitions", "📝");
      guide.importantDefinitions.forEach((item: any) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${item.term}: `,
                bold: true,
                size: 22,
                color: "111111"
              }),
              new TextRun({
                text: item.definition,
                size: 22,
                color: "444444"
              })
            ],
            spacing: { after: 120 }
          })
        );
      });
    }

    // 4. Formulae
    if (Array.isArray(guide.formulae) && guide.formulae.length > 0) {
      addSectionHeader("Formulae & Analytical Equations", "📐");
      guide.formulae.forEach((item: any, idx: number) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Equation ${idx + 1}: ${item.formula}`,
                bold: true,
                size: 22,
                color: "312e81"
              })
            ],
            spacing: { before: 150, after: 60 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Conceptual Meaning: `,
                bold: true,
                size: 20
              }),
              new TextRun({
                text: item.meaning,
                size: 20
              })
            ],
            spacing: { after: 60 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Variables: `,
                bold: true,
                size: 20
              }),
              new TextRun({
                text: item.variables,
                size: 20
              })
            ],
            spacing: { after: 60 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Application/Usage: `,
                bold: true,
                size: 20,
                color: "4f46e5"
              }),
              new TextRun({
                text: item.usage,
                size: 20
              })
            ],
            spacing: { after: 200 }
          })
        );
      });
    }

    // 5. Processes
    if (Array.isArray(guide.processes) && guide.processes.length > 0) {
      addSectionHeader("Processes & Step-by-Step Workflows", "⚙️");
      guide.processes.forEach((proc: any) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `🔄 Process Workflow: ${proc.name}`,
                bold: true,
                size: 24,
                color: "111111"
              })
            ],
            spacing: { before: 180, after: 100 }
          })
        );

        if (Array.isArray(proc.steps)) {
          proc.steps.forEach((step: string, sIdx: number) => {
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `  Step ${sIdx + 1}: `,
                    bold: true,
                    size: 22,
                    color: "4f46e5"
                  }),
                  new TextRun({
                    text: step,
                    size: 22,
                    color: "333333"
                  })
                ],
                spacing: { after: 80 }
              })
            );
          });
        }
      });
    }

    // 6. Common Mistakes
    if (Array.isArray(guide.commonMistakes) && guide.commonMistakes.length > 0) {
      addSectionHeader("Common Exam Mistakes & Confusion Points", "⚠️");
      guide.commonMistakes.forEach((item: any, idx: number) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Confusion Point #${idx + 1}: ${item.mistake}`,
                bold: true,
                size: 22,
                color: "b45309"
              })
            ],
            spacing: { before: 150, after: 80 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `• Recommended Correction: `,
                bold: true,
                size: 20,
                color: "15803d"
              }),
              new TextRun({
                text: item.correction,
                size: 20,
                color: "166534"
              })
            ],
            spacing: { after: 60 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `• Detailed Explanation: `,
                bold: true,
                size: 20,
                color: "4b5563"
              }),
              new TextRun({
                text: item.explanation,
                size: 20,
                color: "555555"
              })
            ],
            spacing: { after: 200 }
          })
        );
      });
    }

    // 7. Exam Tips
    if (Array.isArray(guide.examTips) && guide.examTips.length > 0) {
      addSectionHeader("Strategic Exam Tips", "🎯");
      guide.examTips.forEach((tip: string) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `🎯 ${tip}`,
                size: 22,
                color: "222222"
              })
            ],
            spacing: { after: 120 }
          })
        );
      });
    }

    // 8. Revision Checklist
    if (Array.isArray(guide.revisionChecklist) && guide.revisionChecklist.length > 0) {
      addSectionHeader("Revision Checklists", "📋");
      guide.revisionChecklist.forEach((item: string) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[  ]  ${item}`,
                size: 22,
                color: "222222"
              })
            ],
            spacing: { after: 100 }
          })
        );
      });
    }

    // 9. Flashcards
    if (Array.isArray(guide.flashcards) && guide.flashcards.length > 0) {
      addSectionHeader("Interactive Flashcard Deck", "📇");
      guide.flashcards.forEach((card: any, idx: number) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Flashcard #${idx + 1}`,
                bold: true,
                size: 20,
                color: "4f46e5"
              })
            ],
            spacing: { before: 100, after: 40 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Question: `,
                bold: true,
                size: 22
              }),
              new TextRun({
                text: card.question,
                size: 22
              })
            ],
            spacing: { after: 40 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Answer: `,
                bold: true,
                size: 22,
                color: "555555"
              }),
              new TextRun({
                text: card.answer,
                size: 22,
                color: "666666"
              })
            ],
            spacing: { after: 180 }
          })
        );
      });
    }

    const docx = new DocxDocument({
      sections: [
        {
          properties: {},
          children: docChildren
        }
      ]
    });

    const buffer = await Packer.toBuffer(docx);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    return res.send(buffer);
  } catch (error: any) {
    logger.error("Error generating DOCX Export:", error);
    return res.status(500).json({ error: "Failed to generate study guide DOCX. Please try again." });
  }
}