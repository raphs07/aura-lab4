
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class BancoDados {

    private static final Path ARQUIVO =
            Path.of("dados", "alertas.csv");

    public BancoDados() throws IOException {

        Files.createDirectories(Path.of("dados"));

        if (!Files.exists(ARQUIVO)) {

            String cabecalho =
                    "id,latitude,longitude,raio,categoria,descricao,data,status\n";

            Files.writeString(ARQUIVO, cabecalho);

        }

    }//fim do construtor


    // Salvar um novo alerta
    public synchronized void salvarAlerta(
            double latitude,
            double longitude,
            int raio,
            String categoria,
            String descricao,
            String data) throws IOException {

        String id = UUID.randomUUID().toString();

        String status = "PENDENTE";

        String registro =
                escapar(id) + "," +
                latitude + "," +
                longitude + "," +
                raio + "," +
                escapar(categoria) + "," +
                escapar(descricao) + "," +
                escapar(data) + "," +
                status + "\n";

        Files.writeString(
                ARQUIVO,
                registro,
                StandardOpenOption.CREATE,
                StandardOpenOption.APPEND
        );

    }//fim do salvarAlerta


    // Escapar campos para manter o formato CSV correto
    private String escapar(String texto) {

        if (texto == null) {
            texto = "";
        }

        texto = texto.replace("\r", " ").replace("\n", " ");

        return "\"" + texto.replace("\"", "\"\"") + "\"";

    }//fim do escapar


    // Consultar todos os alertas aprovados
    public synchronized List<String[]> listarAlertasAprovados()
            throws IOException {

        List<String[]> alertas = new ArrayList<>();

        List<String> linhas = Files.readAllLines(ARQUIVO);

        for (int i = 1; i < linhas.size(); i++) {

            String linha = linhas.get(i);

            String[] campos = separarCSV(linha);

            if (campos.length == 8 &&
                    campos[7].equals("APROVADO")) {

                alertas.add(campos);

            }

        }

        return alertas;

    }//fim do listarAlertasAprovados


    // Separar os campos respeitando vírgulas dentro das aspas
    private String[] separarCSV(String linha) {

        List<String> campos = new ArrayList<>();

        StringBuilder campo = new StringBuilder();

        boolean dentroAspas = false;

        for (int i = 0; i < linha.length(); i++) {

            char caractere = linha.charAt(i);

            if (caractere == '"') {

                if (dentroAspas &&
                        i + 1 < linha.length() &&
                        linha.charAt(i + 1) == '"') {

                    campo.append('"');
                    i++;

                } else {

                    dentroAspas = !dentroAspas;

                }

            } else if (caractere == ',' && !dentroAspas) {

                campos.add(campo.toString());
                campo.setLength(0);

            } else {

                campo.append(caractere);

            }

        }

        campos.add(campo.toString());

        return campos.toArray(new String[0]);

    }//fim do separarCSV

}//fim da class
