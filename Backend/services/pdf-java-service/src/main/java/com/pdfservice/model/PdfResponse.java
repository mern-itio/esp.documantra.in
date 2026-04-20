package com.pdfservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PdfResponse {
    private String pdfBase64;
    private String message;
    private boolean success;
}
