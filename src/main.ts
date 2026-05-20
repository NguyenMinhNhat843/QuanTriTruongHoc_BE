import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  console.log("A");
  const app = await NestFactory.create(AppModule);

  console.log("B");
  const config = new DocumentBuilder()
    .setTitle("API hệ thống")
    .setDescription("Tài liệu API")
    .setVersion("1.0")
    .addBearerAuth() // nếu dùng JWT
    .build();

  console.log("C");
  app.enableCors();

  console.log("D");
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  console.log("E");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // bỏ field dư
      forbidNonWhitelisted: true, // báo lỗi nếu có field lạ
      transform: true, // auto convert type
    }),
  );

  console.log("F");
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
