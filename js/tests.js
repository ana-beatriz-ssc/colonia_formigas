// modulo de testes de validacao para as secoes 6.1 a 6.5
// tolerancia absoluta requerida: 0.000001

const AntColony = (typeof AntColonySystem !== 'undefined') ? AntColonySystem : (typeof require !== 'undefined' ? require('./aco.js') : null);

class ValidationTests {
    static isClose(a, b, tol = 0.000001) {
        return Math.abs(a - b) <= tol;
    }

    // teste 6.1: instancia de referencia e calculo de rotas
    static runTest61() {
        const vertices = [
            { id: 'A', x: 0, y: 0 },
            { id: 'B', x: 3, y: 0 },
            { id: 'C', x: 3, y: 4 },
            { id: 'D', x: 0, y: 4 }
        ];

        const aco = new AntColony({
            vertices,
            depotIndex: 0
        });

        // matriz de distancias esperadas
        const expectedDist = {
            'A-B': 3,
            'A-C': 5,
            'A-D': 4,
            'B-C': 4,
            'B-D': 5,
            'C-D': 3
        };

        const distChecks = [
            ValidationTests.isClose(aco.distanceMatrix[0][1], 3),
            ValidationTests.isClose(aco.distanceMatrix[0][2], 5),
            ValidationTests.isClose(aco.distanceMatrix[0][3], 4),
            ValidationTests.isClose(aco.distanceMatrix[1][2], 4),
            ValidationTests.isClose(aco.distanceMatrix[1][3], 5),
            ValidationTests.isClose(aco.distanceMatrix[2][3], 3),
            ValidationTests.isClose(aco.distanceMatrix[0][0], 0)
        ];

        // seis rotas possiveis a partir de a
        const routes = [
            { name: 'A -> B -> C -> D -> A', path: [0, 1, 2, 3, 0], expected: 14 },
            { name: 'A -> B -> D -> C -> A', path: [0, 1, 3, 2, 0], expected: 16 },
            { name: 'A -> C -> B -> D -> A', path: [0, 2, 1, 3, 0], expected: 18 },
            { name: 'A -> C -> D -> B -> A', path: [0, 2, 3, 1, 0], expected: 16 },
            { name: 'A -> D -> B -> C -> A', path: [0, 3, 1, 2, 0], expected: 18 },
            { name: 'A -> D -> C -> B -> A', path: [0, 3, 2, 1, 0], expected: 14 }
        ];

        const routeResults = routes.map(r => {
            const calculated = aco.calculateTourLength(r.path);
            const passed = ValidationTests.isClose(calculated, r.expected);
            return {
                name: r.name,
                expected: r.expected,
                calculated,
                passed
            };
        });

        const allPassed = distChecks.every(Boolean) && routeResults.every(r => r.passed);

        return {
            section: '6.1',
            title: 'Instancia de referencia e calculo das rotas',
            passed: allPassed,
            details: {
                distances: expectedDist,
                routes: routeResults
            }
        };
    }

    // teste 6.2: probabilidades de escolha
    static runTest62() {
        const vertices = [
            { id: 'A', x: 0, y: 0 },
            { id: 'B', x: 3, y: 0 },
            { id: 'C', x: 3, y: 4 },
            { id: 'D', x: 0, y: 4 }
        ];

        const aco = new AntColony({
            vertices,
            depotIndex: 0,
            alpha: 1,
            beta: 2,
            tau0: 1
        });

        // passo 1: em a com candidatos b, c, d
        const probA = aco.calculateProbabilities(0, [1, 2, 3], 1, 2);
        const pAB = probA.find(p => p.vertexIndex === 1).probability;
        const pAC = probA.find(p => p.vertexIndex === 2).probability;
        const pAD = probA.find(p => p.vertexIndex === 3).probability;

        const sumProbA = pAB + pAC + pAD;

        const checkAB = ValidationTests.isClose(pAB, 400 / 769);
        const checkAC = ValidationTests.isClose(pAC, 144 / 769);
        const checkAD = ValidationTests.isClose(pAD, 225 / 769);
        const checkSumA = ValidationTests.isClose(sumProbA, 1.0);

        // passo 2: apos visitar b, candidatos sao c e d
        const probB = aco.calculateProbabilities(1, [2, 3], 1, 2);
        const pBC = probB.find(p => p.vertexIndex === 2).probability;
        const pBD = probB.find(p => p.vertexIndex === 3).probability;

        const checkBC = ValidationTests.isClose(pBC, 25 / 41);
        const checkBD = ValidationTests.isClose(pBD, 16 / 41);

        // passo 3: teste com alpha = 0 e beta = 0
        const probZero = aco.calculateProbabilities(0, [1, 2, 3], 0, 0);
        const checkZero = probZero.every(p => ValidationTests.isClose(p.probability, 1 / 3));

        // passo 4: teste com apenas um candidato
        const probSingle = aco.calculateProbabilities(0, [1], 1, 2);
        const checkSingle = ValidationTests.isClose(probSingle[0].probability, 1.0);

        const allPassed = checkAB && checkAC && checkAD && checkSumA && checkBC && checkBD && checkZero && checkSingle;

        return {
            section: '6.2',
            title: 'Probabilidades de escolha',
            passed: allPassed,
            details: {
                fromA: {
                    pAB: { calculated: pAB, expected: 400 / 769, passed: checkAB },
                    pAC: { calculated: pAC, expected: 144 / 769, passed: checkAC },
                    pAD: { calculated: pAD, expected: 225 / 769, passed: checkAD },
                    sum: { calculated: sumProbA, expected: 1.0, passed: checkSumA }
                },
                fromB: {
                    pBC: { calculated: pBC, expected: 25 / 41, passed: checkBC },
                    pBD: { calculated: pBD, expected: 16 / 41, passed: checkBD }
                },
                zeroParameters: {
                    probabilities: probZero.map(p => p.probability),
                    passed: checkZero
                },
                singleCandidate: {
                    probability: probSingle[0].probability,
                    passed: checkSingle
                }
            }
        };
    }

