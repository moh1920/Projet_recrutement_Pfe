package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    /** Toutes les notifications d'un utilisateur, triées par date décroissante */
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

    /** Compter les non lues */
    long countByRecipientIdAndReadFalse(String recipientId);

    /** Trouver une notification par id et recipientId (sécurité) */
    java.util.Optional<Notification> findByIdAndRecipientId(String id, String recipientId);

    /** Supprimer toutes les notifications d'un utilisateur */
    void deleteAllByRecipientId(String recipientId);
}