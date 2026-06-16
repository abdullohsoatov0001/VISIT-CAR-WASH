import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !password || (!email && !phone)) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть минимум 6 символов" },
        { status: 400 }
      );
    }

    // Check existing
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: "Этот email уже зарегистрирован" },
          { status: 400 }
        );
      }
    }

    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return NextResponse.json(
          { error: "Этот номер уже зарегистрирован" },
          { status: 400 }
        );
      }
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        password: hashed,
        role: "USER",
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
