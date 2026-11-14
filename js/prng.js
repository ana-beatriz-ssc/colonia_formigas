// gerador pseudoaleatorio mulberry32 baseado em semente inteira
class PRNG {
    constructor(seed = 1) {
        this.initialSeed = Math.trunc(seed);
        this.state = this.initialSeed;
    }

    // redefine a semente para o valor inicial ou novo valor
    reset(seed = this.initialSeed) {
        this.initialSeed = Math.trunc(seed);
        this.state = this.initialSeed;
    }

    // gera proximo numero pseudoaleatorio uniforme no intervalo [0, 1)
    next() {
        let t = (this.state += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // sorteia indice proporcional a um vetor de probabilidades
    // nao escolhe sempre o maior peso
    sample(probabilities) {
        const r = this.next();
        let cumulative = 0;
        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];
            if (r < cumulative || i === probabilities.length - 1) {
                return i;
            }
        }
        return probabilities.length - 1;
    }
}

// exportacao para ambiente de navegador ou nodejs
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PRNG;
}
