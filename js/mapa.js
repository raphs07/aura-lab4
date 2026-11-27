
 // ==========================================
 // 1. MAPA
 // ==========================================

var mapa = L.map('map').setView([-15.7939, -47.8828], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(mapa);


// ==========================================
// 2. ALERTAS CADASTRADOS
// ==========================================

// Dados fictícios utilizados apenas para demonstração
var alertas = [

    {
        latitude: -15.8010,
        longitude: -48.0200,
        raio: 300,
        nivel: 'medio',
        categoria: 'Iluminação insuficiente',
        simulado: true
    },

    {
        latitude: -15.8030,
        longitude: -48.0250,
        raio: 300,
        nivel: 'alto',
        categoria: 'Local com alerta de demonstração',
        simulado: true
    },

    {
        latitude: -15.7970,
        longitude: -48.0150,
        raio: 300,
        nivel: 'medio',
        categoria: 'Movimentação reduzida',
        simulado: true
    }

];


// ==========================================
// 3. ELEMENTOS DA TELA
// ==========================================

var campoOrigem = document.getElementById('origem');
var campoDestino = document.getElementById('destino');
var botaoBuscar = document.getElementById('btnBuscar');
var informacoes = document.getElementById('informacoes-rota');
var opcoesRotas = document.getElementById('opcoes-rotas');

var marcadorOrigem = null;
var marcadorDestino = null;
var linhasRotas = [];

var rotasEncontradas = [];


// ==========================================
// 4. PESQUISAR E SELECIONAR ENDERECOS
// ==========================================

var locaisSelecionados = {
    origem: null,
    destino: null,
    relato: null
};

var marcadoresPrevia = {
    origem: null,
    destino: null,
    relato: null
};

var temporizadoresBusca = {};



var CONTEXTO_BUSCA = 'Distrito Federal, Brasil';

async function buscarSugestoesEndereco(endereco) {

    var consulta = endereco.trim();

    // Acrescentar o DF quando a usuária não informar outra localização
    if (!/distrito federal|\bdf\b/i.test(consulta)) {
        consulta += ', Distrito Federal, Brasil';
    }

    var parametros = new URLSearchParams({
        format: 'jsonv2',
        limit: '15',
        addressdetails: '1',
        countrycodes: 'br',
        'accept-language': 'pt-BR',

        // Área ampla para priorizar todo o Distrito Federal
        viewbox: '-48.35,-15.40,-47.20,-16.15',

        // Prioriza a área, mas não limita rigidamente os resultados
        bounded: '0',

        dedupe: '1',
        q: consulta
    });

    var url =
        'https://nominatim.openstreetmap.org/search?' +
        parametros.toString();

    var resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error(
            'Não foi possível pesquisar os endereços.'
        );
    }

    return await resposta.json();
}




// Remover marcador de prévia
function removerMarcadorPrevia(tipo) {

    if (marcadoresPrevia[tipo]) {

        mapa.removeLayer(marcadoresPrevia[tipo]);

        marcadoresPrevia[tipo] = null;

    }

}


// Mostrar o ponto escolhido no mapa
function marcarLocalSelecionado(tipo, resultado) {

    removerMarcadorPrevia(tipo);

    var latitude = Number(resultado.lat);
    var longitude = Number(resultado.lon);

    locaisSelecionados[tipo] = {
        latitude: latitude,
        longitude: longitude,
        nome: resultado.display_name
    };

    var marcador = L.marker(
        [latitude, longitude],
        { draggable: true }
    ).addTo(mapa);

    marcador.bindPopup(
        'Local selecionado. Você pode arrastar este marcador.'
    );

    marcador.openPopup();

    marcadoresPrevia[tipo] = marcador;

    mapa.setView([latitude, longitude], 17);

    // Atualizar coordenadas quando o marcador for arrastado
    marcador.on('dragend', function () {

        var posicao = marcador.getLatLng();

        locaisSelecionados[tipo].latitude = posicao.lat;
        locaisSelecionados[tipo].longitude = posicao.lng;

        marcador.bindPopup(
            'Localização ajustada e selecionada.'
        );

    });

}


