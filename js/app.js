// controlador principal da aplicacao e manipulacao de interface

// estado inicial padrao com 5 vertices
const DEFAULT_PRESET_5 = [
    { id: 'A', x: 200, y: 200 },
    { id: 'B', x: 800, y: 200 },
    { id: 'C', x: 800, y: 700 },
    { id: 'D', x: 200, y: 700 },
    { id: 'E', x: 500, y: 450 }
];

// instancia de referencia da secao 6.1
const REFERENCE_PRESET_4 = [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 3, y: 0 },
    { id: 'C', x: 3, y: 4 },
    { id: 'D', x: 0, y: 4 }
];

class App {
    constructor() {
        this.vertices = JSON.parse(JSON.stringify(DEFAULT_PRESET_5));
        this.depotIndex = 0;
        this.aco = null;
        this.isRunning = false;
        this.animationTimer = null;
        this.speedMs = 300;

        // cache de elementos do dom
        this.dom = {
            simulationSection: document.getElementById('simulation-section'),
            vertexCountBadge: document.getElementById('vertex-count-badge'),
            verticesTableBody: document.getElementById('vertices-table-body'),
            newVertexId: document.getElementById('new-vertex-id'),
            newVertexX: document.getElementById('new-vertex-x'),
            newVertexY: document.getElementById('new-vertex-y'),
            btnAddVertex: document.getElementById('btn-add-vertex'),
            btnLoadPreset5: document.getElementById('btn-load-preset-5'),
            btnLoadPresetRef: document.getElementById('btn-load-preset-ref'),
            selectDepot: document.getElementById('select-depot'),
            inputAnts: document.getElementById('input-ants'),
            inputIterations: document.getElementById('input-iterations'),
            inputAlpha: document.getElementById('input-alpha'),
            inputBeta: document.getElementById('input-beta'),
            inputRho: document.getElementById('input-rho'),
            inputTau0: document.getElementById('input-tau0'),
            inputQ: document.getElementById('input-q'),
            inputSeed: document.getElementById('input-seed'),
            inputSpeed: document.getElementById('input-speed'),
            speedLabel: document.getElementById('speed-label'),
            validationMessage: document.getElementById('validation-message'),
            btnRun: document.getElementById('btn-run'),
            btnPause: document.getElementById('btn-pause'),
            btnStep: document.getElementById('btn-step'),
            btnReset: document.getElementById('btn-reset'),
            metricCurrentIteration: document.getElementById('metric-current-iteration'),
            metricMaxIteration: document.getElementById('metric-max-iteration'),
            metricBestIter: document.getElementById('metric-best-iter'),
            metricAvgIter: document.getElementById('metric-avg-iter'),
            metricBestOverall: document.getElementById('metric-best-overall'),
            routeBestOverallSeq: document.getElementById('route-best-overall-seq'),
            routeBestIterSeq: document.getElementById('route-best-iter-seq'),
            scaleInfo: document.getElementById('scale-info'),
            graphCanvas: document.getElementById('graph-canvas'),
            toggleBestOverall: document.getElementById('toggle-best-overall'),
            toggleBestIter: document.getElementById('toggle-best-iter'),
            toggleEdgeLabels: document.getElementById('toggle-edge-labels'),
            selectEdgeU: document.getElementById('select-edge-u'),
            selectEdgeV: document.getElementById('select-edge-v'),
            edgeQueryResult: document.getElementById('edge-query-result'),
            antStepLogContainer: document.getElementById('ant-step-log-container'),
            edgeUpdatesTableBody: document.getElementById('edge-updates-table-body'),
            historyTableBody: document.getElementById('history-table-body')
        };

        this.ctx = this.dom.graphCanvas.getContext('2d');
        this.hoveredEdge = null;
        this.hoveredVertex = null;

        this.initEventListeners();
        this.renderVerticesTable();
        this.updateDepotSelect();
        this.updateEdgeQuerySelects();
        this.resetSimulation();
    }

