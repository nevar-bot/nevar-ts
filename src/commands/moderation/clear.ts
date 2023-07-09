import BaseCommand from "@structures/BaseCommand";
import BaseClient from "@structures/BaseClient";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default class ClearCommand extends BaseCommand
{
	public constructor(client: BaseClient)
	{
		super(client, {
			name: "clear",
			description: "Löscht eine bestimmte Anzahl an Nachrichten, ggf. von einem bestimmten Nutzer",
			memberPermissions: ["ManageMessages"],
			botPermissions: ["ManageMessages"],
			cooldown: 1000,
			dirname: __dirname,
			slashCommand: {
				addCommand: true,
				data: new SlashCommandBuilder()
					.addIntegerOption((option: any) => option
						.setName("anzahl")
						.setDescription("Gib an, wieviele Nachrichten du löschen möchtest")
						.setMinValue(1)
						.setMaxValue(99)
						.setRequired(true)
					)
					.addUserOption((option: any) => option
						.setName("nutzer")
						.setDescription("Wähle, von welchem Nutzer du Nachrichten löschen möchtest")
						.setRequired(false)
					)
			}
		});
	}

	private interaction: any;

	public async dispatch(interaction: any, data: any): Promise<void>
	{
		this.interaction = interaction;
		await this.clearMessages(interaction.options.getInteger("anzahl"), interaction.options.getUser("nutzer"));
	}

	private async clearMessages(amount: number, user: any): Promise<void>
	{
		let messages: any[] = Array.from((await this.interaction.channel.messages.fetch({ limit: amount + 1 })).values());

		if (user) {
			messages = messages.filter((m: any): boolean => m.author.id === user.id);
		}
		messages = messages.filter((m) => !m.pinned);

		if (messages[0].author.id === this.client.user!.id) messages.shift();

		this.interaction.channel.bulkDelete(messages, true).catch((): void => { });

		const string: string = user ? "von " + user.tag : "";
		const deletedEmbed: EmbedBuilder = this.client.createEmbed("Ich habe {0} Nachrichten {1} gelöscht.", "success", "success", messages.length, string);
		const embedSent = await this.interaction.followUp({ embeds: [deletedEmbed] });

		const logText: string =
			" **" + messages.length + " Nachrichten gelöscht**\n\n" +
			this.client.emotes.arrow + " Moderator: " + this.interaction.user.tag;
		await this.interaction.guild.logAction(logText, "moderation", this.client.emotes.delete, "normal");

		await this.client.wait(7000);
		embedSent.delete().catch((): void => { });
	}
}