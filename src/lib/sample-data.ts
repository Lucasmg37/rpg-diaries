import type { Adventure } from "@/core/entities/adventure";
import type { Adventurer } from "@/core/entities/adventurer";
import type { Guild } from "@/core/entities/guild";
import type { LooseEnd } from "@/core/entities/loose-end";
import type { Session } from "@/core/entities/session";
import type { StoryPlan } from "@/core/entities/story-plan";
import {
  createEmptyStore,
  type InMemoryStore,
} from "@/adapters/in-memory/in-memory.repository";

/**
 * Dados de exemplo do Diário da Guilda, migrados do HTML de referência
 * (reference/diario-referencia.html). Centralizados aqui para serem reutilizados
 * pelo demo da Fase 1, pelo seed da Fase 2 e pelo fallback in-memory de dev.
 *
 * IDs determinísticos (estáveis entre execuções) para seed idempotente e links
 * estáticos previsíveis.
 */

// O id da guild de exemplo segue MASTER_GUILD_ID (quando definido) para que o
// seed grave e o app leia exatamente a mesma guild. Fallback: "guild-aurora".
export const GUILD_ID = process.env.MASTER_GUILD_ID || "guild-aurora";
const ADVENTURE_ID = "adv-cronica";

// Paleta de acentos do tema (mesma do HTML de referência).
const ACCENT = {
  purple: "#9a60d8",
  amber: "#d4a04a",
  red: "#e07050",
  gray: "#a07a40",
} as const;

const date = (iso: string) => new Date(iso);

export const sampleGuild: Guild = {
  id: GUILD_ID,
  name: "Guilda dos Aventureiros",
  slug: "guilda-dos-aventureiros",
  description:
    "Relatórios, análises e registros das jornadas — sessão a sessão, dos primeiros passos às perdas que marcam o grupo.",
  masterId: "master-001",
  createdAt: date("2025-01-10T12:00:00Z"),
};

export const sampleAdventures: Adventure[] = [
  {
    id: ADVENTURE_ID,
    guildId: GUILD_ID,
    name: "Crônica dos Aventureiros",
    slug: "cronica-dos-aventureiros",
    description:
      "A saga do grupo: do batismo de sangue e da primeira condecoração até a escolta fatídica que custou a vida de Zephyron.",
    order: 1,
    createdAt: date("2025-02-01T12:00:00Z"),
  },
];

export const sampleAdventurers: Adventurer[] = [
  {
    id: "adv-nyxx",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    name: "Nyxx",
    className: "Mago",
    icon: "📖",
    level: 2,
    background:
      "Possuidor de um grimório antigo, cujo dono anterior permanece vivo e misterioso. Especialista em magia de invocação — frequentemente descontrolada. Pediu sangue à guilda em um momento bizarro.",
    status: "Ativo",
    sheetUrl: "https://example.com/fichas/nyxx",
  },
  {
    id: "adv-valerius",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    name: "Valerius",
    className: "Guerreiro",
    icon: "⚔️",
    level: 2,
    background:
      "Combate direto, resistência e liderança no campo de batalha. Aplicou o golpe final no primeiro boss do grupo e matou o chefe dos traficantes.",
    status: "Ativo",
    sheetUrl: "https://example.com/fichas/valerius",
  },
  {
    id: "adv-gutsen",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    name: "Gutsen",
    className: "Bárbaro",
    icon: "🪓",
    level: 2,
    background:
      "Fúria em combate, força bruta e resistência. Credor do grupo — emprestou dinheiro a Valerius após a primeira vitória.",
    status: "Ativo",
    sheetUrl: "https://example.com/fichas/gutsen",
  },
  {
    id: "adv-zephyron",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    name: "Zephyron",
    className: "Ladino",
    icon: "🗡️",
    level: 2,
    background:
      "Escravo renegado. Roubo silencioso, furtividade e perícia. Seu último feito foi roubar um mapa da empresa de geologia sem ser notado.",
    status: "Morto",
    sheetUrl: "https://example.com/fichas/zephyron",
  },
  {
    id: "adv-kael",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    name: "Kael Draven",
    className: "Clérigo",
    icon: "✨",
    level: 2,
    background:
      "Cura, suporte e ressurreição espiritual. Novo membro, recrutado após a morte de Zephyron — abordou o grupo criticando-os por não terem um curador.",
    status: "Ativo",
    sheetUrl: "https://example.com/fichas/kael-draven",
  },
];

