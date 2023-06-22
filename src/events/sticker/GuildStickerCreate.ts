import BaseClient from "@structures/BaseClient";
import { EmbedBuilder } from "discord.js";

export default class
{
    public client: BaseClient;

    constructor(client: BaseClient)
    {
        this.client = client;
    }

    async dispatch(sticker: any): Promise<any>
    {
        await sticker.fetchUser().catch((e: any): void => {});
        if(!sticker || !sticker.user || !sticker.guild) return;
        const { guild } = sticker;

        const stickerLogMessage: string =
            this.client.emotes.edit + " Name: " + sticker.name + "\n" +
            this.client.emotes.id + " ID: "+ sticker.id + "\n" +
            this.client.emotes.user + " Ersteller: " + sticker.user.username;

        const stickerLogEmbed: EmbedBuilder = this.client.createEmbed(stickerLogMessage, null, "success");
        stickerLogEmbed.setTitle(this.client.emotes.events.sticker.create + " Sticker erstellt");
        stickerLogEmbed.setThumbnail(sticker.url);

        await guild.logAction(stickerLogEmbed, "guild");
    }
}