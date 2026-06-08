package esprit.PfeBackendProject.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:4200","https://pfe-frontend.graymoss-d46652df.francecentral.azurecontainerapps.io","https://projet-recrutement-pfe.vercel.app","https://pfe-frontend.orangesand-21e6d03b.germanywestcentral.azurecontainerapps.io")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
