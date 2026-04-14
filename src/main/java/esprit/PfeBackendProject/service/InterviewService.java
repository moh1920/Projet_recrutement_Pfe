package esprit.PfeBackendProject.service;


import esprit.PfeBackendProject.configuration.InterviewMapper;
import esprit.PfeBackendProject.dto.InterviewDTO;
import esprit.PfeBackendProject.dto.InterviewFilterDTO;
import esprit.PfeBackendProject.dto.InterviewStatisticsDTO;
import esprit.PfeBackendProject.entity.Interview;
import esprit.PfeBackendProject.entity.InterviewStatus;
import esprit.PfeBackendProject.entity.InterviewType;
import esprit.PfeBackendProject.entity.JuryMember;
import esprit.PfeBackendProject.exceptions.ResourceNotFoundException;
import esprit.PfeBackendProject.repository.InterviewRepository;
import esprit.PfeBackendProject.repository.JuryMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final JuryMemberRepository juryMemberRepository;
    private final InterviewMapper interviewMapper;

    // ==================== GET Operations ====================

    /**
     * Get all interviews
     */
    public List<InterviewDTO> getAllInterviews() {
        log.info("Fetching all interviews");
        List<Interview> interviews = interviewRepository.findAll();
        return interviews.stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get interview by ID
     */
    public InterviewDTO getInterviewById(String id) {
        log.info("Fetching interview with id: {}", id);
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + id));
        return interviewMapper.toDTO(interview);
    }

    /**
     * Get interviews with filters
     */
    public List<InterviewDTO> getInterviewsWithFilters(InterviewFilterDTO filters) {
        log.info("Fetching interviews with filters: {}", filters);

        List<Interview> interviews = interviewRepository.findAll();

        // Apply filters
        if (filters.getStatus() != null && !filters.getStatus().isEmpty()) {
            List<InterviewStatus> statuses = filters.getStatus().stream()
                    .map(InterviewStatus::fromLabel)
                    .collect(Collectors.toList());
            interviews = interviews.stream()
                    .filter(i -> statuses.contains(i.getStatus()))
                    .collect(Collectors.toList());
        }

        if (filters.getType() != null && !filters.getType().isEmpty()) {
            List<InterviewType> types = filters.getType().stream()
                    .map(InterviewType::fromValue)
                    .collect(Collectors.toList());
            interviews = interviews.stream()
                    .filter(i -> types.contains(i.getType()))
                    .collect(Collectors.toList());
        }

        if (filters.getDateFrom() != null) {
            interviews = interviews.stream()
                    .filter(i -> !i.getDate().isBefore(filters.getDateFrom()))
                    .collect(Collectors.toList());
        }

        if (filters.getDateTo() != null) {
            interviews = interviews.stream()
                    .filter(i -> !i.getDate().isAfter(filters.getDateTo()))
                    .collect(Collectors.toList());
        }

        if (filters.getCandidateName() != null && !filters.getCandidateName().isEmpty()) {
            String searchTerm = filters.getCandidateName().toLowerCase();
            interviews = interviews.stream()
                    .filter(i -> i.getCandidateName().toLowerCase().contains(searchTerm))
                    .collect(Collectors.toList());
        }

        if (filters.getPosition() != null && !filters.getPosition().isEmpty()) {
            String searchTerm = filters.getPosition().toLowerCase();
            interviews = interviews.stream()
                    .filter(i -> i.getPosition().toLowerCase().contains(searchTerm))
                    .collect(Collectors.toList());
        }

        if (filters.getJuryMember() != null && !filters.getJuryMember().isEmpty()) {
            String searchTerm = filters.getJuryMember().toLowerCase();
            interviews = interviews.stream()
                    .filter(i -> i.getJury() != null &&
                            i.getJury().stream().anyMatch(j -> j.toLowerCase().contains(searchTerm)))
                    .collect(Collectors.toList());
        }

        if (filters.getDepartment() != null && !filters.getDepartment().isEmpty()) {
            interviews = interviews.stream()
                    .filter(i -> filters.getDepartment().equals(i.getDepartment()))
                    .collect(Collectors.toList());
        }

        return interviews.stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get interviews by date range
     */
    public List<InterviewDTO> getInterviewsByDateRange(LocalDate startDate, LocalDate endDate) {
        log.info("Fetching interviews between {} and {}", startDate, endDate);
        List<Interview> interviews = interviewRepository.findByDateBetween(startDate, endDate);
        return interviews.stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get upcoming interviews
     */
    public List<InterviewDTO> getUpcomingInterviews() {
        log.info("Fetching upcoming interviews");
        LocalDate today = LocalDate.now();
        List<Interview> interviews = interviewRepository.findUpcoming(today);
        return interviews.stream()
                .map(interviewMapper::toDTO)
                .sorted(Comparator.comparing(InterviewDTO::getDate)
                        .thenComparing(InterviewDTO::getTime))
                .collect(Collectors.toList());
    }

    /**
     * Get today's interviews
     */
    public List<InterviewDTO> getTodayInterviews() {
        log.info("Fetching today's interviews");
        LocalDate today = LocalDate.now();
        List<Interview> interviews = interviewRepository.findTodayInterviews(today);
        return interviews.stream()
                .map(interviewMapper::toDTO)
                .sorted(Comparator.comparing(InterviewDTO::getTime))
                .collect(Collectors.toList());
    }

    /**
     * Get interviews by jury member
     */
    public List<InterviewDTO> getInterviewsByJuryMember(String juryMemberId) {
        log.info("Fetching interviews for jury member: {}", juryMemberId);
        List<Interview> interviews = interviewRepository.findByJuryMemberId(juryMemberId);
        return interviews.stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get interviews by candidate
     */
    public List<InterviewDTO> getInterviewsByCandidate(String candidateId) {
        log.info("Fetching interviews for candidate: {}", candidateId);
        List<Interview> interviews = interviewRepository.findByCandidateId(candidateId);
        return interviews.stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    // ==================== CREATE Operations ====================

    /**
     * Create a new interview
     */
    @Transactional
    public InterviewDTO createInterview(InterviewDTO interviewDTO) {
        log.info("Creating new interview for candidate: {}", interviewDTO.getCandidateName());

        Interview interview = interviewMapper.toEntity(interviewDTO);
        if (interviewDTO.getJuryIds() != null && !interviewDTO.getJuryIds().isEmpty()) {
            enrichWithJuryInfo(interview, interviewDTO.getJuryIds());
        }

        interview.setCreatedAt(LocalDateTime.now());
        interview.setUpdatedAt(LocalDateTime.now());

        if (interview.getStatus() == null) {
            interview.setStatus(InterviewStatus.PLANIFIE);
        }

        Interview savedInterview = interviewRepository.save(interview);
        log.info("Interview created successfully with id: {}", savedInterview.getId());

        return interviewMapper.toDTO(savedInterview);
    }

    /**
     * Batch create interviews
     */
    @Transactional
    public List<InterviewDTO> batchCreateInterviews(List<InterviewDTO> interviewDTOs) {
        log.info("Batch creating {} interviews", interviewDTOs.size());

        List<Interview> interviews = interviewDTOs.stream()
                .map(interviewMapper::toEntity)
                .peek(interview -> {
                    interview.setCreatedAt(LocalDateTime.now());
                    interview.setUpdatedAt(LocalDateTime.now());
                    if (interview.getStatus() == null) {
                        interview.setStatus(InterviewStatus.PLANIFIE);
                    }
                })
                .collect(Collectors.toList());

        List<Interview> savedInterviews = interviewRepository.saveAll(interviews);
        log.info("Batch created {} interviews successfully", savedInterviews.size());

        return savedInterviews.stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    // ==================== UPDATE Operations ====================

    /**
     * Update an interview
     */
    @Transactional
    public InterviewDTO updateInterview(String id, InterviewDTO interviewDTO) {
        log.info("Updating interview with id: {}", id);

        Interview existingInterview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + id));

        // Update fields
        if (interviewDTO.getCandidateName() != null) {
            existingInterview.setCandidateName(interviewDTO.getCandidateName());
        }
        if (interviewDTO.getCandidateEmail() != null) {
            existingInterview.setCandidateEmail(interviewDTO.getCandidateEmail());
        }
        if (interviewDTO.getCandidatePhone() != null) {
            existingInterview.setCandidatePhone(interviewDTO.getCandidatePhone());
        }
        if (interviewDTO.getPosition() != null) {
            existingInterview.setPosition(interviewDTO.getPosition());
        }
        if (interviewDTO.getDepartment() != null) {
            existingInterview.setDepartment(interviewDTO.getDepartment());
        }
        if (interviewDTO.getDate() != null) {
            existingInterview.setDate(interviewDTO.getDate());
        }
        if (interviewDTO.getTime() != null) {
            existingInterview.setTime(interviewDTO.getTime());
        }
        if (interviewDTO.getDuration() != null) {
            existingInterview.setDuration(interviewDTO.getDuration());
        }
        if (interviewDTO.getType() != null) {
            existingInterview.setType(InterviewType.fromValue(interviewDTO.getType()));
        }
        if (interviewDTO.getStatus() != null) {
            existingInterview.setStatus(InterviewStatus.fromLabel(interviewDTO.getStatus()));
        }
        if (interviewDTO.getJuryIds() != null) {
            enrichWithJuryInfo(existingInterview, interviewDTO.getJuryIds());
        }
        if (interviewDTO.getMeetLink() != null) {
            existingInterview.setMeetLink(interviewDTO.getMeetLink());
        }
        if (interviewDTO.getRoom() != null) {
            existingInterview.setRoom(interviewDTO.getRoom());
        }
        if (interviewDTO.getLocation() != null) {
            existingInterview.setLocation(interviewDTO.getLocation());
        }
        if (interviewDTO.getNotes() != null) {
            existingInterview.setNotes(interviewDTO.getNotes());
        }

        existingInterview.setUpdatedAt(LocalDateTime.now());

        Interview updatedInterview = interviewRepository.save(existingInterview);
        log.info("Interview updated successfully with id: {}", id);

        return interviewMapper.toDTO(updatedInterview);
    }

    /**
     * Update interview status
     */
    @Transactional
    public InterviewDTO updateInterviewStatus(String id, String status) {
        log.info("Updating status for interview {}: {}", id, status);

        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + id));

        interview.setStatus(InterviewStatus.fromLabel(status));
        interview.setUpdatedAt(LocalDateTime.now());

        Interview updatedInterview = interviewRepository.save(interview);
        log.info("Interview status updated successfully");

        return interviewMapper.toDTO(updatedInterview);
    }

    /**
     * Reschedule interview
     */
    @Transactional
    public InterviewDTO rescheduleInterview(String id, LocalDate date, String time) {
        log.info("Rescheduling interview {}: {} at {}", id, date, time);

        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + id));

        interview.setDate(date);
        interview.setTime(java.time.LocalTime.parse(time));
        interview.setUpdatedAt(LocalDateTime.now());

        Interview updatedInterview = interviewRepository.save(interview);
        log.info("Interview rescheduled successfully");

        return interviewMapper.toDTO(updatedInterview);
    }

    // ==================== DELETE Operations ====================

    /**
     * Delete an interview
     */
    @Transactional
    public void deleteInterview(String id) {
        log.info("Deleting interview with id: {}", id);

        if (!interviewRepository.existsById(id)) {
            throw new ResourceNotFoundException("Interview not found with id: " + id);
        }

        interviewRepository.deleteById(id);
        log.info("Interview deleted successfully");
    }

    /**
     * Batch delete interviews
     */
    @Transactional
    public void batchDeleteInterviews(List<String> ids) {
        log.info("Batch deleting {} interviews", ids.size());
        interviewRepository.deleteAllById(ids);
        log.info("Interviews deleted successfully");
    }

    // ==================== Statistics ====================

    /**
     * Get interview statistics
     */
    public InterviewStatisticsDTO getStatistics(LocalDate dateFrom, LocalDate dateTo) {
        log.info("Calculating statistics from {} to {}", dateFrom, dateTo);

        List<Interview> interviews;
        if (dateFrom != null && dateTo != null) {
            interviews = interviewRepository.findByDateBetween(dateFrom, dateTo);
        } else {
            interviews = interviewRepository.findAll();
        }

        Map<String, Long> byStatus = interviews.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getStatus().getLabel(),
                        Collectors.counting()
                ));

        Map<String, Long> byType = interviews.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getType().getValue(),
                        Collectors.counting()
                ));

        Map<String, Long> byDepartment = interviews.stream()
                .filter(i -> i.getDepartment() != null)
                .collect(Collectors.groupingBy(
                        Interview::getDepartment,
                        Collectors.counting()
                ));

        Double averageDuration = interviews.stream()
                .mapToInt(Interview::getDuration)
                .average()
                .orElse(0.0);

        long upcomingCount = interviews.stream()
                .filter(i -> !i.getDate().isBefore(LocalDate.now()))
                .count();

        long completedCount = interviews.stream()
                .filter(i -> i.getStatus() == InterviewStatus.TERMINE)
                .count();

        long cancelledCount = interviews.stream()
                .filter(i -> i.getStatus() == InterviewStatus.ANNULE)
                .count();

        double completionRate = interviews.isEmpty() ? 0.0 :
                (completedCount * 100.0) / interviews.size();

        double cancellationRate = interviews.isEmpty() ? 0.0 :
                (cancelledCount * 100.0) / interviews.size();

        return InterviewStatisticsDTO.builder()
                .total((long) interviews.size())
                .byStatus(byStatus)
                .byType(byType)
                .byDepartment(byDepartment)
                .averageDuration(averageDuration)
                .upcomingCount(upcomingCount)
                .completionRate(completionRate)
                .cancellationRate(cancellationRate)
                .build();
    }

    // ==================== Helper Methods ====================

    /**
     * Enrich interview with jury information
     */
    private void enrichWithJuryInfo(Interview interview, List<String> juryIds) {
        List<JuryMember> juryMembers = juryMemberRepository.findAllById(juryIds);

        interview.setJuryIds(juryIds);
        interview.setJury(juryMembers.stream()
                .map(JuryMember::getFullName)
                .collect(Collectors.toList()));
        interview.setJuryEmails(juryMembers.stream()
                .map(JuryMember::getEmail)
                .toList());
    }



    /**
     * Get interviews by email profile
     */
    public List<InterviewDTO> getInterviewsByEmail(String email) {
        log.info("Fetching interviews for candidate: {}", email);
        List<Interview> interviews = interviewRepository.findByCandidateEmail(email);
        return interviews.stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

}