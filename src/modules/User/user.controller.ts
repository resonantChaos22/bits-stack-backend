/**
 * @description Documented the OK responses
 *
 * @author Shreyash <pandeyshreyash2201@gmail.com>
 */

import 'reflect-metadata';
import {
	Controller,
	Post,
	Get,
	Req,
	Body,
	UseInterceptors,
	Res,
	HttpStatus,
	Param,
	InternalServerErrorException,
	UseFilters,
	Delete,
	UsePipes
} from '@nestjs/common';
import { Users } from '../../database';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoggerService } from '../../shared/services/logger.service';
import { CacheInterceptor } from '../../interceptors/cache.interceptor';
import { RedisService } from '../../shared/services/redis.service';
import { TimeoutInterceptor } from '../../interceptors/timeout.interceptor';
import { CacheExpiration } from '../../decorators/cache-expiration.decorators';
import { Timeout } from '../../decorators/timeout.decorator';
import { AuthService } from '../Auth/auth.service';
import { google } from 'googleapis';
import { QueryFailedFilter } from '../../filters/queryfailed.filter';
import { Response } from 'express';
import { ValidationPipe } from '../../pipes/validation.pipe';
import { ApiOkResponse } from '@nestjs/swagger';
@Controller('user')
export class UserController {
	constructor(
		private readonly UserService: UserService,
		private readonly AuthService: AuthService,
		private Logger: LoggerService,
		private cache: RedisService
	) {}

	@ApiOkResponse({ description: 'User created successfully' })
	@Post('create')
	@UsePipes(ValidationPipe)
	@CacheExpiration(15)
	@UseInterceptors(CacheInterceptor)
	@UseFilters(new QueryFailedFilter())
	async createUser(@Res() res: Response, @Body() user: CreateUserDto) {
		const newUser = await this.UserService.createUser(Users.create(user));
		return res.status(HttpStatus.OK).json({
			message: 'User has been created successfully!',
			newUser
		});
	}

	@ApiOkResponse({ description: 'User updated successfully' })
	@Post('update/:id')
	@CacheExpiration(15)
	@UseInterceptors(CacheInterceptor)
	@UseFilters(new QueryFailedFilter())
	async updateUser(@Res() res: Response, @Param('id') userID: number, @Body() user: CreateUserDto) {
		const updatedUser = await this.UserService.updateUser(userID, Users.create(user));
		return res.status(HttpStatus.OK).json({
			message: 'User has been updated',
			updatedUser
		});
	}

	@ApiOkResponse({ description: 'User fetch Successful' })
	@Get('get/:id')
	@CacheExpiration(15)
	@UseInterceptors(CacheInterceptor)
	@UseFilters(new QueryFailedFilter())
	async getUser(@Param('id') userID: number, @Res() res: Response) {
		const user = await this.UserService.getUser(userID);
		return res.status(HttpStatus.OK).json({
			user
		});
	}

	@ApiOkResponse({ description: 'User deleted successfully' })
	@Delete('delete/:id')
	@CacheExpiration(15)
	@UseInterceptors(CacheInterceptor)
	@UseFilters(new QueryFailedFilter())
	async deleteUser(@Param('id') userID: number, @Res() res: Response) {
		const result = await this.UserService.deleteUser(userID);
		return res.status(HttpStatus.OK).json({
			message: 'User deleted',
			result
		});
	}

	private async delay(delayInms: number) {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(2);
			}, delayInms);
		});
	}

	@Get('timeout')
	@Timeout(3000)
	@UseInterceptors(TimeoutInterceptor)
	async timeout(): Promise<void> {
		await this.delay(5000);
		return;
	}

	@ApiOkResponse({ description: 'Drive created successfully' })
	@Get('drive/add')
	async drivecreate() {
		try {
			const auth = await this.AuthService.getauthenticatedClient(['https://www.googleapis.com/auth/drive.file']);
			const drive = google.drive({ version: 'v3', auth: auth });
			await drive.files.create({
				requestBody: {
					name: 'Test',
					mimeType: 'text/plain'
				},
				media: {
					mimeType: 'text/plain',
					body: 'Hello World'
				}
			});
			return 'OK';
		} catch (e) {
			throw new InternalServerErrorException();
		}
	}
}
