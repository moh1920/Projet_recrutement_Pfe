package esprit.PfeBackendProject.dto;

import lombok.Data;

import java.util.List;

@Data
public class CompetenceDTO {
    private List<String> langages;
    private List<String> frameworks;
    private List<String> data;
    private List<String> ia;
    private List<String> erp;
}
