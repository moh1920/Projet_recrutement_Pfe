package esprit.PfeBackendProject.repository;

import esprit.PfeBackendProject.entity.ProfileDetails;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProfileRepository extends MongoRepository<ProfileDetails,String> {

    // ── Recherches de base ─────────────────────────
    Optional<ProfileDetails> findByUserId(String userId);
    Optional<ProfileDetails> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUserId(String userId);

    // ── Recherche par compétences ──────────────────
    List<ProfileDetails> findByLangagesContaining(String langage);
    List<ProfileDetails> findByFrameworksContaining(String framework);
    List<ProfileDetails> findByIaSkillsContaining(String iaSkill);
    List<ProfileDetails> findByErpSkillsContaining(String erpSkill);

    // ── Recherche par formation ────────────────────
    List<ProfileDetails> findByNiveauDiplome(String niveauDiplome);
    List<ProfileDetails> findBySpecialite(String specialite);
    List<ProfileDetails> findByUniversite(String universite);

    // ── Recherche par expérience ───────────────────
    List<ProfileDetails> findByNbAnneesExperienceGreaterThanEqual(int annees);
    List<ProfileDetails> findByExperienceAcademiqueTrue();
    List<ProfileDetails> findByEncadrementTrue();
    List<ProfileDetails> findByInnovationPedagogiqueTrue();

    // ── Recherche par ville ────────────────────────
    List<ProfileDetails> findByVille(String ville);
    List<ProfileDetails> findByNationalite(String nationalite);

    // ── Requêtes personnalisées ────────────────────

    // Profils avec score soft skills élevé
    @Query("{ 'communication': { $gte: ?0 }, 'leadership': { $gte: ?1 }, 'espritEquipe': { $gte: ?2 } }")
    List<ProfileDetails> findBySoftSkillsMinimum(int minCommunication, int minLeadership, int minEspritEquipe);

    // Recherche full-text sur nom ou spécialité
    @Query("{ $or: [ { 'nom': { $regex: ?0, $options: 'i' } }, { 'specialite': { $regex: ?0, $options: 'i' } } ] }")
    List<ProfileDetails> searchByNomOrSpecialite(String keyword);

    // Profils par module enseigné
    @Query("{ 'modulesEnseignes': { $regex: ?0, $options: 'i' } }")
    List<ProfileDetails> findByModuleEnseigne(String module);

    // Profils complets (avec CV uploadé)
    @Query("{ 'cvPath': { $exists: true, $ne: null } }")
    List<ProfileDetails> findProfilesWithCV();}
