import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { isAdminAuthenticated } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - List all customers
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// POST - Create new customer
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      retirementVillage,
      birthdate,
      phone,
      address,
      emergencyContactName,
      emergencyContactPhone,
      sessionPassRemaining,
      sessionPassTotal,
    } = body;

    // Check if email already exists
    const existing = await prisma.customer.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "email_exists" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        password: password || "changeme",
        retirementVillage,
        birthdate: birthdate ? new Date(birthdate) : null,
        phone,
        address,
        emergencyContactName,
        emergencyContactPhone,
        sessionPassRemaining: sessionPassRemaining ?? 10,
        sessionPassTotal: sessionPassTotal ?? 10,
        sessionPassPurchaseDate: new Date(),
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
