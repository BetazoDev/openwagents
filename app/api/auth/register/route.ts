import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole, IndustryType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { agencyName, adminName, email, password } = await req.json();

    if (!agencyName || !adminName || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "El correo electrónico ya está en uso" }, { status: 400 });
    }

    const slug = agencyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Verificar si el slug de agencia ya existe
    const existingAgency = await prisma.agency.findUnique({
      where: { slug }
    });

    if (existingAgency) {
      return NextResponse.json({ error: "Ya existe una agencia con un nombre similar" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Crear agencia y usuario administrador en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: agencyName,
          slug,
          industryType: IndustryType.REAL_ESTATE,
        }
      });

      const user = await tx.user.create({
        data: {
          name: adminName,
          email,
          passwordHash,
          role: UserRole.SUPER_ADMIN, // the first user is the super admin of their tenant
          agencyId: agency.id,
        }
      });

      return { agency, user };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Agencia y usuario creados correctamente",
      agencyId: result.agency.id
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
