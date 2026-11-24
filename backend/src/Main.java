import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {

    private static BancoDados bancoDados;

    public static void main(String[] args) throws IOException {

        bancoDados = new BancoDados();

        HttpServer servidor = HttpServer.create(
            new InetSocketAddress(8080), 0
        );

        servidor.createContext("/", requisicao -> {

            String caminho = requisicao.getRequestURI().getPath();
            String metodo = requisicao.getRequestMethod();

            // API: receber e consultar alertas
            if (caminho.equals("/api/alertas")) {

                try {

                    if (metodo.equals("POST")) {
                        receberAlerta(requisicao);
                    }

                    else if (metodo.equals("GET")) {
                        consultarAlertas(requisicao);
                    }

                    else {
                        responderJSON(
                            requisicao,
                            405,
                            "{\"erro\":\"Método não permitido.\"}"
                        );
                    }

                } catch (Exception erro) {

                    erro.printStackTrace();

                    responderJSON(
                        requisicao,
                        400,
                        "{\"erro\":\"Não foi possível processar o pedido.\"}"
                    );

                }

                return;
            }

            // Arquivos do site
            if (metodo.equals("GET") && caminho.equals("/")) {
                caminho = "/index.html";
            }

            if (!metodo.equals("GET")) {
                responderTexto(requisicao, 405, "Método não permitido.");
                return;
            }

            Path pastaSite = Path.of(".").toAbsolutePath().normalize();

            Path arquivo = pastaSite.resolve(
                caminho.substring(1)
            ).normalize();

            if (!arquivo.startsWith(pastaSite)) {
                responderTexto(requisicao, 403, "Acesso negado.");
                return;
            }

            if (!Files.exists(arquivo) || !Files.isRegularFile(arquivo)) {
                responderTexto(requisicao, 404, "Arquivo não encontrado.");
                return;
            }

            String tipo = "text/plain; charset=UTF-8";

            if (caminho.endsWith(".html")) {
                tipo = "text/html; charset=UTF-8";
            }

            else if (caminho.endsWith(".css")) {
                tipo = "text/css; charset=UTF-8";
            }

            else if (caminho.endsWith(".js")) {
                tipo = "application/javascript; charset=UTF-8";
            }

            byte[] conteudo = Files.readAllBytes(arquivo);

            requisicao.getResponseHeaders().set(
                "Content-Type", tipo
            );

            requisicao.sendResponseHeaders(200, conteudo.length);

            try (OutputStream resposta = requisicao.getResponseBody()) {
                resposta.write(conteudo);
            }

        });

        servidor.start();

        System.out.println("Servidor iniciado!");
        System.out.println("Acesse: http://localhost:8080");

    }//fim do main


    // Receber um novo relato enviado pelo site
    private static void receberAlerta(HttpExchange requisicao)
            throws IOException {

        byte[] corpo = requisicao.getRequestBody().readNBytes(20001);

        if (corpo.length > 20000) {
            responderJSON(
                requisicao,
                413,
                "{\"erro\":\"Relato muito grande.\"}"
            );
            return;
        }

        String texto = new String(corpo, StandardCharsets.UTF_8);

        Map<String, String> dados = interpretarFormulario(texto);

        try {

            double latitude = Double.parseDouble(dados.get("latitude"));
            double longitude = Double.parseDouble(dados.get("longitude"));
            int raio = Integer.parseInt(dados.get("raio"));

            String categoria = dados.get("categoria");
            String descricao = dados.get("descricao");
            String data = dados.get("data");

            if (latitude < -90 || latitude > 90 ||
                longitude < -180 || longitude > 180) {

                throw new IllegalArgumentException("Localização inválida.");
            }

            if (raio < 50 || raio > 2000) {
                throw new IllegalArgumentException("Raio inválido.");
            }

            if (categoria == null || categoria.isBlank() ||
                categoria.length() > 60) {

                throw new IllegalArgumentException("Categoria inválida.");
            }

            if (descricao == null || descricao.isBlank() ||
                descricao.length() > 1000) {

                throw new IllegalArgumentException("Descrição inválida.");
            }

            if (data == null || data.isBlank() || data.length() > 30) {
                throw new IllegalArgumentException("Data inválida.");
            }

            bancoDados.salvarAlerta(
                latitude,
                longitude,
                raio,
                categoria,
                descricao,
                data
            );

            responderJSON(
                requisicao,
                201,
                "{\"mensagem\":\"Relato recebido e aguardando aprovação.\"}"
            );

        } catch (NumberFormatException erro) {

            responderJSON(
                requisicao,
                400,
                "{\"erro\":\"Latitude, longitude ou raio inválido.\"}"
            );

        } catch (IllegalArgumentException erro) {

            responderJSON(
                requisicao,
                400,
                "{\"erro\":\"" + escaparJSON(erro.getMessage()) + "\"}"
            );

        }

    }//fim do receberAlerta


    // Consultar somente os alertas aprovados
    private static void consultarAlertas(HttpExchange requisicao)
            throws IOException {

        List<String[]> alertas = bancoDados.listarAlertasAprovados();

        StringBuilder json = new StringBuilder("[");

        for (int i = 0; i < alertas.size(); i++) {

            String[] alerta = alertas.get(i);

            if (i > 0) {
                json.append(",");
            }

            json.append("{");

            json.append("\"id\":\"").append(escaparJSON(alerta[0])).append("\",");
            json.append("\"latitude\":").append(alerta[1]).append(",");
            json.append("\"longitude\":").append(alerta[2]).append(",");
            json.append("\"raio\":").append(alerta[3]).append(",");
            json.append("\"categoria\":\"").append(escaparJSON(alerta[4])).append("\",");
            json.append("\"descricao\":\"").append(escaparJSON(alerta[5])).append("\",");
            json.append("\"data\":\"").append(escaparJSON(alerta[6])).append("\"");

            json.append("}");

        }

        json.append("]");

        responderJSON(requisicao, 200, json.toString());

    }//fim do consultarAlertas


    // Interpretar os dados enviados pelo formulário
    private static Map<String, String> interpretarFormulario(String texto) {

        Map<String, String> dados = new HashMap<>();

        if (texto.isEmpty()) {
            return dados;
        }

        String[] partes = texto.split("&");

        for (String parte : partes) {

            String[] campo = parte.split("=", 2);

            String chave = URLDecoder.decode(
                campo[0], StandardCharsets.UTF_8
            );

            String valor = "";

            if (campo.length > 1) {
                valor = URLDecoder.decode(
                    campo[1], StandardCharsets.UTF_8
                );
            }

            dados.put(chave, valor);

        }

        return dados;

    }//fim do interpretarFormulario


    // Escapar caracteres especiais do JSON
    private static String escaparJSON(String texto) {

        return texto
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");

    }//fim do escaparJSON


    // Enviar uma resposta JSON
    private static void responderJSON(
            HttpExchange requisicao,
            int codigo,
            String mensagem) throws IOException {

        byte[] conteudo = mensagem.getBytes(StandardCharsets.UTF_8);

        requisicao.getResponseHeaders().set(
            "Content-Type", "application/json; charset=UTF-8"
        );

        requisicao.sendResponseHeaders(codigo, conteudo.length);

        try (OutputStream resposta = requisicao.getResponseBody()) {
            resposta.write(conteudo);
        }

    }//fim do responderJSON


    // Enviar uma resposta de texto
    private static void responderTexto(
            HttpExchange requisicao,
            int codigo,
            String mensagem) throws IOException {

        byte[] conteudo = mensagem.getBytes(StandardCharsets.UTF_8);

        requisicao.getResponseHeaders().set(
            "Content-Type", "text/plain; charset=UTF-8"
        );

        requisicao.sendResponseHeaders(codigo, conteudo.length);

        try (OutputStream resposta = requisicao.getResponseBody()) {
            resposta.write(conteudo);
        }

    }//fim do responderTexto

}//fim da class
