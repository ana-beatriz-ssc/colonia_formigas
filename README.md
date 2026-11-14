# UNIVERSIDADE FEDERAL DO PIAUÍ
## Disciplina: Inteligência Artificial
### Período letivo: 2026.2
### Atividade Prática sobre Colônia de Formigas

---

## 1. Identificação
Discentes: Ana Beatriz dos Santos Sousa Costa, Késsia Letícia da Silva Lima e Lara Nubia Martins Ribeiro

Link da aplicação no GitHub Pages: `https://ana-beatriz-ssc.github.io/colonia_formigas/`
Link do repositório no GitHub: `https://github.com/ana-beatriz-ssc/colonia_formigas.git`

---

## 2. Descrição da Solução

Esta aplicação consiste em um simulador de otimização por colônia de formigas (variante Ant System - AS) desenvolvido para planejar uma rota de entregas. O problema modelado corresponde ao Problema do Caixeiro Viajante (TSP) com um ponto de partida fixo (depósito):
- Um veículo parte do depósito, visita cada um dos pontos de entrega exatamente uma vez e retorna obrigatoriamente ao depósito.
- O objetivo é encontrar a sequência de visitas que minimiza a distância total percorrida.
- O cenário é modelado como um grafo completo, não direcionado, onde os vértices possuem coordenadas cartesianas no plano (x, y) entre 0 e 1.000, com até duas casas decimais.
- A distância entre qualquer par de vértices i e j é dada pela métrica euclidiana:
  $$d(i, j) = \sqrt{(x(i) - x(j))^2 + (y(i) - y(j))^2}$$
  com $d(i, i) = 0$ e $d(i, j) = d(j, i)$.

### Funcionamento do Algoritmo (Ant System)

1. **Inicialização:**
   - Todas as arestas que conectam vértices distintos recebem o valor de feromônio inicial $\tau_0$.
   - A diagonal principal da matriz de feromônios é mantida em zero.
   - O gerador de números pseudoaleatórios é inicializado com a semente inteira configurada.

2. **Construção de Soluções:**
   - Em cada iteração, cada uma das formigas constrói de forma independente uma rota completa a partir do depósito.
   - Estando no vértice atual $i$, a formiga avalia o conjunto de vértices candidatos $u$ ainda não visitados.
   - Para cada próximo vértice candidato $j$, calcula-se o peso de transição:
     $$w(i, j) = [\tau(i, j)]^\alpha \times \left[\frac{1}{d(i, j)}\right]^\beta$$
     Quando $\alpha = 0$, o feromônio não influencia a escolha ($[\tau(i, j)]^0 = 1$).
     Quando $\beta = 0$, a distância não influencia a escolha ($[1/d(i, j)]^0 = 1$).
   - A probabilidade de escolha do vértice $j$ é dada pela regra da roleta proporcional:
     $$p(i, j) = \frac{w(i, j)}{\sum_{u} w(i, u)}$$
   - O próximo vértice é sorteado proporcionalmente às probabilidades calculadas, garantindo diversidade e impedindo a escolha determinística exclusiva do maior peso.
   - Ao restar apenas um candidato não visitado, sua probabilidade é 1.
   - Após visitar todos os vértices de entrega, a formiga retorna obrigatoriamente ao depósito, completando a rota com comprimento total $L_k$.

3. **Atualização Síncrona de Feromônios:**
   - Todas as formigas de uma mesma iteração utilizam a matriz de feromônios proveniente do término da iteração anterior.
   - Somente após todas as formigas concluírem suas rotas, realiza-se a evaporação e o depósito acumulado:
     $$\tau_{novo}(i, j) = (1 - \rho) \times \tau_{antigo}(i, j) + \sum_{k} \Delta\tau_k(i, j)$$
   - Se a formiga $k$ percorreu a aresta $(i, j)$ (em qualquer sentido, inclusive no retorno ao depósito), sua contribuição é $\Delta\tau_k(i, j) = \frac{Q}{L_k}$; caso contrário, é 0.
   - Como o grafo é não direcionado, mantém-se a simetria $\tau(i, j) = \tau(j, i)$, somando a contribuição de cada formiga apenas uma vez por aresta utilizada.
   - Para assegurar estabilidade numérica contra valores numericamente nulos, aplica-se o piso mínimo de $10^{-12}$ em todas as arestas após a atualização.

