package com.pdfservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmbedValuesRequest {
    private String pdfBase64;
    private List<FieldValue> fieldValues;
}
