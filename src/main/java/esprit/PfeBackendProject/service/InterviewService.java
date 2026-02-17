//package esprit.PfeBackendProject.service;
//
//
//
//import esprit.PfeBackendProject.repository.CandidatureRepository;
//import esprit.PfeBackendProject.repository.InterviewRepository;
//import esprit.PfeBackendProject.repository.JuryMemberRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.cache.annotation.CacheEvict;
//import org.springframework.cache.annotation.Cacheable;
//
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.time.LocalTime;
//import java.time.format.DateTimeFormatter;
//import java.util.*;
//import java.util.stream.Collectors;
//
//@Slf4j
//@Service
//@RequiredArgsConstructor
//public class InterviewService {
//
//    private final InterviewRepository interviewRepository;
//    private final JuryMemberRepository juryMemberRepository;
//    private final CandidatureRepository candidateRepository;
//    private final InterviewMapper interviewMapper;
//    private final NotificationService notificationService;
//    private final MeetingService meetingService;
//    private final ExportService exportService;
//    private final ValidationService validationService;
//
//    // ==================== GET Operations ====================
//
//    @Cacheable(value = "interviews", unless = "#result == null")
//    public List<InterviewDTO> getAllInterviews() {
//        log.info("Fetching all interviews");
//        return interviewRepository.findAll().stream()
//                .map(interviewMapper::toDTO)
//                .collect(Collectors.toList());
//    }
//
//    public InterviewDTO getInterviewById(String id) {
//        log.info("Fetching interview by id: {}", id);
//        Interview interview = interviewRepository.findById(id)
//                .orElseThrow(() -> new InterviewNotFoundException("Interview not found: " + id));
//        return interviewMapper.toDTO(interview);
//    }
//
//    public List<InterviewDTO> getInterviewsWithFilters(InterviewFilterDTO filters) {
//        log.info("Fetching interviews with filters: {}", filters);
//
//        // Implementation using JPA Specifications or QueryDSL
//        return interviewRepository.findAllWithFilters(filters).stream()
//                .map(interviewMapper::toDTO)
//                .collect(Collectors.toList());
//    }
//
//    public List<InterviewDTO> getInterviewsByDateRange(String startDate, String endDate) {
//        log.info("Fetching interviews between {} and {}", startDate, endDate);
//        LocalDate start = LocalDate.parse(startDate);
//        LocalDate end = LocalDate.parse(endDate);
//
//        return interviewRepository.findByDateBetween(start, end).stream()
//                .map(interviewMapper::toDTO)
//                .collect(Collectors.toList());
//    }
//
//    public List<InterviewDTO> getInterviewsByJuryMember(String juryMemberId) {
//        log.info("Fetching interviews for jury member: {}", juryMemberId);
//        return interviewRepository.findByJuryMembersId(juryMemberId).stream()
//                .map(interviewMapper::toDTO)
//                .collect(Collectors.toList());
//    }
//
//    public List<InterviewDTO> getInterviewsByCandidate(String candidateId) {
//        log.info("Fetching interviews for candidate: {}", candidateId);
//        return interviewRepository.findByCandidateId(candidateId).stream()
//                .map(interviewMapper::toDTO)
//                .collect(Collectors.toList());
//    }
//
//    public List<InterviewDTO> getUpcomingInterviews() {
//        log.info("Fetching upcoming interviews");
//        LocalDate today = LocalDate.now();
//        LocalDate nextWeek = today.plusDays(7);
//
//        return interviewRepository.findByDateBetweenAndStatusNot(today, nextWeek, InterviewStatus.ANNULE).stream()
//                .map(interviewMapper::toDTO)
//                .collect(Collectors.toList());
//    }
//
//    public List<InterviewDTO> getTodayInterviews() {
//        log.info("Fetching today's interviews");
//        LocalDate today = LocalDate.now();
//        return interviewRepository.findByDate(today).stream()
//                .map(interviewMapper::toDTO)
//                .collect(Collectors.toList());
//    }
//
//    // ==================== CREATE Operations ====================
//
//    @Transactional
//    @CacheEvict(value = "interviews", allEntries = true)
//    public InterviewDTO createInterview(CreateInterviewRequestDTO request) {
//        log.info("Creating new interview for candidate: {}", request.getCandidateName());
//
//        // Validation
//        ValidationResultDTO validation = validationService.validateInterview(request);
//        if (!validation.isValid()) {
//            throw new IllegalArgumentException("Validation failed: " + validation.getErrors());
//        }
//
//        // Check conflicts
//        checkConflicts(request.getDate(), request.getTime(), request.getDuration(),
//                request.getJuryIds(), request.getRoom(), null);
//
//        Interview interview = interviewMapper.toEntity(request);
//        interview.setStatus(InterviewStatus.PLANIFIE);
//        interview.setCreatedAt(LocalDateTime.now());
//        interview.setUpdatedAt(LocalDateTime.now());
//
//        // Generate meeting link if requested
//        if (request.getMeetProvider() != null) {
//            MeetingDetailsDTO meeting = meetingService.generateMeetingLink(
//                    interview.getId(), request.getMeetProvider());
//            interview.setMeetLink(meeting.getLink());
//        }
//
//        Interview saved = interviewRepository.save(interview);
//
//        // Send notification
//        notificationService.sendNotification(new NotificationRequestDTO(
//                interviewMapper.toDTO(saved),
//                NotificationAction.CREATED,
//                getRecipients(saved),
//                null,
//                true,
//                false
//        ));
//
//        return interviewMapper.toDTO(saved);
//    }
//
//    @Transactional
//    @CacheEvict(value = "interviews", allEntries = true)
//    public List<InterviewDTO> batchCreateInterviews(List<CreateInterviewRequestDTO> requests) {
//        log.info("Batch creating {} interviews", requests.size());
//
//        List<InterviewDTO> created = new ArrayList<>();
//        for (CreateInterviewRequestDTO request : requests) {
//            created.add(createInterview(request));
//        }
//        return created;
//    }
//
//    // ==================== UPDATE Operations ====================
//
//    @Transactional
//    @CacheEvict(value = "interviews", allEntries = true)
//    public InterviewDTO updateInterview(String id, UpdateInterviewRequestDTO request) {
//        log.info("Updating interview: {}", id);
//
//        Interview interview = interviewRepository.findById(id)
//                .orElseThrow(() -> new InterviewNotFoundException("Interview not found: " + id));
//
//        interviewMapper.updateEntity(interview, request);
//        interview.setUpdatedAt(LocalDateTime.now());
//
//        Interview saved = interviewRepository.save(interview);
//
//        // Send notification
//        notificationService.sendNotification(new NotificationRequestDTO(
//                interviewMapper.toDTO(saved),
//                NotificationAction.UPDATED,
//                getRecipients(saved),
//                null,
//                true,
//                false
//        ));
//
//        return interviewMapper.toDTO(saved);
//    }
//
//    @Transactional
//    @CacheEvict(value = "interviews", allEntries = true)
//    public InterviewDTO updateInterviewStatus(String id, InterviewStatus status) {
//        log.info("Updating interview {} status to {}", id, status);
//
//        Interview interview = interviewRepository.findById(id)
//                .orElseThrow(() -> new InterviewNotFoundException("Interview not found: " + id));
//
//        interview.setStatus(status);
//        interview.setUpdatedAt(LocalDateTime.now());
//
//        Interview saved = interviewRepository.save(interview);
//        return interviewMapper.toDTO(saved);
//    }
//
//    @Transactional
//    @CacheEvict(value = "interviews", allEntries = true)
//    public InterviewDTO rescheduleInterview(String id, RescheduleRequestDTO request) {
//        log.info("Rescheduling interview {} to {} {}", id, request.getDate(), request.getTime());
//
//        Interview interview = interviewRepository.findById(id)
//                .orElseThrow(() -> new InterviewNotFoundException("Interview not found: " + id));
//
//        // Check conflicts excluding current interview
//        checkConflicts(request.getDate(), request.getTime(), interview.getDuration(),
//                interview.getJuryMembers().stream().map(JuryMember::getId).collect(Collectors.toList()),
//                interview.getRoom(), id);
//
//        interview.setDate(LocalDate.parse(request.getDate()));
//        interview.setTime(LocalTime.parse(request.getTime()));
//        interview.setUpdatedAt(LocalDateTime.now());
//
//        Interview saved = interviewRepository.save(interview);
//
//        // Send notification if requested
//        if (request.isNotifyParticipants()) {
//            notificationService.sendNotification(new NotificationRequestDTO(
//                    interviewMapper.toDTO(saved),
//                    NotificationAction.RESCHEDULED,
//                    getRecipients(saved),
//                    request.getReason(),
//                    true,
//                    false
//            ));
//        }
//
//        return interviewMapper.toDTO(saved);
//    }
//
//    @Transactional
//    @CacheEvict(value = "interviews", allEntries = true)
//    public InterviewDTO updateJury(String id, List<String> juryIds) {
//        log.info("Updating jury for interview: {}", id);
//
//        Interview interview = interviewRepository.findById(id)
//                .orElseThrow(() -> new InterviewNotFoundException("Interview not found: " + id));
//
//        List<JuryMember> juryMembers = juryMemberRepository.findAllById(juryIds);
//        interview.setJuryMembers(juryMembers);
//        interview.setUpdatedAt(LocalDateTime.now());
//
//        Interview saved = interviewRepository.save(interview);
//        return interviewMapper.toDTO(saved);
//    }
//
//    // ==================== DELETE Operations ====================
//
//    @Transactional
//    @CacheEvict(value = "interviews", allEntries = true)
//    public void deleteInterview(String id) {
//        log.info("Deleting interview: {}", id);
//
//        Interview interview = interviewRepository.findById(id)
//                .orElseThrow(() -> new InterviewNotFoundException("Interview not found: " + id));
//
//        interviewRepository.delete(interview);
//    }
//
//    @Transactional
//    @CacheEvict(value = "interviews", allEntries = true)
//    public void batchDeleteInterviews(List<String> ids) {
//        log.info("Batch deleting {} interviews", ids.size());
//        interviewRepository.deleteAllById(ids);
//    }
//
//    // ==================== Notifications ====================
//
//    public void sendNotification(NotificationRequestDTO request) {
//        log.info("Sending notification for interview: {}", request.getInterview().getId());
//        notificationService.sendNotification(request);
//    }
//
//    public void sendReminder(String interviewId, ReminderType type) {
//        log.info("Sending reminder for interview: {}", interviewId);
//        Interview interview = interviewRepository.findById(interviewId)
//                .orElseThrow(() -> new InterviewNotFoundException("Interview not found: " + interviewId));
//
//        notificationService.sendReminder(interview, type);
//    }
//
//    public void sendBulkReminders(List<String> interviewIds, ReminderType type) {
//        log.info("Sending bulk reminders for {} interviews", interviewIds.size());
//        for (String id : interviewIds) {
//            sendReminder(id, type);
//        }
//    }
//
//    // ==================== Attachments ====================
//
//    @Transactional
//    public AttachmentDTO uploadAttachment(String interviewId, MultipartFile file) {
//        log.info("Uploading attachment to interview: {}", interviewId);
//        // Implementation for file storage (S3, local, etc.)
//        return new AttachmentDTO();
//    }
//
//    @Transactional
//    public void deleteAttachment(String interviewId, String attachmentId) {
//        log.info("Deleting attachment {} from interview {}", attachmentId, interviewId);
//        // Implementation
//    }
//
//    public byte[] downloadAttachment(String interviewId, String attachmentId) {
//        log.info("Downloading attachment {} from interview {}", attachmentId, interviewId);
//        // Implementation
//        return new byte[0];
//    }
//
//    // ==================== Statistics & Reports ====================
//
//    public InterviewStatisticsDTO getStatistics(String dateFrom, String dateTo) {
//        log.info("Generating statistics from {} to {}", dateFrom, dateTo);
//
//        LocalDate start = dateFrom != null ? LocalDate.parse(dateFrom) : LocalDate.now().minusMonths(12);
//        LocalDate end = dateTo != null ? LocalDate.parse(dateTo) : LocalDate.now();
//
//        List<Interview> interviews = interviewRepository.findByDateBetween(start, end);
//
//        InterviewStatisticsDTO stats = new InterviewStatisticsDTO();
//        stats.setTotal(interviews.size());
//        stats.setByStatus(interviews.stream()
//                .collect(Collectors.groupingBy(Interview::getStatus, Collectors.counting())));
//        stats.setByType(interviews.stream()
//                .collect(Collectors.groupingBy(Interview::getType, Collectors.counting())));
//        stats.setByDepartment(interviews.stream()
//                .collect(Collectors.groupingBy(Interview::getDepartment, Collectors.counting())));
//
//        // Calculate average duration
//        double avgDuration = interviews.stream()
//                .mapToInt(Interview::getDuration)
//                .average()
//                .orElse(0);
//        stats.setAverageDuration((int) avgDuration);
//
//        // Upcoming count
//        stats.setUpcomingCount((int) interviews.stream()
//                .filter(i -> i.getDate().isAfter(LocalDate.now()))
//                .count());
//
//        return stats;
//    }
//
//    public List<AvailabilitySlotDTO> checkAvailability(String date, List<String> juryIds) {
//        log.info("Checking availability for {} with jury {}", date, juryIds);
//        LocalDate localDate = LocalDate.parse(date);
//
//        // Get all interviews for the date
//        List<Interview> interviews = interviewRepository.findByDate(localDate);
//
//        // Generate time slots (e.g., 9:00 to 18:00 with 1-hour intervals)
//        List<AvailabilitySlotDTO> slots = new ArrayList<>();
//        LocalTime startTime = LocalTime.of(9, 0);
//        LocalTime endTime = LocalTime.of(18, 0);
//
//        for (LocalTime time = startTime; !time.isAfter(endTime); time = time.plusHours(1)) {
//            final LocalTime currentTime = time;
//
//            // Check if any jury member is busy at this time
//            boolean available = true;
//            List<String> busyJury = new ArrayList<>();
//
//            if (juryIds != null) {
//                for (String juryId : juryIds) {
//                    boolean isBusy = interviews.stream()
//                            .filter(i -> i.getJuryMembers().stream()
//                                    .anyMatch(j -> j.getId().equals(juryId)))
//                            .anyMatch(i -> {
//                                LocalTime interviewStart = i.getTime();
//                                LocalTime interviewEnd = interviewStart.plusMinutes(i.getDuration());
//                                return !currentTime.isBefore(interviewStart) &&
//                                        currentTime.isBefore(interviewEnd);
//                            });
//
//                    if (isBusy) {
//                        busyJury.add(juryId);
//                    }
//                }
//                available = busyJury.size() < juryIds.size();
//            }
//
//            slots.add(new AvailabilitySlotDTO(
//                    time.format(DateTimeFormatter.ofPattern("HH:mm")),
//                    available,
//                    interviews.size(),
//                    juryIds != null ? juryIds.stream().filter(id -> !busyJury.contains(id)).collect(Collectors.toList()) : null
//            ));
//        }
//
//        return slots;
//    }
//
//    public List<ConflictDTO> checkConflicts(String date, String time, Integer duration,
//                                            List<String> juryIds, String room, String excludeInterviewId) {
//        log.info("Checking conflicts for {} {} with jury {}", date, time, juryIds);
//
//        LocalDate localDate = LocalDate.parse(date);
//        LocalTime localTime = LocalTime.parse(time);
//        int dur = duration != null ? duration : 60;
//
//        List<Interview> interviews = interviewRepository.findByDate(localDate);
//        List<ConflictDTO> conflicts = new ArrayList<>();
//
//        for (Interview interview : interviews) {
//            if (excludeInterviewId != null && interview.getId().equals(excludeInterviewId)) {
//                continue;
//            }
//
//            LocalTime existingStart = interview.getTime();
//            LocalTime existingEnd = existingStart.plusMinutes(interview.getDuration());
//            LocalTime newEnd = localTime.plusMinutes(dur);
//
//            // Check time overlap
//            boolean timeOverlap = localTime.isBefore(existingEnd) && newEnd.isAfter(existingStart);
//
//            if (timeOverlap) {
//                // Check jury conflicts
//                for (String juryId : juryIds) {
//                    if (interview.getJuryMembers().stream().anyMatch(j -> j.getId().equals(juryId))) {
//                        conflicts.add(new ConflictDTO(
//                                ConflictType.JURY_UNAVAILABLE,
//                                interview.getId(),
//                                juryId,
//                                null,
//                                null,
//                                "Jury member has conflicting interview"
//                        ));
//                    }
//                }
//
//                // Check room conflict
//                if (room != null && room.equals(interview.getRoom())) {
//                    conflicts.add(new ConflictDTO(
//                            ConflictType.ROOM_OCCUPIED,
//                            interview.getId(),
//                            null,
//                            null,
//                            room,
//                            "Room is already occupied"
//                    ));
//                }
//            }
//        }
//
//        return conflicts;
//    }
//
//    // ==================== Export Functions ====================
//
//    public byte[] exportToExcel(ExportRequestDTO request) {
//        log.info("Exporting to Excel");
//        return exportService.exportToExcel(request.getInterviews(), request.getWeekDays());
//    }
//
//    public byte[] exportToPDF(ExportRequestDTO request) {
//        log.info("Exporting to PDF");
//        return exportService.exportToPDF(request.getInterviews(), request.getWeekDays());
//    }
//
//    public byte[] exportToCSV(List<InterviewDTO> interviews) {
//        log.info("Exporting to CSV");
//        return exportService.exportToCSV(interviews);
//    }
//
//    public byte[] exportToICal(List<InterviewDTO> interviews) {
//        log.info("Exporting to iCal");
//        return exportService.exportToICal(interviews);
//    }
//
//    // ==================== Utility Functions ====================
//
//    @Transactional
//    public InterviewDTO duplicateInterview(String id) {
//        log.info("Duplicating interview: {}", id);
//
//        Interview original = interviewRepository.findById(id)
//                .orElseThrow(() -> new InterviewNotFoundException("Interview not found: " + id));
//
//        Interview duplicate = new Interview();
//        duplicate.setCandidateName(original.getCandidateName());
//        duplicate.setCandidateEmail(original.getCandidateEmail());
//        duplicate.setCandidatePhone(original.getCandidatePhone());
//        duplicate.setPosition(original.getPosition());
//        duplicate.setDepartment(original.getDepartment());
//        duplicate.setDate(original.getDate().plusDays(7)); // Schedule 1 week later
//        duplicate.setTime(original.getTime());
//        duplicate.setDuration(original.getDuration());
//        duplicate.setType(original.getType());
//        duplicate.setStatus(InterviewStatus.PLANIFIE);
//        duplicate.setJuryMembers(original.getJuryMembers());
//        duplicate.setRoom(original.getRoom());
//        duplicate.setLocation(original.getLocation());
//        duplicate.setNotes(original.getNotes());
//        duplicate.setRequirements(original.getRequirements());
//        duplicate.setCreatedAt(LocalDateTime.now());
//        duplicate.setUpdatedAt(LocalDateTime.now());
//
//        Interview saved = interviewRepository.save(duplicate);
//        return interviewMapper.toDTO(saved);
//    }
//
//    public List<TimeSlotSuggestionDTO> suggestTimeSlots(SuggestTimeSlotsRequestDTO request) {
//        log.info("Suggesting time slots for jury {}", request.getJuryIds());
//
//        List<TimeSlotSuggestionDTO> suggestions = new ArrayList<>();
//        LocalDate start = LocalDate.parse(request.getDateRange().getStart());
//        LocalDate end = LocalDate.parse(request.getDateRange().getEnd());
//
//        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
//            // Skip if preferred days specified and doesn't match
//            if (request.getPreferredDays() != null &&
//                    !request.getPreferredDays().contains(date.getDayOfWeek().getValue() % 7)) {
//                continue;
//            }
//
//            List<AvailabilitySlotDTO> availableSlots = checkAvailability(date.toString(), request.getJuryIds());
//
//            for (AvailabilitySlotDTO slot : availableSlots) {
//                if (slot.isAvailable()) {
//                    int score = calculateSlotScore(date, slot.getHour(), request);
//                    suggestions.add(new TimeSlotSuggestionDTO(
//                            date.toString(),
//                            slot.getHour(),
//                            score,
//                            request.getJuryIds(),
//                            score > 80 ? "Optimal slot" : "Available slot"
//                    ));
//                }
//            }
//        }
//
//        // Sort by score and limit results
//        return suggestions.stream()
//                .sorted(Comparator.comparing(TimeSlotSuggestionDTO::getScore).reversed())
//                .limit(request.getMaxSuggestions() != null ? request.getMaxSuggestions() : 10)
//                .collect(Collectors.toList());
//    }
//
//    public MeetingDetailsDTO generateMeetingLink(String interviewId, MeetingProvider provider) {
//        log.info("Generating meeting link for interview {} using {}", interviewId, provider);
//        return meetingService.generateMeetingLink(interviewId, provider);
//    }
//
//    public ValidationResultDTO validateInterviewData(CreateInterviewRequestDTO interview) {
//        return validationService.validateInterview(interview);
//    }
//
//    // ==================== Helper Methods ====================
//
//    private List<String> getRecipients(Interview interview) {
//        List<String> recipients = new ArrayList<>();
//        if (interview.getCandidateEmail() != null) {
//            recipients.add(interview.getCandidateEmail());
//        }
//        interview.getJuryMembers().forEach(j -> {
//            if (j.getEmail() != null) recipients.add(j.getEmail());
//        });
//        return recipients;
//    }
//
//    private void checkConflicts(String date, String time, int duration,
//                                List<String> juryIds, String room, String excludeId) {
//        List<ConflictDTO> conflicts = checkConflicts(date, time, duration, juryIds, room, excludeId);
//        if (!conflicts.isEmpty()) {
//            throw new ConflictException("Scheduling conflicts detected: " + conflicts);
//        }
//    }
//
//    private int calculateSlotScore(LocalDate date, String time, SuggestTimeSlotsRequestDTO request) {
//        int score = 100;
//
//        // Penalize early/late hours
//        int hour = Integer.parseInt(time.split(":")[0]);
//        if (hour < 10 || hour > 16) {
//            score -= 10;
//        }
//
//        // Penalize Mondays and Fridays slightly
//        int dayOfWeek = date.getDayOfWeek().getValue();
//        if (dayOfWeek == 1 || dayOfWeek == 5) {
//            score -= 5;
//        }
//
//        // Check preferred time ranges
//        if (request.getPreferredTimeRanges() != null) {
//            boolean inPreferred = request.getPreferredTimeRanges().stream()
//                    .anyMatch(range -> {
//                        LocalTime slotTime = LocalTime.parse(time);
//                        LocalTime prefStart = LocalTime.parse(range.getStartTime());
//                        LocalTime prefEnd = LocalTime.parse(range.getEndTime());
//                        return !slotTime.isBefore(prefStart) && slotTime.isBefore(prefEnd);
//                    });
//            if (!inPreferred) {
//                score -= 20;
//            }
//        }
//
//        return Math.max(0, score);
//    }
//
//    // ==================== Utility Methods (matching Angular service) ====================
//
//    public String formatDateForAPI(LocalDate date) {
//        return date.toString(); // YYYY-MM-DD
//    }
//
//    public String formatTimeForAPI(LocalTime time) {
//        return time.format(DateTimeFormatter.ofPattern("HH:mm"));
//    }
//
//    public String calculateEndTime(String startTime, int duration) {
//        LocalTime start = LocalTime.parse(startTime);
//        LocalTime end = start.plusMinutes(duration);
//        return end.format(DateTimeFormatter.ofPattern("HH:mm"));
//    }
//
//    public boolean isInterviewPast(InterviewDTO interview) {
//        LocalDateTime interviewDateTime = LocalDateTime.of(
//                LocalDate.parse(interview.getDate()),
//                LocalTime.parse(interview.getTime())
//        );
//        return interviewDateTime.isBefore(LocalDateTime.now());
//    }
//
//    public boolean isInterviewToday(InterviewDTO interview) {
//        return LocalDate.parse(interview.getDate()).equals(LocalDate.now());
//    }
//
//    public boolean isInterviewUpcoming(InterviewDTO interview) {
//        LocalDate interviewDate = LocalDate.parse(interview.getDate());
//        LocalDate today = LocalDate.now();
//        LocalDate nextWeek = today.plusDays(7);
//        return !interviewDate.isBefore(today) && !interviewDate.isAfter(nextWeek);
//    }
//}