// app/api/clients/[id]/route.ts - Részlet
const client = await prisma.client.findUnique({
  where: { id: Number(params.id) },
  include: {
    units: true,  // <--- EZ NAGYON FONTOS!
    quotes: true,
  },
});
