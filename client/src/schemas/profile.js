import { z } from 'zod';

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras')
    .transform((val) => val.trim()),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .transform((val) => val.toLowerCase().trim()),
  phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(val);
    }, 'Formato inválido: (XX) XXXXX-XXXX')
    .transform((val) => val?.trim() || ''),
});
