// Animação de abertura: flor desabrochando -> texto -> some e mostra o site.
// A linha do tempo está no CSS (.intro.play ...). Aqui só controlamos quando ela
// começa, quando termina e quando pular.
//
//   /           toca 1 vez por sessão do navegador
//   /?intro=1   força tocar de novo (bom para testar)
//   /?intro=0   pula


(function () {

  const intro = document.getElementById("intro");

  const body = document.body;
 
  if (!intro) return;
 
  const params = new URLSearchParams(location.search);
 
  // Só pula a introdução se a URL tiver ?intro=0

  const skip = params.get("intro") === "0";
 
  let finished = false;
 
  function finish() {

    if (finished) return;
 
    finished = true;
 
    intro.remove();

    body.classList.remove("intro-pending");

  }
 
  // Se solicitado, pula a animação

  if (skip) {

    finish();

    return;

  }
 
  // Inicia a animação da florzinha

  requestAnimationFrame(() => {

    intro.classList.add("play");

  });
 
  // Inicia o desaparecimento da introdução

  const outTimer = setTimeout(() => {

    intro.classList.add("out");

  }, 4600);
 
  // Finaliza quando a animação termina

  intro.addEventListener("animationend", (e) => {

    if (e.animationName === "intro-out") {

      finish();

    }

  });
 
  // Garantia para a introdução não ficar presa

  setTimeout(finish, 6000);
 
  // Botão para pular a animação

  const skipButton = document.getElementById("intro-skip");
 
  if (skipButton) {

    skipButton.addEventListener("click", () => {

      clearTimeout(outTimer);

      intro.classList.add("out");

      setTimeout(finish, 850);

    });

  }

})();

 