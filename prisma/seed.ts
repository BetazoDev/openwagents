import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const seedDemoData = process.env.SEED_DEMO_DATA !== "false";

  if (!seedDemoData) {
    console.log("Demo data seeding is disabled.");
    return;
  }

  console.log("Seeding demo data...");

  // 1. Create Agency
  const agency = await prisma.agency.upsert({
    where: { slug: "inmobiliaria-luna" },
    update: {},
    create: {
      name: "Inmobiliaria Luna",
      slug: "inmobiliaria-luna",
      industryType: "REAL_ESTATE",
      aiSystemPrompt: "Eres un asistente experto de Inmobiliaria Luna. Tu objetivo es pre-calificar a los clientes y entender sus necesidades buscando en el catálogo.",
    },
  });

  console.log(`Agency created: ${agency.name}`);

  // 2. Create Admin User
  const passwordHash = await hash("Admin1234!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@luna.com" },
    update: {},
    create: {
      email: "admin@luna.com",
      name: "Admin Luna",
      passwordHash,
      role: UserRole.ADMIN,
      agencyId: agency.id,
    },
  });

  console.log(`Admin user created: ${admin.email}`);

  // 3. Create Catalog Items
  const catalog1 = await prisma.catalogItem.create({
    data: {
      agencyId: agency.id,
      title: "Departamento céntrico 2 habs",
      description: "Hermoso departamento en el centro de la ciudad con 2 habitaciones, 1 baño y cocina equipada. Ideal para parejas o profesionales.",
      price: 250000.0,
      location: "Centro Histórico",
    },
  });

  const catalog2 = await prisma.catalogItem.create({
    data: {
      agencyId: agency.id,
      title: "Casa familiar con jardín",
      description: "Amplia casa en zona residencial tranquila. 4 habitaciones, 3 baños, amplio jardín y garage para 2 autos.",
      price: 450000.0,
      location: "Zona Norte",
    },
  });
  
  const catalog3 = await prisma.catalogItem.create({
    data: {
      agencyId: agency.id,
      title: "Estudio moderno ideal inversión",
      description: "Estudio tipo loft con amenidades premium (alberca, gym). Alta rentabilidad para alquiler a corto plazo.",
      price: 180000.0,
      location: "Zona Financiera",
    },
  });

  console.log("Catalog items created");

  // 4. Create Agent
  const agent = await prisma.agent.create({
    data: {
      agencyId: agency.id,
      name: "Asesor Luna",
      description: "Agente principal encargado de responder consultas de WhatsApp",
      systemPrompt: "Eres Asesor Luna. Saluda amablemente, pregunta qué tipo de propiedad buscan y usa tu herramienta de búsqueda para recomendar opciones.",
      llmProvider: "OPENAI",
      llmApiKey: "", // To be filled by the user in UI
      llmModel: "gpt-4o-mini",
      isActive: true,
    },
  });

  console.log(`Agent created: ${agent.name}`);

  // 5. Create Leads & Messages
  const lead1 = await prisma.lead.upsert({
    where: { agencyId_phoneNumber: { agencyId: agency.id, phoneNumber: "5215551234567" } },
    update: {},
    create: {
      agencyId: agency.id,
      phoneNumber: "5215551234567",
      name: "Juan Pérez",
      status: "NEW",
      messages: {
        create: [
          { role: "USER", content: "Hola, vi sus anuncios y busco una casa grande con jardín." },
        ],
      },
    },
  });

  const lead2 = await prisma.lead.upsert({
    where: { agencyId_phoneNumber: { agencyId: agency.id, phoneNumber: "5215559876543" } },
    update: {},
    create: {
      agencyId: agency.id,
      phoneNumber: "5215559876543",
      name: "María Gómez",
      status: "CONTACTED",
      messages: {
        create: [
          { role: "USER", content: "Buen día, información de departamentos por favor." },
          { role: "ASSISTANT", content: "¡Buen día María! Con gusto te ayudo. ¿En qué zona estás buscando y cuál es tu presupuesto aproximado?" },
          { role: "USER", content: "Busco por el centro, para dos personas." },
        ],
      },
    },
  });

  console.log("Leads and messages created");
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
