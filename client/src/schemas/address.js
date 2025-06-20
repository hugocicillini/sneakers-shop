import { z } from 'zod';

export const addressSchema = z.object({
  type: z.string().min(1, 'Tipo de endereço é obrigatório'),
  isDefault: z.boolean().default(false),
  recipient: z
    .string()
    .min(1, 'Nome do destinatário é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  phoneNumber: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato inválido: (XX) XXXXX-XXXX'),
  zipCode: z
    .string()
    .min(1, 'CEP é obrigatório')
    .regex(/^\d{5}-?\d{3}$/, 'CEP deve ter formato 00000-000'),
  street: z
    .string()
    .min(1, 'Rua é obrigatória')
    .min(5, 'Rua deve ter pelo menos 5 caracteres'),
  number: z
    .string()
    .min(1, 'Número é obrigatório')
    .max(10, 'Número deve ter no máximo 10 caracteres'),
  complement: z
    .string()
    .max(50, 'Complemento deve ter no máximo 50 caracteres')
    .optional(),
  neighborhood: z
    .string()
    .min(1, 'Bairro é obrigatório')
    .min(2, 'Bairro deve ter pelo menos 2 caracteres'),
  city: z
    .string()
    .min(1, 'Cidade é obrigatória')
    .min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z
    .string()
    .min(1, 'Estado é obrigatório')
    .length(2, 'Estado deve ter 2 caracteres'),
  reference: z
    .string()
    .max(100, 'Referência deve ter no máximo 100 caracteres')
    .optional(),
});
