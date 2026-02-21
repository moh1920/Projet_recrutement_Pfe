package esprit.PfeBackendProject.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewStatisticsDTO {

    private Long total;
    private Map<String, Long> byStatus;
    private Map<String, Long> byType;
    private Map<String, Long> byDepartment;
    private Double averageDuration;
    private Long upcomingCount;
    private Double completionRate;
    private Double cancellationRate;
}