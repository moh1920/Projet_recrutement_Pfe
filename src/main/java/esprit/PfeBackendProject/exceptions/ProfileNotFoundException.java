package esprit.PfeBackendProject.exceptions;

// ════════════════════════════════════════════════
// ProfileNotFoundException.java
// ════════════════════════════════════════════════

public class ProfileNotFoundException extends RuntimeException {
    public ProfileNotFoundException(String message) {
        super(message);
    }
}