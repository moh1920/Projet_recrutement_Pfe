package esprit.PfeBackendProject.entity;

// InterviewType.java


import lombok.Getter;

@Getter
public enum InterviewType {
    INTERVIEW("interview"),
    EVALUATION("evaluation");

    private final String value;

    InterviewType(String value) {
        this.value = value;
    }

    public static InterviewType fromValue(String value) {
        for (InterviewType type : values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown type: " + value);
    }
}