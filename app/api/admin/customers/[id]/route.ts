import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { isAdminAuthenticated } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - Get single customer
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            class: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PATCH - Update customer
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

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

    // Check if email is being changed to one that already exists
    if (email) {
      const existing = await prisma.customer.findFirst({
        where: {
          email,
          NOT: { id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "email_exists" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;
    if (retirementVillage !== undefined) updateData.retirementVillage = retirementVillage;
    if (birthdate !== undefined) updateData.birthdate = birthdate ? new Date(birthdate) : null;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) updateData.emergencyContactPhone = emergencyContactPhone;
    if (sessionPassRemaining !== undefined) updateData.sessionPassRemaining = sessionPassRemaining;
    if (sessionPassTotal !== undefined) updateData.sessionPassTotal = sessionPassTotal;

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE - Delete customer
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Delete customer and cascade to bookings
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