export const sampleLooseEnds: LooseEnd[] = [
  // --- Sessão 1 ---
  {
    id: "le-magia-descontrolada",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "Magia Descontrolada",
    category: "Magia",
    description:
      "A invocação de Nyxx destruiu um casebre inteiro com um único golpe. Ele usou todo o seu mana e perdeu o controle. A guilda acreditou na mentira, mas ficou de olho.",
    color: ACCENT.purple,
    icon: "⚡",
    resolved: false,
  },
  {
    id: "le-elfo-visao",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "O Elfo da Visão",
    category: "Mistério",
    description:
      "Quem é o antigo dono do grimório de Nyxx? Ele apareceu em uma visão quando Nyxx adquiriu o livro. Ainda está vivo? Qual o seu interesse?",
    color: ACCENT.purple,
    icon: "👁",
    resolved: false,
  },
  {
    id: "le-mulher-biblioteca",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "A Mulher da Biblioteca",
    category: "Investigação",
    description:
      "Nyxx conversou com uma mulher mais velha que reconheceu a visão no grimório. O que ela sabe? Está viva? Contará tudo quando for encontrada?",
    color: ACCENT.amber,
    icon: "📚",
    resolved: false,
  },
  {
    id: "le-desconfianca-guilda",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "Desconfiança da Guilda",
    category: "Política",
    description:
      "O Chefe da Guilda acreditou na mentira, mas com ceticismo. Quanto tempo levará para descobrir a verdade? E o que fará quando descobrir?",
    color: ACCENT.red,
    icon: "🏛",
    resolved: false,
  },
  {
    id: "le-elfa-misteriosa",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "A Elfa Misteriosa",
    category: "NPC",
    description:
      "Uma elfa atraente os guiou até o Mestre de Forja e depois se afastou com a confusão. Quem é ela? O que sabia? Por que se afastou?",
    color: ACCENT.amber,
    icon: "🧝",
    resolved: false,
  },
  {
    id: "le-divida-valerius",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "Dívida de Valerius",
    category: "Pessoal",
    description:
      "Gutsen emprestou dinheiro a Valerius após a primeira vitória. Será cobrada? Pode gerar tensão no grupo?",
    color: ACCENT.gray,
    icon: "💰",
    resolved: false,
  },
  // --- Sessão 2 ---
  {
    id: "le-mapa-roubado",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "O Mapa Roubado",
    category: "Item",
    description:
      "Zephyron roubou um mapa da empresa de geologia sem ninguém notar. O que está nele? Por que era importante? Onde está agora?",
    color: ACCENT.purple,
    icon: "🗺️",
    resolved: false,
  },
  {
    id: "le-voce-fraco",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: '"Você é Fraco"',
    category: "Divino",
    description:
      "A deusa Tenebra respondeu ao chamado de Nyxx, mas com uma condenação pessoal. Por que ele é fraco? O que isso significa para a sua devoção?",
    color: ACCENT.red,
    icon: "🙏",
    resolved: false,
  },
  {
    id: "le-armas-perdidas",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "Armas Perdidas",
    category: "Item",
    description:
      "As armas de Valerius ficaram no campo da mineradora durante a batalha com os zumbis. Alguém as encontrará? Serão úteis para alguém?",
    color: ACCENT.gray,
    icon: "⚔️",
    resolved: false,
  },
  {
    id: "le-pedido-sangue",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "Pedido de Sangue",
    category: "Mistério",
    description:
      "Nyxx pediu sangue à guilda e depois gritou que não precisava. Comportamento bizarro. O que ele tentava fazer? O que planejava?",
    color: ACCENT.amber,
    icon: "🩸",
    resolved: false,
  },
  {
    id: "le-porta-dourada",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "A Porta Dourada",
    category: "Mistério",
    description:
      "Uma porta dourada guardada por estátuas nas minas. O grupo foi dispensado sem chance de investigar. O que está lá dentro? Por que foi protegida?",
    color: ACCENT.purple,
    icon: "🗿",
    resolved: false,
  },
  {
    id: "le-biblioteca",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "A Biblioteca",
    category: "Gancho",
    description:
      "Nyxx ficou visivelmente apreensivo ao ouvir 'biblioteca'. Por quê? O que ele sabe que os outros não sabem? A próxima missão será perigosa.",
    color: ACCENT.red,
    icon: "📚",
    resolved: false,
  },
  {
    id: "le-kael-draven",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "Quem é Kael Draven?",
    category: "NPC",
    description:
      "Um novo clérigo ousado se uniu ao grupo. Quem é ele de verdade? Por que apareceu naquele momento específico? Tem segundas intenções?",
    color: ACCENT.gray,
    icon: "✨",
    resolved: false,
  },
];

