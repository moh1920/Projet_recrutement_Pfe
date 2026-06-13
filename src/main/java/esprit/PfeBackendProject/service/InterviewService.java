package esprit.PfeBackendProject.service;

import esprit.PfeBackendProject.configuration.InterviewMapper;
import esprit.PfeBackendProject.dto.InterviewDTO;
import esprit.PfeBackendProject.dto.InterviewFilterDTO;
import esprit.PfeBackendProject.dto.InterviewStatisticsDTO;
import esprit.PfeBackendProject.entity.*;
import esprit.PfeBackendProject.exceptions.ResourceNotFoundException;
import esprit.PfeBackendProject.repository.InterviewRepository;
import esprit.PfeBackendProject.repository.JuryMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final JuryMemberRepository juryMemberRepository;
    private final InterviewMapper interviewMapper;
    private final EmailService emailService;
    private final EmailSenderService emailSenderService;
    private final MeetingService meetingService;

    // ==================== GET Operations ====================

    public List<InterviewDTO> getAllInterviews() {
        log.info("Fetching all interviews");
        return interviewRepository.findAll().stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    public InterviewDTO getInterviewById(String id) {
        log.info("Fetching interview with id: {}", id);
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + id));
        return interviewMapper.toDTO(interview);
    }

    public List<InterviewDTO> getInterviewsWithFilters(InterviewFilterDTO filters) {
        log.info("Fetching interviews with filters: {}", filters);
        List<Interview> interviews = interviewRepository.findAll();

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

        // ✅ String → LocalDate pour comparaison
        if (filters.getDateFrom() != null) {
            interviews = interviews.stream()
                    .filter(i -> i.getDate() != null &&
                            !LocalDate.parse(i.getDate()).isBefore(filters.getDateFrom()))
                    .collect(Collectors.toList());
        }

        if (filters.getDateTo() != null) {
            interviews = interviews.stream()
                    .filter(i -> i.getDate() != null &&
                            !LocalDate.parse(i.getDate()).isAfter(filters.getDateTo()))
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

    public List<InterviewDTO> getInterviewsByDateRange(LocalDate startDate, LocalDate endDate) {
        log.info("Fetching interviews between {} and {}", startDate, endDate);
        // ✅ Filtrer en mémoire car date est String dans l'entity
        return interviewRepository.findAll().stream()
                .filter(i -> i.getDate() != null)
                .filter(i -> {
                    LocalDate d = LocalDate.parse(i.getDate());
                    return !d.isBefore(startDate) && !d.isAfter(endDate);
                })
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<InterviewDTO> getUpcomingInterviews() {
        log.info("Fetching upcoming interviews");
        LocalDate today = LocalDate.now();
        // ✅ Filtrer en mémoire
        return interviewRepository.findAll().stream()
                .filter(i -> i.getDate() != null &&
                        !LocalDate.parse(i.getDate()).isBefore(today))
                .map(interviewMapper::toDTO)
                .sorted(Comparator.comparing(InterviewDTO::getDate)
                        .thenComparing(InterviewDTO::getTime))
                .collect(Collectors.toList());
    }

    public List<InterviewDTO> getTodayInterviews() {
        log.info("Fetching today's interviews");
        String today = LocalDate.now().toString(); // "2026-05-16"
        // ✅ Comparaison directe String
        return interviewRepository.findAll().stream()
                .filter(i -> today.equals(i.getDate()))
                .map(interviewMapper::toDTO)
                .sorted(Comparator.comparing(InterviewDTO::getTime))
                .collect(Collectors.toList());
    }

    public List<InterviewDTO> getInterviewsByJuryMember(String juryMemberId) {
        log.info("Fetching interviews for jury member: {}", juryMemberId);
        return interviewRepository.findByJuryMemberId(juryMemberId).stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<InterviewDTO> getInterviewsByCandidate(String candidateId) {
        log.info("Fetching interviews for candidate: {}", candidateId);
        return interviewRepository.findByCandidateId(candidateId).stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    // ==================== CREATE Operations ====================

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
        emailSenderService.send(interview.getCandidateEmail(),
                "Confirmation de votre entretien",
                String.format("""
                    Bonjour %s,

                    Votre entretien pour le poste de %s a été programmé.

                    📅 Date         : %s
                    🕐 Heure        : %s
                    ⏱ Durée        : %d min
                    📍 Lieu/Lien    : %s

                    Merci de vous présenter quelques minutes avant l'heure prévue.

                    Cordialement,
                    L'équipe RH
                    """,
                        interview.getCandidateName(),
                        interview.getPosition(),
                        interview.getDate(),
                        interview.getTime(),
                        interview.getDuration(),
                        buildLocationString(interview)));
        log.info("Interview created successfully with id: {}", savedInterview.getId());
        return interviewMapper.toDTO(savedInterview);
    }

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

        return interviewRepository.saveAll(interviews).stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    // ==================== UPDATE Operations ====================

    @Transactional
    public InterviewDTO updateInterview(String id, InterviewDTO interviewDTO) {
        log.info("Updating interview with id: {}", id);

        Interview existingInterview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + id));

        if (interviewDTO.getCandidateName() != null)
            existingInterview.setCandidateName(interviewDTO.getCandidateName());
        if (interviewDTO.getCandidateEmail() != null)
            existingInterview.setCandidateEmail(interviewDTO.getCandidateEmail());
        if (interviewDTO.getCandidatePhone() != null)
            existingInterview.setCandidatePhone(interviewDTO.getCandidatePhone());
        if (interviewDTO.getPosition() != null)
            existingInterview.setPosition(interviewDTO.getPosition());
        if (interviewDTO.getDepartment() != null)
            existingInterview.setDepartment(interviewDTO.getDepartment());


        if (interviewDTO.getDate() != null)
            existingInterview.setDate(interviewDTO.getDate().toString());

        if (interviewDTO.getTime() != null)
            existingInterview.setTime(interviewDTO.getTime().toString());

        if (interviewDTO.getDuration() != null)
            existingInterview.setDuration(interviewDTO.getDuration());
        if (interviewDTO.getType() != null)
            existingInterview.setType(InterviewType.fromValue(interviewDTO.getType()));
        if (interviewDTO.getStatus() != null)
            existingInterview.setStatus(InterviewStatus.fromLabel(interviewDTO.getStatus()));
        if (interviewDTO.getJuryIds() != null)
            enrichWithJuryInfo(existingInterview, interviewDTO.getJuryIds());
        if (interviewDTO.getMeetLink() != null)
            existingInterview.setMeetLink(interviewDTO.getMeetLink());
        if (interviewDTO.getRoom() != null)
            existingInterview.setRoom(interviewDTO.getRoom());
        if (interviewDTO.getLocation() != null)
            existingInterview.setLocation(interviewDTO.getLocation());
        if (interviewDTO.getNotes() != null)
            existingInterview.setNotes(interviewDTO.getNotes());

        existingInterview.setUpdatedAt(LocalDateTime.now());

        return interviewMapper.toDTO(interviewRepository.save(existingInterview));
    }

    @Transactional
    public InterviewDTO updateInterviewStatus(String id, String status) {
        log.info("Updating status for interview {}: {}", id, status);
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + id));
        interview.setStatus(InterviewStatus.fromLabel(status));
        interview.setUpdatedAt(LocalDateTime.now());
        return interviewMapper.toDTO(interviewRepository.save(interview));
    }

    @Transactional
    public InterviewDTO rescheduleInterview(String id, LocalDate date, String time) {
        log.info("Rescheduling interview {}: {} at {}", id, date, time);
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + id));

        // ✅ LocalDate → String, time est déjà String
        interview.setDate(date.toString());
        interview.setTime(time);
        interview.setUpdatedAt(LocalDateTime.now());

        return interviewMapper.toDTO(interviewRepository.save(interview));
    }

    // ==================== DELETE Operations ====================

    @Transactional
    public void deleteInterview(String id) {
        log.info("Deleting interview with id: {}", id);
        if (!interviewRepository.existsById(id)) {
            throw new ResourceNotFoundException("Interview not found with id: " + id);
        }
        interviewRepository.deleteById(id);
    }

    @Transactional
    public void batchDeleteInterviews(List<String> ids) {
        log.info("Batch deleting {} interviews", ids.size());
        interviewRepository.deleteAllById(ids);
    }

    // ==================== Statistics ====================

    public InterviewStatisticsDTO getStatistics(LocalDate dateFrom, LocalDate dateTo) {
        log.info("Calculating statistics from {} to {}", dateFrom, dateTo);

        List<Interview> interviews;
        if (dateFrom != null && dateTo != null) {
            // ✅ Filtrer en mémoire
            final LocalDate from = dateFrom;
            final LocalDate to = dateTo;
            interviews = interviewRepository.findAll().stream()
                    .filter(i -> i.getDate() != null)
                    .filter(i -> {
                        LocalDate d = LocalDate.parse(i.getDate());
                        return !d.isBefore(from) && !d.isAfter(to);
                    })
                    .collect(Collectors.toList());
        } else {
            interviews = interviewRepository.findAll();
        }

        Map<String, Long> byStatus = interviews.stream()
                .collect(Collectors.groupingBy(i -> i.getStatus().getLabel(), Collectors.counting()));

        Map<String, Long> byType = interviews.stream()
                .collect(Collectors.groupingBy(i -> i.getType().getValue(), Collectors.counting()));

        Map<String, Long> byDepartment = interviews.stream()
                .filter(i -> i.getDepartment() != null)
                .collect(Collectors.groupingBy(Interview::getDepartment, Collectors.counting()));

        Double averageDuration = interviews.stream()
                .mapToInt(Interview::getDuration)
                .average()
                .orElse(0.0);

        LocalDate today = LocalDate.now();

        // ✅ String → LocalDate pour comparaison
        long upcomingCount = interviews.stream()
                .filter(i -> i.getDate() != null &&
                        !LocalDate.parse(i.getDate()).isBefore(today))
                .count();

        long completedCount = interviews.stream()
                .filter(i -> i.getStatus() == InterviewStatus.TERMINE).count();

        long cancelledCount = interviews.stream()
                .filter(i -> i.getStatus() == InterviewStatus.ANNULE).count();

        return InterviewStatisticsDTO.builder()
                .total((long) interviews.size())
                .byStatus(byStatus)
                .byType(byType)
                .byDepartment(byDepartment)
                .averageDuration(averageDuration)
                .upcomingCount(upcomingCount)
                .completionRate(interviews.isEmpty() ? 0.0 : (completedCount * 100.0) / interviews.size())
                .cancellationRate(interviews.isEmpty() ? 0.0 : (cancelledCount * 100.0) / interviews.size())
                .build();
    }

    // ==================== Helper Methods ====================

    private void enrichWithJuryInfo(Interview interview, List<String> juryIds) {
        List<JuryMember> juryMembers = juryMemberRepository.findAllById(juryIds);
        interview.setJuryIds(juryIds);
        interview.setJury(juryMembers.stream().map(JuryMember::getFullName).collect(Collectors.toList()));
        interview.setJuryEmails(juryMembers.stream().map(JuryMember::getEmail).toList());
    }

    public List<InterviewDTO> getInterviewsByEmail(String email) {
        log.info("Fetching interviews for candidate: {}", email);
        return interviewRepository.findByCandidateEmail(email).stream()
                .map(interviewMapper::toDTO)
                .collect(Collectors.toList());
    }

    // ==================== Scheduled Tasks ====================

    @Scheduled(cron = "0 0 8 * * *")
    public void sendInterviewReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        String tomorrowStr = tomorrow.toString(); // "2026-05-16"

        log.info("Scheduler - Envoi des rappels pour les entretiens du {}", tomorrow);

        // ✅ Comparaison String directe
        List<Interview> tomorrowInterviews = interviewRepository.findAll().stream()
                .filter(i -> tomorrowStr.equals(i.getDate()))
                .filter(i -> i.getStatus() == InterviewStatus.PLANIFIE)
                .collect(Collectors.toList());

        if (tomorrowInterviews.isEmpty()) {
            log.info("Scheduler - Aucun entretien prévu demain.");
            return;
        }

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

        for (Interview interview : tomorrowInterviews) {
            String dateStr  = tomorrow.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            // ✅ time est String → parser pour formatter
            String timeStr  = LocalTime.parse(interview.getTime()).format(timeFmt);
            String position = interview.getPosition();
            String candidate = interview.getCandidateName();
            String location = buildLocationString(interview);

            if (interview.getCandidateEmail() != null && !interview.getCandidateEmail().isBlank()) {
                try {
                    String subject = "Rappel : votre entretien demain à " + timeStr;
                    String body = String.format("""
                        Bonjour %s,

                        Ceci est un rappel pour votre entretien prévu demain.

                        📋 Poste        : %s
                        📅 Date         : %s
                        🕐 Heure        : %s
                        ⏱ Durée        : %d min
                        📍 Lieu/Lien    : %s
                        %s

                        Merci de vous présenter quelques minutes avant l'heure prévue.

                        Cordialement,
                        L'équipe RH
                        """,
                            candidate, position, dateStr, timeStr,
                            interview.getDuration(), location,
                            interview.getNotes() != null ? "\n📝 Notes : " + interview.getNotes() : "");

                    emailService.sendEmail(interview.getCandidateEmail(), subject, body);
                    log.info("Rappel candidat envoyé à {}", interview.getCandidateEmail());
                } catch (Exception e) {
                    log.error("Échec rappel candidat {} : {}", interview.getCandidateEmail(), e.getMessage());
                }
            }

            if (interview.getJuryEmails() != null) {
                List<String> juryNames = interview.getJury() != null
                        ? interview.getJury() : Collections.emptyList();

                for (int i = 0; i < interview.getJuryEmails().size(); i++) {
                    String juryEmail = interview.getJuryEmails().get(i);
                    String juryName  = i < juryNames.size() ? juryNames.get(i) : "Membre du jury";
                    try {
                        String subject = "Rappel : entretien demain avec " + candidate;
                        String body = String.format("""
                            Bonjour %s,

                            Rappel : vous participez demain à un entretien en tant que membre du jury.

                            👤 Candidat     : %s
                            📋 Poste        : %s
                            📅 Date         : %s
                            🕐 Heure        : %s
                            ⏱ Durée        : %d min
                            📍 Lieu/Lien    : %s
                            %s

                            Merci de préparer vos questions et grilles d'évaluation.

                            Cordialement,
                            L'équipe RH
                            """,
                                juryName, candidate, position, dateStr, timeStr,
                                interview.getDuration(), location,
                                interview.getNotes() != null ? "\n📝 Notes : " + interview.getNotes() : "");

                        emailService.sendEmail(juryEmail, subject, body);
                        log.info("Rappel jury envoyé à {}", juryEmail);
                    } catch (Exception e) {
                        log.error("Échec rappel jury {} : {}", juryEmail, e.getMessage());
                    }
                }
            }
        }
        log.info("Scheduler - Rappels terminés : {} entretien(s) traité(s)", tomorrowInterviews.size());
    }

    @Transactional
    @Scheduled(cron = "0 0 0 * * *")
    public void updateExpiredInterviewStatuses() {
        LocalDate today = LocalDate.now();
        log.info("Scheduler - Mise à jour des statuts expirés au {}", today);

        List<Interview> expiredInterviews = interviewRepository.findAll().stream()
                .filter(i -> i.getDate() != null &&
                        LocalDate.parse(i.getDate()).isBefore(today))
                .filter(i -> i.getStatus() == InterviewStatus.PLANIFIE
                        || i.getStatus() == InterviewStatus.ANNULE
                        || i.getStatus() == InterviewStatus.EN_COURS)
                .collect(Collectors.toList());

        if (expiredInterviews.isEmpty()) {
            log.info("Scheduler - Aucun statut à mettre à jour.");
            return;
        }

        for (Interview interview : expiredInterviews) {
            InterviewStatus oldStatus = interview.getStatus();
            interview.setStatus(InterviewStatus.TERMINE);
            interview.setUpdatedAt(LocalDateTime.now());
            interviewRepository.save(interview);
            log.info("Statut mis à jour : entretien {} ({} → TERMINE)", interview.getId(), oldStatus);
        }

        log.info("Scheduler - {} entretien(s) passé(s) à TERMINE.", expiredInterviews.size());
    }

    private String buildLocationString(Interview interview) {
        if (interview.getMeetLink() != null && !interview.getMeetLink().isBlank())
            return "Visio — " + interview.getMeetLink();
        if (interview.getRoom() != null && !interview.getRoom().isBlank())
            return "Salle " + interview.getRoom();
        if (interview.getLocation() != null && !interview.getLocation().isBlank())
            return interview.getLocation();
        return "À confirmer";
    }

    // ==================== Scheduled - Auto Meeting Room ====================

    @Transactional
    @Scheduled(cron = "0 0 7 * * *") // Tous les jours à 7h00
    //@Scheduled(cron = "0 */1 * * * *")   // Toutes les 1 minute
    public void autoCreateMeetingRoomsForTodayInterviews() {
        LocalDate today = LocalDate.now();
        String todayStr = today.toString();

        log.info("Scheduler - Création automatique des rooms pour les entretiens du {}", today);

        List<Interview> todayVisioInterviews = interviewRepository.findAll().stream()
                .filter(i -> todayStr.equals(i.getDate()))
                .filter(i -> i.getStatus() == InterviewStatus.PLANIFIE)
                .filter(i -> (i.getMeetLink() == null || i.getMeetLink().isBlank())) // Pas déjà une room assignée
                .collect(Collectors.toList());

        if (todayVisioInterviews.isEmpty()) {
            log.info("Scheduler - Aucun entretien visio aujourd'hui sans room.");
            return;
        }

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

        for (Interview interview : todayVisioInterviews) {
            try {
                // 1. Créer la room via MeetingService
                // L'hostId = premier juryId ou fallback "system"
                String hostId = (interview.getJuryIds() != null && !interview.getJuryIds().isEmpty())
                        ? interview.getJuryIds().get(0)
                        : "system";

                String title = "Entretien – " + interview.getCandidateName()
                        + " – " + interview.getPosition();

                Meeting meeting = meetingService.createMeeting(hostId, title);
                String roomCode = meeting.getRoomCode();

                // 2. Sauvegarder le roomCode dans le meetLink de l'interview
                interview.setMeetLink(roomCode);
                interview.setUpdatedAt(LocalDateTime.now());
                interviewRepository.save(interview);

                // 3. Préparer les infos communes
                String dateStr = today.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                String timeStr = LocalTime.parse(interview.getTime()).format(timeFmt);

                // 4. Envoyer le code au candidat
                if (interview.getCandidateEmail() != null && !interview.getCandidateEmail().isBlank()) {
                    String subject = "Votre code de réunion – Entretien du " + dateStr;
                    String body = String.format("""
                        Bonjour %s,

                        Votre entretien pour le poste de **%s** aura lieu aujourd'hui.
                        Voici votre code de salon de réunion :

                        🔑 Code de réunion : %s

                        📅 Date    : %s
                        🕐 Heure   : %s
                        ⏱ Durée   : %d min

                        Veuillez utiliser ce code pour rejoindre la réunion à l'heure prévue.

                        Cordialement,
                        L'équipe RH
                        """,
                            interview.getCandidateName(),
                            interview.getPosition(),
                            roomCode,
                            dateStr,
                            timeStr,
                            interview.getDuration());

                    emailService.sendEmail(interview.getCandidateEmail(), subject, body);
                    log.info("Code room envoyé au candidat : {}", interview.getCandidateEmail());
                }

                // 5. Envoyer le code à chaque membre du jury (responsables)
                if (interview.getJuryEmails() != null && !interview.getJuryEmails().isEmpty()) {
                    List<String> juryNames = interview.getJury() != null
                            ? interview.getJury()
                            : Collections.emptyList();

                    for (int i = 0; i < interview.getJuryEmails().size(); i++) {
                        String juryEmail = interview.getJuryEmails().get(i);
                        String juryName = i < juryNames.size() ? juryNames.get(i) : "Membre du jury";

                        String subject = "Code de réunion – Entretien avec " + interview.getCandidateName();
                        String body = String.format("""
                            Bonjour %s,

                            Un salon de réunion a été créé automatiquement pour l'entretien d'aujourd'hui.

                            👤 Candidat        : %s
                            📋 Poste           : %s
                            📅 Date            : %s
                            🕐 Heure           : %s
                            ⏱ Durée           : %d min

                            🔑 Code de réunion : %s

                            En tant que membre du jury, vous pouvez rejoindre le salon avec ce code.

                            Merci de préparer vos questions et grilles d'évaluation.

                            Cordialement,
                            L'équipe RH
                            """,
                                juryName,
                                interview.getCandidateName(),
                                interview.getPosition(),
                                dateStr,
                                timeStr,
                                interview.getDuration(),
                                roomCode);

                        emailService.sendEmail(juryEmail, subject, body);
                        log.info("Code room envoyé au jury : {}", juryEmail);
                    }
                }

                log.info("Room créée et notifications envoyées pour l'entretien {}", interview.getId());

            } catch (Exception e) {
                log.error("Échec création room pour l'entretien {} : {}", interview.getId(), e.getMessage());
            }
        }

        log.info("Scheduler - Création rooms terminée : {} entretien(s) traité(s)", todayVisioInterviews.size());
    }
}