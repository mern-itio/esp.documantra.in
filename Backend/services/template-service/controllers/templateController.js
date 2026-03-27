// templateController.js
const Template = require("../models/template");
const Form = require("../models/formBuilder");
const TemplateType = require("../models/templateType");
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Helper function to render formatted text
function renderFormattedText(doc, text, options = {}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  parts.forEach((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      doc.font('Times-Bold').text(part.replace(/\*\*/g, ''), options);
    } else {
      doc.font('Times-Roman').text(part, options);
    }
  });
}

function isHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 4) return false;
  const cleaned = trimmed.replace(/\*\*/g, '');
  if (cleaned === cleaned.toUpperCase() && cleaned.length < 100) {
    return true;
  }
  return /^\d+\.\s+/.test(cleaned);
}

// Convert text content to PDF and return base64
const convertContentToPDF = async (content, documentName) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const fileName = `${Date.now()}-${(documentName || 'document').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const filePath = path.join(uploadsDir, fileName);
  
  const doc = new PDFDocument({
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    size: 'LETTER',
    bufferPages: true,
    autoFirstPage: true
  });
  
  const stream = fsSync.createWriteStream(filePath);
  doc.pipe(stream);
  
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
  paragraphs.forEach((paragraph, index) => {
    if (index > 0) {
      doc.moveDown(0.5);
    }
    const lines = paragraph.split('\n').filter(l => l.trim());
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      if (isHeading(trimmedLine)) {
        if (lineIndex > 0 || index > 0) {
          doc.moveDown(0.5);
        }
        const cleanedLine = trimmedLine.replace(/\*\*/g, '');
        doc.font('Times-Bold')
          .fontSize(13)
          .text(cleanedLine, {
            align: 'left',
            width: 495,
            lineGap: 2
          });
        doc.moveDown(0.3);
      } else {
        if (lineIndex > 0 || index > 0) {
          doc.moveDown(0.3);
        }
        renderFormattedText(doc, trimmedLine, {
          fontSize: 11,
          width: 495
        });
      }
    });
  });
  
  doc.end();
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
  
  const pdfBuffer = await fs.readFile(filePath);
  const base64 = pdfBuffer.toString('base64');
  
  // Clean up temporary file
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.warn('Failed to delete temporary PDF file:', err);
  }
  
  return base64;
};

const getApproverName = (req) =>
  req.user?.data?.fullname || req.user?.fullname || req.user?.data?.email || 'admin';

const ensureDefaultTemplateTypes = async () => {
  const count = await TemplateType.countDocuments();
  if (count > 0) return;
  await TemplateType.insertMany([
    { key: 'legal', label: 'legal', isDefault: true, isActive: true },
    { key: 'hr', label: 'hr', isDefault: true, isActive: true },
    { key: 'business', label: 'business', isDefault: true, isActive: true },
    { key: 'tech', label: 'tech', isDefault: true, isActive: true },
  ]);
};

// Create or Update a template
const saveUpdateTemplate = async (req, res) => {
  try {
    const { id, title, elements, status } = req.body;

    let template;
    if (id) {
      // Update existing template
      template = await Template.findByIdAndUpdate(
        id,
        { title, elements, status },
        { new: true, runValidators: true }
      );
    } else {
      // Create new template
      template = new Template({
        title,
        elements,
        status,
      });
      await template.save();
    }

    return res.status(200).json({
      success: true,
      message: id ? "Template updated successfully" : "Template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error saving/updating template:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving template",
      error: error.message,
    });
  }
};

// Save AI-generated template as a Form with PDF
const saveAITemplate = async (req, res) => {
  try {
    const { id, title, content, description, templateType } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required"
      });
    }

    const normalizedTitle = String(title).trim();
    const normalizedContent = String(content);

    // Convert content to PDF
    let pdfBase64 = null;
    try {
      pdfBase64 = await convertContentToPDF(normalizedContent, normalizedTitle);
    } catch (pdfError) {
      console.error("Error converting to PDF:", pdfError);
      return res.status(500).json({
        success: false,
        message: "Failed to convert content to PDF",
        error: pdfError.message,
      });
    }

    // Extract owner information from authenticated user
    const ownerId = req.user?.data?.id || req.user?.id || req.user?._id || null;
    const owner = req.user?.data?.fullname || req.user?.fullname || null;

    // If id is provided, update that exact template (preferred).
    if (id) {
      const form = await Form.findByIdAndUpdate(
        id,
        {
          $set: {
            title: normalizedTitle,
            description: description || '',
            content: normalizedContent,
            pdfBase64,
            isAIGenerated: true,
            templateType: templateType || 'legal',
            approvalStatus: 'pending',
            approvedBy: null,
            approvedAt: null,
            rejectionReason: '',
            ownerId,
            owner
          }
        },
        { new: true, runValidators: true }
      );

      if (form) {
        return res.status(200).json({
          success: true,
          message: "AI template updated successfully",
          data: form
        });
      }
      // If id not found, fall through to upsert-by-title.
    }

    // Update existing AI template (same title + same owner) instead of creating duplicates.
    // Prefer ownerId match when available; fallback to owner name if not.
    const filter = ownerId
      ? { title: normalizedTitle, isAIGenerated: true, ownerId }
      : { title: normalizedTitle, isAIGenerated: true, owner: owner || null };

    const update = {
      title: normalizedTitle,
      description: description || '',
      content: normalizedContent,
      pdfBase64,
      isAIGenerated: true,
      templateType: templateType || 'legal',
      approvalStatus: 'pending',
      approvedBy: null,
      approvedAt: null,
      rejectionReason: '',
      ownerId,
      owner
    };

    const form = await Form.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "AI template saved successfully",
      data: form
    });
  } catch (error) {
    console.error("Error saving AI template:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving AI template",
      error: error.message,
    });
  }
};

// Admin: create an AI template and immediately activate it (approved)
const createApprovedAITemplateForAdmin = async (req, res) => {
  try {
    const { title, content, description, templateType } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    const normalizedTitle = String(title).trim();
    const normalizedContent = String(content);

    let pdfBase64 = null;
    try {
      pdfBase64 = await convertContentToPDF(normalizedContent, normalizedTitle);
    } catch (pdfError) {
      console.error('Error converting to PDF:', pdfError);
      return res.status(500).json({
        success: false,
        message: 'Failed to convert content to PDF',
        error: pdfError.message,
      });
    }

    const approverName = getApproverName(req);
    const ownerId = req.user?.data?.id || req.user?.id || req.user?._id || null;
    const owner = approverName;

    const form = new Form({
      title: normalizedTitle,
      description: description || '',
      content: normalizedContent,
      pdfBase64,
      isAIGenerated: true,
      createdByAdmin: true,
      templateType: templateType || 'legal',
      approvalStatus: 'approved',
      isActive: true,
      approvedBy: approverName,
      approvedAt: new Date(),
      rejectionReason: '',
      ownerId,
      owner,
    });

    await form.save();

    return res.status(201).json({
      success: true,
      message: 'Admin template created and activated',
      data: form,
    });
  } catch (error) {
    console.error('Error creating approved AI template for admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating admin template',
      error: error.message,
    });
  }
};

// Admin: list templates with moderation filters
const listTemplatesForAdmin = async (req, res) => {
  try {
    const { status, templateType, search } = req.query;
    const query = {};
    if (status) query.approvalStatus = status;
    if (templateType) query.templateType = templateType;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { owner: { $regex: search, $options: 'i' } },
      ];
    }
    const templates = await Form.find(query).sort({ updatedAt: -1, createdAt: -1 });
    return res.status(200).json({ success: true, data: templates });
  } catch (error) {
    console.error("Error listing templates for admin:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching templates",
      error: error.message,
    });
  }
};

// Admin: edit template content/meta
const updateTemplateForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, templateType, isActive } = req.body;
    const existing = await Form.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    const nextTitle = title ?? existing.title;
    const nextContent = content ?? existing.content;
    const nextDescription = description ?? existing.description;
    const nextTemplateType = templateType ?? existing.templateType;
    const nextIsActive = typeof isActive === 'boolean' ? isActive : existing.isActive;
    let pdfBase64 = existing.pdfBase64;
    if (typeof content === 'string' || typeof title === 'string') {
      pdfBase64 = await convertContentToPDF(String(nextContent || ''), String(nextTitle || 'template'));
    }

    // Single toggle behavior: activating a template implies it is approved/published.
    // Deactivating hides it from users but keeps approval history intact.
    const approverName = getApproverName(req);
    const nextApprovalStatus = nextIsActive ? 'approved' : (existing.approvalStatus || 'pending');
    const nextApprovedBy = nextIsActive ? (existing.approvedBy || approverName) : existing.approvedBy;
    const nextApprovedAt = nextIsActive ? (existing.approvedAt || new Date()) : existing.approvedAt;

    const updated = await Form.findByIdAndUpdate(
      id,
      {
        $set: {
          title: nextTitle,
          description: nextDescription,
          content: nextContent,
          templateType: nextTemplateType,
          isActive: nextIsActive,
          approvalStatus: nextApprovalStatus,
          approvedBy: nextApprovedBy,
          approvedAt: nextApprovedAt,
          pdfBase64,
        }
      },
      { new: true, runValidators: true }
    );
    return res.status(200).json({ success: true, data: updated, message: 'Template updated successfully' });
  } catch (error) {
    console.error("Error updating template for admin:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating template",
      error: error.message,
    });
  }
};

// Admin: approve/reject template for user-end visibility
const setTemplateApprovalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus, rejectionReason } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid approval status' });
    }
    const approverName = getApproverName(req);
    const updated = await Form.findByIdAndUpdate(
      id,
      {
        $set: {
          approvalStatus,
          rejectionReason: approvalStatus === 'rejected' ? (rejectionReason || '') : '',
          approvedBy: approvalStatus === 'approved' ? approverName : null,
          approvedAt: approvalStatus === 'approved' ? new Date() : null,
        }
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Template not found' });
    return res.status(200).json({ success: true, data: updated, message: 'Template status updated' });
  } catch (error) {
    console.error("Error setting template approval:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating approval status",
      error: error.message,
    });
  }
};

// Admin: list available template types
const listTemplateTypesForAdmin = async (_req, res) => {
  try {
    await ensureDefaultTemplateTypes();
    const items = await TemplateType.find({}).sort({ isDefault: -1, label: 1, createdAt: 1 });
    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching template types",
      error: error.message,
    });
  }
};

// Admin: create a new template type
const createTemplateTypeForAdmin = async (req, res) => {
  try {
    const { label } = req.body;
    const normalizedLabel = String(label || '').trim();
    if (!normalizedLabel) {
      return res.status(400).json({ success: false, message: 'Type label is required' });
    }
    const key = normalizedLabel.toLowerCase().replace(/\s+/g, '-');
    const exists = await TemplateType.findOne({ key });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Template type already exists' });
    }
    const created = await TemplateType.create({
      key,
      label: normalizedLabel,
      isDefault: false,
      isActive: true,
    });
    return res.status(201).json({ success: true, data: created, message: 'Template type created' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while creating template type",
      error: error.message,
    });
  }
};

// Admin: update template type label / state
const updateTemplateTypeForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, isActive } = req.body;
    const existing = await TemplateType.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Template type not found' });
    const nextLabel = label !== undefined ? String(label).trim() : existing.label;
    if (!nextLabel) return res.status(400).json({ success: false, message: 'Type label is required' });
    const nextKey = nextLabel.toLowerCase().replace(/\s+/g, '-');
    if (nextKey !== existing.key) {
      const dup = await TemplateType.findOne({ key: nextKey, _id: { $ne: id } });
      if (dup) return res.status(409).json({ success: false, message: 'Template type already exists' });
    }
    const updated = await TemplateType.findByIdAndUpdate(
      id,
      {
        $set: {
          label: nextLabel,
          key: nextKey,
          isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
        }
      },
      { new: true, runValidators: true }
    );
    return res.status(200).json({ success: true, data: updated, message: 'Template type updated' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while updating template type",
      error: error.message,
    });
  }
};

// Admin: delete template type
const deleteTemplateTypeForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await TemplateType.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Template type not found' });
    if (existing.isDefault) {
      return res.status(400).json({ success: false, message: 'Default template type cannot be deleted' });
    }
    await TemplateType.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Template type deleted' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while deleting template type",
      error: error.message,
    });
  }
};

module.exports = {
  saveUpdateTemplate,
  saveAITemplate,
  createApprovedAITemplateForAdmin,
  listTemplatesForAdmin,
  updateTemplateForAdmin,
  setTemplateApprovalStatus,
  listTemplateTypesForAdmin,
  createTemplateTypeForAdmin,
  updateTemplateTypeForAdmin,
  deleteTemplateTypeForAdmin,
};
