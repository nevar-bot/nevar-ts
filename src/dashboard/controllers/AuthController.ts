import { Request, Response } from "express";
import { client } from "@src/app";
import axios, { AxiosResponse } from "axios";

import UserController from "@dashboard/controllers/UserController";

const BASE_API_URL: string = "https://discord.com/api";

export default {
	getAccessToken(req: Request): string | null {
		/* get oauth2 cookie */
		const cookie = req.cookies?.["oauth2"];
		if (!cookie) return null;

		/* get access token */
		const { access_token } = JSON.parse(cookie);
		if (!access_token) return null;

		return access_token;
	},

	async login(req: Request, res: Response): Promise<void> {
		/* user is already logged in */
		if (req.cookies?.["oauth2"]) return res.status(301).redirect("/dashboard");

		/* prepare redirect url */
		const { REDIRECT_URI } = client.config.dashboard;
		const callback_url: string = encodeURI(REDIRECT_URI);
		const redirect_url: string =
			BASE_API_URL +
			`/oauth2/authorize?client_id=${client.user!.id}&redirect_uri=${callback_url}&response_type=code&scope=identify%20guilds%20guilds.join`;

		/* redirect to discord oauth2 */
		res.status(301).redirect(redirect_url);
	},

	async isLoggedIn(req: Request): Promise<boolean> {
		/* get access token */
		const cookie = req.cookies?.["oauth2"];
		if (!cookie) return false;

		const { access_token } = JSON.parse(cookie);

		/* check if access token is valid */
		const userData: AxiosResponse = await axios.get("https://discord.com/api/users/@me", {
			headers: { authorization: `Bearer ${access_token}` },
			validateStatus: (status: number): boolean => true
		});

		return Boolean(userData.data?.id && access_token);
	},

	renderLogin(res: Response): void {
		/* render login page */
		res.render("login", {
			client: client,
			title: "Login",
			module: "login",
			guild: null,
			guildData: null,
			user: null,
			avatarUrl: null
		});
	},

	async isAuthorizedInGuild(guild: any): Promise<boolean> {
		if (!guild) return false;

		/* check if user is owner or has admin or manage guild permissions */
		const ADMIN_PERMISSION: any = 0x08;
		const MANAGE_GUILD_PERMISSION: any = 0x20;
		return !(!guild || !(guild.owner || guild.permissions & ADMIN_PERMISSION || guild.permissions & MANAGE_GUILD_PERMISSION));
	},

	async callback(req: Request, res: Response): Promise<void> {
		/* handle discord oauth2 callback */
		const { code } = req.query as { code: string };
		const { CLIENT_SECRET, REDIRECT_URI } = client.config.dashboard;

		/* get access token */
		const authResponse: AxiosResponse = await axios.post(
			BASE_API_URL + "/oauth2/token",
			new URLSearchParams({
				client_id: client.user!.id,
				client_secret: CLIENT_SECRET,
				grant_type: "authorization_code",
				redirect_uri: REDIRECT_URI,
				code
			}),
			{ headers: { ["Content-Type"]: "application/x-www-form-urlencoded" }, validateStatus: (status: number): boolean => true }
		);

		const { access_token } = authResponse.data;

		/* get user info */
		const user: any = await UserController.getUser(access_token);

		/* join support server */
		await axios.put(
			BASE_API_URL + `/guilds/${client.config.support["ID"]}/members/${user.id}`,
			{ access_token },
			{
				headers: { authorization: `Bot ${client.token}`, ["Content-Type"]: "application/json" },
				validateStatus: (status: number): boolean => true
			}
		);

		/* set access token cookie */
		res.cookie("oauth2", JSON.stringify({ access_token }), { secure: false, httpOnly: true, expires: new Date(Date.now() + 604800000) });
		res.status(301).redirect("/dashboard");
	},

	async logout(req: Request, res: Response): Promise<boolean | void> {
		/* get access token */
		const cookie = req.cookies?.["oauth2"];
		if (!cookie) return false;

		const { access_token } = JSON.parse(cookie);
		if (!access_token) return false;

		const { CLIENT_SECRET } = client.config.dashboard;

		/* revoke access token */
		await axios.post(
			BASE_API_URL + "/oauth2/token/revoke",
			new URLSearchParams({ client_id: client.user!.id, client_secret: CLIENT_SECRET, token: access_token }),
			{ headers: { ["Content-Type"]: "application/x-www-form-urlencoded" }, validateStatus: (status: number): boolean => true }
		);

		/* clear cookie */
		res.clearCookie("oauth2");
		return res.status(301).redirect("/");
	}
};