package esprit.PfeBackendProject.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewFilterDTO {

    private List<String> status;
    private List<String> type;
    private LocalDate dateFrom;
    private LocalDate dateTo;
    private String candidateName;
    private String position;
    private String juryMember;
    private String department;
}