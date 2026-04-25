import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleType } from "../../../prisma/generated/prisma/enums.js";
import { ROLES_KEY } from "../../common/decorators/role.decorator.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy danh sách Roles được định nghĩa tại API (từ Decorator @Roles)
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu API không định nghĩa @Roles, cho phép truy cập (hoặc tùy bạn cấu hình)
    if (!requiredRoles) {
      return true;
    }

    // 2. Lấy User từ Request (do JwtAuthGuard gán vào trước đó)
    const { user } = context.switchToHttp().getRequest();

    // 3. Kiểm tra User Role có nằm trong danh sách được phép không
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        "Bạn không có quyền thực hiện hành động này",
      );
    }

    return true;
  }
}
