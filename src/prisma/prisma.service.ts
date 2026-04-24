import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    const dbUrl = configService.get<string>("DATABASE_URL");

    if (!dbUrl) {
      throw new Error("❌ DATABASE_URL is missing in .env");
    }

    // Sử dụng URL object để parse các thành phần của Aiven URL
    const url = new URL(dbUrl);

    const pool = new Pool({
      user: url.username,
      password: decodeURIComponent(url.password), // Giải mã nếu password có ký tự đặc biệt
      host: url.hostname,
      port: parseInt(url.port),
      database: url.pathname.substring(1),
      ssl: {
        rejectUnauthorized: false, // Bắt buộc cho Aiven
      },
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log("🚀 Database connected successfully via Adapter");
    } catch (e) {
      console.error("🚀 Database connection failed:", e);
    }
  }
}
