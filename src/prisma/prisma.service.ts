import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
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

    const url = new URL(dbUrl);
    const connectionLimit = parseInt(url.searchParams.get("connection_limit") || "2", 10);

    // Kiểm tra xem có tắt SSL không (dùng cho Localhost / Postgres không có TLS)
    const isSslDisabled =
      url.searchParams.get("sslmode") === "disable" || url.hostname === "localhost" || url.hostname === "127.0.0.1";

    const pool = new Pool({
      user: url.username,
      password: decodeURIComponent(url.password),
      host: url.hostname,
      port: parseInt(url.port || "5432"),
      database: url.pathname.substring(1),
      max: connectionLimit,
      idleTimeoutMillis: 30000,
      // Nếu là Localhost hoặc sslmode=disable thì TẮT SSL (false), ngược lại mới dùng cấu hình Aiven
      ssl: isSslDisabled
        ? false
        : {
            rejectUnauthorized: false, // Bắt buộc cho Aiven / Cloud Postgres
          },
    });

    const adapter = new PrismaPg(pool);
    super({
      adapter,
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      Logger.log("🚀 Database connected successfully via Adapter");
    } catch (e) {
      Logger.error("🚀 Database connection failed:", e);
    }
  }
}