4. **Registro de Desempenho:**
   - Registra-se a menor distância da iteração, a média de comprimento de todas as formigas e a melhor rota acumulada de toda a execução (que nunca sofre piora ao longo das iterações).

---

## 3. Instruções de Uso

### Como Executar Localmente
A aplicação foi desenvolvida em tecnologias web puras e é executada diretamente no navegador, sem necessidade de instalação de dependências ou servidor de aplicação:
1. Abra o arquivo `index.html` em qualquer navegador web moderno (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, etc.).
2. Alternativamente, para execução com servidor local estático simples, pode-se executar no terminal:
   ```bash
   python -m http.server 8000
   ```
   e acessar no navegador o endereço `http://localhost:8000`.

### Controles Disponíveis
- **Cenários Pré-configurados:**
  - *Cenário Inicial (5 Vértices):* carrega o cenário padrão com 5 vértices e depósito em A.
  - *Instância de Teste (4 Vértices A-B-C-D):* carrega a geometria exata da Seção 6.1 para verificação analítica.
- **Gerenciamento de Vértices:**
  - Adicione novos vértices informando identificador único e coordenadas X e Y (0 a 1.000).
  - Edite coordenadas diretamente nos campos de texto da tabela.
  - Remova vértices utilizando o botão "Remover" (respeitando o mínimo de 4 vértices).
- **Parâmetros do Algoritmo:**
  - Ajuste os valores dos parâmetros numéricos nos campos correspondentes.
  - Altere o depósito selecionando qualquer vértice cadastrado no menu suspenso.
  - Ajuste a velocidade visual da execução com o controle deslizante de intervalo (50 ms a 1.000 ms).
- **Ações de Execução:**
  - *Executar:* inicia a execução contínua com atualização visual periódica.
  - *Pausar:* suspende a execução contínua preservando o estado corrente.
  - *Avançar uma iteração:* executa apenas um ciclo de iteração e mantém a simulação pausada.
  - *Reiniciar:* limpa o histórico, restaura o feromônio inicial $\tau_0$ em todas as arestas, restaura a semente e reinicia na iteração 0.
- **Consulta e Inspeção de Arestas:**
  - Passe o cursor sobre o grafo para destacar arestas e vértices.
  - Selecione os vértices de origem e destino no painel de consulta para verificar a distância fixa euclidiana, o feromônio atualizado e o peso $w$ calculado.
- **Transparência e Logs Expansíveis:**
  - Abra o painel "Acompanhamento da Construção de Rota (Formiga 1)" para inspecionar cada decisão tomada.
  - Abra "Atualização Numérica dos Feromônios por Aresta" para conferir valores anteriores, evaporação, depósitos somados e valores finais.
  - Abra "Histórico de Todas as Iterações" para consultar a tabela com todos os ciclos executados.
  - Abra "Bateria de Testes de Validação" e clique em "Executar Bateria de Testes" para rodar a suíte analítica com validação automática.

---

## 4. Parâmetros da Aplicação

| Parâmetro | Faixa Válida | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| **Vértices** | 4 a 12 | 5 vértices | Quantidade de pontos no grafo. Coordenadas finitas entre 0 e 1.000 (até 2 casas decimais). Coordenadas repetidas são bloqueadas. |
| **Depósito** | Vértice válido | Vértice A | Vértice inicial e final obrigatório para todas as rotas. |
| **Número de Formigas** | 1 a 100 | 10 | Quantidade de formigas que constroem rotas em cada iteração. |
| **Número de Iterações** | 1 a 200 | 30 | Quantidade máxima de iterações do algoritmo. |
| **Influência do Feromônio ($\alpha$)** | 0 a 5 | 1,0 | Peso atribuído à intensidade do feromônio. Com 0, a trilha é desconsiderada. |
| **Influência da Distância ($\beta$)** | 0 a 5 | 2,0 | Peso atribuído à visibilidade heurística ($1/d$). Com 0, o custo de distância é desconsiderado. |
| **Taxa de Evaporação ($\rho$)** | 0% a 90% | 50% | Percentual de feromônio evaporado a cada ciclo. Convertido internamente para a fração $\rho \in [0,0; 0,9]$. |
| **Feromônio Inicial ($\tau_0$)** | 0,01 a 100 | 1,00 | Quantidade inicial depositada uniformemente em todas as arestas não diagonais. |
| **Constante de Depósito ($Q$)** | 0,01 a 10.000 | 14,00 | Fator de escala utilizado no depósito de feromônio $\Delta\tau = Q / L_k$. |
| **Semente Aleatória** | Inteiro | 42 | Semente utilizada no gerador pseudoaleatório Mulberry32 para garantir total determinismo e reprodutibilidade. |

