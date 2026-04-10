package esprit.PfeBackendProject.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import esprit.PfeBackendProject.dto.DocumentResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final Cloudinary cloudinary;

    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    public DocumentResponseDTO uploadCV(MultipartFile file) throws IOException {

        // Validation type
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Format non supporté. Utilisez PDF ou Word.");
        }

        // Validation taille (5 MB max)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Fichier trop volumineux (max 5 MB).");
        }

        // Upload vers Cloudinary
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder",        "cvs",
                        "resource_type", "raw",       // obligatoire pour PDF/Word
                        "public_id",     UUID.randomUUID().toString(),
                        "use_filename",  true,
                        "unique_filename", false
                )
        );

        String sizeFormatted = String.format("%.1f MB", file.getSize() / 1024.0 / 1024.0);

        return DocumentResponseDTO.builder()
                .name(file.getOriginalFilename())
                .size(sizeFormatted)
                .date(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .type("cv")
                .url((String) uploadResult.get("secure_url"))
                .publicId((String) uploadResult.get("public_id"))
                .build();
    }
}