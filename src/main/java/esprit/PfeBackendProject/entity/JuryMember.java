package esprit.PfeBackendProject.entity;



import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "jury_members")
public class JuryMember {

    @Id
    private String id;

    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    private String title;
    private String department;
    private JuryRole role;

    private List<String> expertise;
    private List<Availability> availability;

    private Integer maxInterviewsPerDay;
    private List<TimeSlot> preferredTimeSlots;

    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Embedded Classes
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Availability {
        private Integer dayOfWeek; // 0-6
        private String startTime; // HH:MM
        private String endTime; // HH:MM
        private Boolean available;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSlot {
        private String startTime;
        private String endTime;
    }

    // Helper method to get full name
    public String getFullName() {
        return firstName + " " + lastName;
    }
}