    // configura todos os ouvintes de eventos da interface
    initEventListeners() {
        this.dom.btnAddVertex.addEventListener('click', () => this.handleAddVertex());
        this.dom.btnLoadPreset5.addEventListener('click', () => this.loadPreset(DEFAULT_PRESET_5, 0));
        this.dom.btnLoadPresetRef.addEventListener('click', () => this.loadPreset(REFERENCE_PRESET_4, 0));

        this.dom.btnRun.addEventListener('click', () => this.startExecution());
        this.dom.btnPause.addEventListener('click', () => this.pauseExecution());
        this.dom.btnStep.addEventListener('click', () => this.stepExecution());
        this.dom.btnReset.addEventListener('click', () => this.resetSimulation());

        this.dom.inputSpeed.addEventListener('input', (e) => {
            this.speedMs = parseInt(e.target.value, 10);
            this.dom.speedLabel.textContent = `${this.speedMs} ms`;
        });

        // alteracoes em parametros exigem reinicio da simulacao
        const paramInputs = [
            this.dom.selectDepot,
            this.dom.inputAnts,
            this.dom.inputIterations,
            this.dom.inputAlpha,
            this.dom.inputBeta,
            this.dom.inputRho,
            this.dom.inputTau0,
            this.dom.inputQ,
            this.dom.inputSeed
        ];

        paramInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.handleParameterChange();
            });
        });

        this.dom.toggleBestOverall.addEventListener('change', () => this.drawGraph());
        this.dom.toggleBestIter.addEventListener('change', () => this.drawGraph());
        this.dom.toggleEdgeLabels.addEventListener('change', () => this.drawGraph());

        this.dom.selectEdgeU.addEventListener('change', () => this.updateEdgeQueryResult());
        this.dom.selectEdgeV.addEventListener('change', () => this.updateEdgeQueryResult());

        this.dom.graphCanvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.dom.graphCanvas.addEventListener('mouseleave', () => {
            this.hoveredEdge = null;
            this.hoveredVertex = null;
            this.drawGraph();
        });

        window.addEventListener('resize', () => this.drawGraph());
    }

    // exibe mensagem de erro ou alerta de validacao
    showValidationMessage(msg) {
        if (!msg) {
            this.dom.validationMessage.style.display = 'none';
            this.dom.validationMessage.textContent = '';
        } else {
            this.dom.validationMessage.style.display = 'block';
            this.dom.validationMessage.textContent = msg;
        }
    }

    // le e valida parametros do formulario
    validateParameters() {
        const ants = parseInt(this.dom.inputAnts.value, 10);
        const iterations = parseInt(this.dom.inputIterations.value, 10);
        const alpha = parseFloat(this.dom.inputAlpha.value);
        const beta = parseFloat(this.dom.inputBeta.value);
        const rhoPercent = parseFloat(this.dom.inputRho.value);
        const tau0 = parseFloat(this.dom.inputTau0.value);
        const q = parseFloat(this.dom.inputQ.value);
        const seedStr = this.dom.inputSeed.value.trim();

        if (isNaN(ants) || ants < 1 || ants > 100) {
            this.showValidationMessage('O número de formigas deve ser um inteiro entre 1 e 100.');
            return null;
        }

        if (isNaN(iterations) || iterations < 1 || iterations > 200) {
            this.showValidationMessage('O número de iterações deve ser um inteiro entre 1 e 200.');
            return null;
        }

        if (isNaN(alpha) || alpha < 0 || alpha > 5) {
            this.showValidationMessage('O parâmetro alfa (α) deve ser um número entre 0 e 5.');
            return null;
        }

        if (isNaN(beta) || beta < 0 || beta > 5) {
            this.showValidationMessage('O parâmetro beta (β) deve ser um número entre 0 e 5.');
            return null;
        }

        if (isNaN(rhoPercent) || rhoPercent < 0 || rhoPercent > 90) {
            this.showValidationMessage('A taxa de evaporação (ρ) deve ser entre 0% e 90%.');
            return null;
        }

        if (isNaN(tau0) || tau0 < 0.01 || tau0 > 100) {
            this.showValidationMessage('O feromônio inicial (τ₀) deve ser entre 0,01 e 100.');
            return null;
        }

        if (isNaN(q) || q < 0.01 || q > 10000) {
            this.showValidationMessage('A constante de depósito (Q) deve ser entre 0,01 e 10.000.');
            return null;
        }

        if (seedStr === '' || isNaN(parseInt(seedStr, 10))) {
            this.showValidationMessage('A semente aleatória deve ser um número inteiro válido.');
            return null;
        }

        if (this.vertices.length < 4 || this.vertices.length > 12) {
            this.showValidationMessage('A quantidade de vértices deve ser mantida entre 4 e 12.');
            return null;
        }

        const depotIdx = parseInt(this.dom.selectDepot.value, 10);
        if (isNaN(depotIdx) || depotIdx < 0 || depotIdx >= this.vertices.length) {
            this.showValidationMessage('Selecione um depósito válido cadastrado.');
            return null;
        }

        this.showValidationMessage('');

        return {
            vertices: this.vertices,
            depotIndex: depotIdx,
            numAnts: ants,
            maxIterations: iterations,
            alpha: alpha,
            beta: beta,
            rho: rhoPercent / 100.0,
            tau0: tau0,
            Q: q,
            seed: parseInt(seedStr, 10)
        };
    }

    // trata adicao de novo vertice com validacoes
    handleAddVertex() {
        const id = this.dom.newVertexId.value.trim().toUpperCase();
        const xStr = this.dom.newVertexX.value.trim();
        const yStr = this.dom.newVertexY.value.trim();

        if (!id) {
            this.showValidationMessage('Informe um identificador único para o vértice.');
            return;
        }

        if (this.vertices.some(v => v.id.toUpperCase() === id)) {
            this.showValidationMessage(`Já existe um vértice com o identificador "${id}".`);
            return;
        }

        if (this.vertices.length >= 12) {
            this.showValidationMessage('O número máximo permitido é de 12 vértices.');
            return;
        }

        if (xStr === '' || yStr === '') {
            this.showValidationMessage('Informe coordenadas X e Y.');
            return;
        }

        const x = parseFloat(xStr);
        const y = parseFloat(yStr);

        if (isNaN(x) || x < 0 || x > 1000) {
            this.showValidationMessage('A coordenada X deve ser finita e estar entre 0 e 1.000.');
            return;
        }

        if (isNaN(y) || y < 0 || y > 1000) {
            this.showValidationMessage('A coordenada Y deve ser finita e estar entre 0 e 1.000.');
            return;
        }

        const roundedX = Math.round(x * 100) / 100;
        const roundedY = Math.round(y * 100) / 100;

        // nao permite dois vertices nas mesmas coordenadas
        const duplicateCoord = this.vertices.some(v => Math.abs(v.x - roundedX) < 0.0001 && Math.abs(v.y - roundedY) < 0.0001);
        if (duplicateCoord) {
            this.showValidationMessage('Não é permitido cadastrar dois vértices nas mesmas coordenadas.');
            return;
        }

        this.vertices.push({
            id: id,
            x: roundedX,
            y: roundedY
        });

        this.dom.newVertexId.value = '';
        this.dom.newVertexX.value = '';
        this.dom.newVertexY.value = '';

        this.renderVerticesTable();
        this.updateDepotSelect();
        this.updateEdgeQuerySelects();
        this.resetSimulation();
    }

    // remove vertice com validacao de minimo 4
    handleRemoveVertex(index) {
        if (this.vertices.length <= 4) {
            this.showValidationMessage('O número mínimo permitido é de 4 vértices.');
            return;
        }

        const removedDepot = (this.depotIndex === index);
        this.vertices.splice(index, 1);

        if (removedDepot || this.depotIndex >= this.vertices.length) {
            this.depotIndex = 0;
        } else if (this.depotIndex > index) {
            this.depotIndex -= 1;
        }

        this.renderVerticesTable();
        this.updateDepotSelect();
        this.updateEdgeQuerySelects();
        this.resetSimulation();
    }

    // edita coordenada de vertice diretamente na tabela
    handleEditVertex(index, field, value) {
        const val = parseFloat(value);
        if (isNaN(val) || val < 0 || val > 1000) {
            this.showValidationMessage('As coordenadas devem ser números entre 0 e 1.000.');
            this.renderVerticesTable();
            return;
        }

        const rounded = Math.round(val * 100) / 100;

        // checa duplicidade com outros vertices
        for (let i = 0; i < this.vertices.length; i++) {
            if (i === index) continue;
            const other = this.vertices[i];
            const checkX = (field === 'x') ? rounded : this.vertices[index].x;
            const checkY = (field === 'y') ? rounded : this.vertices[index].y;
            if (Math.abs(other.x - checkX) < 0.0001 && Math.abs(other.y - checkY) < 0.0001) {
                this.showValidationMessage('Não é permitido dois vértices nas mesmas coordenadas.');
                this.renderVerticesTable();
                return;
            }
        }

        this.vertices[index][field] = rounded;
        this.renderVerticesTable();
        this.updateEdgeQuerySelects();
        this.resetSimulation();
    }

    // carrega cenario predefinido
    loadPreset(presetVertices, depotIdx = 0) {
        this.pauseExecution();
        this.vertices = JSON.parse(JSON.stringify(presetVertices));
        this.depotIndex = depotIdx;
        this.renderVerticesTable();
        this.updateDepotSelect();
        this.updateEdgeQuerySelects();
        this.resetSimulation();
    }

    // renderiza tabela de vertices com campos de edicao
    renderVerticesTable() {
        this.dom.verticesTableBody.innerHTML = '';
        if (this.dom.vertexCountBadge) {
            this.dom.vertexCountBadge.textContent = `${this.vertices.length} / 12`;
        }

        this.vertices.forEach((v, idx) => {
            const tr = document.createElement('tr');

            const tdId = document.createElement('td');
            tdId.textContent = v.id;
            if (idx === this.depotIndex) {
                tdId.innerHTML += ' <strong style="color: #dc2626;">(Depósito)</strong>';
            }

            const tdX = document.createElement('td');
            const inputX = document.createElement('input');
            inputX.type = 'number';
            inputX.min = '0';
            inputX.max = '1000';
            inputX.step = '0.01';
            inputX.value = v.x.toFixed(2);
            inputX.addEventListener('change', (e) => this.handleEditVertex(idx, 'x', e.target.value));
            tdX.appendChild(inputX);

            const tdY = document.createElement('td');
            const inputY = document.createElement('input');
            inputY.type = 'number';
            inputY.min = '0';
            inputY.max = '1000';
            inputY.step = '0.01';
            inputY.value = v.y.toFixed(2);
            inputY.addEventListener('change', (e) => this.handleEditVertex(idx, 'y', e.target.value));
            tdY.appendChild(inputY);

            const tdActions = document.createElement('td');
            const btnRemove = document.createElement('button');
            btnRemove.type = 'button';
            btnRemove.className = 'btn btn-danger btn-small';
            btnRemove.textContent = 'Remover';
            btnRemove.disabled = (this.vertices.length <= 4);
            btnRemove.addEventListener('click', () => this.handleRemoveVertex(idx));
            tdActions.appendChild(btnRemove);

            tr.appendChild(tdId);
            tr.appendChild(tdX);
            tr.appendChild(tdY);
            tr.appendChild(tdActions);

            this.dom.verticesTableBody.appendChild(tr);
        });
    }

    // atualiza seletor de deposito
    updateDepotSelect() {
        this.dom.selectDepot.innerHTML = '';
        this.vertices.forEach((v, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = `${v.id} (${v.x.toFixed(2)}, ${v.y.toFixed(2)})`;
            if (idx === this.depotIndex) {
                option.selected = true;
            }
            this.dom.selectDepot.appendChild(option);
        });
    }

    // atualiza seletores para consulta de arestas
    updateEdgeQuerySelects() {
        this.dom.selectEdgeU.innerHTML = '';
        this.dom.selectEdgeV.innerHTML = '';

        this.vertices.forEach((v, idx) => {
            const optU = document.createElement('option');
            optU.value = idx;
            optU.textContent = v.id;
            this.dom.selectEdgeU.appendChild(optU);

            const optV = document.createElement('option');
            optV.value = idx;
            optV.textContent = v.id;
            this.dom.selectEdgeV.appendChild(optV);
        });

        if (this.vertices.length > 1) {
            this.dom.selectEdgeU.selectedIndex = 0;
            this.dom.selectEdgeV.selectedIndex = 1;
        }

        this.updateEdgeQueryResult();
    }

    // exibe o resultado da consulta de aresta selecionada
    updateEdgeQueryResult() {
        if (!this.aco) return;
        const u = parseInt(this.dom.selectEdgeU.value, 10);
        const v = parseInt(this.dom.selectEdgeV.value, 10);

        if (isNaN(u) || isNaN(v) || u === v) {
            this.dom.edgeQueryResult.textContent = 'Selecione dois vértices distintos.';
            return;
        }

        const dist = this.aco.distanceMatrix[u][v];
        const tau = this.aco.pheromoneMatrix[u][v];
        const weight = this.aco.calculateWeight(u, v);

        this.dom.edgeQueryResult.innerHTML = `
            <strong>Aresta ${this.vertices[u].id} - ${this.vertices[v].id}:</strong>&nbsp;
            Distância fixa d = ${dist.toFixed(4)} | 
            Feromônio atual τ = ${tau.toFixed(6)} | 
            Peso w = ${weight.toFixed(6)}
        `;
    }

    // trata alteracoes de parametros exigindo reinicio
    handleParameterChange() {
        const config = this.validateParameters();
        if (!config) return;
        this.depotIndex = config.depotIndex;
        this.renderVerticesTable();
        this.resetSimulation();
    }

    // reinicia a simulacao restaurando estado inicial (iteracao 0)
    resetSimulation() {
        this.pauseExecution();
        const config = this.validateParameters();
        if (!config) return;

        this.aco = new AntColonySystem(config);

        // estado inicial: iteracao 0, feromonio tau0, sem rota calculada
        this.dom.metricCurrentIteration.textContent = '0';
        this.dom.metricMaxIteration.textContent = `de ${this.aco.maxIterations}`;
        this.dom.metricBestIter.textContent = 'ainda não calculada';
        this.dom.metricAvgIter.textContent = 'ainda não calculada';
        this.dom.metricBestOverall.textContent = 'ainda não calculada';

        this.dom.routeBestOverallSeq.textContent = 'Nenhuma rota calculada ainda';
        this.dom.routeBestIterSeq.textContent = 'Nenhuma rota calculada ainda';

        this.dom.btnRun.disabled = false;
        this.dom.btnPause.disabled = true;
        this.dom.btnStep.disabled = false;

        this.dom.antStepLogContainer.innerHTML = '<p class="hint-text">Inicie a simulação ou avance uma iteração para visualizar a tomada de decisão da Formiga 1 passo a passo.</p>';
        this.dom.edgeUpdatesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma iteração concluída ainda.</td></tr>';
        this.dom.historyTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum registro no histórico.</td></tr>';

        this.updateEdgeQueryResult();
        this.drawGraph();
    }

    // inicia ou retoma a execucao continua
    startExecution() {
        if (this.isRunning) return;
        const config = this.validateParameters();
        if (!config) return;

        if (this.aco.currentIteration >= this.aco.maxIterations) {
            this.resetSimulation();
        }

        this.isRunning = true;
        this.dom.btnRun.disabled = true;
        this.dom.btnPause.disabled = false;
        this.dom.btnStep.disabled = true;

        this.runLoop();
    }

    // laco de execucao temporizado
    runLoop() {
        if (!this.isRunning) return;

        const hasMore = this.aco.step();
        this.updateInterfaceAfterStep();

        if (hasMore && this.aco.currentIteration < this.aco.maxIterations) {
            this.animationTimer = setTimeout(() => this.runLoop(), this.speedMs);
        } else {
            this.pauseExecution();
        }
    }

    // pausa a execucao preservando o estado
    pauseExecution() {
        this.isRunning = false;
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }
        this.dom.btnRun.disabled = (this.aco && this.aco.currentIteration >= this.aco.maxIterations);
        this.dom.btnPause.disabled = true;
        this.dom.btnStep.disabled = (this.aco && this.aco.currentIteration >= this.aco.maxIterations);
    }

    // avanca exatamente uma iteracao e permanece pausado
    stepExecution() {
        if (this.isRunning) return;
        const config = this.validateParameters();
        if (!config) return;

        if (this.aco.currentIteration >= this.aco.maxIterations) {
            this.showValidationMessage('O número máximo de iterações configurado já foi atingido. Reinicie para nova execução.');
            return;
        }

        this.aco.step();
        this.updateInterfaceAfterStep();

        if (this.aco.currentIteration >= this.aco.maxIterations) {
            this.dom.btnRun.disabled = true;
            this.dom.btnStep.disabled = true;
        }
    }

    // atualiza todos os elementos visuais apos uma iteracao
    updateInterfaceAfterStep() {
        const log = this.aco.lastIterationLog;
        if (!log) return;

        this.dom.metricCurrentIteration.textContent = String(log.iteration);
        this.dom.metricMaxIteration.textContent = `de ${this.aco.maxIterations}`;
        this.dom.metricBestIter.textContent = log.bestDistanceThisIter.toFixed(4);
        this.dom.metricAvgIter.textContent = log.avgDistanceThisIter.toFixed(4);
        this.dom.metricBestOverall.textContent = log.bestDistanceOverall.toFixed(4);

        this.dom.routeBestOverallSeq.textContent = `${log.bestTourOverallIds.join(' -> ')} (Comprimento total: ${log.bestDistanceOverall.toFixed(4)})`;
        this.dom.routeBestIterSeq.textContent = `${log.bestTourThisIterIds.join(' -> ')} (Comprimento: ${log.bestDistanceThisIter.toFixed(4)})`;

        this.renderAntStepLog(log.firstAntLog);
        this.renderEdgeUpdatesTable(log.edgeUpdates);
        this.renderHistoryTable();
        this.updateEdgeQueryResult();
        this.drawGraph();
    }

    // renderiza o log detalhado passo a passo da formiga 1
    renderAntStepLog(steps) {
        if (!steps || steps.length === 0) {
            this.dom.antStepLogContainer.innerHTML = '<p class="hint-text">Nenhum dado registrado para esta iteração.</p>';
            return;
        }

        let html = '';
        steps.forEach((step, idx) => {
            if (step.returnToDepot) {
                html += `
                    <div class="step-box">
                        <div class="step-box-header">Passo ${idx + 1}: Retorno obrigatório ao Depósito</div>
                        <p>Do vértice <strong>${this.vertices[step.currentVertex].id}</strong> para o depósito <strong>${step.chosenVertexId}</strong>. Distância: ${step.distance.toFixed(4)} | Feromônio: ${step.pheromone.toFixed(6)}</p>
                    </div>
                `;
            } else {
                html += `
                    <div class="step-box">
                        <div class="step-box-header">Passo ${idx + 1}: Vértice atual: <strong>${this.vertices[step.currentVertex].id}</strong> &rarr; Escolhido: <strong>${step.chosenVertexId}</strong></div>
                        <table class="data-table" style="margin-top: 8px;">
                            <thead>
                                <tr>
                                    <th>Candidato</th>
                                    <th>Distância d</th>
                                    <th>Feromônio τ</th>
                                    <th>Peso w</th>
                                    <th>Probabilidade p(i, j)</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                step.candidates.forEach(cand => {
                    const isChosen = (cand.vertexId === step.chosenVertexId);
                    const highlightStyle = isChosen ? 'style="background-color: #dbeafe; font-weight: 700; color: #1d4ed8;"' : '';
                    html += `
                        <tr ${highlightStyle}>
                            <td>${cand.vertexId} ${isChosen ? '(Sorteado)' : ''}</td>
                            <td>${cand.distance.toFixed(4)}</td>
                            <td>${cand.pheromone.toFixed(6)}</td>
                            <td>${cand.weight.toFixed(6)}</td>
                            <td>${(cand.probability * 100).toFixed(2)}% (${cand.probability.toFixed(6)})</td>
                        </tr>
                    `;
                });

                html += `
                            </tbody>
                        </table>
                    </div>
                `;
            }
        });

        this.dom.antStepLogContainer.innerHTML = html;
    }

    // renderiza tabela de atualizacao dos feromonios
    renderEdgeUpdatesTable(edgeUpdates) {
        if (!edgeUpdates || edgeUpdates.length === 0) return;

        let html = '';
        edgeUpdates.forEach(edge => {
            html += `
                <tr>
                    <td><strong>${edge.idU} - ${edge.idV}</strong></td>
                    <td>${edge.distance.toFixed(4)}</td>
                    <td>${edge.tauBefore.toFixed(6)}</td>
                    <td>${edge.tauAfterEvap.toFixed(6)}</td>
                    <td>${edge.totalDeposit.toFixed(6)}</td>
                    <td><strong style="color: #2563eb;">${edge.tauFinal.toFixed(6)}</strong></td>
                </tr>
            `;
        });

        this.dom.edgeUpdatesTableBody.innerHTML = html;
    }

    // renderiza tabela de historico acumulado
    renderHistoryTable() {
        const history = this.aco.history;
        if (!history || history.length === 0) return;

        let html = '';
        for (let i = history.length - 1; i >= 0; i--) {
            const h = history[i];
            html += `
                <tr>
                    <td><strong>${h.iteration}</strong></td>
                    <td>${h.bestDistanceThisIter.toFixed(4)}</td>
                    <td>${h.avgDistanceThisIter.toFixed(4)}</td>
                    <td><strong style="color: #2563eb;">${h.bestDistanceOverall.toFixed(4)}</strong></td>
                    <td>${h.bestTourThisIterIds.join(' -> ')}</td>
                </tr>
            `;
        }

        this.dom.historyTableBody.innerHTML = html;
    }

    // desenha o grafo completo no canvas com tema claro limpo
    drawGraph() {
        const canvas = this.dom.graphCanvas;
        const ctx = this.ctx;
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        if (!this.vertices || this.vertices.length === 0) return;

        // mapeamento de coordenadas com margem
        const padding = 55;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        this.vertices.forEach(v => {
            if (v.x < minX) minX = v.x;
            if (v.x > maxX) maxX = v.x;
            if (v.y < minY) minY = v.y;
            if (v.y > maxY) maxY = v.y;
        });

        const spanX = (maxX - minX === 0) ? 1 : (maxX - minX);
        const spanY = (maxY - minY === 0) ? 1 : (maxY - minY);

        const project = (x, y) => {
            const px = padding + ((x - minX) / spanX) * (width - 2 * padding);
            const py = padding + ((y - minY) / spanY) * (height - 2 * padding);
            return { x: px, y: py };
        };

        const screenPositions = this.vertices.map(v => project(v.x, v.y));

        // calcula min e max de feromonio para escala visual
        let minTau = Infinity;
        let maxTau = -Infinity;
        const n = this.vertices.length;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const tau = this.aco ? this.aco.pheromoneMatrix[i][j] : this.aco.tau0;
                if (tau < minTau) minTau = tau;
                if (tau > maxTau) maxTau = tau;
            }
        }

        if (minTau === Infinity) minTau = 1.0;
        if (maxTau === -Infinity) maxTau = 1.0;

        this.dom.scaleInfo.textContent = `Escala de feromônio atual: [mín: ${minTau.toFixed(6)}, máx: ${maxTau.toFixed(6)}]. Espessura visual mapeada linearmente entre 1px e 6px.`;

        // desenha todas as arestas com feromonio
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const tau = this.aco ? this.aco.pheromoneMatrix[i][j] : 1.0;
                const p1 = screenPositions[i];
                const p2 = screenPositions[j];

                // mapeamento linear da espessura entre 1px e 6px
                const normalizedTau = (maxTau === minTau) ? 0.5 : ((tau - minTau) / (maxTau - minTau));
                const lineWidth = 1.0 + normalizedTau * 5.0;
                const alphaColor = 0.2 + normalizedTau * 0.75;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(71, 85, 105, ${alphaColor})`;
                ctx.lineWidth = lineWidth;
                ctx.stroke();

                // rotulos opcionais nas arestas
                if (this.dom.toggleEdgeLabels.checked) {
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    ctx.font = '10px Helvetica, Arial, sans-serif';
                    ctx.fillStyle = '#64748b';
                    ctx.fillText(`τ=${tau.toFixed(2)}`, midX + 4, midY - 4);
                }
            }
        }

        // desenha melhor rota da iteracao atual se habilitado
        if (this.dom.toggleBestIter.checked && this.aco && this.aco.lastIterationLog) {
            const tour = this.aco.lastIterationLog.bestTourThisIter;
            ctx.beginPath();
            for (let i = 0; i < tour.length - 1; i++) {
                const u = tour[i];
                const v = tour[i + 1];
                const p1 = screenPositions[u];
                const p2 = screenPositions[v];
                if (i === 0) ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 3.5;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // desenha melhor rota acumulada se habilitado
        if (this.dom.toggleBestOverall.checked && this.aco && this.aco.bestTourOverall) {
            const tour = this.aco.bestTourOverall;
            ctx.beginPath();
            for (let i = 0; i < tour.length - 1; i++) {
                const u = tour[i];
                const v = tour[i + 1];
                const p1 = screenPositions[u];
                const p2 = screenPositions[v];
                if (i === 0) ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // destaca aresta sob foco do cursor se houver
        if (this.hoveredEdge) {
            const p1 = screenPositions[this.hoveredEdge.u];
            const p2 = screenPositions[this.hoveredEdge.v];
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 5;
            ctx.stroke();
        }

        // desenha vertices
        screenPositions.forEach((pos, idx) => {
            const isDepot = (idx === this.depotIndex);
            const isHovered = (this.hoveredVertex === idx);
            const radius = isDepot ? 17 : 14;

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = isDepot ? '#dc2626' : '#2563eb';
            ctx.fill();

            ctx.lineWidth = isHovered ? 4 : 2;
            ctx.strokeStyle = isDepot ? '#991b1b' : '#1d4ed8';
            ctx.stroke();

            // identificador do vertice
            ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.vertices[idx].id, pos.x, pos.y);

            // rotulo do deposito
            if (isDepot) {
                ctx.font = 'bold 11px Helvetica, Arial, sans-serif';
                ctx.fillStyle = '#dc2626';
                ctx.fillText('Depósito', pos.x, pos.y - 24);
            }
        });
    }

    // trata movimento do cursor sobre o canvas para inspecao
    handleCanvasMouseMove(e) {
        const rect = this.dom.graphCanvas.getBoundingClientRect();
        const scaleX = this.dom.graphCanvas.width / rect.width;
        const scaleY = this.dom.graphCanvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const padding = 55;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        this.vertices.forEach(v => {
            if (v.x < minX) minX = v.x;
            if (v.x > maxX) maxX = v.x;
            if (v.y < minY) minY = v.y;
            if (v.y > maxY) maxY = v.y;
        });

        const spanX = (maxX - minX === 0) ? 1 : (maxX - minX);
        const spanY = (maxY - minY === 0) ? 1 : (maxY - minY);

        const screenPositions = this.vertices.map(v => ({
            x: padding + ((v.x - minX) / spanX) * (this.dom.graphCanvas.width - 2 * padding),
            y: padding + ((v.y - minY) / spanY) * (this.dom.graphCanvas.height - 2 * padding)
        }));

        // verifica vertice sob cursor
        let foundVertex = null;
        for (let i = 0; i < screenPositions.length; i++) {
            const p = screenPositions[i];
            const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
            if (dist <= 19) {
                foundVertex = i;
                break;
            }
        }

        // verifica aresta sob cursor
        let foundEdge = null;
        if (foundVertex === null) {
            for (let i = 0; i < screenPositions.length; i++) {
                for (let j = i + 1; j < screenPositions.length; j++) {
                    const p1 = screenPositions[i];
                    const p2 = screenPositions[j];
                    const d = this.distanceToSegment(mouseX, mouseY, p1.x, p1.y, p2.x, p2.y);
                    if (d <= 8) {
                        foundEdge = { u: i, v: j };
                        break;
                    }
                }
                if (foundEdge) break;
            }
        }

        this.hoveredVertex = foundVertex;
        this.hoveredEdge = foundEdge;

        if (foundEdge) {
            this.dom.selectEdgeU.value = foundEdge.u;
            this.dom.selectEdgeV.value = foundEdge.v;
            this.updateEdgeQueryResult();
        }

        this.drawGraph();
    }

    // calcula distancia de um ponto a um segmento de reta
    distanceToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSq = dx * dx + dy * dy;
        if (lengthSq === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }
}

// inicializacao quando o dom estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
