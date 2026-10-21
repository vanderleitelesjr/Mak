// Lista o que mudou no projeto desde a última varredura do card (sem custo; só lê).
// Uso: node verificar.mjs            → relatório do que mudou
//      node verificar.mjs --registrar → grava varredura.json com o estado de agora (fim da varredura)
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const pasta = dirname(fileURLToPath(import.meta.url));
const REPO = 'E:/Claude Projects/GlobalEmpires/GE-game';
const MEMORIA = 'C:/Users/vande/.claude/projects/E--Claude-Projects-GlobalEmpires/memory';
const CODEX = 'E:/ChatGPT Projects/GEgame/Art';
const estadoArq = join(pasta, 'varredura.json');
const anterior = existsSync(estadoArq) ? JSON.parse(readFileSync(estadoArq, 'utf8')) : null;
const desde = anterior ? new Date(anterior.ultima) : new Date(Date.now() - 2 * 864e5);

const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim();
const main = git('rev-parse', '--short', 'main');
const contar = status => {
  const texto = readFileSync(join(REPO, 'docs/specs/decisoes.md'), 'utf8');
  return texto.split('\n').filter(l => new RegExp(`^\\| *[A-Z][A-Za-z0-9/–-]* *\\|.*\\| *${status}[^|]*\\| *$`).test(l)).length;
};
const decisoes = { confirmadas: contar('Confirmado'), pendentes: contar('Pendente') };

if (process.argv.includes('--registrar')) {
  writeFileSync(estadoArq, JSON.stringify({ ultima: new Date().toISOString(), main, decisoes }, null, 2) + '\n');
  console.log(`varredura registrada: main ${main}, ${decisoes.confirmadas} confirmadas, ${decisoes.pendentes} pendentes`);
  process.exit(0);
}

const recentes = (raiz, filtro) => {
  const achados = [];
  const andar = dir => {
    for (const nome of existsSync(dir) ? readdirSync(dir) : []) {
      const p = join(dir, nome);
      const st = statSync(p);
      if (st.isDirectory()) { if (!/^(Textures|Assets|\.git)$/.test(nome)) andar(p); }
      else if (filtro.test(nome) && st.mtime > desde) achados.push(relative(raiz, p).replace(/\\/g, '/'));
    }
  };
  andar(raiz);
  return achados;
};

const linhas = [`# O que mudou desde ${anterior ? anterior.ultima : 'as últimas 48 h (primeira varredura)'}`, ''];
const commits = anterior && anterior.main !== main ? git('log', '--first-parent', '--format=%h %ad %s', '--date=short', `${anterior.main}..main`) : '';
linhas.push(`## Main local: ${main}${anterior ? ` (antes ${anterior.main})` : ''}`, commits || 'Nenhum commit novo na main.', '');
const arte = anterior && anterior.main !== main ? git('diff', '--name-only', anterior.main, 'main', '--', 'Art', 'Unity_Import/Assets/_Project/Art/Concepts', 'view/com.globalempires.view/Runtime/Resources/AltaFidelidade', 'view/com.globalempires.view/Runtime/Resources/Audio/Musica').split('\n').filter(f => /\.(png|jpe?g|webp|fbx|ogg)$/i.test(f)) : [];
linhas.push('## Arte, modelos e música novos na main', arte.length ? arte.map(f => `- ${f}`).join('\n') : 'Nenhum.', '');
const d = anterior?.decisoes;
linhas.push('## Decisões', `${decisoes.confirmadas} confirmadas, ${decisoes.pendentes} pendentes${d ? ` (antes ${d.confirmadas} e ${d.pendentes})` : ''}.`, '');
const mem = recentes(MEMORIA, /\.md$/).filter(f => f !== 'MEMORY.md');
linhas.push('## Memórias do projeto alteradas (playtests, decisões, entregas dos bots)', mem.length ? mem.map(f => `- ${f}`).join('\n') : 'Nenhuma.', '');
const codex = recentes(CODEX, /\.(png|jpe?g|webp)$/i);
linhas.push('## Arte nova na cópia local do Codex', codex.length ? codex.map(f => `- ${f}`).join('\n') : 'Nenhuma.', '');
const ultimaEntrega = JSON.parse(readFileSync(join(pasta, 'entregas.json'), 'utf8')).entregas.map(e => e.data).sort().pop();
linhas.push('## Card', `Última entrega registrada: ${ultimaEntrega}.`);
const nada = !commits && !arte.length && !mem.length && !codex.length && (!d || (d.confirmadas === decisoes.confirmadas && d.pendentes === decisoes.pendentes));
if (nada) linhas.push('', 'NADA NOVO: só registre a varredura (node verificar.mjs --registrar).');
console.log(linhas.join('\n'));
