package esprit.PfeBackendProject.controller;

import esprit.PfeBackendProject.service.GoogleSheetsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("googleSheetCandidats")
public class CandidatGoogleSheetSrapingController {

    @Autowired
    private GoogleSheetsService sheetsService;

    @GetMapping
    public ResponseEntity<List<Map<String, String>>> getCandidats() throws Exception {
        return ResponseEntity.ok(sheetsService.getCandidats());
    }
}