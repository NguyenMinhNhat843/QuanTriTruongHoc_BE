import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === "production";

  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ["error", "warn"]
      : ["log", "debug", "error", "warn"],
  });

  const config = new DocumentBuilder()
    .setTitle("API hệ thống")
    .setDescription("Tài liệu API")
    .setVersion("1.0")
    .addBearerAuth() // nếu dùng JWT
    .build();

  app.use(cookieParser());

  app.enableCors({
    origin: ["http://localhost:5173", "https://website-truong-tdn.vercel.app"],
    credentials: true,
  });

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // bỏ field dư
      forbidNonWhitelisted: true, // báo lỗi nếu có field lạ
      transform: true, // auto convert type
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
