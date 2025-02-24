import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { getThemeColor } from '../functions';
import { SlashCommand } from "../types";

const bloxlinkAPIKey = process.env.BLOXLINK_API_KEY || '';
const parcelAPIURL = 'https://papi.parcelroblox.com/whitelist/check';
const parcelAPIKey = process.env.PARCEL_API_KEY || '';
const serverID = process.env.SERVER_ID || '';
const productIDs = ["jmv11xsoerulfnqesuvzppefkdyr", "ud25jbxr5shnud8qbyitrc6j70jx", "qt7zj3codgtw2xyo8aaz6xdsrbrb"];

const whitelist = ["1040722410070093825", "1095116890361315478", "428925948818227201", "717403465785016375"];

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('licences')
    .addStringOption(option => {
      return option
        .setName("user")
        .setDescription("Discord_User_ID")
        .setRequired(true)
    })    
    .setDescription("Fetches & Provides provided users licenses"),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction || !interaction.member || !interaction.guild) return;

    const discordUserID = interaction.options.getString("user", true);

    if (!whitelist.includes(interaction.user.id)) {
      await interaction.reply("You are not authorized to use this command.");
      return;
    }

    try {
      const response = await axios.get(
        `https://api.blox.link/v4/public/guilds/${serverID}/discord-to-roblox/${discordUserID}`,
        {
          headers: {
            Authorization: bloxlinkAPIKey,
          },
        }
      );

      const { robloxID } = response.data;
      const results = [];

      for (const productID of productIDs) {
        try {
          const parcelResponse = await axios.post(
            parcelAPIURL,
            {
              productID,
              robloxID,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "hub-secret-key": parcelAPIKey,
              },
            }
          );

          const productName = getProductName(productID);
          const isWhitelisted = parcelResponse.data.data.owned;

          results.push({
            productID,
            success: true,
            isWhitelisted,
          });
        } catch (error) {
          results.push({
            productID,
            success: false,
            error: error.message,
          });
        }
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: 'Command Ran: /licenses',
        })
        .setTitle('Licenses Retrieved!')
        .setColor('#7CFC00')
        .setDescription(`User ID: ${discordUserID}\n\n`);

      for (const result of results) {
        embed.addFields({
          name: `${getProductName(result.productID)}`,
          value: result.success ? (result.isWhitelisted ? "✅ Whitelisted" : "❌ Not Whitelisted") : "❌ Error",
          inline: false,
        });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error replying to interaction:", error.message);
    }
  },
  cooldown: 10,
};

function getProductName(productID: string): string {
  const productNames: Record<string, string> = {
    "jmv11xsoerulfnqesuvzppefkdyr": "Beginner Bundle",
    "ud25jbxr5shnud8qbyitrc6j70jx": "CodeCraft",
    "qt7zj3codgtw2xyo8aaz6xdsrbrb": "Advanced Admin Logger",
  };

  return productNames[productID] || productID;
}

export default command;