// Configurar pesquisa e sugestões de um campo
function configurarBuscaEndereco(
    idCampo,
    idSugestoes,
    tipo
) {

    var campo = document.getElementById(idCampo);
    var lista = document.getElementById(idSugestoes);

    if (!campo || !lista) {

        console.error(
            'Campo ou lista de sugestões não encontrado:',
            idCampo,
            idSugestoes
        );

        return;
    }

    var numeroBusca = 0;

    campo.addEventListener('input', function () {

        numeroBusca++;

        var buscaAtual = numeroBusca;

        locaisSelecionados[tipo] = null;

        removerMarcadorPrevia(tipo);

        clearTimeout(temporizadoresBusca[tipo]);

        lista.innerHTML = '';
        lista.style.display = 'none';

        var texto = campo.value.trim();

        if (texto.length < 3) {
            return;
        }

        temporizadoresBusca[tipo] = setTimeout(async function () {

            lista.innerHTML = '';

            var carregando = document.createElement('div');

            carregando.className = 'sugestao-endereco';
            carregando.textContent = 'Pesquisando endereços...';

            lista.appendChild(carregando);

            lista.style.display = 'block';

            try {

                var resultados =
                    await buscarSugestoesEndereco(texto);

                if (buscaAtual !== numeroBusca) {
                    return;
                }

                lista.innerHTML = '';

                if (resultados.length === 0) {

                    lista.style.display = 'none';

                    return;
                }

                resultados.forEach(function (resultado) {

                    var opcao = document.createElement('button');

                    opcao.type = 'button';
                    opcao.className = 'sugestao-endereco';

                    opcao.textContent = resultado.display_name;

                    opcao.addEventListener('click', function () {

                        campo.value = resultado.display_name;

                        lista.innerHTML = '';
                        lista.style.display = 'none';

                        marcarLocalSelecionado(tipo, resultado);

                    });

                    lista.appendChild(opcao);

                });

                lista.style.display = 'block';

            } catch (erro) {

                if (buscaAtual === numeroBusca) {

                    lista.innerHTML = '';

                    var mensagem = document.createElement('div');

                    mensagem.className = 'sugestao-endereco';
                    mensagem.textContent = erro.message;

                    lista.appendChild(mensagem);

                    lista.style.display = 'block';

                }

            }

        }, 1100);

    });

}


// Configurar os três campos
configurarBuscaEndereco(
    'origem',
    'sugestoes-origem',
    'origem'
);

configurarBuscaEndereco(
    'destino',
    'sugestoes-destino',
    'destino'
);

configurarBuscaEndereco(
    'endereco-alerta',
    'sugestoes-relato',
    'relato'
);



// ==========================================
// 5. BUSCAR ROTAS POR MEIO DE TRANSPORTE
// ==========================================

async function buscarRotas(origem, destino, meioTransporte) {

    var configuracoes = {
        a_pe: 'pedestrian',
        bicicleta: 'bicycle'
    };

    // O Valhalla não calcula itinerários de ônibus
    if (meioTransporte === 'onibus') {
        throw new Error(
            'A simulação de ônibus será integrada separadamente. ' +
            'Por enquanto, escolha A pé ou Bicicleta.'
        );
    }

    var pedido = {
        locations: [
            {
                lat: origem.latitude,
                lon: origem.longitude
            },
            {
                lat: destino.latitude,
                lon: destino.longitude
            }
        ],

        costing: configuracoes[meioTransporte],
        alternates: 2,
        units: 'kilometers',
        language: 'pt-BR',
        format: 'osrm',
        shape_format: 'geojson'
    };

    var resposta = await fetch(
        'https://valhalla1.openstreetmap.de/route',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pedido)
        }
    );

    if (!resposta.ok) {
        throw new Error('Não foi possível calcular a rota.');
    }

    var dados = await resposta.json();

    if (!dados.routes || dados.routes.length === 0) {
        throw new Error('Nenhuma rota encontrada.');
    }

    return dados.routes;
}



// ==========================================
// 6. CALCULAR DISTANCIA ENTRE PONTOS
// ==========================================

function calcularDistancia(lat1, lon1, lat2, lon2) {

    var raioTerra = 6371000;

    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;

    var a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return raioTerra * c;
}


// ==========================================
// 7. ANALISAR OS ALERTAS DE UMA ROTA
// ==========================================

function analisarRisco(rota) {

    var coordenadas = rota.geometry.coordinates;

    var alertasEncontrados = new Set();

    for (var i = 0; i < coordenadas.length; i++) {

        var ponto = coordenadas[i];

        for (var j = 0; j < alertas.length; j++) {

            var alerta = alertas[j];

            var distancia = calcularDistancia(
                ponto[1],
                ponto[0],
                alerta.latitude,
                alerta.longitude
            );

            if (distancia <= alerta.raio) {
                alertasEncontrados.add(j);
            }

        }

    }

    var nivel = 'verde';

    alertasEncontrados.forEach(function (indice) {

        if (alertas[indice].nivel === 'alto') {
            nivel = 'vermelho';
        }

        else if (
            alertas[indice].nivel === 'medio' &&
            nivel !== 'vermelho'
        ) {
            nivel = 'amarelo';
        }

    });

    var quantidadeSimulada = 0;

alertasEncontrados.forEach(function (indice) {

    if (alertas[indice].simulado === true) {
        quantidadeSimulada++;
    }

});

return {
    nivel: nivel,
    quantidade: alertasEncontrados.size,
    simulados: quantidadeSimulada
};

alertasEncontrados.forEach(function (indice) {

    if (alertas[indice].simulado === true) {
        quantidadeSimulada++;
    }

});

return {
    nivel: nivel,
    quantidade: alertasEncontrados.size,
    simulados: quantidadeSimulada
};

}


