package esprit.PfeBackendProject.service;


import esprit.PfeBackendProject.configuration.UserMapper;
import esprit.PfeBackendProject.dto.UserDTO;
import esprit.PfeBackendProject.entity.User;
import esprit.PfeBackendProject.entity.UserDetais;
import esprit.PfeBackendProject.repository.UserDetaisRepository;
import esprit.PfeBackendProject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository ;
    private final UserMapper userMapper ;
    private final UserDetaisRepository userDetaisRepository ;


    public List<UserDTO> getAllUser() {

        List<User> users = userRepository.findAll()
                .stream()
                .filter(user -> !"CANDIDAT".equals(user.getRole()))
                .toList();

        List<String> detailsIds = users.stream()
                .map(User::getIdDetaisUsers)
                .toList();

        Map<String, UserDetais> detailsMap =
                userDetaisRepository.findAllById(detailsIds)
                        .stream()
                        .collect(Collectors.toMap(UserDetais::getId, d -> d));

        return users.stream()
                .map(user -> userMapper.mapToDTO(
                        user,
                        detailsMap.get(user.getIdDetaisUsers())
                ))
                .toList();
    }

    public UserDTO getUserById(String keycloakId){
         User user = userRepository.findByKeycloakId(keycloakId).orElseThrow(() -> new RuntimeException("user not found"));
         UserDetais userDetais =  userDetaisRepository.findById(user.getIdDetaisUsers()).orElse(null);
         return userMapper.mapToDTO(user,userDetais);

    }


}
