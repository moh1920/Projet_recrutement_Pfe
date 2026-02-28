package esprit.PfeBackendProject.controller;


import esprit.PfeBackendProject.dto.ProfileRequestDTO;
import esprit.PfeBackendProject.dto.ProfileResponseDTO;
import esprit.PfeBackendProject.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/profiles_users")
public class ProfileController {

    private final ProfileService profileService;

    @Autowired
    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    // CREATE
    @PostMapping("/createProfile")
    public ResponseEntity<ProfileResponseDTO> createProfile(@Valid @RequestBody ProfileRequestDTO dto) {
        ProfileResponseDTO created = profileService.createProfile(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // GET ALL
    @GetMapping("/getAllProfiles")
    public ResponseEntity<List<ProfileResponseDTO>> getAllProfiles() {
        return ResponseEntity.ok(profileService.getAllProfiles());
    }

    // GET BY ID
    @GetMapping("/getProfileById/{id}")
    public ResponseEntity<ProfileResponseDTO> getProfileById(@PathVariable String id) {
        return ResponseEntity.ok(profileService.getProfileById(id));
    }

    // GET BY USER ID
    @GetMapping("/getProfileByUserId/{userId}")
    public ResponseEntity<ProfileResponseDTO> getProfileByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(profileService.getProfileByUserId(userId));
    }

    // GET BY EMAIL
    @GetMapping("/getProfileByEmail/{email}")
    public ResponseEntity<ProfileResponseDTO> getProfileByEmail(@PathVariable String email) {
        return ResponseEntity.ok(profileService.getProfileByEmail(email));
    }

    // UPDATE
    @PutMapping("/updateProfile/{id}")
    public ResponseEntity<ProfileResponseDTO> updateProfile(
            @PathVariable String id,
            @Valid @RequestBody ProfileRequestDTO dto) {
        return ResponseEntity.ok(profileService.updateProfile(id, dto));
    }

    // UPDATE CV PATH
    @PatchMapping("/updateCvPath/{id}")
    public ResponseEntity<ProfileResponseDTO> updateCvPath(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String cvPath = body.get("cvPath");
        return ResponseEntity.ok(profileService.updateCvPath(id, cvPath));
    }

    // DELETE
    @DeleteMapping("/deleteProfile/{id}")
    public ResponseEntity<Map<String, String>> deleteProfile(@PathVariable String id) {
        profileService.deleteProfile(id);
        return ResponseEntity.ok(Map.of("message", "Profil supprimé avec succès", "id", id));
    }

    // SEARCH
    @GetMapping("/searchProfiles")
    public ResponseEntity<List<ProfileResponseDTO>> searchProfiles(@RequestParam String keyword) {
        return ResponseEntity.ok(profileService.searchProfiles(keyword));
    }

    // FILTER LANGAGE
    @GetMapping("/filterByLangage")
    public ResponseEntity<List<ProfileResponseDTO>> filterByLangage(@RequestParam String value) {
        return ResponseEntity.ok(profileService.getProfilesByLangage(value));
    }

    // FILTER FRAMEWORK
    @GetMapping("/filterByFramework")
    public ResponseEntity<List<ProfileResponseDTO>> filterByFramework(@RequestParam String value) {
        return ResponseEntity.ok(profileService.getProfilesByFramework(value));
    }

    // FILTER EXPERIENCE
    @GetMapping("/filterByExperience")
    public ResponseEntity<List<ProfileResponseDTO>> filterByExperience(@RequestParam int minAnnees) {
        return ResponseEntity.ok(profileService.getProfilesByExperience(minAnnees));
    }

    // FILTER SOFT SKILLS
    @GetMapping("/filterBySoftSkills")
    public ResponseEntity<List<ProfileResponseDTO>> filterBySoftSkills(
            @RequestParam(defaultValue = "1") int comm,
            @RequestParam(defaultValue = "1") int lead,
            @RequestParam(defaultValue = "1") int equipe) {
        return ResponseEntity.ok(profileService.getProfilesWithSoftSkills(comm, lead, equipe));
    }

    // FILTER VILLE
    @GetMapping("/filterByVille")
    public ResponseEntity<List<ProfileResponseDTO>> filterByVille(@RequestParam String value) {
        return ResponseEntity.ok(profileService.getProfilesByVille(value));
    }

    // FILTER MODULE
    @GetMapping("/filterByModule")
    public ResponseEntity<List<ProfileResponseDTO>> filterByModule(@RequestParam String value) {
        return ResponseEntity.ok(profileService.getProfilesByModule(value));
    }

    // WITH CV
    @GetMapping("/getProfilesWithCV")
    public ResponseEntity<List<ProfileResponseDTO>> getProfilesWithCV() {
        return ResponseEntity.ok(profileService.getProfilesWithCV());
    }
}