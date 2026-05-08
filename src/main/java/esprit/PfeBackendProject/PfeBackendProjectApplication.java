package esprit.PfeBackendProject;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.LocalDate;

@SpringBootApplication
@EnableScheduling
public class PfeBackendProjectApplication {

	public static void main(String[] args) {
		SpringApplication.run(PfeBackendProjectApplication.class, args);
	}




}
