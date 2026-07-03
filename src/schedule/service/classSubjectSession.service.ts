import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassSubjectSessionDto, SearchClassSubjectSessionDto, UpdateClassSubjectSessionDto } from '../dto/classSubjectSession.dto';
@Injectable()
export class ClassSubjectSessionService {
    constructor(private readonly prisma: PrismaService) { }
    async create(createDto: CreateClassSubjectSessionDto) {
        return this.prisma.classSubjectSession.create({
            data: createDto,
        });
    }
    async findAll(query: SearchClassSubjectSessionDto) {
        return this.prisma.classSubjectSession.findMany({
            where: {
                classSubjectId: query.classSubjectId ? Number(query.classSubjectId) : undefined,
                roomId: query.roomId ? Number(query.roomId) : undefined,
                dayOfWeek: query.dayOfWeek,
                shift: query.shift,
                startPeriod: query.startPeriod ? Number(query.startPeriod) : undefined,
                endPeriod: query.endPeriod ? Number(query.endPeriod) : undefined,
            },
            include: {
                room: true,
                classSubject: {
                    include: {
                        subject: true,
                        teacher: true,
                        baseClass: true,
                    }
                },
                schedules: true,
            }
        });
    }
    async findOne(id: number) {
        const session = await this.prisma.classSubjectSession.findUnique({
            where: { id },
            include: {
                room: true,
                classSubject: {
                    include: {
                        subject: true,
                        teacher: true,
                        baseClass: true,
                    }
                },
                schedules: true,
            }
        });
        if (!session) {
            throw new NotFoundException(`ClassSubjectSession with ID ${id} not found`);
        }
        return session;
    }
    async update(id: number, updateDto: UpdateClassSubjectSessionDto) {
        await this.findOne(id);
        return this.prisma.classSubjectSession.update({
            where: { id },
            data: updateDto,
        });
    }
    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.classSubjectSession.delete({
            where: { id },
        });
    }
}