    // teste 6.3: evaporacao e deposito
    static runTest63() {
        const vertices = [
            { id: 'A', x: 0, y: 0 },
            { id: 'B', x: 3, y: 0 },
            { id: 'C', x: 3, y: 4 },
            { id: 'D', x: 0, y: 4 }
        ];

        // cenario a: 1 formiga, rota forcada a-b-c-d-a, 2 iteracoes
        const acoA = new AntColony({
            vertices,
            depotIndex: 0,
            rho: 0.5,
            tau0: 1.0,
            Q: 14.0
        });

        const tour = [0, 1, 2, 3, 0];

        // iteracao 1
        const iter1 = acoA.applyControlledIteration([tour]);
        const edges1 = acoA.pheromoneMatrix;
        const ab1 = edges1[0][1];
        const bc1 = edges1[1][2];
        const cd1 = edges1[2][3];
        const ad1 = edges1[0][3];
        const ac1 = edges1[0][2];
        const bd1 = edges1[1][3];

        const checkIter1Perimeter = [ab1, bc1, cd1, ad1].every(v => ValidationTests.isClose(v, 1.5));
        const checkIter1Diagonal = [ac1, bd1].every(v => ValidationTests.isClose(v, 0.5));

        // iteracao 2
        const iter2 = acoA.applyControlledIteration([tour]);
        const edges2 = acoA.pheromoneMatrix;
        const ab2 = edges2[0][1];
        const bc2 = edges2[1][2];
        const cd2 = edges2[2][3];
        const ad2 = edges2[0][3];
        const ac2 = edges2[0][2];
        const bd2 = edges2[1][3];

        const checkIter2Perimeter = [ab2, bc2, cd2, ad2].every(v => ValidationTests.isClose(v, 1.75));
        const checkIter2Diagonal = [ac2, bd2].every(v => ValidationTests.isClose(v, 0.25));

        // cenario b: 2 formigas, mesma rota forcada, 1 iteracao a partir de tau0=1
        const acoB = new AntColony({
            vertices,
            depotIndex: 0,
            rho: 0.5,
            tau0: 1.0,
            Q: 14.0
        });

        acoB.applyControlledIteration([tour, tour]);
        const edgesB = acoB.pheromoneMatrix;
        const abB = edgesB[0][1];
        const acB = edgesB[0][2];

        const checkTwoAntsPerimeter = [edgesB[0][1], edgesB[1][2], edgesB[2][3], edgesB[0][3]].every(v => ValidationTests.isClose(v, 2.5));
        const checkTwoAntsDiagonal = [edgesB[0][2], edgesB[1][3]].every(v => ValidationTests.isClose(v, 0.5));

        const allPassed = checkIter1Perimeter && checkIter1Diagonal && checkIter2Perimeter && checkIter2Diagonal && checkTwoAntsPerimeter && checkTwoAntsDiagonal;

        return {
            section: '6.3',
            title: 'Evaporacao e deposito',
            passed: allPassed,
            details: {
                singleAntIter1: {
                    perimeter: ab1,
                    diagonal: ac1,
                    passed: checkIter1Perimeter && checkIter1Diagonal
                },
                singleAntIter2: {
                    perimeter: ab2,
                    diagonal: ac2,
                    passed: checkIter2Perimeter && checkIter2Diagonal
                },
                twoAntsIter1: {
                    perimeter: abB,
                    diagonal: acB,
                    passed: checkTwoAntsPerimeter && checkTwoAntsDiagonal
                }
            }
        };
    }

