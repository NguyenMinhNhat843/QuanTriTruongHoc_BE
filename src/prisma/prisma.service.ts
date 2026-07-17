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

    // Sử dụng URL object để parse các thành phần của Aiven URL
    const url = new URL(dbUrl);
    const connectionLimit = parseInt(
      url.searchParams.get("connection_limit") || "2",
      10,
    );

    const pool = new Pool({
      user: url.username,
      password: decodeURIComponent(url.password),
      host: url.hostname,
      port: parseInt(url.port),
      database: url.pathname.substring(1),
      max: connectionLimit,
      idleTimeoutMillis: 30000,
      ssl: {
        rejectUnauthorized: false, // Bắt buộc cho Aiven
      },
    });

    const adapter = new PrismaPg(pool);
    super({
      adapter,
      // log: [
      //   { emit: "stdout", level: "query" }, 
      //   { emit: "stdout", level: "info" },
      //   { emit: "stdout", level: "warn" }, 
      //   { emit: "stdout", level: "error" }, 
      // ],
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
