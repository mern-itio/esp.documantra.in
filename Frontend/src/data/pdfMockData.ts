import type { ProcessingStats, UserWorkflow } from "../types";


export const mockPDFTools = {
  conversion: {
    category: "Conversion Tools",
    description: "Convert PDFs to and from various formats with high fidelity",
    tools: [
      {
        id: "pdf-to-word",
        name: "PDF to Word",
        description: "Convert PDF to editable Word documents with layout preservation",
        category: "conversion",
        inputFormats: ["pdf"],
        outputFormats: ["doc", "docx"],
        features: ["layout_preservation", "table_recognition", "image_extraction"],
        complexity: "easy" as const,
        popularity: 95,
        avgProcessingTime: "30 seconds",
        icon: "FileText",
        badge: "Popular"
      },
      {
        id: "word-to-pdf",
        name: "Word to PDF",
        description: "Convert Word documents to PDF format",
        category: "conversion",
        inputFormats: ["doc", "docx"],
        outputFormats: ["pdf"],
        features: ["bookmark_preservation", "hyperlink_retention", "metadata_transfer"],
        complexity: "easy" as const,
        popularity: 88,
        avgProcessingTime: "15 seconds",
        icon: "FileOutput"
      },
      {
        id: "pdf-to-excel",
        name: "PDF to Excel",
        description: "Convert PDF tables to Excel spreadsheets",
        category: "conversion",
        inputFormats: ["pdf"],
        outputFormats: ["xls", "xlsx"],
        features: ["table_detection", "data_extraction", "formula_preservation"],
        complexity: "medium" as const,
        popularity: 76,
        avgProcessingTime: "45 seconds",
        icon: "TableProperties"
      },
      {
        id: "excel-to-pdf",
        name: "Excel to PDF",
        description: "Convert Excel spreadsheets to PDF with formatting",
        category: "conversion",
        inputFormats: ["xls", "xlsx"],
        outputFormats: ["pdf"],
        features: ["worksheet_selection", "scaling_options", "chart_preservation"],
        complexity: "easy" as const,
        popularity: 71,
        icon: "Sheet"
      },
      {
        id: "pdf-to-powerpoint",
        name: "PDF to PowerPoint",
        description: "Convert PDF slides to editable PowerPoint presentations",
        category: "conversion",
        inputFormats: ["pdf"],
        outputFormats: ["ppt", "pptx"],
        features: ["slide_recognition", "image_extraction", "text_formatting"],
        complexity: "medium" as const,
        popularity: 62,
        icon: "Presentation"
      },
      {
        id: "powerpoint-to-pdf",
        name: "PowerPoint to PDF",
        description: "Convert PowerPoint presentations to PDF",
        category: "conversion",
        inputFormats: ["ppt", "pptx"],
        outputFormats: ["pdf"],
        features: ["animation_preservation", "slide_transitions", "notes_inclusion"],
        complexity: "easy" as const,
        popularity: 68,
        icon: "FileSliders"
      },
      {
        id: "pdf-to-img",
        name: "PDF to Images",
        description: "Convert PDF pages to high-quality images",
        category: "conversion",
        inputFormats: ["pdf"],
        outputFormats: ["jpg", "png", "tiff"],
        features: ["dpi_selection", "color_profiles", "batch_conversion"],
        complexity: "easy" as const,
        popularity: 84,
        icon: "Image"
      },
      {
        id: "img-to-pdf",
        name: "Images to PDF",
        description: "Combine multiple images into a single PDF",
        category: "conversion",
        inputFormats: ["jpg", "png", "tiff", "bmp"],
        outputFormats: ["pdf"],
        features: ["layout_options", "compression_settings", "page_ordering"],
        complexity: "easy" as const,
        popularity: 79,
        icon: "ImagePlus"
      },
      {
        id: "pdf-to-text",
        name: "PDF to Text",
        description: "Extract plain text from PDF documents",
        category: "conversion",
        inputFormats: ["pdf"],
        outputFormats: ["txt"],
        features: ["formatting_options", "encoding_selection", "column_detection"],
        complexity: "easy" as const,
        popularity: 73,
        icon: "Type"
      },
      {
        id: "text-to-pdf",
        name: "Text to PDF",
        description: "Convert text files to formatted PDF documents",
        category: "conversion",
        inputFormats: ["txt"],
        outputFormats: ["pdf"],
        features: ["font_selection", "page_formatting", "header_footer"],
        complexity: "easy" as const,
        popularity: 45,
        icon: "FileType"
      },
      {
        id: "pdf-to-html",
        name: "PDF to HTML",
        description: "Convert PDF to responsive HTML web pages",
        category: "conversion",
        inputFormats: ["pdf"],
        outputFormats: ["html"],
        features: ["responsive_design", "css_styling", "interactive_elements"],
        complexity: "advanced" as const,
        popularity: 41,
        icon: "Code",
        premium: true
      },
      {
        id: "html-to-pdf",
        name: "HTML to PDF",
        description: "Convert HTML web pages to PDF documents",
        category: "conversion",
        inputFormats: ["html"],
        outputFormats: ["pdf"],
        features: ["css_support", "media_queries", "javascript_rendering"],
        complexity: "medium" as const,
        popularity: 52,
        icon: "Globe"
      },
      {
        id: "pdf-to-epub",
        name: "PDF to EPUB",
        description: "Convert PDF documents to EPUB e-book format",
        category: "conversion",
        inputFormats: ["pdf"],
        outputFormats: ["epub"],
        features: ["chapter_detection", "toc_generation", "reflowable_text"],
        complexity: "advanced" as const,
        popularity: 28,
        icon: "BookOpen"
      },
      {
        id: "batch-conversion",
        name: "Batch Conversion",
        description: "Convert multiple files simultaneously",
        category: "conversion",
        inputFormats: ["pdf", "doc", "docx", "xls", "xlsx"],
        outputFormats: ["pdf", "doc", "docx", "xls", "xlsx"],
        features: ["queue_management", "progress_tracking", "error_handling"],
        complexity: "medium" as const,
        popularity: 67,
        icon: "RefreshCw",
        badge: "Batch"
      },
      {
        id: "smart-conversion",
        name: "Smart Conversion",
        description: "AI-powered format detection and optimal conversion",
        category: "conversion",
        inputFormats: ["any"],
        outputFormats: ["any"],
        features: ["format_detection", "quality_optimization", "smart_settings"],
        complexity: "advanced" as const,
        popularity: 58,
        icon: "Zap",
        badge: "AI",
        premium: true
      }
    ]
  },
  editing: {
    category: "Editing Tools",
    description: "Edit, annotate, and modify PDF content directly",
    tools: [
      {
        id: "edit-pdf",
        name: "Edit PDF Text",
        description: "Edit text directly in PDF documents with font matching",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["font_matching", "formatting_preservation", "spell_check"],
        complexity: "medium" as const,
        popularity: 76,
        icon: "Edit3"
      },
      {
        id: "add-text",
        name: "Add Text",
        description: "Insert new text with custom fonts and styling",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["custom_fonts", "text_styling", "positioning_controls"],
        complexity: "easy" as const,
        popularity: 68,
        icon: "Plus"
      },
      {
        id: "add-images",
        name: "Add Images",
        description: "Insert and position images in PDF documents",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["image_positioning", "resize_controls", "transparency_options"],
        complexity: "easy" as const,
        popularity: 72,
        icon: "ImagePlus"
      },
      {
        id: "add-shapes",
        name: "Add Shapes",
        description: "Draw shapes, lines, and drawing elements",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["shape_library", "custom_colors", "line_styles"],
        complexity: "easy" as const,
        popularity: 54,
        icon: "Square"
      },
      {
        id: "highlight-text",
        name: "Highlight Text",
        description: "Highlight text with color and opacity options",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["color_picker", "opacity_control", "highlight_styles"],
        complexity: "easy" as const,
        popularity: 82,
        icon: "Highlighter"
      },
      {
        id: "add-comments-db",
        name: "Add Comments",
        description: "Add sticky notes and comments with threading",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["comment_threading", "user_tracking", "reply_system"],
        complexity: "easy" as const,
        popularity: 78,
        icon: "MessageCircle",
        route: "/pdf-tools/add-comments-db"
      },
      {
        id: "add-comments",
        name: "Add Comments (Shared)",
        description: "Create shareable PDF documents with collaborative commenting",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["shareable_links", "user_authentication", "real_time_collaboration"],
        complexity: "medium" as const,
        popularity: 85,
        icon: "Share2",
        route: "/pdf-tools/add-comments",
        badge: "New"
      },
      {
        id: "draw-annotations",
        name: "Draw Annotations",
        description: "Freehand drawing and markup tools",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["pen_tools", "brush_sizes", "pressure_sensitivity"],
        complexity: "medium" as const,
        popularity: 65,
        icon: "PenTool"
      },
      {
        id: "add-stamps",
        name: "Add Stamps",
        description: "Insert stamps and custom annotations",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["stamp_library", "custom_stamps", "date_stamps"],
        complexity: "easy" as const,
        popularity: 49,
        icon: "Stamp"
      },
      {
        id: "redact-content",
        name: "Redact Content",
        description: "Permanently remove sensitive information",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["pattern_redaction", "batch_redaction", "privacy_compliance"],
        complexity: "medium" as const,
        popularity: 57,
        icon: "EyeOff",
        badge: "Security",
        route: "/pdf-tools/redact-content"
      },
      {
        id: "add-stamps",
        name: "Add Stamps",
        description: "Insert stamps and custom annotations",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["stamp_library", "custom_stamps", "date_stamps"],
        complexity: "easy" as const,
        popularity: 72,
        icon: "Stamp",
        badge: "New",
        route: "/pdf-tools/add-stamps"
      },
      
      {
        id: "find-replace",
        name: "Find & Replace",
        description: "Search and replace text across documents",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["regex_support", "case_sensitivity", "whole_word_matching"],
        complexity: "medium" as const,
        popularity: 61,
        icon: "Search",
        route: "/pdf-tools/find-replace"
      },
      {
        id: "spell-check",
        name: "Spell Check",
        description: "Check spelling and grammar in PDF text",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["multilingual_support", "custom_dictionaries", "suggestions"],
        complexity: "easy" as const,
        popularity: 53,
        icon: "CheckCircle",
        route: "/pdf-tools/spell-check"
      },
      {
        id: "edit-metadata",
        name: "Edit Metadata",
        description: "Modify document properties and metadata",
        category: "editing",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["custom_properties", "metadata_templates", "bulk_editing"],
        complexity: "medium" as const,
        popularity: 34,
        icon: "Info",
        route: "/pdf-tools/edit-metadata"
      }
    ]
  },
  pages: {
    category: "Page Management",
    description: "Organize, manipulate, and manage PDF pages",
    tools: [
      {
        id: "merge-pdf",
        name: "Merge PDFs",
        description: "Combine multiple PDFs with custom ordering",
        category: "pages",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["drag_drop_ordering", "bookmark_preservation", "metadata_merging"],
        complexity: "easy" as const,
        popularity: 91,
        avgProcessingTime: "20 seconds",
        icon: "Combine",
        badge: "Popular"
      },
      {
        id: "split-pdf",
        name: "Split PDF",
        description: "Split PDF by pages, bookmarks, or file size",
        category: "pages",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["page_range_selection", "bookmark_splitting", "size_based_splitting"],
        complexity: "easy" as const,
        popularity: 85,
        icon: "Split"
      },
      {
        id: "extract-pdf",
        name: "Extract Pages",
        description: "Extract specific pages to new documents",
        category: "pages",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["page_selection", "batch_extraction", "metadata_preservation"],
        complexity: "easy" as const,
        popularity: 73,
        icon: "FileOutput"
      },
      {
        id: "delete-pdf",
        name: "Delete Pages",
        description: "Remove unwanted pages with batch selection",
        category: "pages",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["multi_select", "preview_mode", "undo_support"],
        complexity: "easy" as const,
        popularity: 67,
        icon: "Trash2"
      },
      {
        id: "reorder-pdf",
        name: "Reorder Pages",
        description: "Rearrange pages with drag-and-drop interface",
        category: "pages",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["visual_reordering", "thumbnail_preview", "batch_operations"],
        complexity: "easy" as const,
        popularity: 71,
        icon: "Move"
      },
      {
        id: "rotate-pdf",
        name: "Rotate Pages",
        description: "Rotate pages individually or in batches",
        category: "pages",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["90_degree_rotation", "custom_angles", "batch_rotation"],
        complexity: "easy" as const,
        popularity: 64,
        icon: "RotateCw"
      },
      {
        id: "crop-pdf",
        name: "Crop Pages",
        description: "Crop pages with custom dimensions",
        category: "pages",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["visual_cropping", "preset_dimensions", "batch_cropping"],
        complexity: "medium" as const,
        popularity: 45,
        icon: "Crop"
      },
      {
        id: "insert-pdf",
        name: "Insert Pages",
        description: "Insert blank pages or pages from other documents",
        category: "pages",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["blank_page_insertion", "page_import", "position_control"],
        complexity: "medium" as const,
        popularity: 52,
        icon: "FilePlus"
      },
      {
        id: "add-page-numbers",
        name: "Add Page Numbers",
        description: "Add page numbers with custom formatting",
        category: "pages",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["number_formats", "position_options", "starting_number"],
        complexity: "easy" as const,
        popularity: 58,
        icon: "Hash"
      },
      {
        id: "add-header-footer",
        name: "Headers & Footers",
        description: "Insert headers and footers with variables",
        category: "pages",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["template_variables", "position_control", "font_customization"],
        complexity: "medium" as const,
        popularity: 43,
        icon: "Layout"
      }
    ]
  },
  security: {
    category: "Security & Protection",
    description: "Protect and secure PDF documents with encryption",
    tools: [
      {
        id: "add-password",
        name: "Add Password",
        description: "Protect PDFs with owner and user passwords",
        category: "security",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["dual_password_system", "permission_control", "encryption_levels", "aes_256_encryption"],
        complexity: "easy" as const,
        popularity: 79,
        avgProcessingTime: "15 seconds",
        icon: "Lock",
        badge: "Security",
        route: "/pdf-tools/add-password"
      },
      {
        id: "remove-password",
        name: "Remove Password",
        description: "Unlock protected PDFs with password verification",
        category: "security",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["password_recovery", "security_validation", "encryption_removal", "batch_unlocking"],
        complexity: "easy" as const,
        popularity: 71,
        avgProcessingTime: "10 seconds",
        icon: "Unlock",
        route: "/pdf-tools/remove-password"
      },
      {
        id: "digital-signature",
        name: "Digital Signature",
        description: "Add digital signatures with certificate validation",
        category: "security",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["certificate_validation", "timestamp_authority", "signature_verification"],
        complexity: "advanced" as const,
        popularity: 56,
        avgProcessingTime: "30 seconds",
        icon: "PenTool",
        badge: "Legal",
        premium: true,
        route: "/pdf-tools/digital-signature"
      },
      {
        id: "set-permissions",
        name: "Set Permissions",
        description: "Control document permissions and access",
        category: "security",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["granular_permissions", "print_restrictions", "copy_protection"],
        complexity: "medium" as const,
        popularity: 38,
        avgProcessingTime: "20 seconds",
        icon: "Settings",
        route: "/pdf-tools/set-permissions"

      },
      {
        id: "add-watermark",
        name: "Add Watermark",
        description: "Add text or image watermarks",
        category: "security",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["text_watermarks", "image_watermarks", "transparency_control"],
        complexity: "easy" as const,
        popularity: 61,
        avgProcessingTime: "15 seconds",
        icon: "Droplets",
        route: "/pdf-tools/add-watermark"

      },
      {
        id: "remove-metadata",
        name: "Remove Metadata",
        description: "Clean metadata and hidden information",
        category: "security",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["metadata_cleaning", "hidden_content_removal", "privacy_audit"],
        complexity: "medium" as const,
        popularity: 47,
        avgProcessingTime: "25 seconds",
        icon: "EyeOff",
        route: "/pdf-tools/remove-metadata"
      },
      {
        id: "document-tracking",
        name: "Document Tracking",
        description: "Track document access and usage",
        category: "security",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["access_logging", "usage_analytics", "expiration_dates"],
        complexity: "advanced" as const,
        popularity: 29,
        avgProcessingTime: "45 seconds",
        icon: "Activity",
        premium: true,
          route: "/pdf-tools/document-tracking"
      }
    ]
  },
  optimization: {
    category: "Optimization & Compression",
    description: "Optimize and compress PDFs for better performance",
    tools: [
      {
        id: "compress-pdf",
        name: "Compress PDF",
        description: "Reduce file size while maintaining quality",
        category: "optimization",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["quality_presets", "custom_compression", "batch_processing"],
        complexity: "easy" as const,
        popularity: 87,
        avgProcessingTime: "25 seconds",
        icon: "Archive",
        badge: "Popular",
        route: "/pdf-tools/compress-pdf"
      },
      {
        id: "optimize-image",
        name: "Optimize Images",
        description: "Compress images within PDFs",
        category: "optimization",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["image_compression", "resolution_adjustment", "format_conversion"],
        complexity: "medium" as const,
        popularity: 64,
        avgProcessingTime: "35 seconds",
        icon: "Image",
        route: "/pdf-tools/optimize-image"
      },
    
      {
        id: "optimize-font",
        name: "Optimize Fonts",
        description: "Optimize font usage and embedding",
        category: "optimization",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["font_subsetting", "font_optimization", "embedding_control"],
        complexity: "advanced" as const,
        popularity: 31,
        avgProcessingTime: "40 seconds",
        icon: "Type",
        route: "/pdf-tools/optimize-font"
      },
      {
        id: "remove-unused-objects",
        name: "Remove Unused Objects",
        description: "Clean up unused PDF objects and resources",
        category: "optimization",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["object_analysis", "resource_cleanup", "structure_optimization"],
        complexity: "advanced" as const,
        popularity: 28,
        avgProcessingTime: "50 seconds",
        icon: "Trash2",
        route: "/pdf-tools/remove-unused-objects"
      },
      {
        id: "linearize-pdf",
        name: "Linearize PDF",
        description: "Optimize PDFs for fast web viewing",
        category: "optimization",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["web_optimization", "fast_loading", "streaming_support"],
        complexity: "medium" as const,
        popularity: 35,
        avgProcessingTime: "30 seconds",
        icon: "Zap",
        route: "/pdf-tools/linearize-pdf"
      },
      {
        id: "color-optimization",
        name: "Color Optimization",
        description: "Optimize color spaces and profiles",
        category: "optimization",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["color_conversion", "profile_optimization", "gamut_mapping"],
        complexity: "advanced" as const,
        popularity: 22,
        avgProcessingTime: "60 seconds",
        icon: "Palette",
        premium: true,
        route: "/pdf-tools/color-optimization"
      },
      {
        id: "quality-analysis",
        name: "Quality Analysis",
        description: "Analyze and score document quality",
        category: "optimization",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["quality_scoring", "optimization_suggestions", "performance_metrics"],
        complexity: "medium" as const,
        popularity: 41,
        avgProcessingTime: "45 seconds",
        icon: "BarChart3",
        route: "/pdf-tools/quality-analysis"
      },
                {
        id: "batch-optimization",
        name: "Batch Optimization",
        description: "Optimize multiple PDFs simultaneously",
        category: "optimization",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["bulk_processing", "custom_profiles", "progress_tracking"],
        complexity: "medium" as const,
        popularity: 53,
        avgProcessingTime: "90 seconds",
        icon: "RefreshCw",
        badge: "Batch",
        route: "/pdf-tools/batch-optimization"
      }
  
    ]
  },
  ocr: {
    category: "OCR & Text Recognition",
    description: "Extract and recognize text from scanned documents",
    tools: [
      {
        id: "ocr",
        name: "OCR Text Recognition",
        description: "High-accuracy OCR for scanned documents",
        category: "ocr",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["high_accuracy_ocr", "100_languages", "confidence_scoring"],
        complexity: "medium" as const,
        popularity: 74,
        avgProcessingTime: "60 seconds",
        icon: "ScanLine",
        badge: "AI",
      route: "/pdf-tools/ocr"

      },
      {
        id: "make-searchable",
        name: "Make Searchable",
        description: "Convert scanned PDFs to searchable documents",
        category: "ocr",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["searchable_text", "layout_preservation", "invisible_text_layer"],
        complexity: "medium" as const,
        popularity: 68,
        avgProcessingTime: "75 seconds",
        icon: "Search",
      route: "/pdf-tools/make-searchable"

      },
      {
        id: "extract-tables",
        name: "Extract Tables",
        description: "Recognize and extract table data",
        category: "ocr",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["table_detection", "data_extraction", "format_preservation"],
        complexity: "advanced" as const,
        popularity: 45,
        avgProcessingTime: "90 seconds",
        icon: "Table",
        badge: "AI",
        premium: true,
        route: "/pdf-tools/extract-tables"
      },
      {
        id: "handwriting-recognition",
        name: "Handwriting Recognition",
        description: "Convert handwritten text to digital text",
        category: "ocr",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["handwriting_ocr", "cursive_support", "accuracy_tuning"],
        complexity: "advanced" as const,
        popularity: 39,
        avgProcessingTime: "120 seconds",
        icon: "PenTool",
        premium: true,
        route: "/pdf-tools/handwriting-recognition"
      }
     
    ]
  },
  forms: {
    category: "PDF Forms",
    description: "Create, fill, and manage interactive PDF forms",
    tools: [
      {
        id: "create-form",
        name: "Create PDF Form",
        description: "Design interactive fillable forms",
        category: "forms",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["form_designer", "field_validation", "interactive_elements"],
        complexity: "medium" as const,
        popularity: 58,
        avgProcessingTime: "30 seconds",
        icon: "FileInput",
        route: "/pdf-tools/create-form"
      },
      {
        id: "fill-form",
        name: "Fill PDF Form",
        description: "Fill out PDF forms digitally",
        category: "forms",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["auto_fill", "data_validation", "signature_fields"],
        complexity: "easy" as const,
        popularity: 72,
        avgProcessingTime: "20 seconds",
        icon: "Edit3",
        route: "/pdf-tools/fill-form"

      },
      {
        id: "flatten-form",
        name: "Flatten Form",
        description: "Convert fillable forms to static content",
        category: "forms",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["form_flattening", "content_preservation", "batch_flattening"],
        complexity: "easy" as const,
        popularity: 36,
        avgProcessingTime: "15 seconds",
        icon: "Layers",
        route: "/pdf-tools/fill-form"

      },
      {
        id: "form-recognition",
        name: "Form Recognition",
        description: "Convert static forms to fillable forms",
        category: "forms",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["automatic_field_detection", "form_analysis", "field_optimization"],
        complexity: "advanced" as const,
        popularity: 29,
        avgProcessingTime: "60 seconds",
        icon: "ScanLine",
        badge: "AI",
        premium: true,
        route: "/pdf-tools/form-recognition"

      },
      {
        id: "calculate-fields",
        name: "Calculate Fields",
        description: "Add calculations to form fields",
        category: "forms",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["formula_support", "field_relationships", "dynamic_calculations"],
        complexity: "advanced" as const,
        popularity: 24,
        avgProcessingTime: "25 seconds",
        icon: "Calculator",
        premium: true,
        route: "/pdf-tools/calculate-fields"
      }
    ]
  },
  utilities: {
    category: "Utilities & Tools",
    description: "Specialized tools and utilities for PDF management",
    tools: [
      {
        id: "pdf-info",
        name: "PDF Information",
        description: "View detailed document information and metadata",
        category: "utilities",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["metadata_viewer", "document_statistics", "security_info"],
        complexity: "easy" as const,
        popularity: 51,
        avgProcessingTime: "5 seconds",
        icon: "Info",
        route: "/pdf-tools/pdf-info"
      },
      {
        id: "pdf-validator",
        name: "PDF Validator",
        description: "Validate PDF standards compliance",
        category: "utilities",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["standards_validation", "error_detection", "compliance_reporting"],
        complexity: "advanced" as const,
        popularity: 27,
        icon: "CheckCircle",
        route: "/pdf-tools/pdf-validator"
      },
      {
        id: "pdf-compare",
        name: "PDF Compare",
        description: "Compare two PDF documents side-by-side",
        category: "utilities",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["side_by_side_comparison", "difference_highlighting", "detailed_analysis"],
        complexity: "intermediate" as const,
        popularity: 35,
        icon: "GitCompare",
        route: "/pdf-tools/pdf-compare"
      },
      {
        id: "pdf-repair",
        name: "PDF Repair",
        description: "Repair corrupted PDFs and optimize for fast web viewing",
        category: "utilities",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["error_recovery", "structure_repair", "content_reconstruction", "web_optimization"],
        complexity: "advanced" as const,
        popularity: 28,
        icon: "Wrench",
        route: "/pdf-tools/pdf-repair"
      },


      {
        id: "pdf-bookmarks",
        name: "PDF Bookmarks",
        description: "Create navigation bookmarks in PDFs",
        category: "utilities",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["automatic_bookmarks", "hierarchical_structure", "custom_titles"],
        complexity: "medium" as const,
        popularity: 38,
        icon: "Bookmark",
        route: "/pdf-tools/pdf-bookmarks"
      },
      {
        id: "pdf-statistics",
        name: "PDF Statistics",
        description: "Analyze document content and statistics",
        category: "utilities",
        inputFormats: ["pdf"],
        outputFormats: ["pdf"],
        features: ["content_analysis", "usage_statistics", "performance_metrics"],
        complexity: "medium" as const,
        popularity: 32,
        icon: "BarChart3",
        route: "/pdf-tools/pdf-statistics"
      }
    ]
  }
};