---

## 5. Bibliotecas Auxiliares Utilizadas
- **Nenhuma biblioteca de terceiros ou externa foi utilizada.**
- A solução foi concebida e implementada de forma nativa e pura em **HTML5**, **CSS3** e **JavaScript (ES6+)**.
- O gerador de números pseudoaleatórios baseado em semente inteira foi implementado no módulo `js/prng.js` utilizando o algoritmo determinístico Mulberry32.
- A técnica de Otimização por Colônia de Formigas (Ant System) foi implementada integralmente do zero no módulo `js/aco.js`.
- A renderização visual do grafo foi desenvolvida com a API nativa do elemento HTML5 Canvas 2D.

---

## 6. Resultados dos Testes de Validação

Os testes a seguir foram executados com precisão numérica interna completa e comparação contra as tolerâncias absolutas exigidas ($\le 0,000001$).

### 6.1. Instância de Referência e Cálculo das Rotas
- **Entradas e Parâmetros:**
  - Vértices: $A = (0, 0)$, $B = (3, 0)$, $C = (3, 4)$, $D = (0, 4)$.
  - Depósito: $A$.
- **Distâncias Euclidianas Obtidas:**
  - $A - B = \sqrt{(3-0)^2 + (0-0)^2} = 3$
  - $A - C = \sqrt{(3-0)^2 + (4-0)^2} = 5$
  - $A - D = \sqrt{(0-0)^2 + (4-0)^2} = 4$
  - $B - C = \sqrt{(3-3)^2 + (4-0)^2} = 4$
  - $B - D = \sqrt{(0-3)^2 + (4-0)^2} = 5$
  - $C - D = \sqrt{(0-3)^2 + (4-4)^2} = 3$
  - Simetria $d(i, j) = d(j, i)$ verificada e $d(i, i) = 0$.
- **Comprimento das 6 Rotas Possíveis:**
  1. $A \to B \to C \to D \to A$: $3 + 4 + 3 + 4 = 14$ (Ótimo)
  2. $A \to B \to D \to C \to A$: $3 + 5 + 3 + 5 = 16$
  3. $A \to C \to B \to D \to A$: $5 + 4 + 5 + 4 = 18$
  4. $A \to C \to D \to B \to A$: $5 + 3 + 5 + 3 = 16$
  5. $A \to D \to B \to C \to A$: $4 + 5 + 4 + 5 = 18$
  6. $A \to D \to C \to B \to A$: $4 + 3 + 4 + 3 = 14$ (Ótimo)
- **Conclusão:** Todas as distâncias e comprimentos de rota calculados conferem exatamente com a especificação analítica.

---

### 6.2. Probabilidades de Escolha
- **Entradas e Parâmetros:**
  - Instância do teste 6.1 com formiga em $A$, sem outros vértices visitados.
  - $\tau = 1$ em todas as arestas, $\alpha = 1$, $\beta = 2$.
- **Cálculo dos Pesos a partir de A:**
  - $w(A, B) = 1^1 \times (1/3)^2 = 1/9 \approx 0,111111$
  - $w(A, C) = 1^1 \times (1/5)^2 = 1/25 = 0,040000$
  - $w(A, D) = 1^1 \times (1/4)^2 = 1/16 = 0,062500$
  - Soma dos pesos: $1/9 + 1/25 + 1/16 = 769 / 3600 \approx 0,213611$
