package esprit.PfeBackendProject.exceptions;

// ════════════════════════════════════════════════
// ProfileAlreadyExistsException.java
// ════════════════════════════════════════════════

public class ProfileAlreadyExistsException extends RuntimeException {
    public ProfileAlreadyExistsException(String message) {
        super(message);
    }
}