export const mockProcessingStats: ProcessingStats = {
  dailyUsage: {
    totalOperations: 15670,
    uniqueUsers: 3421,
    popularTools: [
      { name: "PDF to Word", usage: 2341, percentage: 14.9 },
      { name: "Compress PDF", usage: 1987, percentage: 12.7 },
      { name: "Merge PDFs", usage: 1654, percentage: 10.6 },
      { name: "PDF to Images", usage: 1432, percentage: 9.1 },
      { name: "Add Password", usage: 1287, percentage: 8.2 }
    ]
  },
  performanceMetrics: {
    averageProcessingTime: "24 seconds",
    successRate: 98.7,
    userSatisfaction: 4.6,
    errorRate: 1.3
  },
  qualityMetrics: {
    conversionAccuracy: 96.8,
    layoutPreservation: 94.2,
    textRecognitionAccuracy: 97.4,
    compressionEfficiency: 87.3
  }
};

export const mockUserWorkflows: UserWorkflow[] = [
  {
    id: "workflow_001",
    name: "Document Preparation",
    steps: [
      { tool: "ocr_text_recognition", order: 1 },
      { tool: "edit_text", order: 2 },
      { tool: "add_password", order: 3 },
      { tool: "compress_pdf", order: 4 }
    ],
    usage: 89,
    avgCompletionTime: "8 minutes"
  },
  {
    id: "workflow_002",
    name: "Archive Processing",
    steps: [
      { tool: "merge_pdfs", order: 1 },
      { tool: "add_bookmarks", order: 2 },
      { tool: "compress_pdf", order: 3 },
      { tool: "add_password", order: 4 }
    ],
    usage: 67,
    avgCompletionTime: "4 minutes"
  },
  {
    id: "workflow_003",
    name: "Form Processing",
    steps: [
      { tool: "form_recognition", order: 1 },
      { tool: "fill_form", order: 2 },
      { tool: "extract_form_data", order: 3 },
      { tool: "flatten_form", order: 4 }
    ],
    usage: 45,
    avgCompletionTime: "6 minutes"
  }
];