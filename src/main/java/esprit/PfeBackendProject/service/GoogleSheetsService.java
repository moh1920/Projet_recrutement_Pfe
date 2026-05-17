package esprit.PfeBackendProject.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.ValueRange;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GoogleSheetsService {

    @Value("${google.sheets.id}")
    private String spreadsheetId;

    @Value("${google.sheets.range}")
    private String range;

    @Value("${google.credentials.path}")
    private String credentialsPath;

    public List<Map<String, String>> getCandidats() throws Exception {
        GoogleCredentials credentials = GoogleCredentials
                .fromStream(new FileInputStream(credentialsPath))
                .createScoped(List.of(SheetsScopes.SPREADSHEETS_READONLY));

        Sheets service = new Sheets.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("Candidats App")
                .build();

        ValueRange response = service.spreadsheets().values()
                .get(spreadsheetId, range)
                .execute();

        List<List<Object>> values = response.getValues();
        List<String> headers = values.get(0).stream()
                .map(Object::toString).toList();

        return values.stream().skip(1).map(row -> {
            Map<String, String> map = new LinkedHashMap<>();
            for (int i = 0; i < headers.size(); i++) {
                map.put(headers.get(i), i < row.size() ? row.get(i).toString() : "");
            }
            return map;
        }).toList();
    }
}