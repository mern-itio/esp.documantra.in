package com.pdfservice.controller;

import com.pdfservice.model.EmbedValuesRequest;
import com.pdfservice.model.PrepareTemplateRequest;
import com.pdfservice.model.PdfResponse;
import com.pdfservice.service.PdfService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.logging.Logger;

@Slf4j
@RestController
@RequestMapping("/api/pdf")
public class PdfController {

    @Autowired
    private PdfService pdfService;

    /**
     * Prepares PDF template by creating empty placeholders for all fields
     * 
     * @param request PrepareTemplateRequest containing base64 PDF and field definitions
     * @return PdfResponse with modified base64 PDF
     */
    @PostMapping("/prepare-template")
    public ResponseEntity<PdfResponse> prepareTemplate(@RequestBody PrepareTemplateRequest request) {
        try {
            log.info("Preparing template with " + request.getFields().size() + " fields");
            
            if (request.getPdfBase64() == null || request.getPdfBase64().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new PdfResponse(null, "PDF base64 is required", false));
            }
            
            if (request.getFields() == null || request.getFields().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new PdfResponse(null, "Fields definition is required", false));
            }
            
            PdfResponse response = pdfService.prepareTemplate(request);
            log.info("Template prepared successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid input: " + e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(new PdfResponse(null, "Invalid input: " + e.getMessage(), false));
        } catch (Exception e) {
            log.error("Error preparing template: " + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new PdfResponse(null, "Error: " + e.getMessage(), false));
        }
    }

    /**
     * Embeds field values into PDF
     * 
     * @param request EmbedValuesRequest containing base64 PDF and field values
     * @return PdfResponse with modified base64 PDF
     */
    @PostMapping("/embed-values")
    public ResponseEntity<PdfResponse> embedValues(@RequestBody EmbedValuesRequest request) {
        try {
            log.info("Embedding " + request.getFieldValues().size() + " values into PDF");
            
            if (request.getPdfBase64() == null || request.getPdfBase64().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new PdfResponse(null, "PDF base64 is required", false));
            }
            
            if (request.getFieldValues() == null || request.getFieldValues().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new PdfResponse(null, "Field values are required", false));
            }
            
            PdfResponse response = pdfService.embedValues(request);
            log.info("Values embedded successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid input: " + e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(new PdfResponse(null, "Invalid input: " + e.getMessage(), false));
        } catch (Exception e) {
            log.error("Error embedding values: " + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new PdfResponse(null, "Error: " + e.getMessage(), false));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Object> health() {
        return ResponseEntity.ok(new Object() {
            public String status = "OK";
            public String service = "PDF Service";
        });
    }
}