// ==========================================
// 8. FORMATAR TEMPO
// ==========================================

function formatarTempo(segundos, meioTransporte) {

    var minutos = Math.round(segundos / 60);

    var nomes = {
        a_pe: 'a pé',
        bicicleta: 'de bicicleta',
        onibus: 'de ônibus'
    };

    return minutos + ' minutos ' + (nomes[meioTransporte] || '');

}
// ==========================================
// 9. CONFIGURACAO VISUAL DE CADA ROTA
// ==========================================

function obterEstiloRisco(nivel) {

    if (nivel === 'vermelho') {

        return {
            cor: '#e53935',
            nome: 'Vermelha',
            titulo: 'Alto risco registrado',
            mensagem: 'Se possível, evite este caminho.',
            flor: '✿'
        };

    }

    if (nivel === 'amarelo') {

        return {
            cor: '#e0b21b',
            nome: 'Amarela',
            titulo: 'Atenção',
            mensagem: 'Existem alertas registrados neste caminho.',
            flor: '✿'
        };

    }

    return {
        cor: '#27865c',
        nome: 'Verde',
        titulo: 'Sem alertas cadastrados',
        mensagem: 'Não encontramos alertas cadastrados neste caminho.',
        flor: '✿'
    };

}


// ==========================================
// 10. LIMPAR ROTAS ANTERIORES
// ==========================================

function limparMapa() {

    if (marcadorOrigem) {

        mapa.removeLayer(marcadorOrigem);

        marcadorOrigem = null;

    }

    if (marcadorDestino) {

        mapa.removeLayer(marcadorDestino);

        marcadorDestino = null;

    }

    linhasRotas.forEach(function (linha) {

        mapa.removeLayer(linha);

    });

    linhasRotas = [];

    removerMarcadorPrevia('origem');
    removerMarcadorPrevia('destino');

}


// ==========================================
// 11. DESENHAR UMA ROTA SELECIONADA
// ==========================================

function selecionarRota(indice) {

    limparMapa();

    var rota = rotasEncontradas[indice];

    var estilo = obterEstiloRisco(rota.risco.nivel);

    marcadorOrigem = L.marker([
        rota.origem.latitude,
        rota.origem.longitude
    ]).addTo(mapa);

    marcadorOrigem.bindPopup('Ponto de partida');

    marcadorDestino = L.marker([
        rota.destino.latitude,
        rota.destino.longitude
    ]).addTo(mapa);

    marcadorDestino.bindPopup('Destino');

    var linha = L.geoJSON(rota.geometry, {

        style: {
            color: estilo.cor,
            weight: 7,
            opacity: 0.9
        }

    }).addTo(mapa);

    linhasRotas.push(linha);

    mapa.fitBounds(linha.getBounds(), {
        padding: [40, 40]
    });

    var cartoes = document.querySelectorAll('.cartao-rota');

    cartoes.forEach(function (cartao, i) {

        cartao.classList.toggle('selecionada', i === indice);

    });

}


// ==========================================
// 12. MOSTRAR AS OPCOES DE ROTAS
// ==========================================

function mostrarOpcoesRotas(rotas, origem, destino, meioTransporte) {

    rotasEncontradas = [];

    opcoesRotas.innerHTML = '';

    rotas.forEach(function (rota) {

        var risco = analisarRisco(rota);

        rotasEncontradas.push({

            geometry: rota.geometry,
            distance: rota.distance,
            duration: rota.duration,
            origem: origem,
            destino: destino,
            risco: risco

        });

    });

    // Ordenar: menor risco primeiro
    rotasEncontradas.sort(function (a, b) {

        var ordem = {
            verde: 0,
            amarelo: 1,
            vermelho: 2
        };

        return ordem[a.risco.nivel] - ordem[b.risco.nivel];

    });

    rotasEncontradas.forEach(function (rota, indice) {

        var estilo = obterEstiloRisco(rota.risco.nivel);

        var cartao = document.createElement('button');

        cartao.type = 'button';
        cartao.className = 'cartao-rota';

        var distanciaKm = (rota.distance / 1000).toFixed(1);

        var tempo = formatarTempo(rota.duration, meioTransporte);

        var recomendacao = '';

if (indice === 0) {

    recomendacao =
        '<br><span class="recomendada">★ Rota com menor nível de alertas</span>';

}

var avisoSimulacao = '';

if (rota.risco.simulados > 0) {

    avisoSimulacao =
        '<br><small>⚠ ' +
        rota.risco.simulados +
        ' alerta(s) simulado(s) para demonstração</small>';

}

        cartao.innerHTML =

            '<div class="floresta">' +

                '<span class="flor" style="color:' + estilo.cor + ';">' +
                    estilo.flor +
                '</span>' +

                '<span class="nome-cor" style="color:' + estilo.cor + ';">' +
                    estilo.nome +
                '</span>' +

            '</div>' +

            '<div class="detalhes-rota">' +

                '<strong>Rota ' + (indice + 1) + '</strong>' +

                estilo.titulo + '<br>' +
                estilo.mensagem + '<br>' +
                'Tempo: ' + tempo + '<br>' +
                'Distância: ' + distanciaKm + ' km<br>' +
                'Alertas encontrados: ' + rota.risco.quantidade +
                avisoSimulacao +
                recomendacao +

            '</div>';

        cartao.addEventListener('click', function () {

            selecionarRota(indice);

        });

        opcoesRotas.appendChild(cartao);

    });

    informacoes.innerHTML =

        '<b>' + rotasEncontradas.length +

        (rotasEncontradas.length === 1
            ? ' opção encontrada.'
            : ' opções encontradas.') +

        '</b><br>Selecione uma opção para visualizar o caminho no mapa.';

    selecionarRota(0);

}