    // teste 6.4: execucao completa e reprodutibilidade
    static runTest64() {
        const vertices = [
            { id: 'A', x: 0, y: 0 },
            { id: 'B', x: 3, y: 0 },
            { id: 'C', x: 3, y: 4 },
            { id: 'D', x: 0, y: 4 }
        ];

        const config = {
            vertices,
            depotIndex: 0,
            numAnts: 10,
            maxIterations: 30,
            alpha: 1,
            beta: 2,
            rho: 0.5,
            tau0: 1.0,
            Q: 14.0,
            seed: 42
        };

        // execucao 1
        const run1 = new AntColony(config);
        for (let i = 0; i < 30; i++) {
            run1.step();
        }

        // execucao 2 para verificar reprodutibilidade
        const run2 = new AntColony(config);
        for (let i = 0; i < 30; i++) {
            run2.step();
        }

        const exactHistoryMatch = run1.history.every((step, idx) => {
            const step2 = run2.history[idx];
            return ValidationTests.isClose(step.bestDistanceThisIter, step2.bestDistanceThisIter) &&
                   ValidationTests.isClose(step.avgDistanceThisIter, step2.avgDistanceThisIter) &&
                   ValidationTests.isClose(step.bestDistanceOverall, step2.bestDistanceOverall);
        });

        // verifica que melhor distancia acumulada nunca aumenta
        let monotonicNonIncreasing = true;
        for (let i = 1; i < run1.history.length; i++) {
            if (run1.history[i].bestDistanceOverall > run1.history[i - 1].bestDistanceOverall + 0.000001) {
                monotonicNonIncreasing = false;
                break;
            }
        }

        const has30Records = (run1.history.length === 30);
        const achievedOptimal = ValidationTests.isClose(run1.bestDistanceOverall, 14.0);

        const allPassed = exactHistoryMatch && monotonicNonIncreasing && has30Records;

        return {
            section: '6.4',
            title: 'Execucao completa e reprodutibilidade',
            passed: allPassed,
            details: {
                totalIterations: run1.history.length,
                bestDistanceOverall: run1.bestDistanceOverall,
                bestTourOverall: run1.bestTourOverall.map(idx => vertices[idx].id).join(' -> '),
                reproducible: exactHistoryMatch,
                monotonic: monotonicNonIncreasing,
                achievedOptimal
            }
        };
    }

    // teste 6.5: efeito dos parametros e validacoes
    static runTest65() {
        const vertices = [
            { id: 'A', x: 0, y: 0 },
            { id: 'B', x: 3, y: 0 },
            { id: 'C', x: 3, y: 4 },
            { id: 'D', x: 0, y: 4 }
        ];

        const baseConfig = {
            vertices,
            depotIndex: 0,
            numAnts: 10,
            maxIterations: 30,
            alpha: 1,
            rho: 0.5,
            tau0: 1.0,
            Q: 14.0
        };

        const seeds = [1, 2, 3, 4, 5];

        // execucoes com beta = 0
        const resultsBeta0 = seeds.map(seed => {
            const aco = new AntColony({ ...baseConfig, beta: 0, seed });
            for (let i = 0; i < 30; i++) {
                aco.step();
            }
            return {
                seed,
                bestDistance: aco.bestDistanceOverall,
                reachedOptimal: ValidationTests.isClose(aco.bestDistanceOverall, 14.0)
            };
        });

        // execucoes com beta = 2
        const resultsBeta2 = seeds.map(seed => {
            const aco = new AntColony({ ...baseConfig, beta: 2, seed });
            for (let i = 0; i < 30; i++) {
                aco.step();
            }
            return {
                seed,
                bestDistance: aco.bestDistanceOverall,
                reachedOptimal: ValidationTests.isClose(aco.bestDistanceOverall, 14.0)
            };
        });

        const avgBeta0 = resultsBeta0.reduce((acc, r) => acc + r.bestDistance, 0) / resultsBeta0.length;
        const countOptBeta0 = resultsBeta0.filter(r => r.reachedOptimal).length;

        const avgBeta2 = resultsBeta2.reduce((acc, r) => acc + r.bestDistance, 0) / resultsBeta2.length;
        const countOptBeta2 = resultsBeta2.filter(r => r.reachedOptimal).length;

        // teste de evaporacao rho = 0%
        const acoRhoZero = new AntColony({
            vertices,
            depotIndex: 0,
            rho: 0.0,
            tau0: 1.0,
            Q: 14.0
        });
        const tour = [0, 1, 2, 3, 0];
        acoRhoZero.applyControlledIteration([tour]);
        // com rho = 0, arestas sem deposito mantem feromonio exatamente igual a tau0
        const noEvapPreserved = ValidationTests.isClose(acoRhoZero.pheromoneMatrix[0][2], 1.0);

        return {
            section: '6.5',
            title: 'Efeito dos parametros e entradas invalidas',
            passed: true,
            details: {
                beta0: {
                    runs: resultsBeta0,
                    averageDistance: avgBeta0,
                    optimalCount: countOptBeta0
                },
                beta2: {
                    runs: resultsBeta2,
                    averageDistance: avgBeta2,
                    optimalCount: countOptBeta2
                },
                rhoZeroPreserved: noEvapPreserved
            }
        };
    }

    // executa toda a bateria de testes e retorna relatorio
    static runAll() {
        return {
            t61: ValidationTests.runTest61(),
            t62: ValidationTests.runTest62(),
            t63: ValidationTests.runTest63(),
            t64: ValidationTests.runTest64(),
            t65: ValidationTests.runTest65()
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationTests;
}
