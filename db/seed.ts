import { db, questionBanks, questions, admins, client } from "./index";
import { DEFAULT_BASKETBALL_BANK } from "./seed-data";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth";

export * from "./seed-data";

export async function seed() {
  console.log("🌱 Memulai proses seeding database Supabase PostgreSQL...");

  try {
    // 0. Ensure admins table exists
    await client`
      CREATE TABLE IF NOT EXISTS "admins" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "username" text NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "name" text DEFAULT 'Admin' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;

    // 1. Seed / Update Admin User
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const adminName = process.env.ADMIN_NAME || "Administrator";
    const passwordHash = hashPassword(adminPassword);

    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.username, adminUsername));

    if (existingAdmin.length === 0) {
      await db.insert(admins).values({
        username: adminUsername,
        passwordHash,
        name: adminName,
      });
      console.log(`✅ [Admin] Dibuat: ${adminUsername}`);
    } else {
      const cur = existingAdmin[0];
      if (cur.name !== adminName || cur.passwordHash !== passwordHash) {
        await db
          .update(admins)
          .set({ name: adminName, passwordHash, updatedAt: new Date() })
          .where(eq(admins.id, cur.id));
        console.log(`🔄 [Admin] Diperbarui: ${adminUsername}`);
      } else {
        console.log(`⏭️ [Admin] Dilewati (Tidak ada perubahan): ${adminUsername}`);
      }
    }

    // 2. Check / Update Question Bank
    const existingBanks = await db
      .select()
      .from(questionBanks)
      .where(eq(questionBanks.title, DEFAULT_BASKETBALL_BANK.title));

    let bankId: string;

    if (existingBanks.length === 0) {
      const [newBank] = await db
        .insert(questionBanks)
        .values({
          title: DEFAULT_BASKETBALL_BANK.title,
          description: DEFAULT_BASKETBALL_BANK.description,
        })
        .returning();
      bankId = newBank.id;
      console.log(`✅ [Bank Soal] Dibuat: ${newBank.title}`);
    } else {
      const curBank = existingBanks[0];
      bankId = curBank.id;
      if (curBank.description !== DEFAULT_BASKETBALL_BANK.description) {
        await db
          .update(questionBanks)
          .set({ description: DEFAULT_BASKETBALL_BANK.description })
          .where(eq(questionBanks.id, bankId));
        console.log(`🔄 [Bank Soal] Deskripsi diperbarui: ${curBank.title}`);
      } else {
        console.log(`⏭️ [Bank Soal] Dilewati (Sudah sesuai): ${curBank.title}`);
      }
    }

    // 3. Differential Question Sync: Update jika berubah, skip jika sama, insert jika baru
    const existingQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.bankId, bankId));

    const existingByOrder = new Map(existingQuestions.map((q) => [q.orderIndex, q]));

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const seedQ of DEFAULT_BASKETBALL_BANK.questions) {
      const existing = existingByOrder.get(seedQ.orderIndex);

      if (!existing) {
        // Insert baru
        await db.insert(questions).values({
          bankId,
          text: seedQ.text,
          optionA: seedQ.optionA,
          optionB: seedQ.optionB,
          optionC: seedQ.optionC,
          optionD: seedQ.optionD || null,
          correctAnswer: seedQ.correctAnswer,
          orderIndex: seedQ.orderIndex,
        });
        insertedCount++;
        console.log(`➕ [Soal #${seedQ.orderIndex}] Ditambahkan: ${seedQ.text.substring(0, 35)}... [Kunci: ${seedQ.correctAnswer.toUpperCase()}]`);
      } else {
        // Periksa apakah ada perubahan data
        const isChanged =
          existing.text !== seedQ.text ||
          existing.optionA !== seedQ.optionA ||
          existing.optionB !== seedQ.optionB ||
          existing.optionC !== seedQ.optionC ||
          (existing.optionD || null) !== (seedQ.optionD || null) ||
          existing.correctAnswer !== seedQ.correctAnswer;

        if (isChanged) {
          await db
            .update(questions)
            .set({
              text: seedQ.text,
              optionA: seedQ.optionA,
              optionB: seedQ.optionB,
              optionC: seedQ.optionC,
              optionD: seedQ.optionD || null,
              correctAnswer: seedQ.correctAnswer,
            })
            .where(eq(questions.id, existing.id));
          updatedCount++;
          console.log(`🔄 [Soal #${seedQ.orderIndex}] Diperbarui (Timpa): ${seedQ.text.substring(0, 35)}... [Kunci Baru: ${seedQ.correctAnswer.toUpperCase()}]`);
        } else {
          skippedCount++;
        }
      }
    }

    console.log("\n==========================================");
    console.log(`🎉 Sinkronisasi Seeder Selesai!`);
    console.log(`   ➕ Ditambahkan Baru : ${insertedCount}`);
    console.log(`   🔄 Diperbarui/Timpa : ${updatedCount}`);
    console.log(`   ⏭️ Dilewati (Sama)  : ${skippedCount}`);
    console.log(`   📊 Total Soal       : ${DEFAULT_BASKETBALL_BANK.questions.length}`);
    console.log("==========================================\n");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
