package com.pdfservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FieldDefinition {
    private String fieldId;
    private Integer page;
    private Double x;
    private Double y;
    private Double width;
    private Double height;
    private String type; // "text" or "signature"
    private String label;
}
