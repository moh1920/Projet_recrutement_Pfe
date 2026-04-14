package esprit.PfeBackendProject.controller;


import esprit.PfeBackendProject.dto.InterviewDTO;
import esprit.PfeBackendProject.dto.InterviewFilterDTO;
import esprit.PfeBackendProject.dto.InterviewStatisticsDTO;
import esprit.PfeBackendProject.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    // ==================== GET Endpoints ====================

    /**
     * GET /api/interviews
     * Get all interviews
     */
    @GetMapping
    public ResponseEntity<List<InterviewDTO>> getAllInterviews() {
        log.info("REST request to get all interviews");
        List<InterviewDTO> interviews = interviewService.getAllInterviews();
        return ResponseEntity.ok(interviews);
    }

    /**
     * GET /api/interviews/{id}
     * Get interview by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<InterviewDTO> getInterviewById(@PathVariable String id) {
        log.info("REST request to get interview: {}", id);
        InterviewDTO interview = interviewService.getInterviewById(id);
        return ResponseEntity.ok(interview);
    }

    /**
     * POST /api/interviews/filter
     * Get interviews with filters
     */
    @PostMapping("/filter")
    public ResponseEntity<List<InterviewDTO>> getInterviewsWithFilters(
            @RequestBody InterviewFilterDTO filters) {
        log.info("REST request to get interviews with filters");
        List<InterviewDTO> interviews = interviewService.getInterviewsWithFilters(filters);
        return ResponseEntity.ok(interviews);
    }

    /**
     * GET /api/interviews/date-range
     * Get interviews by date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<InterviewDTO>> getInterviewsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("REST request to get interviews between {} and {}", startDate, endDate);
        List<InterviewDTO> interviews = interviewService.getInterviewsByDateRange(startDate, endDate);
        return ResponseEntity.ok(interviews);
    }

    /**
     * GET /api/interviews/upcoming
     * Get upcoming interviews
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<InterviewDTO>> getUpcomingInterviews() {
        log.info("REST request to get upcoming interviews");
        List<InterviewDTO> interviews = interviewService.getUpcomingInterviews();
        return ResponseEntity.ok(interviews);
    }

    /**
     * GET /api/interviews/today
     * Get today's interviews
     */
    @GetMapping("/today")
    public ResponseEntity<List<InterviewDTO>> getTodayInterviews() {
        log.info("REST request to get today's interviews");
        List<InterviewDTO> interviews = interviewService.getTodayInterviews();
        return ResponseEntity.ok(interviews);
    }

    /**
     * GET /api/interviews/jury/{juryMemberId}
     * Get interviews by jury member
     */
    @GetMapping("/jury/{juryMemberId}")
    public ResponseEntity<List<InterviewDTO>> getInterviewsByJuryMember(
            @PathVariable String juryMemberId) {
        log.info("REST request to get interviews for jury member: {}", juryMemberId);
        List<InterviewDTO> interviews = interviewService.getInterviewsByJuryMember(juryMemberId);
        return ResponseEntity.ok(interviews);
    }

    /**
     * GET /api/interviews/candidate/{candidateId}
     * Get interviews by candidate
     */
    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<InterviewDTO>> getInterviewsByCandidate(
            @PathVariable String candidateId) {
        log.info("REST request to get interviews for candidate: {}", candidateId);
        List<InterviewDTO> interviews = interviewService.getInterviewsByCandidate(candidateId);
        return ResponseEntity.ok(interviews);
    }

    /**
     * GET /api/interviews/candidate/{candidateId}
     * Get interviews by candidate
     */
    @GetMapping("/getInterviewsByEmail/{CandidateEmail}")
    public ResponseEntity<List<InterviewDTO>> getInterviewsByEmail(
            @PathVariable String CandidateEmail) {
        log.info("REST request to get interviews for candidate: {}", CandidateEmail);
        List<InterviewDTO> interviews = interviewService.getInterviewsByEmail(CandidateEmail);
        return ResponseEntity.ok(interviews);
    }

    /**
     * GET /api/interviews/statistics
     * Get interview statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<InterviewStatisticsDTO> getStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        log.info("REST request to get interview statistics");
        InterviewStatisticsDTO statistics = interviewService.getStatistics(dateFrom, dateTo);
        return ResponseEntity.ok(statistics);
    }

    // ==================== POST Endpoints ====================

    /**
     * POST /api/interviews
     * Create a new interview
     */
    @PostMapping("create")
    public ResponseEntity<InterviewDTO> createInterview(
             @RequestBody InterviewDTO interviewDTO) {
        log.info("REST request to create interview");

        if (interviewDTO.getId() != null) {
            return ResponseEntity.badRequest().build();
        }

        InterviewDTO createdInterview = interviewService.createInterview(interviewDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdInterview);
    }

    /**
     * POST /api/interviews/batch
     * Batch create interviews
     */
    @PostMapping("/batch")
    public ResponseEntity<List<InterviewDTO>> batchCreateInterviews(
            @Valid @RequestBody List<InterviewDTO> interviewDTOs) {
        log.info("REST request to batch create {} interviews", interviewDTOs.size());
        List<InterviewDTO> createdInterviews = interviewService.batchCreateInterviews(interviewDTOs);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdInterviews);
    }

    // ==================== PUT/PATCH Endpoints ====================

    /**
     * PUT /api/interviews/{id}
     * Update an interview
     */
    @PutMapping("/{id}")
    public ResponseEntity<InterviewDTO> updateInterview(
            @PathVariable String id,
            @Valid @RequestBody InterviewDTO interviewDTO) {
        log.info("REST request to update interview: {}", id);
        InterviewDTO updatedInterview = interviewService.updateInterview(id, interviewDTO);
        return ResponseEntity.ok(updatedInterview);
    }

    /**
     * PATCH /api/interviews/{id}/status
     * Update interview status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<InterviewDTO> updateInterviewStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusUpdate) {
        log.info("REST request to update status for interview: {}", id);
        String status = statusUpdate.get("status");
        InterviewDTO updatedInterview = interviewService.updateInterviewStatus(id, status);
        return ResponseEntity.ok(updatedInterview);
    }

    /**
     * PATCH /api/interviews/{id}/reschedule
     * Reschedule an interview
     */
    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<InterviewDTO> rescheduleInterview(
            @PathVariable String id,
            @RequestBody Map<String, String> rescheduleData) {
        log.info("REST request to reschedule interview: {}", id);
        LocalDate date = LocalDate.parse(rescheduleData.get("date"));
        String time = rescheduleData.get("time");
        InterviewDTO updatedInterview = interviewService.rescheduleInterview(id, date, time);
        return ResponseEntity.ok(updatedInterview);
    }

    // ==================== DELETE Endpoints ====================

    /**
     * DELETE /api/interviews/{id}
     * Delete an interview
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInterview(@PathVariable String id) {
        log.info("REST request to delete interview: {}", id);
        interviewService.deleteInterview(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/interviews/batch
     * Batch delete interviews
     */
    @DeleteMapping("/batch")
    public ResponseEntity<Void> batchDeleteInterviews(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.get("ids");
        log.info("REST request to batch delete {} interviews", ids.size());
        interviewService.batchDeleteInterviews(ids);
        return ResponseEntity.noContent().build();
    }

}