- **Probabilidades Obtidas e Comparação com o Esperado:**
  - $p(A, B) = \frac{1/9}{769/3600} = \frac{400}{769} \approx 0,5201560468$ (Obtido: 0,520156, Erro: 0,000000)
  - $p(A, C) = \frac{1/25}{769/3600} = \frac{144}{769} \approx 0,1872561769$ (Obtido: 0,187256, Erro: 0,000000)
  - $p(A, D) = \frac{1/16}{769/3600} = \frac{225}{769} \approx 0,2925877763$ (Obtido: 0,292588, Erro: 0,000000)
  - Soma das probabilidades: $1,000000$
- **Transição seguinte após visita a B (candidatos restantes: C e D):**
  - $w(B, C) = 1 \times (1/4)^2 = 1/16$
  - $w(B, D) = 1 \times (1/5)^2 = 1/25$
  - Soma: $1/16 + 1/25 = 41 / 400$
  - $p(B, C) = \frac{1/16}{41/400} = \frac{25}{41} \approx 0,609756$ (Obtido: 0,609756, Erro: 0,000000)
  - $p(B, D) = \frac{1/25}{41/400} = \frac{16}{41} \approx 0,390244$ (Obtido: 0,390244, Erro: 0,000000)
- **Teste com $\alpha = 0$ e $\beta = 0$:**
  - Pesos unitários para todos os candidatos; probabilidades obtidas: $p(A, B) = p(A, C) = p(A, D) = 1/3 \approx 0,333333$.
- **Teste com 1 candidato restante:**
  - Probabilidade obtida: $1,000000$.
- **Conclusão:** O cálculo dos pesos e a distribuição proporcional de probabilidades atendem rigorosamente às equações analíticas com erro nulo dentro da tolerância de $10^{-6}$.

---

### 6.3. Evaporação e Depósito
- **Entradas e Parâmetros:**
  - $\tau_0 = 1$, $\rho = 50\%$ ($\rho = 0,5$), $Q = 14$.
- **Cenário 1: Uma formiga com rota forçada $A \to B \to C \to D \to A$ ($L = 14$):**
  - Após evaporação: todas as arestas passam a $(1 - 0,5) \times 1 = 0,5$.
  - Depósito da formiga: $\Delta\tau = Q / L = 14 / 14 = 1,0$ nas arestas percorridas ($AB, BC, CD, AD$); arestas diagonais ($AC, BD$) recebem $0$.
  - **Resultado da Iteração 1:**
    - Perímetro ($AB, BC, CD, AD$): $0,5 + 1,0 = 1,500000$.
    - Diagonais ($AC, BD$): $0,5 + 0,0 = 0,500000$.
    - Log gerado para $AB$: "anterior 1; após evaporação 0,5; depósito 1; final 1,5".
    - Log gerado para $AC$: "anterior 1; após evaporação 0,5; depósito 0; final 0,5".
  - **Resultado da Iteração 2 (mesma rota forçada):**
    - Perímetro: $(1,5 \times 0,5) + 1,0 = 0,75 + 1,0 = 1,750000$.
    - Diagonais: $(0,5 \times 0,5) + 0,0 = 0,250000$.
- **Cenário 2: Duas formigas percorrendo a mesma rota na Iteração 1 a partir de $\tau_0 = 1$:**
  - Evaporação: $1 \times 0,5 = 0,5$ em todas as arestas.
  - Depósito somado das duas formigas no perímetro: $1,0 + 1,0 = 2,0$.
  - Feromônio final no perímetro: $0,5 + 2,0 = 2,500000$.
  - Feromônio final nas diagonais: $0,5 + 0,0 = 0,500000$.
- **Conclusão:** A soma das contribuições de múltiplas formigas e a atualização estritamente síncrona pós-iteração estão perfeitamente validadas.

---

### 6.4. Execução Completa e Reprodutibilidade
- **Entradas e Parâmetros:**
  - Vértices: $A=(0,0), B=(3,0), C=(3,4), D=(0,4)$, depósito em $A$.
  - Número de formigas: 10.
  - Número de iterações: 30.
  - $\alpha = 1$, $\beta = 2$, $\rho = 50\%$, $\tau_0 = 1$, $Q = 14$, semente aleatória = 42.
