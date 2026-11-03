import { z } from "zod";

const actionSchema = z.object({
  actionId: z.string().uuid(),
  type: z.enum(["object.interact", "puzzle.solved", "item.pickup"]),
  targetId: z.string().trim().min(1).max(100),
  payload: z.record(z.unknown()).default({}),
});
const movementSchema = z.object({
  position: z.object({
    x: z.number().min(-500).max(500),
    y: z.number().min(-20).max(200),
    z: z.number().min(-500).max(500),
  }),
  rotationY: z
    .number()
    .min(-Math.PI * 4)
    .max(Math.PI * 4),
  roomKey: z.string().max(40).nullable().optional(),
});
const checkpointMetaSchema = z.object({
  diaryEntries: z.array(z.string().max(100)).max(50),
  hintHistory: z.array(z.object({ id: z.string().max(140), text: z.string().max(1000) })).max(100),
});
const characterSelectionSchema = z.object({ character: z.enum(["mum", "dad"]).nullable() });
const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});
const registerSchema = credentialsSchema.extend({ displayName: z.string().trim().min(1).max(40) });
const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
});
const passwordResetSchema = z.object({ token: z.string().min(32).max(256), password: z.string().min(8).max(128) });
const saveSlotSchema = z.object({ slotNumber: z.number().int().min(1).max(3) });
const createSavedRoomSchema = saveSlotSchema.extend({ name: z.string().trim().min(1).max(50).default("Partida") });

export { actionSchema, movementSchema, checkpointMetaSchema, characterSelectionSchema, credentialsSchema, registerSchema, passwordResetRequestSchema, passwordResetSchema, saveSlotSchema, createSavedRoomSchema };