export const sampleSessions: Session[] = [
  {
    id: "sess-01",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "Do Batismo ao Escândalo",
    number: 1,
    icon: "⚔️",
    summary:
      "A primeira vitória, a condecoração e a invocação descontrolada que mudou tudo.",
    timeline: [
      {
        icon: "🏆",
        title: "Batismo de Sangue — a Primeira Vitória",
        body: "O grupo enfrentou o boss do seu primeiro desafio coletivo. A batalha foi dura — três membros caíram durante o confronto. Valerius permaneceu de pé e aplicou o golpe final, encerrando o combate.",
      },
      {
        icon: "📜",
        title: "Descanso, Relatório e Ascensão de Nível",
        body: "Após o descanso, reportaram a missão. Todos subiram de nível. Passeio pela cidade, compra de equipamentos e aprendizado de magias na biblioteca. Gutsen emprestou dinheiro a Valerius.",
      },
      {
        icon: "🏅",
        title: "Condecoração — Aventureiros da Guilda",
        body: "Uma elfa na guilda os direcionou ao Mestre de Forja. Foram formalmente condecorados: receberam um pergaminho com autorização para missões e um broche com o seu nível. Nyxx se ausentou durante a cerimônia.",
        callout:
          "Quando questionado, Nyxx disse que foi à biblioteca... o grupo ficou com cerca de 10% de dúvida. Ele relatou ter raptado uma mulher que reconheceu como conhecedora do antigo dono do grimório.",
      },
      {
        icon: "⚖️",
        title: "Escolha da Missão — sem Nyxx",
        body: "Analisaram o quadro enquanto Nyxx buscava o seu broche. Debateram entre missões fáceis ou de maior retorno. Decidiram — sem a opinião dele — por uma missão mediana com retorno imediato.",
      },
      {
        icon: "💥",
        title: "Missão no Portão — o Desastre",
        body: "Fiscalizavam o portão da muralha. O Sargento Elias os levou a um casebre com dois guardas sem uniforme — entraram mesmo desconfiando. Dentro: meia dúzia de traficantes. Elias tentou subornar, falhou na intimidação. Briga frenética. Os bandidos foram vencidos até que o chefe apareceu.",
        callout:
          "Nyxx, do lado de fora, usou todo o seu mana para invocar uma criatura de nível colossal. Com um soco, destruiu o casebre inteiro. O chefe morreu. Os aventureiros ficaram inconscientes. Nyxx os resgatou com a invocação e fingiu estar desacordado.",
      },
      {
        icon: "🏛️",
        title: "Interrogatório na Guilda",
        body: "Chamados pelo Chefe da Guilda. A guilda os olhava com desconfiança. A elfa que os ajudara se afastou. Disseram que um dos bandidos foi o responsável pela invocação. Com carisma, a mentira passou. Sem recompensa pela morte de Elias.",
      },
    ],
    tags: [
      { label: "Missão concluída", color: ACCENT.gray },
      { label: "Sem recompensa", color: ACCENT.gray },
      { label: "Mentira plantada", color: ACCENT.red },
    ],
    masterNotes:
      "NOTA DO MESTRE: a invocação de Nyxx é o grimório agindo por conta própria; o dono anterior (o elfo da visão) está ciente. A guilda guarda 10% de suspeita — escalar nas próximas sessões. A elfa da forja sabe mais do que demonstrou.",
    participants: [
      { adventurerId: "adv-valerius", sessionBadge: "↑ Nv. 2" },
      { adventurerId: "adv-gutsen", sessionBadge: "↑ Nv. 2" },
      {
        adventurerId: "adv-nyxx",
        sessionBadge: "⚠ Suspeito",
        sessionState: "suspicious",
        sessionNote:
          "Ausentou-se da cerimônia e mentiu sobre a invocação descontrolada.",
      },
      { adventurerId: "adv-zephyron", sessionBadge: "↑ Nv. 2" },
    ],
    looseEndIds: [
      "le-magia-descontrolada",
      "le-elfo-visao",
      "le-mulher-biblioteca",
      "le-desconfianca-guilda",
      "le-elfa-misteriosa",
      "le-divida-valerius",
    ],
    closing: {
      quote:
        "De iniciantes a aventureiros em um dia só — e já com uma mentira pesando nas costas.",
      tagline: "Que a próxima sessão seja mais... controlada.",
    },
    createdAt: date("2025-02-05T20:00:00Z"),
    updatedAt: date("2025-02-05T23:30:00Z"),
  },
  {
    id: "sess-02",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "A Escolta, a Queda e o Novo Nível",
    number: 2,
    icon: "⚰️",
    summary:
      "Três missões completadas, uma morte permanente e a chegada de Kael Draven.",
    timeline: [
      {
        icon: "📋",
        title: "O Quadro de Missões",
        body: "Dois avisos chamaram atenção: um procura-se anônimo por um mago de nível 15, e um desaparecimento na biblioteca. O grupo trocou olhares desconfiados, mas escolheu outro caminho: uma missão de maior retorno — 400 de recompensa para escoltar uma mineradora.",
      },
      {
        icon: "🗺️",
        title: "O Mapa Roubado",
        body: "No escritório da empresa, Zephyron furtou um mapa sem ser notado — nem mesmo pelos companheiros.",
      },
      {
        icon: "🧟",
        title: "As Máquinas Despertam os Mortos",
        body: "Ao ligar as máquinas, uma horda de zumbis surgiu — não uma vez, mas em três ondas. Onda 1: derrotada. Onda 2: Zephyron cai. Onda 3: defesa total do maquinário.",
      },
      {
        icon: "💔",
        title: "A Queda de Zephyron",
        body: "Na segunda onda, Zephyron caiu sangrando. Tentaram estancar sem sucesso. Valerius lançou a sua arma contra a horda — errou, e a arma ficou perdida no campo.",
      },
      {
        icon: "🙏",
        title: "O Pedido Negado",
        body: "Nyxx pediu à deusa Tenebra poder para controlar os zumbis.",
        callout: 'Do céu, veio apenas uma resposta: "Você é fraco".',
      },
      {
        icon: "🛡️",
        title: "Mudança de Estratégia",
        body: "Antes de a segunda onda ser vencida, a terceira já surgia. O grupo abandonou o ataque e se uniu para proteger o maquinário. A mineradora terminou o trabalho segundos antes de os zumbis alcançarem a base.",
      },
      {
        icon: "⚰️",
        title: "A Perda",
        body: "Entraram na carroça com Zephyron já caído. As armas de Valerius ficaram para trás. Zephyron não resistiu aos ferimentos e morreu no caminho de volta.",
        callout:
          "Mesmo renegado pelo próprio pai, Zephyron recebeu dos companheiros um enterro digno. A missão foi concluída com sucesso.",
      },
      {
        icon: "🆕",
        title: "Um Novo Aliado — Kael Draven",
        body: 'Buscando um substituto, o grupo foi abordado por um estranho ousado que criticou a falta de curador e os chamou de "fracos". Topou se juntar por uma parcela da recompensa. Kael Draven, clérigo healer, assume o lugar de Zephyron.',
      },
      {
        icon: "🛒",
        title: "Mercado e Taverna",
        body: "Compraram novas armas. Nyxx, em um momento bizarro, pediu sangue à guilda — e logo depois gritou que não precisava dele.",
      },
      {
        icon: "⛏️",
        title: "A Câmara das Estátuas",
        body: "Missão: analisar uma câmara nas minas. Nível 3, 500 de recompensa. Uma porta dourada ao fundo, guardada por duas estátuas que despertaram quando se aproximaram.",
        callout:
          "Kael Draven foi essencial — as suas curas mantiveram o grupo de pé. As estátuas caíram sem nenhuma baixa. Mas foram dispensados sem chance de investigar a porta dourada.",
      },
      {
        icon: "📚",
        title: "De Volta à Taberna",
        body: "Escolheram a próxima missão: o desaparecimento na biblioteca. Ao ouvir o nome, Nyxx ficou visivelmente apreensivo.",
      },
    ],
    tags: [
      { label: "Zephyron caído", color: ACCENT.red },
      { label: "Novo membro", color: ACCENT.amber },
      { label: "Apreensão crescente", color: ACCENT.gray },
    ],
    masterNotes:
      "NOTA DO MESTRE: a porta dourada conecta ao mapa roubado por Zephyron — guardar para o arco das minas. A rejeição de Tenebra ('você é fraco') é a deixa para o arco de fé de Nyxx. Kael Draven tem agenda oculta ligada à biblioteca.",
    participants: [
      { adventurerId: "adv-nyxx", sessionBadge: "Apreensivo" },
      { adventurerId: "adv-gutsen", sessionBadge: "Sobrevivente" },
      { adventurerId: "adv-valerius", sessionBadge: "Sobrevivente" },
      {
        adventurerId: "adv-zephyron",
        sessionBadge: "✝ Caído",
        sessionState: "fallen",
        sessionNote: "Tombou na segunda onda de zumbis e morreu no retorno.",
      },
      {
        adventurerId: "adv-kael",
        sessionBadge: "Novo membro",
        sessionState: "new",
        sessionNote: "Manteve o grupo de pé na câmara das estátuas.",
      },
    ],
    looseEndIds: [
      "le-mapa-roubado",
      "le-voce-fraco",
      "le-armas-perdidas",
      "le-pedido-sangue",
      "le-porta-dourada",
      "le-biblioteca",
      "le-kael-draven",
    ],
    closing: {
      quote:
        "Nem toda vitória chega sem perdas — e Zephyron pagou o preço por todos.",
      tagline: "Que seu roubo silencioso não tenha sido em vão.",
    },
    createdAt: date("2025-02-12T20:00:00Z"),
    updatedAt: date("2025-02-12T23:45:00Z"),
  },
];

