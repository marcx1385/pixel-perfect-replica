import { createFileRoute } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, MapPin, Search, Hash, Building2, Map, Globe2, Check, CheckCircle2, Copy, Code2, Terminal, Zap, ShieldCheck, BookOpen, UserRound, Monitor, Braces, LoaderCircle, AlertCircle, ExternalLink, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { buildEndpoint, maskCep, states, toXml, type Address } from '@/lib/viacep';
import glassFlow from '@/assets/glass-flow.jpg';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'EnderStudio — Consulta de endereços com ViaCEP' },
    { name: 'description', content: 'Consulte CEPs e endereços brasileiros e explore requisições REST, respostas JSON e XML com o EnderStudio.' },
    { property: 'og:title', content: 'EnderStudio — Encontre seu próximo endereço' },
    { property: 'og:description', content: 'Consulta ViaCEP por CEP ou endereço, com dados JSON, XML e indicadores em tempo real.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

type RequestInfo = { endpoint: string; status: number | null; time: number | null; failed: boolean };
const concepts = [
  ['REST', 'Um padrão de comunicação entre aplicações pela web.'],
  ['GET', 'Método HTTP que solicita dados sem alterá-los.'],
  ['Request', 'A requisição enviada ao endereço da API.'],
  ['Response', 'Os dados e o status devolvidos pela API.'],
  ['JSON', 'Formato leve de dados em pares de chave e valor.'],
  ['XML', 'Formato de dados estruturados por tags.'],
];

function Highlight({ line, format }: { line: string; format: 'json' | 'xml' }) {
  const parts = format === 'json' ? line.split(/("(?:[^"\\]|\\.)*"\s*:|"(?:[^"\\]|\\.)*")/g) : line.split(/(<[^>]+>)/g);
  return <>{parts.map((part, i) => <span key={i} className={format === 'xml' ? (part.startsWith('<') ? 'syntax-mark' : '') : (part.endsWith(':') ? 'syntax-key' : part.startsWith('"') ? 'syntax-string' : '')}>{part}</span>)}</>;
}

function Index() {
  const [mode, setMode] = useState<'cep' | 'address'>('cep');
  const [cep, setCep] = useState('');
  const [uf, setUf] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [data, setData] = useState<Address | Address[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<RequestInfo | null>(null);
  const [format, setFormat] = useState<'json' | 'xml'>('json');
  const [copied, setCopied] = useState(false);
  const reducedMotion = useReducedMotion();
  const addresses = data ? (Array.isArray(data) ? data : [data]) : [];
  const code = data ? (format === 'json' ? JSON.stringify(data, null, 2) : toXml(data)) : '';
  let previewEndpoint = 'https://viacep.com.br/ws/{CEP}/json/';
  try { previewEndpoint = buildEndpoint(mode, cep, uf, city, street); } catch { if (mode === 'address') previewEndpoint = 'https://viacep.com.br/ws/{UF}/{CIDADE}/{LOGRADOURO}/json/'; }

  async function search(event?: FormEvent, exampleCep?: string) {
    event?.preventDefault();
    if (loading) return;
    let endpoint: string;
    try { endpoint = buildEndpoint(mode, exampleCep ?? cep, uf, city, street); }
    catch (err) { const message = err instanceof Error ? err.message : 'Confira os campos informados.'; setError(message); toast.error(message); return; }
    setError(''); setLoading(true); setData(null); setRequest({ endpoint, status: null, time: null, failed: false });
    const started = performance.now();
    let status: number | null = null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, { method: 'GET', signal: controller.signal });
      status = response.status;
      if (!response.ok) throw new Error(`O ViaCEP não conseguiu atender à consulta (HTTP ${response.status}). Tente novamente.`);
      const result = await response.json();
      if (result.erro || (Array.isArray(result) && result.length === 0)) throw new Error('Nenhum endereço encontrado. Confira os dados e tente novamente.');
      setData(result);
      setRequest({ endpoint, status, time: Math.round(performance.now() - started), failed: false });
      toast.success(Array.isArray(result) ? `${result.length} endereço(s) encontrado(s).` : 'Endereço encontrado com sucesso.');
    } catch (err) {
      const message = err instanceof Error && err.name === 'AbortError' ? 'A consulta demorou mais que o esperado. Tente novamente.' : err instanceof TypeError ? 'Não foi possível conectar ao ViaCEP. Verifique sua conexão e tente novamente.' : err instanceof Error ? err.message : 'Não foi possível realizar a consulta.';
      setError(message); setRequest({ endpoint, status, time: Math.round(performance.now() - started), failed: true }); toast.error(message);
    } finally { clearTimeout(timeout); setLoading(false); }
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setCopied(true); toast.success('Copiado para a área de transferência.'); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error('Não foi possível copiar.'); }
  }

  return <div className="studio">
    <img className="ambient-image" src={glassFlow} alt="" width={1920} height={1024} />
    <div className="page-width">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><MapPin strokeWidth={1.8} /></div><span>Ender<span>Studio</span></span></div>
        <div className="nav-right"><span className="service-status"><i className="status-dot" /> API pública · ViaCEP</span><span className="nav-divider">|</span><Button asChild variant="link" className="api-link h-auto p-0 text-xs text-muted-foreground"><a href="https://viacep.com.br/" target="_blank" rel="noreferrer">Documentação <ExternalLink size={12} /></a></Button></div>
      </header>
      <main>
        <section className="intro">
          <span className="eyebrow"><Zap size={12} /> Endereços conectados. Possibilidades infinitas.</span>
          <h1>Seu próximo endereço,<br /><span>a uma consulta de distância.</span></h1>
          <p>Encontre endereços em todo o Brasil com precisão e simplicidade.<br />Explore os dados e descubra o que acontece por trás de cada requisição.</p>
        </section>
        <div className="workspace">
          <section className="glass-panel search-panel" aria-label="Consulta de endereço">
            <div className="search-tabs" role="tablist" aria-label="Tipo de consulta">
              <Button variant="tab" role="tab" aria-selected={mode === 'cep'} data-active={mode === 'cep'} disabled={loading} onClick={() => { setMode('cep'); setError(''); }}><Hash /> Buscar CEP</Button>
              <Button variant="tab" role="tab" aria-selected={mode === 'address'} data-active={mode === 'address'} disabled={loading} onClick={() => { setMode('address'); setError(''); }}><MapPin /> Buscar Endereço</Button>
            </div>
            <AnimatePresence mode="wait"><motion.form key={mode} initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .15 }} onSubmit={search}>
              <div className="section-heading"><Search /><h2>{mode === 'cep' ? 'Qual endereço você procura?' : 'Encontre o CEP de um endereço'}</h2></div>
              <p className="section-subtitle">{mode === 'cep' ? 'Digite o CEP e deixe o resto com a gente.' : 'Informe o estado, a cidade e o nome da rua.'}</p>
              {mode === 'cep' ? <><label className="field-label" htmlFor="cep">Código de Endereçamento Postal</label><div className="input-wrap"><MapPin /><input className="glass-input font-mono" id="cep" value={cep} onChange={e => { setCep(maskCep(e.target.value)); setError(''); }} placeholder="00000-000" inputMode="numeric" autoComplete="postal-code" disabled={loading} aria-invalid={!!error} aria-describedby="cep-hint" /></div><p className="input-hint" id="cep-hint">Informe os 8 dígitos do CEP, com ou sem hífen.</p></> : <div className="address-fields"><div><label className="field-label" htmlFor="uf">Estado (UF)</label><select id="uf" className="glass-input" value={uf} onChange={e => setUf(e.target.value)} disabled={loading}><option value="">UF</option>{states.map(state => <option key={state}>{state}</option>)}</select></div><div><label className="field-label" htmlFor="city">Cidade</label><div className="input-wrap"><Building2 /><input id="city" className="glass-input" value={city} onChange={e => setCity(e.target.value)} placeholder="São Paulo" disabled={loading} /></div></div><div className="street-field"><label className="field-label" htmlFor="street">Logradouro</label><div className="input-wrap"><Navigation /><input id="street" className="glass-input" value={street} onChange={e => setStreet(e.target.value)} placeholder="Praça da Sé" disabled={loading} /></div></div></div>}
              {error && <p className="error-message" role="alert"><AlertCircle />{error}</p>}
              <Button variant="liquid" type="submit" className="w-full" disabled={loading}>{loading ? <LoaderCircle className="spinner" /> : <Search />}{loading ? 'Consultando ViaCEP…' : mode === 'cep' ? 'Consultar CEP' : 'Consultar endereço'}{!loading && <ArrowRight />}</Button>
            </motion.form></AnimatePresence>
            <div className="example-row">{mode === 'cep' ? <>Experimente:<Button className="example-button" variant="ghost" disabled={loading} onClick={() => { setCep('01001-000'); void search(undefined, '01001-000'); }}>01001-000</Button><Button className="example-button" variant="ghost" disabled={loading} onClick={() => { setCep('20040-020'); void search(undefined, '20040-020'); }}>20040-020</Button><Button className="example-button" variant="ghost" disabled={loading} onClick={() => { setCep('30130-010'); void search(undefined, '30130-010'); }}>30130-010</Button></> : <><MapPin size={11} /> Encontre todos os CEPs correspondentes à sua busca.</>}</div>
            <div className="search-note"><ShieldCheck /> Consulta gratuita. Seus dados não são armazenados.</div>
          </section>
          <div className="right-column">
            <section className="glass-panel result-panel" aria-live="polite" aria-busy={loading}>
              <div className="result-top"><div className="section-heading"><MapPin /><h2>Resultado da consulta</h2></div>{addresses.length > 0 && <span className="result-badge"><CheckCircle2 />{addresses.length === 1 ? 'Endereço encontrado' : `${addresses.length} endereços`}</span>}</div>
              {loading ? <div className="skeleton-grid">{Array.from({ length: 6 }, (_, i) => <div key={i}><div className="skeleton-block w-1/3 mb-3" /><div className="skeleton-block w-4/5" /></div>)}</div> : addresses.length ? <AnimatePresence><motion.div initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }}>{addresses.map((address, i) => <article className="address-result" key={`${address.cep}-${i}`}><div className="result-grid">{[
                { icon: Hash, label: 'CEP', value: address.cep, className: 'cep-field' },
                { icon: Globe2, label: 'Estado', value: address.estado ? `${address.estado} · ${address.uf}` : address.uf },
                { icon: Navigation, label: 'Logradouro', value: address.logradouro || 'Não informado', className: 'wide' },
                { icon: Map, label: 'Bairro', value: address.bairro || 'Não informado' },
                { icon: Building2, label: 'Cidade', value: address.localidade },
              ].map(field => <div className={`result-field ${field.className ?? ''}`} key={field.label}><field.icon /><div><label>{field.label}</label><strong>{field.value}</strong></div></div>)}</div></article>)}</motion.div></AnimatePresence> : <div className="empty-result"><div className="empty-icon">{error && request?.failed ? <AlertCircle /> : <MapPin strokeWidth={1.5} />}</div><h3>{error && request?.failed ? 'Não encontramos um resultado' : 'Um endereço começa com uma busca'}</h3><p>{error && request?.failed ? 'Revise sua consulta ou tente novamente.' : <>Faça uma consulta para ver os detalhes<br />do endereço aqui.</>}</p></div>}
            </section>
            <section className="glass-panel technical-panel">
              <div className="technical-header"><div className="section-heading"><Terminal /><h2>Por trás da consulta</h2></div><span className="live-label">{loading ? 'Em andamento' : request ? 'Última requisição' : 'Pronto para conectar'}</span></div>
              <div className="endpoint"><span className="get-badge">GET</span><code>{request?.endpoint ?? previewEndpoint}</code><Button variant="tool" size="icon" title="Copiar endpoint" aria-label="Copiar endpoint" onClick={() => void copy(request?.endpoint ?? previewEndpoint)}><Copy /></Button></div>
              <div className="metrics"><span>Status<strong className={request?.status === 200 ? 'success' : ''}>{loading ? '…' : request?.status ? `${request.status}${request.status === 200 ? ' OK' : ''}` : request?.failed ? 'Falha de conexão' : '—'}</strong></span><span>Tempo<strong>{request?.time != null && !loading ? `${request.time} ms` : '—'}</strong></span><span>Formato<strong>JSON</strong></span></div>
            </section>
          </div>
        </div>
        <section className="glass-panel data-panel">
          <div className="data-header"><div className="section-heading"><Code2 /><h2>A resposta, sem filtros</h2></div><div className="data-actions"><div className="format-tabs" role="tablist" aria-label="Formato dos dados"><Button variant="tab" role="tab" aria-selected={format === 'json'} data-active={format === 'json'} onClick={() => setFormat('json')}>JSON</Button><Button variant="tab" role="tab" aria-selected={format === 'xml'} data-active={format === 'xml'} onClick={() => setFormat('xml')}>XML</Button></div><Button variant="tool" size="icon" title="Copiar resposta" aria-label="Copiar resposta" disabled={!data || loading} onClick={() => void copy(code)}>{copied ? <Check /> : <Copy />}</Button></div></div>
          {code && !loading ? <div className="code-view" role="tabpanel" aria-label={`Resposta ${format.toUpperCase()}`}>{code.split('\n').map((line, i) => <div className="code-line" key={i}><span className="line-number">{i + 1}</span><code><Highlight line={line} format={format} /></code></div>)}</div> : <div className="data-empty">{loading ? <><LoaderCircle className="spinner" size={17} /> Aguardando resposta do ViaCEP…</> : <><Braces size={19} /> A resposta da sua consulta aparecerá aqui.</>}</div>}
          <div className="data-footer"><span>{format === 'json' ? 'application/json' : 'application/xml · convertido do JSON'}</span><span>{data ? `${new TextEncoder().encode(code).length} bytes` : 'Aguardando requisição'} · UTF-8</span></div>
        </section>
        <section className="education">
          <div className="education-heading"><div className="section-heading"><BookOpen /><h2>Entendendo a Requisição REST</h2></div><span>Uma pequena viagem por trás dos dados</span></div>
          <div className="flow">{[
            { icon: UserRound, title: 'Usuário', sub: 'Informa um endereço' },
            { icon: Monitor, title: 'Frontend', sub: 'Envia a requisição GET' },
            { icon: Globe2, title: 'ViaCEP API', sub: 'Busca o endereço' },
            { icon: Braces, title: 'Resposta JSON', sub: 'Retorna os dados' },
            { icon: CheckCircle2, title: 'Interface', sub: 'Exibe o resultado' },
          ].map((step, i) => <div className="contents" key={step.title}>{i > 0 && <ArrowRight className="flow-arrow" />}<div className="flow-step"><div className="flow-icon"><step.icon /></div><div><strong>{step.title}</strong><small>{step.sub}</small></div></div></div>)}</div>
          <div className="concepts">{concepts.map(([title, description]) => <div key={title}><h3>{title}</h3><p>{description}</p></div>)}</div>
        </section>
      </main>
      <footer className="footer"><span><MapPin /> EnderStudio <span>·</span> Feito para conectar.</span><span>Dados fornecidos pelo ViaCEP <span>·</span> Brasil <Globe2 /></span></footer>
    </div>
  </div>;
}