- **Saídas Obtidas:**
  - Total de registros de iteração concluídos: 30 registros.
  - Na iteração 0 inicial: feromônio $\tau_0 = 1,0$ em todas as arestas e melhor distância apresentada como "ainda não calculada".
  - Melhor rota acumulada ao final das 30 iterações: $A \to B \to C \to D \to A$ (ou inversão equivalente $A \to D \to C \to B \to A$).
  - Comprimento da melhor rota: $14,000000$ (ótimo global atingido).
  - Reprodutibilidade: executando novamente com os mesmos parâmetros e semente 42, os históricos de todas as 30 iterações foram rigorosamente idênticos.
  - Monotonicidade: a melhor distância acumulada nunca sofreu aumento ao longo das 30 iterações, satisfazendo a propriedade de não-crescimento do mínimo acumulado.
- **Conclusão:** O sistema garante reprodutibilidade estrita com a semente configurada e preserva o histórico sob pausas e retomadas.

---

### 6.5. Efeito dos Parâmetros e Entradas Inválidas

#### Comparação entre $\beta = 0$ e $\beta = 2$ (5 execuções com sementes 1, 2, 3, 4 e 5)
Mantendo os demais parâmetros da seção 6.4:

| Semente | Melhor Distância ($\beta = 0$) | Atingiu Ótimo (14)? | Melhor Distância ($\beta = 2$) | Atingiu Ótimo (14)? |
| :---: | :---: | :---: | :---: | :---: |
| 1 | 14,0000 | Sim | 14,0000 | Sim |
| 2 | 14,0000 | Sim | 14,0000 | Sim |
| 3 | 14,0000 | Sim | 14,0000 | Sim |
| 4 | 14,0000 | Sim | 14,0000 | Sim |
| 5 | 14,0000 | Sim | 14,0000 | Sim |
| **Média** | **14,0000** | **5 / 5 (100%)** | **14,0000** | **5 / 5 (100%)** |

- **Interpretação:**
  Nesta instância de referência pequena (4 vértices), existem apenas 6 rotas possíveis no total e duas delas são ótimas ($L = 14$). Com 10 formigas ao longo de 30 iterações (300 rotas geradas por execução), a taxa de encontro do ótimo foi de 100% em ambas as configurações.
  A principal diferença teórica entre as configurações reside na velocidade de convergência inicial: com $\beta = 2$, a atratividade heurística ($1/d^2$) favorece escolhas de menor distância logo na primeira iteração (por exemplo, probabilidade de 52% para aresta de distância 3 contra 18,7% para aresta diagonal de distância 5), enquanto com $\beta = 0$ as probabilidades na iteração 1 são perfeitamente uniformes (33,3% para cada candidato), dependendo exclusivamente do reforço positivo de feromônio depositado nas iterações seguintes para convergir.

#### Verificação de Entradas Inválidas e Casos de Borda
- **Coordenadas duplicadas:** O sistema bloqueia a criação ou edição de vértices em coordenadas já ocupadas por outro vértice, emitindo a mensagem clara: *"Não é permitido cadastrar dois vértices nas mesmas coordenadas."*
- **Identificadores repetidos:** Tentativas de cadastrar vértices com mesmo identificador são bloqueadas com a mensagem: *"Já existe um vértice com o identificador 'X'."*
- **Limite de vértices:** Tentativas de remover vértices abaixo de 4 são impedidas (*"O número mínimo permitido é de 4 vértices."*) e de adicionar acima de 12 são bloqueadas (*"O número máximo permitido é de 12 vértices."*).
- **Campos vazios e limites numéricos:** Parâmetros fora das faixas (ex: $\rho > 90\%$, $\alpha > 5$, formigas $< 1$, etc.) são barrados com mensagens específicas.
- **Evaporação nula ($\rho = 0\%$):** Testada e validada: o feromônio anterior não é reduzido, sofrendo alteração somente através dos depósitos de formigas ou pela aplicação do piso de proteção numérica ($10^{-12}$).

