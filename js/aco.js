// implementacao do algoritmo ant system para roteamento de entregas

class AntColonySystem {
    constructor(config = {}) {
        this.vertices = [];
        this.depotIndex = 0;
        this.numAnts = 10;
        this.maxIterations = 30;
        this.alpha = 1.0;
        this.beta = 2.0;
        this.rho = 0.5;
        this.tau0 = 1.0;
        this.Q = 14.0;
        this.seed = 42;

        this.prng = null;
        this.distanceMatrix = [];
        this.pheromoneMatrix = [];
        this.currentIteration = 0;
        this.bestTourOverall = null;
        this.bestDistanceOverall = Infinity;
        this.history = [];
        this.lastIterationLog = null;

        if (config.vertices) {
            this.init(config);
        }
    }

    // calcula distancia euclidiana entre dois vertices
    static calculateEuclideanDistance(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // inicializa ou reinicia a simulacao com os parametros fornecidos
    init(config = {}) {
        if (config.vertices) {
            this.vertices = config.vertices.map(v => ({
                id: String(v.id),
                x: Number(v.x),
                y: Number(v.y)
            }));
        }

        if (config.depotIndex !== undefined) {
            this.depotIndex = Number(config.depotIndex);
        }
        if (config.numAnts !== undefined) {
            this.numAnts = parseInt(config.numAnts, 10);
        }
        if (config.maxIterations !== undefined) {
            this.maxIterations = parseInt(config.maxIterations, 10);
        }
        if (config.alpha !== undefined) {
            this.alpha = Number(config.alpha);
        }
        if (config.beta !== undefined) {
            this.beta = Number(config.beta);
        }
        if (config.rho !== undefined) {
            this.rho = Number(config.rho);
        }
        if (config.tau0 !== undefined) {
            this.tau0 = Number(config.tau0);
        }
        if (config.Q !== undefined) {
            this.Q = Number(config.Q);
        }
        if (config.seed !== undefined) {
            this.seed = parseInt(config.seed, 10);
        }

        const n = this.vertices.length;

        // instancia o gerador com a semente configurada
        const PRNGClass = (typeof PRNG !== 'undefined') ? PRNG : (typeof require !== 'undefined' ? require('./prng.js') : null);
        this.prng = new PRNGClass(this.seed);

        // preenche matriz de distancias euclidianas
        this.distanceMatrix = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    this.distanceMatrix[i][j] = 0;
                } else {
                    this.distanceMatrix[i][j] = AntColonySystem.calculateEuclideanDistance(this.vertices[i], this.vertices[j]);
                }
            }
        }

        // inicializa matriz de feromonios com tau0 e zero na diagonal
        this.pheromoneMatrix = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    this.pheromoneMatrix[i][j] = this.tau0;
                } else {
                    this.pheromoneMatrix[i][j] = 0;
                }
            }
        }

        this.currentIteration = 0;
        this.bestTourOverall = null;
        this.bestDistanceOverall = Infinity;
        this.history = [];
        this.lastIterationLog = null;
    }

    // calcula comprimento total de uma rota incluindo retorno ao deposito
    calculateTourLength(tour) {
        let length = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            const u = tour[i];
            const v = tour[i + 1];
            length += this.distanceMatrix[u][v];
        }
        return length;
    }

    // calcula peso de transicao w(i, j) = tau^alpha * (1/d)^beta
    calculateWeight(i, j, alpha = this.alpha, beta = this.beta) {
        const tau = this.pheromoneMatrix[i][j];
        const dist = this.distanceMatrix[i][j];

        // quando alpha for zero a influencia do feromonio e neutra
        const tauFactor = (alpha === 0) ? 1.0 : Math.pow(tau, alpha);

        // quando beta for zero a influencia da distancia e neutra
        const distFactor = (beta === 0) ? 1.0 : Math.pow(1.0 / dist, beta);

        return tauFactor * distFactor;
    }

    // calcula probabilidades para os vertices candidatos nao visitados
    calculateProbabilities(currentVertex, unvisitedIndices, alpha = this.alpha, beta = this.beta) {
        if (unvisitedIndices.length === 1) {
            return [{
                vertexIndex: unvisitedIndices[0],
                weight: 1.0,
                probability: 1.0
            }];
        }

        // calcula pesos individuais
        const weights = unvisitedIndices.map(candidateIndex => {
            const w = this.calculateWeight(currentVertex, candidateIndex, alpha, beta);
            return {
                vertexIndex: candidateIndex,
                weight: w
            };
        });

        // soma dos pesos dos vertices nao visitados
        const sumWeights = weights.reduce((acc, item) => acc + item.weight, 0);

        // calcula probabilidade normalizada proporcional
        return weights.map(item => ({
            vertexIndex: item.vertexIndex,
            weight: item.weight,
            probability: sumWeights > 0 ? (item.weight / sumWeights) : (1.0 / unvisitedIndices.length)
        }));
    }

    // constroi uma rota completa para uma formiga a partir do deposito
    buildTour(trackStepLog = false) {
        const n = this.vertices.length;
        const unvisited = [];
        for (let i = 0; i < n; i++) {
            if (i !== this.depotIndex) {
                unvisited.push(i);
            }
        }

        const tour = [this.depotIndex];
        let current = this.depotIndex;
        const stepsLog = [];

        while (unvisited.length > 0) {
            const candidatesProb = this.calculateProbabilities(current, unvisited);
            const probValues = candidatesProb.map(cp => cp.probability);
            const selectedIdxInCandidates = this.prng.sample(probValues);
            const chosenCandidate = candidatesProb[selectedIdxInCandidates];
            const nextVertex = chosenCandidate.vertexIndex;

            if (trackStepLog) {
                stepsLog.push({
                    currentVertex: current,
                    candidates: candidatesProb.map(cp => ({
                        vertexIndex: cp.vertexIndex,
                        vertexId: this.vertices[cp.vertexIndex].id,
                        distance: this.distanceMatrix[current][cp.vertexIndex],
                        pheromone: this.pheromoneMatrix[current][cp.vertexIndex],
                        weight: cp.weight,
                        probability: cp.probability
                    })),
                    chosenVertex: nextVertex,
                    chosenVertexId: this.vertices[nextVertex].id
                });
            }

            tour.push(nextVertex);
            const removeIdx = unvisited.indexOf(nextVertex);
            unvisited.splice(removeIdx, 1);
            current = nextVertex;
        }

        // retorno obrigatorio ao deposito
        tour.push(this.depotIndex);

        if (trackStepLog) {
            stepsLog.push({
                currentVertex: current,
                returnToDepot: true,
                chosenVertex: this.depotIndex,
                chosenVertexId: this.vertices[this.depotIndex].id,
                distance: this.distanceMatrix[current][this.depotIndex],
                pheromone: this.pheromoneMatrix[current][this.depotIndex]
            });
        }

        const length = this.calculateTourLength(tour);

        return {
            tour,
            length,
            stepsLog
        };
    }

    // executa uma iteracao completa do ant system
    step() {
        if (this.currentIteration >= this.maxIterations) {
            return false;
        }

        const n = this.vertices.length;
        const antTours = [];

        // todas as formigas constroem rotas usando o feromonio atual
        for (let k = 0; k < this.numAnts; k++) {
            const trackThisAnt = (k === 0);
            const result = this.buildTour(trackThisAnt);
            antTours.push(result);
        }

        // calcula metricas da iteracao
        let bestDistanceThisIter = Infinity;
        let bestTourThisIter = null;
        let sumDistances = 0;

        for (let k = 0; k < antTours.length; k++) {
            const len = antTours[k].length;
            sumDistances += len;
            if (len < bestDistanceThisIter) {
                bestDistanceThisIter = len;
                bestTourThisIter = antTours[k].tour.slice();
            }
        }

        const avgDistanceThisIter = sumDistances / antTours.length;

        // atualiza melhor rota acumulada
        if (bestDistanceThisIter < this.bestDistanceOverall) {
            this.bestDistanceOverall = bestDistanceThisIter;
            this.bestTourOverall = bestTourThisIter.slice();
        }

        // matriz temporaria para somar depositos delta tau de todas as formigas
        const depositMatrix = Array.from({ length: n }, () => Array(n).fill(0));

        for (let k = 0; k < antTours.length; k++) {
            const tour = antTours[k].tour;
            const deltaTau = this.Q / antTours[k].length;

            for (let s = 0; s < tour.length - 1; s++) {
                const u = tour[s];
                const v = tour[s + 1];
                // grafo nao direcionado: mantem simetria sem contar duas vezes
                depositMatrix[u][v] += deltaTau;
                depositMatrix[v][u] += deltaTau;
            }
        }

        // registro detalhado de atualizacao por aresta
        const edgeUpdates = [];
        const nextPheromoneMatrix = Array.from({ length: n }, () => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const tauBefore = this.pheromoneMatrix[i][j];
                const tauAfterEvap = (1.0 - this.rho) * tauBefore;
                const totalDeposit = depositMatrix[i][j];
                let tauFinal = tauAfterEvap + totalDeposit;

                // piso numerico de seguranca contra zeros numericos
                if (tauFinal < 1e-12) {
                    tauFinal = 1e-12;
                }

                nextPheromoneMatrix[i][j] = tauFinal;
                nextPheromoneMatrix[j][i] = tauFinal;

                edgeUpdates.push({
                    u: i,
                    v: j,
                    idU: this.vertices[i].id,
                    idV: this.vertices[j].id,
                    distance: this.distanceMatrix[i][j],
                    tauBefore,
                    tauAfterEvap,
                    totalDeposit,
                    tauFinal
                });
            }
        }

        // atualiza matriz de feromonio da instancia
        this.pheromoneMatrix = nextPheromoneMatrix;
        this.currentIteration += 1;

        // monta dados do log da iteracao
        const iterationData = {
            iteration: this.currentIteration,
            bestDistanceThisIter,
            bestTourThisIter,
            bestTourThisIterIds: bestTourThisIter.map(idx => this.vertices[idx].id),
            avgDistanceThisIter,
            bestDistanceOverall: this.bestDistanceOverall,
            bestTourOverall: this.bestTourOverall.slice(),
            bestTourOverallIds: this.bestTourOverall.map(idx => this.vertices[idx].id),
            firstAntLog: antTours[0].stepsLog,
            allAntLengths: antTours.map((a, idx) => ({ antIndex: idx + 1, length: a.length })),
            edgeUpdates
        };

        this.history.push(iterationData);
        this.lastIterationLog = iterationData;

        return true;
    }

    // executa teste controlado de evaporacao e deposito com rotas fixadas
    // util para a secao 6.3 de validacao
    applyControlledIteration(fixedTours) {
        const n = this.vertices.length;
        const depositMatrix = Array.from({ length: n }, () => Array(n).fill(0));
        const edgeUpdates = [];
        const nextPheromoneMatrix = Array.from({ length: n }, () => Array(n).fill(0));

        for (let k = 0; k < fixedTours.length; k++) {
            const tour = fixedTours[k];
            const length = this.calculateTourLength(tour);
            const deltaTau = this.Q / length;

            for (let s = 0; s < tour.length - 1; s++) {
                const u = tour[s];
                const v = tour[s + 1];
                depositMatrix[u][v] += deltaTau;
                depositMatrix[v][u] += deltaTau;
            }
        }

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const tauBefore = this.pheromoneMatrix[i][j];
                const tauAfterEvap = (1.0 - this.rho) * tauBefore;
                const totalDeposit = depositMatrix[i][j];
                let tauFinal = tauAfterEvap + totalDeposit;

                if (tauFinal < 1e-12) {
                    tauFinal = 1e-12;
                }

                nextPheromoneMatrix[i][j] = tauFinal;
                nextPheromoneMatrix[j][i] = tauFinal;

                edgeUpdates.push({
                    u: i,
                    v: j,
                    idU: this.vertices[i].id,
                    idV: this.vertices[j].id,
                    distance: this.distanceMatrix[i][j],
                    tauBefore,
                    tauAfterEvap,
                    totalDeposit,
                    tauFinal
                });
            }
        }

        this.pheromoneMatrix = nextPheromoneMatrix;
        this.currentIteration += 1;

        return {
            iteration: this.currentIteration,
            edgeUpdates
        };
    }
}

// exportacao para ambiente de navegador ou nodejs
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AntColonySystem;
}
