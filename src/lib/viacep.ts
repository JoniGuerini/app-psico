export interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export const fetchCep = async (cepDigits: string): Promise<ViaCepResponse> => {
  const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
  if (!res.ok) throw new Error("network");
  return (await res.json()) as ViaCepResponse;
};