export const sampleStoryPlans: StoryPlan[] = [
  {
    id: "plan-rastro-bibliotecaria",
    guildId: GUILD_ID,
    adventureId: ADVENTURE_ID,
    title: "O rastro da bibliotecária",
    eyebrow: "Notas do mestre · uso exclusivo",
    subtitle: "Missão de busca — cadeia de pistas, testes e segredos",
    loreBanner: {
      label: '⬙ Atualização de lore — quem é o "mestre" da marca',
      body: "A magia de ligação encontrada no corpo da auxiliar pertence ao antigo dono do grimório de Nyxx — o elfo que apareceu na visão dele no momento em que adquiriu o livro. Ele está vivo (ou ativo de alguma forma) e capaz de projetar magia à distância. Suas intenções permanecem desconhecidas — ele pode estar vigiando o Nyxx, testando-o, recuperando o que considera seu, ou perseguindo um objetivo totalmente independente que só colide com o grupo por acaso.",
      tags: [
        "Antigo dono do grimório",
        "Vivo / ativo",
        "Intenções desconhecidas",
        "Capaz de magia à distância",
      ],
    },
    scenes: [
      {
        id: "cena-1-biblioteca",
        icon: "📚",
        title: "Cena 1 — A biblioteca",
        meta: "Ponto de partida da investigação",
        blocks: [
          {
            type: "clue",
            body: "A bibliotecária-mor confirma: a auxiliar foi vista por último na sexta, antes do fechamento.",
          },
          {
            type: "test",
            variant: "test",
            tag: "Teste — Nyxx",
            body: "Memória/Intuição: ele percebe que a bibliotecária-mor pode reconhecê-lo como a última pessoa que falou com a auxiliar antes do incidente no porão.",
          },
          { type: "clue", body: "O grupo decide vasculhar o local em busca de pistas." },
          {
            type: "clue",
            body: "No porão — área pouco visitada, onde ficam os livros de menor interesse — notam marcas recentes no pó, indicando movimento.",
          },
          {
            type: "test",
            variant: "test",
            tag: "Teste — Nyxx",
            body: "Percepção/Memória: ao notar manchas de sangue no chão, ele se lembra de um corte na própria cabeça.",
          },
          {
            type: "clue",
            body: "A bibliotecária-mor comenta que a auxiliar andava estranha desde um \"ocorrido\" no porão — sem saber que o responsável era Nyxx (ela pode ou não associar os dois fatos, a critério do mestre).",
          },
          {
            type: "clue",
            body: "Ela explica o corte na cabeça como resultado de uma queda na escada ao descer para o porão.",
          },
          {
            type: "clue",
            body: "Pelas pegadas e rastros de sangue, percebem que a auxiliar acordou e saiu do porão por conta própria — ou seja, Nyxx a deixou viva.",
          },
          {
            type: "clue",
            body: "Uma placa na porta indica o horário de funcionamento: até 23h nas sextas. No sábado, a auxiliar não apareceu para o turno — ela trabalha sozinha durante as noites.",
          },
          {
            type: "clue",
            body: "A porta da biblioteca não tem fechadura tradicional: ela se lacra magicamente quando alguém sai, e só a bibliotecária-mor pode reabri-la. Na manhã seguinte, a porta estava lacrada normalmente — confirmando que a auxiliar saiu e trancou tudo certo.",
          },
          {
            type: "secret",
            label: "🔒 Conclusão da cena (mestre)",
            body: "Ela desapareceu no caminho de volta para casa — não dentro da biblioteca. O grupo deve seguir para a residência dela.",
          },
        ],
      },
      {
        id: "cena-2-casa",
        icon: "🏠",
        title: "Cena 2 — A casa da auxiliar",
        meta: "Local do sequestro",
        blocks: [
          { type: "clue", body: "A porta da casa está trancada — ela nunca chegou a entrar." },
          { type: "clue", body: "No gramado em frente, há sinais claros de luta." },
          {
            type: "clue",
            body: "Gotas de sangue notáveis no chão indicam que ela foi ferida durante o confronto.",
          },
          {
            type: "secret",
            label: "🔒 O que houve (mestre)",
            body: "Alguém a interceptou no caminho para casa, lutou com ela e a capturou — levando-a para outro local.",
          },
          { type: "clue", body: "As gotas de sangue formam um rastro que pode ser seguido." },
        ],
      },
      {
        id: "cena-3-gruta",
        icon: "🌲",
        title: "Cena 3 — A gruta na floresta",
        meta: "~30 minutos de caminhada seguindo o rastro",
        blocks: [
          {
            type: "clue",
            body: "O rastro de sangue atravessa a floresta por cerca de 30 minutos até uma gruta escondida.",
          },
          {
            type: "test",
            variant: "test",
            tag: "Teste — grupo",
            body: "Percepção/Arcana: a entrada da gruta está protegida por magia. Sucesso permite identificar e tentar desarmar (novo teste). Falha no desarme: desperta um guardião invocado — informação totalmente oculta até esse momento.",
          },
          {
            type: "secret",
            label: "🔒 Segredo — proteção da gruta",
            body: "A proteção foi criada por magia de invocação. Se desarmada com sucesso, o grupo entra sem confronto extra. Se falharem, surge o ser defensor — um combate antes do confronto principal.",
          },
          {
            type: "test",
            variant: "combat",
            tag: "Combate",
            body: "No fundo da gruta, o grupo enfrenta o boss guardião do local.",
          },
          {
            type: "clue",
            body: "Vencido o boss, encontram o corpo da auxiliar — torturada com extrema crueldade. Cortes pelo corpo, muito cabelo arrancado espalhado pelo chão. Obra de alguém sem qualquer compaixão.",
          },
          {
            type: "test",
            variant: "test",
            tag: "Teste — grupo",
            body: "Arcana/Investigação: ao examinar o corpo, notam uma marca arcana nele.",
          },
          {
            type: "secret",
            label: "🔒 Segredo — a marca",
            body: "É uma magia de ligação ao antigo dono do grimório de Nyxx — permanece ativa mesmo após a morte da vítima. Foi ele quem a torturou e marcou. Suas intenções com isso (vigilância, mensagem, recurso arcano, ou algo pior) permanecem desconhecidas. A marca pode ser rastreada de volta até ele caso ativada.",
          },
          {
            type: "danger",
            label: "⚠ Risco",
            body: "Se o grupo decidir levar o corpo, a marca pode ser ativada ao saírem da gruta — possivelmente alertando o antigo dono do grimório de que alguém encontrou seu trabalho. Consequências a critério do mestre.",
          },
          {
            type: "choices",
            choices: [
              {
                title: "Levar o corpo",
                body: "Risco de ativar a marca arcana ao saírem da gruta — possível alerta direto ao antigo dono do grimório. Pode gerar consequências futuras.",
              },
              {
                title: "Levar só a informação",
                body: "Mais seguro — registram o que encontraram e deixam o corpo na gruta, sem riscos imediatos.",
              },
            ],
          },
        ],
      },
    ],
    reward:
      "É uma missão de busca — mesmo sem trazer o corpo, o grupo recebe recompensa pela informação e pela conclusão da investigação.",
    liveNotes: [],
    order: 1,
    createdAt: date("2025-02-19T18:00:00Z"),
    updatedAt: date("2025-02-19T18:00:00Z"),
  },
];

/** Popula (ou cria) um InMemoryStore com todos os dados de exemplo. */
export function buildSampleStore(
  store: InMemoryStore = createEmptyStore(),
): InMemoryStore {
  store.guilds.set(sampleGuild.id, sampleGuild);
  for (const a of sampleAdventures) store.adventures.set(a.id, a);
  for (const a of sampleAdventurers) store.adventurers.set(a.id, a);
  for (const l of sampleLooseEnds) store.looseEnds.set(l.id, l);
  for (const s of sampleSessions) store.sessions.set(s.id, s);
  for (const p of sampleStoryPlans) store.storyPlans.set(p.id, p);
  return store;
}
