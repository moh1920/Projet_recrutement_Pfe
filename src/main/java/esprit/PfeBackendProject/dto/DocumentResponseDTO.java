package esprit.PfeBackendProject.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentResponseDTO {
    private String name;
    private String size;
    private String date;
    private String type;
    private String url;
    private String publicId;
}