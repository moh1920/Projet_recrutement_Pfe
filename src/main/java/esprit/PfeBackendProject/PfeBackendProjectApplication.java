package esprit.PfeBackendProject;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDate;

@SpringBootApplication
public class PfeBackendProjectApplication {

	public static void main(String[] args) {
		SpringApplication.run(PfeBackendProjectApplication.class, args);
	}
	@Bean
	CommandLineRunner runner(CandidatRepo candidatRepo){
		return args -> {

			Candidat candidat = Candidat.builder()
					.email("dddd")
					.nationalite("dddd")
					.nom("Test")
					.statut("EN_ATTENTE")
					.dateCandidature(LocalDate.now())
					.build();

			candidatRepo.save(candidat);
		};
	}



}