// ==========================================
// 13. BOTAO DE BUSCAR ROTAS
// ==========================================

var campoMeioTransporte =
    document.getElementById('meio-transporte');

botaoBuscar.addEventListener('click', async function () {

    var origem = locaisSelecionados.origem;
    var destino = locaisSelecionados.destino;

    var meioTransporte = campoMeioTransporte.value;

    if (!origem || !destino) {

        informacoes.textContent =
            'Pesquise e selecione uma opção para a origem e outra para o destino.';

        return;
    }

    origem = {
        latitude: origem.latitude,
        longitude: origem.longitude
    };

    destino = {
        latitude: destino.latitude,
        longitude: destino.longitude
    };

    botaoBuscar.disabled = true;

    opcoesRotas.innerHTML = '';

    limparMapa();

    var nomeTransporte = {
        a_pe: 'a pé',
        bicicleta: 'de bicicleta',
        onibus: 'de ônibus'
    };

    informacoes.textContent =
        'Calculando caminhos ' + nomeTransporte[meioTransporte] + '...';

    try {

        var rotas = await buscarRotas(
            origem,
            destino,
            meioTransporte
        );

        mostrarOpcoesRotas(rotas, origem, destino, meioTransporte);

    } catch (erro) {

        informacoes.textContent = erro.message;

    } finally {

        botaoBuscar.disabled = false;

    }

});


// ==========================================
// 14. CADASTRAR RELATOS NO BANCO DE DADOS
// ==========================================

var formularioAlerta = document.getElementById('formulario-alerta');

var enderecoAlerta = document.getElementById('endereco-alerta');

var categoriaAlerta = document.getElementById('categoria-alerta');

var descricaoAlerta = document.getElementById('descricao-alerta');

var dataAlerta = document.getElementById('data-alerta');

var botaoEnviarAlerta = document.getElementById('btnEnviarAlerta');

var mensagemAlerta = document.getElementById('mensagem-alerta');


formularioAlerta.addEventListener('submit', async function (evento) {

    evento.preventDefault();

    var local = locaisSelecionados.relato;

    if (!local) {

        mensagemAlerta.textContent =
            'Pesquise o endereço e selecione uma sugestão antes de enviar.';

        mensagemAlerta.style.color = '#e53935';

        return;

    }

    var categoria = categoriaAlerta.value;

    var descricao = descricaoAlerta.value.trim();

    var data = dataAlerta.value;

    botaoEnviarAlerta.disabled = true;

    mensagemAlerta.textContent = 'Enviando relato...';

    try {

        var dados = new URLSearchParams();

        dados.append('latitude', local.latitude);
        dados.append('longitude', local.longitude);
        dados.append('raio', 300);
        dados.append('categoria', categoria);
        dados.append('descricao', descricao);
        dados.append('data', data);

        var resposta = await fetch('/api/alertas', {

            method: 'POST',

            headers: {
                'Content-Type':
                    'application/x-www-form-urlencoded'
            },

            body: dados

        });

        var resultado = await resposta.json();

        if (!resposta.ok) {

            throw new Error(
                resultado.erro || 'Não foi possível enviar o relato.'
            );

        }

        mensagemAlerta.textContent =
            'Relato enviado! Aguardando aprovação.';

        mensagemAlerta.style.color = '#27865c';

        formularioAlerta.reset();

        locaisSelecionados.relato = null;

        removerMarcadorPrevia('relato');

    } catch (erro) {

        mensagemAlerta.textContent = erro.message;

        mensagemAlerta.style.color = '#e53935';

    } finally {

        botaoEnviarAlerta.disabled = false;

    }

});

console.log('AURA: localização por sugestões carregada!');
