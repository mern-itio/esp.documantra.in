package com.pdfservice.service;

import com.itextpdf.forms.PdfAcroForm;
import com.itextpdf.forms.fields.PdfFormField;
import com.itextpdf.forms.fields.PdfSignatureFormField;
import com.itextpdf.forms.fields.PdfTextFormField;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.*;
import com.pdfservice.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class PdfService {

    /**
     * Prepares PDF template by creating empty placeholders for all fields
     * Uses incremental update mode to preserve signatures
     *
     * @param request PrepareTemplateRequest containing base64 PDF and field definitions
     * @return PdfResponse with modified base64 PDF
     */
    public PdfResponse prepareTemplate(PrepareTemplateRequest request) {
        try {
            byte[] pdfBytes = java.util.Base64.getDecoder().decode(request.getPdfBase64());
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            
            // Use append mode so updates are written as a new PDF revision.
            PdfReader reader = new PdfReader(new ByteArrayInputStream(pdfBytes));
            PdfWriter writer = new PdfWriter(outputStream);
            writer.setSmartMode(true);
            
            PdfDocument document = new PdfDocument(reader, writer, new StampingProperties().useAppendMode());
            
            // Get or create AcroForm
            PdfAcroForm form = PdfAcroForm.getAcroForm(document, true);
            
            // Create fields based on definitions
            for (FieldDefinition field : request.getFields()) {
                try {
                    int pageNum = field.getPage();
                    PdfPage page = document.getPage(pageNum);
                    
                    // Convert coordinates to PDF coordinate system
                    // PDF uses bottom-left origin, assuming input uses top-left
                    float pageHeight = page.getPageSize().getHeight();
                    float x = field.getX().floatValue();
                    float y = pageHeight - field.getY().floatValue() - field.getHeight().floatValue();
                    float width = field.getWidth().floatValue();
                    float height = field.getHeight().floatValue();
                    
                    Rectangle rect = new Rectangle(x, y, width, height);
                    
                    if ("signature".equalsIgnoreCase(field.getType())) {
                        // Create a proper signature form field for this page/position.
                        PdfSignatureFormField signatureField = PdfFormField.createSignature(document, rect);
                        signatureField.setFieldName(field.getFieldId());
                        form.addField(signatureField, page);

                        log.info("Created signature field: " + field.getFieldId());
                    } else {
                        // Create text field (empty placeholder)
                        PdfTextFormField textField = PdfTextFormField.createText(document, rect, field.getFieldId(), "");
                        textField.setFieldName(field.getFieldId());
                        form.addField(textField, page);

                        log.info("Created text field: " + field.getFieldId());
                    }
                } catch (Exception e) {
                    log.error("Error creating field: " + field.getFieldId(), e);
                    throw new RuntimeException("Error creating field: " + field.getFieldId(), e);
                }
            }
            
            document.close();
            
            String resultBase64 = java.util.Base64.getEncoder().encodeToString(outputStream.toByteArray());
            
            return new PdfResponse(
                resultBase64,
                "Template prepared successfully with " + request.getFields().size() + " fields",
                true
            );
            
        } catch (Exception e) {
            log.error("Error preparing template: " + e.getMessage(), e);
            throw new RuntimeException("Error preparing template: " + e.getMessage(), e);
        }
    }

    /**
     * Embeds field values into PDF
     * Uses incremental update mode to preserve signatures
     * Fields remain editable after embedding values
     *
     * @param request EmbedValuesRequest containing base64 PDF and field values
     * @return PdfResponse with modified base64 PDF
     */
    public PdfResponse embedValues(EmbedValuesRequest request) {
        try {
            byte[] pdfBytes = java.util.Base64.getDecoder().decode(request.getPdfBase64());
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            
            // Use append mode to preserve previous signatures/revisions.
            PdfReader reader = new PdfReader(new ByteArrayInputStream(pdfBytes));
            PdfWriter writer = new PdfWriter(outputStream);
            writer.setSmartMode(true);
            
            PdfDocument document = new PdfDocument(reader, writer, new StampingProperties().useAppendMode());
            
            // Get existing AcroForm
            PdfAcroForm form = PdfAcroForm.getAcroForm(document, false);
            
            if (form != null) {
                // Create a map of fieldId -> value for easier lookup
                Map<String, String> valueMap = request.getFieldValues().stream()
                    .collect(Collectors.toMap(
                        FieldValue::getFieldId,
                        FieldValue::getValue,
                        (existing, replacement) -> replacement
                    ));
                
                // Set field values
                for (Map.Entry<String, String> entry : valueMap.entrySet()) {
                    String fieldId = entry.getKey();
                    String value = entry.getValue();
                    
                    try {
                        PdfFormField field = form.getField(fieldId);
                        if (field != null) {
                            field.setValue(value);

                            log.info("Embedded value for field: " + fieldId);
                        } else {
                            log.warn("Field not found: " + fieldId);
                        }
                    } catch (Exception e) {
                        log.error("Error embedding value for field: " + fieldId, e);
                        throw new RuntimeException("Error embedding value for field: " + fieldId, e);
                    }
                }
            }
            
            document.close();
            
            String resultBase64 = java.util.Base64.getEncoder().encodeToString(outputStream.toByteArray());
            
            return new PdfResponse(
                resultBase64,
                "Values embedded successfully for " + request.getFieldValues().size() + " fields",
                true
            );
            
        } catch (Exception e) {
            log.error("Error embedding values: " + e.getMessage(), e);
            throw new RuntimeException("Error embedding values: " + e.getMessage(), e);
        }
    }
}
