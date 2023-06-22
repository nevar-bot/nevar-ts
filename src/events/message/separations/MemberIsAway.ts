import BaseClient from "@structures/BaseClient";
import { EmbedBuilder } from "discord.js";

export default class
{
    public client: BaseClient;

    constructor(client: BaseClient)
    {
        this.client = client;
    }

    async dispatch(message: any, data: any, guild: any): Promise<void> {
        let afkUsers: any[] = [];

        if(message.mentions.repliedUser) {
            const mentionData = await this.client.findOrCreateUser(message.mentions.repliedUser.id);

            if(mentionData.afk?.state){
                const afkSince: any = this.client.utils.getRelativeTime(mentionData.afk.since);
                afkUsers = afkUsers.filter(u => u.id !== message.mentions.repliedUser.id);

                afkUsers.push({
                    name: message.mentions.repliedUser.username,
                    id: message.mentions.repliedUser.id,
                    reason: mentionData.afk.reason || "Kein Grund angegeben",
                    since: afkSince
                });
            }
        }

        if(message.mentions.users){
            const users: any = Array.from(message.mentions.users);

            for(const user of users){
                const mentionData = await this.client.findOrCreateUser(user[1].id);

                if(mentionData.afk?.state){
                    const afkSince = this.client.utils.getRelativeTime(mentionData.afk.since);
                    afkUsers = afkUsers.filter((u: any): boolean => u.id !== user[1].id);
                    afkUsers.push({
                        name: user[1].username,
                        id: user[1].id,
                        reason: mentionData.afk.reason,
                        since: afkSince
                    });
                }
            }
        }

        for(let afkUser of afkUsers){
            const awayText: string =
                this.client.emotes.text + " Grund: " + afkUser.reason + "\n" +
                this.client.emotes.reminder + " Abwesend seit: " + afkUser.since;

            const isAwayEmbed: EmbedBuilder = this.client.createEmbed("{0}", "reminder", "normal", awayText);
            isAwayEmbed.setTitle(this.client.emotes.status.idle + " " + afkUser.name + " ist aktuell abwesend!");
            await message.reply({ embeds: [isAwayEmbed] }).catch((): void => {});
        }
    }
}