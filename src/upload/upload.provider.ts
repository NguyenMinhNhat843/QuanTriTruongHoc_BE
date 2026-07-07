import { v2 as cloudinary } from "cloudinary";
import { ConfigService } from "@nestjs/config";

export const CloudinaryProvider = {
  provide: "CLOUDINARY",
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const cloudName = configService.get<string>("CLOUDINARY_CLOUD_NAME");
    const apiKey = configService.get<string>("CLOUDINARY_API_KEY");
    const apiSecret = configService.get<string>("CLOUDINARY_API_SECRET");

    // 3. Trả về cấu hình cho SDK
    return cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  },
};
