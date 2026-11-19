export interface Address {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado?: string;
  ibge?: string;
  ddd?: string;
  [key: string]: string | undefined;
}

export const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
export function maskCep(value: string) {
  return value.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}
export function buildEndpoint(mode: 'cep' | 'address', cep: string, uf: string, city: string, street: string) {
  if (mode === 'cep') {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) throw new Error('Informe um CEP válido com 8 dígitos.');
    return `https://viacep.com.br/ws/${digits}/json/`;
  }
  if (!states.includes(uf)) throw new Error('Selecione um estado.');
  if (city.trim().length < 3 || street.trim().length < 3) throw new Error('Cidade e logradouro precisam ter pelo menos 3 caracteres.');
  return `https://viacep.com.br/ws/${uf}/${encodeURIComponent(city.trim())}/${encodeURIComponent(street.trim())}/json/`;
}
function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
export function toXml(data: Address | Address[]) {
  const item = (address: Address, indent: string) => Object.entries(address).map(([key, value]) => `${indent}<${key}>${escapeXml(value ?? '')}</${key}>`).join('\n');
  return Array.isArray(data)
    ? `<?xml version="1.0" encoding="UTF-8"?>\n<enderecos>\n${data.map(address => `  <endereco>\n${item(address, '    ')}\n  </endereco>`).join('\n')}\n</enderecos>`
    : `<?xml version="1.0" encoding="UTF-8"?>\n<endereco>\n${item(data, '  ')}\n</endereco>`;
}