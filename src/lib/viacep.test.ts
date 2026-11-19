import { describe, expect, it } from 'vitest';
import { buildEndpoint, maskCep, toXml } from './viacep';

describe('ViaCEP', () => {
  it('formats and limits CEP to eight digits', () => expect(maskCep('0100100099')).toBe('01001-000'));
  it('uses the ViaCEP JSON endpoint for CEP', () => expect(buildEndpoint('cep', '01001-000', '', '', '')).toBe('https://viacep.com.br/ws/01001000/json/'));
  it('rejects invalid CEP', () => expect(() => buildEndpoint('cep', '123', '', '', '')).toThrow());
  it('encodes address parameters', () => expect(buildEndpoint('address', '', 'SP', 'São Paulo', 'Praça da Sé')).toBe('https://viacep.com.br/ws/SP/S%C3%A3o%20Paulo/Pra%C3%A7a%20da%20S%C3%A9/json/'));
  it('rejects short address parameters', () => expect(() => buildEndpoint('address', '', 'SP', 'SP', 'Sé')).toThrow());
  it('escapes XML response values', () => expect(toXml({ cep: '01001-000', logradouro: 'A & B <C>', bairro: '', complemento: '', localidade: 'São Paulo', uf: 'SP' })).toContain('<logradouro>A &amp; B &lt;C&gt;</logradouro>'));
});